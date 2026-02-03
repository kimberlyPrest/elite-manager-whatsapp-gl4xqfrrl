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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { cliente_id } = await req
      .json()
      .catch(() => ({ cliente_id: undefined }))

    let query = supabaseClient.from('clientes').select('id')
    if (cliente_id) {
      query = query.eq('id', cliente_id)
    }

    const { data: clientIds, error: fetchError } = await query

    if (fetchError) throw fetchError

    if (!clientIds || clientIds.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          processados: 0,
          tags_criadas: 0,
          tags_desativadas: 0,
          detalhes: [],
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Batch processing
    const BATCH_SIZE = 50
    const batches = []
    for (let i = 0; i < clientIds.length; i += BATCH_SIZE) {
      batches.push(clientIds.slice(i, i + BATCH_SIZE))
    }

    let totalProcessed = 0
    let totalTagsCreated = 0
    let totalTagsDeactivated = 0
    const details: string[] = []

    const now = new Date()

    for (const batch of batches) {
      const batchIds = batch.map((c: any) => c.id)

      // Fetch all necessary data for this batch
      const { data: clients, error: batchError } = await supabaseClient
        .from('clientes')
        .select(
          `
          id,
          nome_completo,
          conversas_whatsapp (
            ultima_interacao,
            mensagens (
              timestamp,
              enviado_via
            )
          ),
          produtos_cliente (
            id,
            produto,
            status,
            num_calls_total,
            num_calls_realizadas,
            data_fim_prevista,
            calls (
              data_realizada,
              data_agendada,
              csat_enviado,
              transcricao
            )
          ),
          vendas (
            status_venda,
            produto_interesse
          )
        `,
        )
        .in('id', batchIds)

      if (batchError) {
        console.error('Batch fetch error:', batchError)
        continue
      }

      const tagsToInsert: any[] = []
      const clientIdsToDeactivate: string[] = []

      for (const client of clients) {
        const newTags = new Set<string>()
        const conversation = client.conversas_whatsapp?.[0]

        // 1. No Response Logic
        if (conversation && conversation.ultima_interacao) {
          // Sort messages to find last one
          // Note: Assuming we fetched enough messages. In real optimized scenario we limit messages per conversation
          const messages = conversation.mensagens || []
          messages.sort(
            (a: any, b: any) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          )
          const lastMessage = messages[0]

          if (lastMessage && lastMessage.enviado_via) {
            // Sent by us (assuming enviado_via is not null for system/user messages)
            const lastInteractionDate = new Date(conversation.ultima_interacao)
            const diffTime = Math.abs(
              now.getTime() - lastInteractionDate.getTime(),
            )
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            if (diffDays >= 14) newTags.add('sem_resposta_14_dias')
            else if (diffDays >= 7) newTags.add('sem_resposta_7_dias')
            else if (diffDays >= 3) newTags.add('sem_resposta_3_dias')
          }
        }

        // 2. Product Specific Logic
        const products = client.produtos_cliente || []

        for (const product of products) {
          const calls = product.calls || []

          // ultima_call_mais_20_dias
          if (['Elite', 'Scale'].includes(product.produto)) {
            const realizedCalls = calls.filter((c: any) => c.data_realizada)
            if (realizedCalls.length > 0) {
              // Get latest
              realizedCalls.sort(
                (a: any, b: any) =>
                  new Date(b.data_realizada).getTime() -
                  new Date(a.data_realizada).getTime(),
              )
              const lastCallDate = new Date(realizedCalls[0].data_realizada)
              const daysSinceLastCall = Math.ceil(
                Math.abs(now.getTime() - lastCallDate.getTime()) /
                  (1000 * 60 * 60 * 24),
              )

              if (daysSinceLastCall > 20)
                newTags.add('ultima_call_mais_20_dias')
            }
          }

          // csat_pendente
          const callsWithoutCsat = calls.some(
            (c: any) => c.data_realizada && !c.csat_enviado,
          )
          if (callsWithoutCsat) newTags.add('csat_pendente')

          // formulario_pendente
          if (product.status === 'Formulário Não Preenchido')
            newTags.add('formulario_pendente')

          // agendamento_proximo
          const nextCall = calls.some((c: any) => {
            if (!c.data_agendada) return false
            const agendada = new Date(c.data_agendada)
            const diff = agendada.getTime() - now.getTime()
            const days = diff / (1000 * 60 * 60 * 24)
            return days >= 0 && days <= 3
          })
          if (nextCall) newTags.add('agendamento_proximo')

          // pendente_transcricao
          const pendingTranscription = calls.some((c: any) => {
            if (!c.data_realizada) return false
            const realizada = new Date(c.data_realizada)
            const days =
              (now.getTime() - realizada.getTime()) / (1000 * 60 * 60 * 24)
            return days > 3 && (!c.transcricao || c.transcricao.trim() === '')
          })
          if (pendingTranscription) newTags.add('pendente_transcricao')

          // perto_do_final
          if (['Elite', 'Scale', 'Labs'].includes(product.produto)) {
            if (product.num_calls_total > 0 && product.num_calls_realizadas) {
              if (
                product.num_calls_realizadas / product.num_calls_total >=
                0.8
              ) {
                newTags.add('perto_do_final')
              }
            }
          }

          // tempo_esgotado
          if (product.data_fim_prevista) {
            const endDate = new Date(product.data_fim_prevista)
            if (
              endDate < now &&
              ![
                'Consultoria Concluída',
                'Concluído',
                'Cancelado',
                'Reembolsado',
              ].includes(product.status)
            ) {
              newTags.add('tempo_esgotado')
            }
          }

          // no_show
          const noShow = calls.some((c: any) => {
            if (!c.data_agendada || c.data_realizada) return false
            const agendada = new Date(c.data_agendada)
            const daysSince =
              (now.getTime() - agendada.getTime()) / (1000 * 60 * 60 * 24)
            return daysSince > 0 && daysSince <= 7
          })
          if (noShow) newTags.add('no_show')
        }

        // fup_venda
        // Check if client has ANY 'Venda' product or verify via vendas table
        const sales = client.vendas || [] // using vendas table related to client
        const activeSales = sales.filter(
          (s: any) =>
            (s.produto_interesse === 'Venda' || s.status_venda) &&
            ['Em Contato', 'Agendar FUP'].includes(s.status_venda),
        )

        if (activeSales.length > 0) {
          if (conversation && conversation.ultima_interacao) {
            const lastInteraction = new Date(conversation.ultima_interacao)
            const days =
              (now.getTime() - lastInteraction.getTime()) /
              (1000 * 60 * 60 * 24)
            if (days >= 5) newTags.add('fup_venda')
          }
        }

        // Prepare DB Operations
        clientIdsToDeactivate.push(client.id)

        newTags.forEach((tag) => {
          tagsToInsert.push({
            cliente_id: client.id,
            tipo_tag: tag,
            ativo: true,
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
          })
        })

        if (newTags.size > 0) {
          details.push(
            `${client.nome_completo}: ${Array.from(newTags).join(', ')}`,
          )
        }
      }

      // Execute Batch DB Updates
      if (clientIdsToDeactivate.length > 0) {
        // Deactivate old tags
        const { error: deactivateError, count: deactivatedCount } =
          await supabaseClient
            .from('tags_cliente')
            .update({ ativo: false, updated_at: now.toISOString() })
            .in('cliente_id', clientIdsToDeactivate)
            .eq('ativo', true)

        if (deactivateError)
          console.error('Error deactivating tags:', deactivateError)
        else totalTagsDeactivated += deactivatedCount || 0

        // Insert new tags
        if (tagsToInsert.length > 0) {
          const { error: insertError, count: insertedCount } =
            await supabaseClient
              .from('tags_cliente')
              .insert(tagsToInsert)
              .select('*', { count: 'exact', head: true }) // Using count to get number of inserted

          if (insertError) console.error('Error inserting tags:', insertError)
          else totalTagsCreated += tagsToInsert.length
        }
      }

      totalProcessed += batch.length
    }

    return new Response(
      JSON.stringify({
        success: true,
        processados: totalProcessed,
        tags_criadas: totalTagsCreated,
        tags_desativadas: totalTagsDeactivated,
        detalhes: details,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error: any) {
    console.error('Edge Function Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
