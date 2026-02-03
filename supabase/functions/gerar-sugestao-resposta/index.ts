import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
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

    // 2. Fetch Conversation & Client
    const { data: conversation } = await supabase
      .from('conversas_whatsapp')
      .select(
        `
        *,
        cliente:clientes (
            *,
            produtos_cliente (produto, status),
            tags_cliente (tipo_tag, ativo),
            calls (data_realizada, duracao_minutos)
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
    const tags =
      conversation.cliente?.tags_cliente
        ?.filter((t: any) => t.ativo)
        .map((t: any) => t.tipo_tag)
        .join(', ') || 'Nenhuma'
    const lastCall = conversation.cliente?.calls?.[0]?.data_realizada
      ? `Última call em ${new Date(conversation.cliente.calls[0].data_realizada).toLocaleDateString()}`
      : 'Sem histórico de calls recentes'

    let systemPrompt = `Você é um assistente de suporte e vendas experiente. Sua missão é escrever uma resposta de WhatsApp para um cliente, agindo como um consultor humano da empresa.
    
CONTEXTO DA EMPRESA:
${contextMap['institucional'] || ''}
${contextMap['produtos_servicos'] || ''}
${contextMap['escopo_elite'] || ''}
${contextMap['escopo_scale'] || ''}

TOM DE VOZ:
${contextMap['tom_de_voz'] || 'Profissional, empático, direto e com uso moderado de emojis.'}

PERFIL DO CLIENTE:
Nome: ${clientName}
Produtos: ${products}
Tags: ${tags}
Histórico: ${lastCall}
Engajamento: ${conversation.cliente?.nivel_engajamento || 'Desconhecido'}
Observações: ${conversation.cliente?.observacoes || 'Nenhuma'}

DIRETRIZES DE RESPOSTA:
- Use o primeiro nome do cliente de forma natural, se apropriado.
- Seja objetivo e útil.
- Evite linguagem robótica ou excessivamente formal.
- Preferência de tamanho: ${lengthPreference}.
- Se houver templates abaixo, use-os como inspiração de estilo, mas adapte ao contexto da conversa.
`

    if (templates && templates.length > 0) {
      systemPrompt += `\nTEMPLATES DE REFERÊNCIA:\n${templates
        .slice(0, 3)
        .map((t: any) => `- ${t.nome}: ${t.conteudo.substring(0, 100)}...`)
        .join('\n')}`
    }

    const conversationLog = recentMessages
      .map((m: any) => {
        const sender = m.origem === 'me' ? 'VOCÊ (Consultor)' : 'CLIENTE'
        return `${sender}: ${m.conteudo}`
      })
      .join('\n')

    const fullPrompt = `${systemPrompt}\n\nHISTÓRICO DA CONVERSA:\n${conversationLog}\n\nSUA TAREFA: Escreva apenas a resposta sugerida para enviar agora.`

    // 6. Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config['gemini_apikey']}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: temperature,
            maxOutputTokens: 500,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
          ],
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

    if (!suggestion) {
      throw new Error('No suggestion generated')
    }

    const duration = Date.now() - startTime
    const tokens = aiData.usageMetadata?.totalTokenCount || 0

    // 7. Log Analytics
    const { data: analyticsEntry, error: analyticsError } = await supabase
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

    if (analyticsError) {
      console.error('Analytics Error:', analyticsError)
    }

    return new Response(
      JSON.stringify({
        suggestion: suggestion.trim(),
        analyticsId: analyticsEntry?.id,
        contextUsed: {
          clientName,
          products,
          tags,
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
