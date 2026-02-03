import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { conversa_id } = await req.json()

    if (!conversa_id) {
      throw new Error('Conversation ID is required')
    }

    // 1. Fetch Configuration
    const { data: configData } = await supabase
      .from('configuracoes')
      .select('chave, valor')
      .in('chave', [
        'gemini_apikey',
        'gemini_model',
        'gemini_temperature',
        'gemini_response_length',
      ])

    const config: Record<string, string> = {}
    configData?.forEach((c: any) => (config[c.chave] = c.valor))

    if (!config['gemini_apikey']) {
      throw new Error('Gemini API Key not configured')
    }

    const model = config['gemini_model'] || 'gemini-2.0-flash-exp'
    const temperature = parseFloat(config['gemini_temperature'] || '0.7')
    const lengthPreference = config['gemini_response_length'] || 'Adaptativa'

    // 2. Fetch Conversation & Client with specific fields
    const { data: conversation } = await supabase
      .from('conversas_whatsapp')
      .select(
        `
        *,
        cliente:clientes (
            *,
            produtos_cliente (produto, status),
            tags_cliente (tipo_tag, ativo),
            calls (data_realizada, data_agendada, duracao_minutos)
        )
      `,
      )
      .eq('id', conversa_id)
      .single()

    if (!conversation) throw new Error('Conversation not found')

    // 3. Fetch Context & Templates
    const { data: contextData } = await supabase
      .from('contexto_geral')
      .select('*')
    const { data: templates } = await supabase
      .from('templates_resposta')
      .select('*')
      .eq('ativo', true)

    const contextMap: Record<string, string> = {}
    contextData?.forEach((c: any) => (contextMap[c.secao] = c.conteudo))

    // Parse Scopes
    let eliteScope, scaleScope, labsScope, salesScope, examples
    try {
      eliteScope = JSON.parse(contextMap['escopo_elite'] || '{}')
    } catch {}
    try {
      scaleScope = JSON.parse(contextMap['escopo_scale'] || '{}')
    } catch {}
    try {
      labsScope = JSON.parse(contextMap['escopo_labs'] || '{}')
    } catch {}
    try {
      salesScope = JSON.parse(contextMap['escopo_venda'] || '{}')
    } catch {}
    try {
      examples = JSON.parse(contextMap['exemplos_conversas'] || '[]')
    } catch {}

    // Determine relevant scope based on client product
    const clientProducts =
      conversation.cliente?.produtos_cliente?.map((p: any) =>
        p.produto.toLowerCase(),
      ) || []
    let relevantScopeText = ''

    const formatScope = (name: string, data: any) => {
      if (!data || Object.keys(data).length === 0) return ''
      return `\n=== ESCOPO ${name.toUpperCase()} ===
Descrição: ${data.description}
Público: ${data.targetAudience}
Valor: ${data.investment}
Entregas: ${data.deliverables}
Metodologia: ${data.methodology}
${data.objections ? `Objeções Mapeadas: ${data.objections.map((o: any) => `"${o.objection}" -> "${o.response}"`).join(' | ')}` : ''}
`
    }

    if (clientProducts.some((p: string) => p.includes('elite'))) {
      relevantScopeText += formatScope('Adapta Elite', eliteScope)
    } else if (clientProducts.some((p: string) => p.includes('scale'))) {
      relevantScopeText += formatScope('Adapta Scale', scaleScope)
    } else if (clientProducts.some((p: string) => p.includes('labs'))) {
      relevantScopeText += formatScope('Adapta Labs', labsScope)
    } else {
      // If no specific product, or unknown, include summaries or all if not too huge.
      // For now, let's include all populated scopes as reference
      relevantScopeText += formatScope('Adapta Elite', eliteScope)
      relevantScopeText += formatScope('Adapta Scale', scaleScope)
      relevantScopeText += formatScope('Adapta Labs', labsScope)
    }

    // Always include Sales Pipeline
    if (salesScope && salesScope.processDescription) {
      relevantScopeText += `\n=== PIPELINE DE VENDAS ===
Processo: ${salesScope.processDescription}
Qualificação: ${salesScope.qualificationCriteria}
Objeções Gerais: ${salesScope.objections?.map((o: any) => `"${o.objection}" -> "${o.response}"`).join(' | ')}
`
    }

    // 4. Fetch Messages
    const { data: messages } = await supabase
      .from('mensagens')
      .select('*')
      .eq('conversa_id', conversa_id)
      .order('timestamp', { ascending: false })
      .limit(20)

    const recentMessages = messages?.reverse() || []

    // 5. Build Prompt
    const clientName =
      conversation.cliente?.nome_completo ||
      conversation.cliente?.primeiro_nome ||
      'Cliente'
    const products =
      conversation.cliente?.produtos_cliente
        ?.map((p: any) => `${p.produto} (${p.status})`)
        .join(', ') || 'Nenhum'
    const activeTags =
      conversation.cliente?.tags_cliente
        ?.filter((t: any) => t.ativo)
        .map((t: any) => t.tipo_tag) || []
    const tagsString = activeTags.join(', ') || 'Nenhuma'

    // Scenario Logic (Scheduled Call, CSAT, New Lead) - Keep existing logic
    const specialInstructions: string[] = []
    const now = new Date()
    const next48h = new Date(now.getTime() + 48 * 60 * 60 * 1000)
    const scheduledCall = conversation.cliente?.calls?.find((c: any) => {
      if (!c.data_agendada) return false
      const d = new Date(c.data_agendada)
      return d > now && d < next48h
    })

    if (scheduledCall) {
      const callDate = new Date(scheduledCall.data_agendada).toLocaleString(
        'pt-BR',
        {
          weekday: 'long',
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        },
      )
      specialInstructions.push(
        `URGENTE: Existe uma call agendada para ${callDate}. Mencione isso.`,
      )
    }
    if (activeTags.includes('csat_pendente')) {
      specialInstructions.push(
        'IMPORTANTE: O cliente tem uma pesquisa de satisfação (CSAT) pendente. Peça feedback.',
      )
    }
    if (conversation.cliente?.pendente_classificacao) {
      specialInstructions.push(
        'CONTEXTO: Este é um NOVO LEAD (pendente de classificação). Faça perguntas de qualificação.',
      )
    }

    // Format Few-Shot Examples
    let examplesText = ''
    if (Array.isArray(examples) && examples.length > 0) {
      examplesText =
        '\n=== EXEMPLOS DE CONVERSAS REAIS (FEW-SHOT) ===\nUse estes exemplos como guia de tom e estrutura:\n'
      examples.slice(0, 5).forEach((ex: any, i: number) => {
        if (ex.pairs && ex.pairs.length > 0) {
          examplesText += `\nCenário ${i + 1}: ${ex.title} (${ex.category})\nContexto: ${ex.context}\n`
          ex.pairs.forEach((pair: any) => {
            examplesText += `Cliente: "${pair.client}"\nConsultor: "${pair.ai}"\n`
          })
        }
      })
    }

    let systemPrompt = `=== CONTEXTO DA EMPRESA ===
${contextMap['institucional'] || ''}
${contextMap['produtos_servicos'] || ''}

${relevantScopeText}

=== TOM DE COMUNICAÇÃO ===
${contextMap['tom_de_voz'] || 'Profissional, empático, direto e com uso moderado de emojis.'}

${examplesText}

=== PERFIL DO CLIENTE ===
Nome: ${clientName}
Produtos: ${products}
Tags: ${tagsString}
Engajamento: ${conversation.cliente?.nivel_engajamento || 'Desconhecido'}

=== SUA TAREFA ===
Você é um consultor humano da empresa. Escreva uma resposta de WhatsApp para este cliente.
Diretrizes:
- Use o primeiro nome do cliente de forma natural.
- Seja objetivo e útil.
- Baseie-se fortemente nos escopos e exemplos fornecidos.
- Preferência de tamanho: ${lengthPreference}.
${specialInstructions.length > 0 ? '\nINSTRUÇÕES ESPECÍFICAS PARA ESTA CONVERSA:\n' + specialInstructions.map((i) => `- ${i}`).join('\n') : ''}`

    const conversationLog = recentMessages
      .map((m: any) => {
        const sender = m.origem === 'me' ? 'VOCÊ (Consultor)' : 'CLIENTE'
        return `${sender}: ${m.conteudo}`
      })
      .join('\n')

    const fullPrompt = `${systemPrompt}\n\n=== HISTÓRICO DA CONVERSA ===\n${conversationLog}\n\nResposta Sugerida:`

    // 6. Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config['gemini_apikey']}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { temperature: temperature, maxOutputTokens: 800 },
        }),
      },
    )

    if (!response.ok) {
      const err = await response.json()
      throw new Error(
        `Gemini API Error: ${err.error?.message || response.statusText}`,
      )
    }

    const aiData = await response.json()
    const suggestion = aiData.candidates?.[0]?.content?.parts?.[0]?.text || ''

    if (!suggestion) throw new Error('No suggestion generated')

    const duration = Date.now() - startTime
    const tokens = aiData.usageMetadata?.totalTokenCount || 0

    // 7. Log Analytics
    const { data: analyticsEntry } = await supabase
      .from('analytics_sugestoes_ia')
      .insert({
        conversa_id: conversa_id,
        cliente_id: conversation.cliente_id,
        sugestao_gerada: suggestion,
        tempo_geracao_ms: duration,
        tokens_usados: tokens,
        modelo_used: model,
      })
      .select()
      .single()

    return new Response(
      JSON.stringify({
        suggestion: suggestion.trim(),
        analyticsId: analyticsEntry?.id,
        contextUsed: {
          clientName,
          products,
          tags: tagsString,
          lengthPreference,
          temperature,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error: any) {
    console.error('Edge Function Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
