import { supabase } from '@/lib/supabase/client'
import { isAfter, parseISO } from 'date-fns'

export interface WhatsAppConversation {
  id: string
  created_at: string
  updated_at: string
  cliente_id: string | null
  numero_whatsapp: string
  ultimo_mensagem: string | null
  mensagens_nao_lidas: number
  prioridade: 'Baixo' | 'Médio' | 'Alto' | 'Crítico' | string
  score_prioridade: number
  status: string
  ultima_interacao: string | null
  prioridade_manual: boolean
  cliente?: {
    id: string
    nome_completo: string
    primeiro_nome?: string
    sobrenome?: string
    foto_url?: string
  } | null
}

export interface WhatsAppMessage {
  id: string
  conversation_id: string
  origem: 'me' | 'other' | string
  conteudo: string
  timestamp: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  tipo: 'text' | 'image' | 'audio' | 'document' | 'template'
  url_midia?: string | null
  status_leitura?: boolean
}

export interface EvolutionConfig {
  url: string
  apikey: string
  instance: string
}

// Deprecated, mapped to EvolutionConfig for compatibility
export interface WhatsappConfig extends EvolutionConfig {
  instanceName: string
  status: 'connected' | 'disconnected' | 'connecting'
  owner?: string
}

const SYNC_START_DATE = new Date('2025-09-01T00:00:00.000Z')

// --- Configuration Functions ---

export const getEvolutionConfig = async (): Promise<EvolutionConfig> => {
  try {
    const { data, error } = await supabase
      .from('configuracoes')
      .select('chave, valor')
      .in('chave', [
        'evolution_api_url',
        'evolution_api_key',
        'evolution_instance_name',
      ])

    if (error) {
      console.error('Error fetching config:', error)
      return { url: '', apikey: '', instance: '' }
    }

    const config: EvolutionConfig = { url: '', apikey: '', instance: '' }

    if (data) {
      data.forEach((item) => {
        if (item.chave === 'evolution_api_url') config.url = item.valor || ''
        if (item.chave === 'evolution_api_key') config.apikey = item.valor || ''
        if (item.chave === 'evolution_instance_name')
          config.instance = item.valor || ''
      })
    }

    return config
  } catch (err) {
    console.error('Unexpected error fetching config:', err)
    return { url: '', apikey: '', instance: '' }
  }
}

export const saveEvolutionConfig = async (
  config: EvolutionConfig,
): Promise<boolean> => {
  try {
    const updates = [
      { chave: 'evolution_api_url', valor: config.url },
      { chave: 'evolution_api_key', valor: config.apikey },
      { chave: 'evolution_instance_name', valor: config.instance },
    ]

    for (const update of updates) {
      const { error } = await supabase
        .from('configuracoes')
        .update({ valor: update.valor, updated_at: new Date().toISOString() })
        .eq('chave', update.chave)

      if (error) throw error
    }

    return true
  } catch (error) {
    console.error('Error saving config:', error)
    return false
  }
}

// Kept for backward compatibility, but uses DB now
export const getWhatsappConfig = async (): Promise<WhatsappConfig> => {
  const config = await getEvolutionConfig()
  return {
    ...config,
    instanceName: config.instance || 'Elite Manager WhatsApp',
    status: config.url && config.apikey ? 'connected' : 'disconnected',
    owner: 'Admin',
  }
}

// --- Data Fetching Functions ---

export const getConversations = async () => {
  const { data, error } = await supabase
    .from('conversas_whatsapp')
    .select(
      `
      *,
      cliente:clientes(id, nome_completo, primeiro_nome, sobrenome)
    `,
    )
    .order('score_prioridade', { ascending: false })

  if (error) {
    console.error('Error fetching conversations:', error)
    return []
  }
  return (data as WhatsAppConversation[]) || []
}

export const getConversation = async (id: string) => {
  if (!id) throw new Error('Conversation ID is required')

  const { data, error } = await supabase
    .from('conversas_whatsapp')
    .select(
      `
      *,
      cliente:clientes(id, nome_completo, primeiro_nome, sobrenome)
    `,
    )
    .eq('id', id)
    .single()

  if (error) throw error
  return data as WhatsAppConversation
}

