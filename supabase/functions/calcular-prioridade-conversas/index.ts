import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { conversa_id } = await req
      .json()
      .catch(() => ({ conversa_id: undefined }))

    let query = supabase
      .from('conversas_whatsapp')
      .select(
        `
        id,
        prioridade_manual,
        cliente_id,
        ultima_interacao,
        cliente:clientes (
            id,
            produtos_cliente (produto, status),
            tags_cliente (tipo_tag, ativo),
            vendas (status_venda, produto_interesse)
        ),
        mensagens (
            timestamp,
            origem
        )
      `,
      )
      .order('timestamp', { foreignTable: 'mensagens', ascending: false }) // Get latest message
      .limit(1, { foreignTable: 'mensagens' }) // We only need the very last message

    if (conversa_id) {
      query = query.eq('id', conversa_id)
    } else {
      // Filter for active conversations (e.g. last 30 days) to avoid processing dead data
      // For simplicity/safety in this demo, we might process all or a large batch
      // query = query.gt('ultima_interacao', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    }

    const { data: conversas, error } = await query

    if (error) throw error

    const updates = []
    const now = new Date()

    for (const conv of conversas) {
      if (conv.prioridade_manual) continue // Skip manual override

      let score = 0
      const details = []

      // 1. Time Without Response (Max 30)
      const lastMsg = conv.mensagens?.[0]
      if (lastMsg && lastMsg.origem === 'contact') {
        // Last message was from contact, we need to reply
        const diffTime = Math.abs(
          now.getTime() - new Date(lastMsg.timestamp).getTime(),
        )
        const diffDays = diffTime / (1000 * 60 * 60 * 24)

        if (diffDays >= 8) {
          score += 30
          details.push('No Response > 8d')
        } else if (diffDays >= 4) {
          score += 20
          details.push('No Response 4-7d')
        } else if (diffDays >= 2) {
          score += 10
          details.push('No Response 2-3d')
        }
      }

      // 2. Product Tier (Max 25)
      const products = conv.cliente?.produtos_cliente || []
      const tiers = products.map((p: any) => {
        if (['Elite', 'Scale'].includes(p.produto)) return 25
        if (['Labs', 'Venda'].includes(p.produto)) return 15
        return 5
      })
      const maxTier = Math.max(0, ...tiers, 5) // Default 5 if no product
      score += maxTier
      details.push(`Product Tier (${maxTier})`)

      // 3. Critical Status (Max 25 Cumulative)
      let statusScore = 0
      const statusMap: Record<string, number> = {
        Reembolsado: 25,
        'Tempo Esgotado': 25,
        Pausado: 20,
        'Formulário Não Preenchido': 15,
        'Perto do Final': 15,
        'Novos Alunos': 10,
      }

      // Product Status
      products.forEach((p: any) => {
        if (statusMap[p.status]) statusScore += statusMap[p.status]
      })

      // Sales Status
      const sales = conv.cliente?.vendas || []
      sales.forEach((s: any) => {
        if (['Perdido', 'Novo Lead'].includes(s.status_venda)) statusScore += 10
      })

      const appliedStatusScore = Math.min(25, statusScore)
      score += appliedStatusScore
      if (appliedStatusScore > 0) details.push(`Status (${appliedStatusScore})`)

      // 4. Alert Tags (Max 20 Cumulative)
      let tagsScore = 0
      const tagMap: Record<string, number> = {
        sem_resposta_14_dias: 10,
        tempo_esgotado: 10,
        no_show: 8,
        fup_venda: 8,
        sem_resposta_7_dias: 7,
        ultima_call_mais_20_dias: 6,
        csat_pendente: 5,
        sem_resposta_3_dias: 5,
        pendente_transcricao: 3,
      }

      const tags = conv.cliente?.tags_cliente || []
      tags.forEach((t: any) => {
        if (t.ativo && tagMap[t.tipo_tag]) {
          tagsScore += tagMap[t.tipo_tag]
        }
      })

      const appliedTagsScore = Math.min(20, tagsScore)
      score += appliedTagsScore
      if (appliedTagsScore > 0) details.push(`Tags (${appliedTagsScore})`)

      // Cap Score
      score = Math.min(100, score)

      // Determine Priority
      let priority = 'Baixo'
      if (score >= 70) priority = 'Crítico'
      else if (score >= 50) priority = 'Alto'
      else if (score >= 30) priority = 'Médio'

      updates.push({
        id: conv.id,
        score_prioridade: score,
        prioridade: priority,
      })
    }

    // Perform Updates
    // Ideally use upsert or batch update, but supabase-js update is per row or by matching column
    // For simplicity in this function, we loop. For high volume, a stored procedure or pg_net calling a procedure is better.
    const results = []
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('conversas_whatsapp')
        .update({
          score_prioridade: update.score_prioridade,
          prioridade: update.prioridade,
        })
        .eq('id', update.id)

      if (updateError)
        console.error(`Failed to update ${update.id}`, updateError)
      else results.push(update)
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: updates.length,
        updates: results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error: any) {
    console.error('Priority Calc Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
