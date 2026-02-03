import { supabase } from '@/lib/supabase/client'

export interface WhatsAppConversation {
  id: string
  cliente_id: string
  numero_whatsapp: string
  ultima_mensagem: string | null
  ultima_mensagem_timestamp: string | null
  ultima_interacao: string | null
  mensagens_nao_lidas: number
  prioridade: 'Crítico' | 'Alto' | 'Médio' | 'Baixo'
  prioridade_manual?: boolean
  score_prioridade?: number
  cliente?: {
    id: string
    nome_completo: string
    primeiro_nome?: string
    avatar_url?: string
  }
}

export interface WhatsAppMessage {
  id: string
  conversa_id: string
  tipo: string
  conteudo: string
  timestamp: string
  status_leitura: boolean
  origem: 'me' | 'contact'
  enviado_via?: string
}

export interface EvolutionConfig {
  url: string
  apikey: string
  instance: string
}

export const getWhatsappConfig = async (): Promise<EvolutionConfig> => {
  const { data, error } = await supabase
    .from('configuracoes')
    .select('chave, valor')
    .in('chave', ['evolution_url', 'evolution_apikey', 'evolution_instance'])

  if (error) throw error

  const config: Record<string, string> = {}
  data?.forEach((item) => {
    config[item.chave] = item.valor || ''
  })

  // Normalize URL by removing trailing slash
  const url = config['evolution_url']?.replace(/\/$/, '') || ''

  return {
    url,
    apikey: config['evolution_apikey'] || '',
    instance: config['evolution_instance'] || '',
  }
}

export const getConversations = async (
  search: string = '',
  filter: string = 'Todas',
) => {
  let query = supabase.from('conversas_whatsapp').select(`
      *,
      cliente:clientes(id, nome_completo, primeiro_nome)
    `)

  query = query.order('ultima_interacao', { ascending: false })

  if (search) {
    query = query.ilike('numero_whatsapp', `%${search}%`)
  }

  if (filter !== 'Todas') {
    if (filter === 'Não Lidas') {
      query = query.gt('mensagens_nao_lidas', 0)
    } else {
      query = query.eq('prioridade', filter)
    }
  }

  const { data, error } = await query
  if (error) throw error

  if (search && data) {
    const lowerSearch = search.toLowerCase()
    return (data as any[]).filter(
      (c) =>
        c.numero_whatsapp.includes(search) ||
        c.cliente?.nome_completo?.toLowerCase().includes(lowerSearch),
    )
  }

  return data as any as WhatsAppConversation[]
}

export const getMessages = async (conversationId: string) => {
  const { data, error } = await supabase
    .from('mensagens')
    .select('*')
    .eq('conversa_id', conversationId)
    .order('timestamp', { ascending: true })

  if (error) throw error
  return data as WhatsAppMessage[]
}