export const getMessages = async (conversationId: string) => {
  if (!conversationId) return []

  const { data, error } = await supabase
    .from('mensagens')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('timestamp', { ascending: true })

  if (error) {
    console.error('Error fetching messages:', error)
    return []
  }
  return (data as WhatsAppMessage[]) || []
}

export const sendWhatsAppMessage = async (
  conversationId: string,
  phone: string,
  message: string,
) => {
  // 1. Save to Supabase first (Optimistic UI)
  const { data, error } = await supabase
    .from('mensagens')
    .insert({
      conversation_id: conversationId,
      origem: 'me',
      conteudo: message,
      timestamp: new Date().toISOString(),
      status: 'sent',
      tipo: 'text',
    })
    .select()
    .single()

  if (error) throw error

  // 2. Update conversation
  await supabase
    .from('conversas_whatsapp')
    .update({
      ultima_interacao: new Date().toISOString(),
      ultima_mensagem: message,
    })
    .eq('id', conversationId)

  // 3. Trigger Evolution API Send (Fire and Forget or handled by Edge Function in real app)
  const config = await getEvolutionConfig()
  if (config.url && config.apikey && config.instance) {
    fetch(`${config.url}/message/sendText/${config.instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: config.apikey,
      },
      body: JSON.stringify({
        number: phone,
        options: { delay: 1200, presence: 'composing' },
        textMessage: { text: message },
      }),
    }).catch((err) => console.error('Failed to send to API:', err))
  }

  return data
}

export const setManualPriority = async (
  conversationId: string,
  priority: string,
) => {
  const { data, error } = await supabase
    .from('conversas_whatsapp')
    .update({
      prioridade: priority,
      prioridade_manual: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const recalculatePriority = async (conversationId?: string) => {
  // Logic handled by edge function usually, calling it here
  const payload = conversationId ? { conversation_id: conversationId } : {}

  const { data, error } = await supabase.functions.invoke(
    'calcular-prioridade-conversas',
    { body: payload },
  )

  if (error) throw error
  return data
}

export const markAsRead = async (conversationId: string) => {
  const { error } = await supabase
    .from('conversas_whatsapp')
    .update({ mensagens_nao_lidas: 0 })
    .eq('id', conversationId)

  if (error) throw error
}

// --- Instance Management & Sync ---

export const checkInstanceConnection = async (config: EvolutionConfig) => {
  if (!config.url || !config.apikey || !config.instance) {
    return { state: 'error', status: 400 }
  }

  try {
    const response = await fetch(
      `${config.url}/instance/connectionState/${config.instance}`,
      {
        method: 'GET',
        headers: { apikey: config.apikey },
      },
    )

    if (!response.ok) {
      if (response.status === 401) return { state: 'unauthorized', status: 401 }
      if (response.status === 404) return { state: 'not_found', status: 404 }
      throw new Error('Connection failed')
    }

    const data = await response.json()
    // Evolution v2 structure: data.instance.state or data.state
    const state = data?.instance?.state || data?.state || 'unknown'
    return { state, status: response.status }
  } catch (error) {
    console.error('Check connection error:', error)
    return { state: 'error', status: 500 }
  }
}

export const connectInstance = async (config: EvolutionConfig) => {
  if (!config.url || !config.apikey || !config.instance) {
    throw new Error('Configuração incompleta')
  }

  const response = await fetch(
    `${config.url}/instance/connect/${config.instance}`,
    {
      method: 'GET', // Evolution v2 uses GET for connect usually
      headers: { apikey: config.apikey },
    },
  )

  if (!response.ok) throw new Error('Falha ao solicitar conexão')
  return await response.json()
}

export const logoutInstance = async (config: EvolutionConfig) => {
  const response = await fetch(
    `${config.url}/instance/logout/${config.instance}`,
    {
      method: 'DELETE',
      headers: { apikey: config.apikey },
    },
  )
  if (!response.ok) throw new Error('Falha ao desconectar')
  return await response.json()
}

export const configureWebhook = async (config: EvolutionConfig) => {
  // This typically would be an API call to set webhook
  // Assuming supabase edge function URL for webhook
  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webhook-whatsapp`

  const response = await fetch(`${config.url}/webhook/set/${config.instance}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: config.apikey },
    body: JSON.stringify({
      webhook: {
        url: webhookUrl,
        enabled: true,
        events: ['MESSAGES_UPSERT', 'MESSAGES_UPDATE', 'SEND_MESSAGE'],
      },
    }),
  })

  if (!response.ok) throw new Error('Falha ao configurar webhook')
  return { success: true }
}

export const syncHistory = async (config: EvolutionConfig) => {
  if (!config.url || !config.apikey || !config.instance) {
    throw new Error('Configuração inválida para sincronização')
  }

  // 1. Fetch Chats
  const chatsResponse = await fetch(
    `${config.url}/chat/findContacts/${config.instance}`,
    {
      method: 'GET',
      headers: { apikey: config.apikey },
    },
  )

  if (!chatsResponse.ok) throw new Error('Falha ao buscar contatos')

  const chats = await chatsResponse.json()
  // Evolution returns array of chats
  const chatList = Array.isArray(chats) ? chats : chats.data || []

  let count = 0

  for (const chat of chatList) {
    if (!chat.id || !chat.id.includes('@s.whatsapp.net')) continue

    const remoteJid = chat.id
    const phone = remoteJid.split('@')[0]

    // Upsert Conversation
    const { data: conversationData, error: convError } = await supabase
      .from('conversas_whatsapp')
      .upsert(
        {
          numero_whatsapp: phone,
          ultima_interacao: chat.conversationTimestamp
            ? new Date(chat.conversationTimestamp * 1000).toISOString()
            : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'numero_whatsapp' },
      )
      .select()
      .single()

    if (convError || !conversationData) continue

    // 2. Fetch Messages for this Chat (Limited batch for stability)
    // Evolution endpoint for messages: /chat/findMessages/{instance}
    try {
      const msgsResponse = await fetch(
        `${config.url}/chat/findMessages/${config.instance}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: config.apikey,
          },
          body: JSON.stringify({
            where: {
              key: { remoteJid },
            },
            options: {
              limit: 50, // Limit to avoid overload
            },
          }),
        },
      )

      if (msgsResponse.ok) {
        const msgsData = await msgsResponse.json()
        const messages = Array.isArray(msgsData)
          ? msgsData
          : msgsData.messages || []

        const filteredMessages = messages.filter((m: any) => {
          const timestamp = m.messageTimestamp
            ? typeof m.messageTimestamp === 'number'
              ? m.messageTimestamp * 1000
              : m.messageTimestamp
            : Date.now()
          return isAfter(new Date(timestamp), SYNC_START_DATE)
        })

        for (const m of filteredMessages) {
          const timestamp = m.messageTimestamp
            ? new Date(
                typeof m.messageTimestamp === 'number'
                  ? m.messageTimestamp * 1000
                  : m.messageTimestamp,
              ).toISOString()
            : new Date().toISOString()
          const content =
            m.message?.conversation ||
            m.message?.extendedTextMessage?.text ||
            m.message?.imageMessage?.caption ||
            '[Mídia]'
          const fromMe = m.key?.fromMe

          await supabase.from('mensagens').upsert(
            {
              conversa_id: conversationData.id,
              conteudo: content,
              origem: fromMe ? 'me' : 'other',
              timestamp: timestamp,
              status: 'delivered',
              tipo: m.messageType || 'text',
              message_id: m.key?.id,
            },
            { onConflict: 'message_id' },
          ) // Assuming message_id unique constraint or just insert

          count++
        }
      }
    } catch (err) {
      console.error(`Error syncing chat ${phone}:`, err)
    }
  }

  return { success: true, count }
}