export const sendWhatsAppMessage = async (
  conversationId: string,
  phone: string,
  text: string,
) => {
  const config = await getWhatsappConfig()

  if (!config.url || !config.apikey || !config.instance) {
    throw new Error('Configuração da API incompleta')
  }

  const response = await fetch(
    `${config.url}/message/sendText/${encodeURIComponent(config.instance)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: config.apikey,
      },
      body: JSON.stringify({
        number: phone,
        options: {
          delay: 1200,
          presence: 'composing',
          linkPreview: false,
        },
        textMessage: {
          text: text,
        },
      }),
    },
  )

  if (!response.ok) {
    throw new Error('Falha ao enviar mensagem na API')
  }

  const { data, error } = await supabase
    .from('mensagens')
    .insert({
      conversa_id: conversationId,
      tipo: 'text',
      conteudo: text,
      timestamp: new Date().toISOString(),
      status_leitura: true,
      origem: 'me',
      enviado_via: 'agent',
    })
    .select()
    .single()

  if (error) throw error

  await supabase
    .from('conversas_whatsapp')
    .update({
      ultima_mensagem: text,
      ultima_mensagem_timestamp: new Date().toISOString(),
      ultima_interacao: new Date().toISOString(),
    })
    .eq('id', conversationId)

  recalculatePriority(conversationId).catch(console.error)

  return data
}

export const markAsRead = async (conversationId: string) => {
  await supabase
    .from('conversas_whatsapp')
    .update({ mensagens_nao_lidas: 0 })
    .eq('id', conversationId)
}

export const recalculatePriority = async (conversationId?: string) => {
  const { data, error } = await supabase.functions.invoke(
    'calcular-prioridade-conversas',
    {
      body: { conversa_id: conversationId },
    },
  )
  if (error) throw error
  return data
}

export const setManualPriority = async (
  conversationId: string,
  priority: string,
) => {
  const { error } = await supabase
    .from('conversas_whatsapp')
    .update({
      prioridade: priority,
      prioridade_manual: true,
    })
    .eq('id', conversationId)

  if (error) throw error
}

/**
 * Checks the connection state of the Evolution API instance.
 */
export const checkInstanceConnection = async (config: EvolutionConfig) => {
  const url = config.url.replace(/\/$/, '')
  try {
    const response = await fetch(
      `${url}/instance/connectionState/${encodeURIComponent(config.instance)}`,
      {
        method: 'GET',
        headers: {
          apikey: config.apikey,
        },
      },
    )

    if (!response.ok) {
      if (response.status === 404) return { state: 'not_found' }
      if (response.status === 401) return { state: 'unauthorized' }
      throw new Error(`API Error: ${response.status}`)
    }

    const data = await response.json()
    // Evolution API structure usually: { instance: { state: 'open' | 'close' | 'connecting' } }
    return { state: data?.instance?.state || 'unknown' }
  } catch (error) {
    console.error('Connection check failed:', error)
    return { state: 'error', error }
  }
}

/**
 * Initiates connection to get QR Code.
 */
export const connectInstance = async (config: EvolutionConfig) => {
  const url = config.url.replace(/\/$/, '')

  try {
    const response = await fetch(
      `${url}/instance/connect/${encodeURIComponent(config.instance)}`,
      {
        method: 'GET',
        headers: {
          apikey: config.apikey,
        },
      },
    )

    if (!response.ok) {
      if (response.status === 401) throw new Error('API Key inválida (401)')
      if (response.status === 404)
        throw new Error('Instância não encontrada (404)')
      if (response.status === 403) throw new Error('Acesso negado (403)')
      throw new Error(`Falha na conexão: ${response.status}`)
    }

    const data = await response.json()
    // Evolution API returns base64 or message
    return data
  } catch (error: any) {
    throw new Error(error.message || 'Erro de rede ao conectar')
  }
}

/**
 * Logs out the instance.
 */
export const logoutInstance = async (config: EvolutionConfig) => {
  const url = config.url.replace(/\/$/, '')

  try {
    const response = await fetch(
      `${url}/instance/logout/${encodeURIComponent(config.instance)}`,
      {
        method: 'DELETE',
        headers: {
          apikey: config.apikey,
        },
      },
    )

    if (!response.ok) {
      if (response.status === 404) return true // Already logged out
      if (response.status === 401) throw new Error('API Key inválida')
      throw new Error(`Falha ao desconectar: ${response.status}`)
    }

    return true
  } catch (error: any) {
    throw new Error(error.message || 'Erro de rede ao desconectar')
  }
}

/**
 * Configures the webhook for the instance.
 */
export const configureWebhook = async (config: EvolutionConfig) => {
  const url = config.url.replace(/\/$/, '')
  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-whatsapp`

  try {
    const payload = {
      webhook: {
        enabled: true,
        url: webhookUrl,
        byEvents: false,
        events: ['MESSAGES_UPSERT'],
      }
    }

    const response = await fetch(
      `${url}/webhook/set/${encodeURIComponent(config.instance)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: config.apikey,
        },
        body: JSON.stringify(payload),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      try {
        const errorJson = JSON.parse(errorText)
        throw new Error(
          `Erro API: ${errorJson.response?.message || errorJson.message || JSON.stringify(errorJson)}`,
        )
      } catch (e) {
        throw new Error(
          `Falha ao configurar webhook: ${response.status} - ${errorText}`,
        )
      }
    }

    return await response.json()
  } catch (error: any) {
    console.error('Webhook config failed:', error)
    throw error // Re-throw modified error
  }
}

/**
 * Fetches history from Evolution API and syncs with Supabase.
 */
export const syncHistory = async (config: EvolutionConfig) => {
  const url = config.url.replace(/\/$/, '')

  try {
    // 1. Fetch messages from Evolution
    const response = await fetch(
      `${url}/chat/findMessages/${encodeURIComponent(config.instance)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: config.apikey,
        },
        body: JSON.stringify({
          where: {},
          options: {
            limit: 50, // Start with last 50 messages to simply verify
            page: 1,
          },
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      try {
        const errorJson = JSON.parse(errorText)
        throw new Error(`Erro API: ${errorJson.response?.message || errorJson.message || JSON.stringify(errorJson)}`)
      } catch (e) {
        throw new Error(`Falha ao buscar mensagens: ${response.status} - ${errorText}`)
      }
    }

    const data = await response.json()
    // Data can be { messages: [...] } or just [...]
    const messages = Array.isArray(data) ? data : data.messages || []

    if (!messages.length) return { count: 0 }

    let syncedCount = 0
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const webhookUrl = `${supabaseUrl}/functions/v1/webhook-whatsapp`

    // 2. Send each message to our webhook
    // We do this in parallel chunks to be faster but not overwhelm
    const chunkSize = 5
    for (let i = 0; i < messages.length; i += chunkSize) {
      const chunk = messages.slice(i, i + chunkSize)
      await Promise.all(
        chunk.map(async (msg: any) => {
          try {
            // Adapt message to webhook format if needed
            // If msg already looks like the data part of webhook, great.
            // Usually findMessages returns the full message object similar to 'data' in webhook.

            await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'messages.upsert',
                data: msg,
              }),
            })
            syncedCount++
          } catch (err) {
            console.error('Failed to sync message:', err)
          }
        }),
      )
    }

    return { count: syncedCount }
  } catch (error: any) {
    console.error('History sync failed:', error)
    throw new Error(error.message || 'Erro ao sincronizar histórico')
  }
}
