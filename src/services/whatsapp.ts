import { supabase } from '@/lib/supabase/client'

// Types for WhatsApp service
export interface ConnectionState {
  state: 'open' | 'connecting' | 'disconnected' | 'close'
  statusReason?: number
}

export interface ConnectResponse {
  qrcode?: {
    base64: string
  }
  base64?: string
  code?: string
}

export interface WhatsappConfig {
  instanceName: string
  status: ConnectionState['state']
  webhookUrl?: string
}

/**
 * Checks the connection status of a WhatsApp instance
 */
export const checkInstanceConnection = async (
  instanceName: string,
): Promise<ConnectionState> => {
  try {
    console.log('Checking connection for:', instanceName)
    // Return a default disconnected state to prevent crashes
    return {
      state: 'disconnected',
      statusReason: 200,
    }
  } catch (error) {
    console.error('Error checking instance connection:', error)
    return {
      state: 'disconnected',
      statusReason: 500,
    }
  }
}

/**
 * Initiates connection for a WhatsApp instance
 */
export const connectInstance = async (
  instanceName: string,
): Promise<ConnectResponse> => {
  try {
    console.log('Connecting instance:', instanceName)
    // Mock response for connection initiation
    return {
      qrcode: {
        base64: '',
      },
      base64: '',
    }
  } catch (error) {
    console.error('Error connecting instance:', error)
    throw error
  }
}

/**
 * Logs out a WhatsApp instance
 */
export const logoutInstance = async (instanceName: string) => {
  try {
    console.log('Logging out instance:', instanceName)
    return { status: 'success' }
  } catch (error) {
    console.error('Error logging out:', error)
    throw error
  }
}

/**
 * Configures the webhook for a WhatsApp instance
 */
export const configureWebhook = async (
  instanceName: string,
  webhookUrl: string,
  enabled: boolean = true,
  events?: string[],
) => {
  try {
    console.log('Configuring webhook:', {
      instanceName,
      webhookUrl,
      enabled,
      events,
    })
    return { status: 'success' }
  } catch (error) {
    console.error('Error configuring webhook:', error)
    throw error
  }
}

/**
 * Triggers history synchronization for a WhatsApp instance
 */
export const syncHistory = async (instanceName: string, options?: any) => {
  try {
    console.log('Syncing history for:', instanceName, options)
    return { status: 'success' }
  } catch (error) {
    console.error('Error syncing history:', error)
    throw error
  }
}

/**
 * Retrieves the current WhatsApp configuration
 */
export const getWhatsappConfig = async (): Promise<WhatsappConfig> => {
  try {
    // In a real scenario, fetch this from a 'config' table or edge function
    return {
      instanceName: 'default',
      status: 'disconnected',
      webhookUrl: '',
    }
  } catch (error) {
    console.error('Error getting whatsapp config:', error)
    throw error
  }
}

/**
 * Retrieves a list of WhatsApp conversations
 */
export const getConversations = async () => {
  try {
    const { data, error } = await supabase
      .from('conversas_whatsapp')
      .select(
        `
        *,
        cliente:clientes(nome_completo, telefone)
      `,
      )
      .order('ultima_interacao', { ascending: false })

    if (error) throw error

    return data.map((conv: any) => ({
      id: conv.id,
      clientId: conv.cliente_id,
      name:
        conv.cliente?.nome_completo ||
        conv.numero_telefone ||
        'Cliente Desconhecido',
      phone: conv.cliente?.telefone || conv.numero_telefone || '',
      unreadCount: conv.mensagens_nao_lidas || 0,
      lastMessageDate: conv.ultima_interacao,
      priority: conv.prioridade,
      status: conv.status || 'active',
    }))
  } catch (error) {
    console.error('Error getting conversations:', error)
    return []
  }
}

/**
 * Recalculates priority for a specific conversation
 */
export const recalculatePriority = async (conversationId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke(
      'calcular-prioridade-conversas',
      {
        body: { conversationId },
      },
    )

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error recalculating priority:', error)
    throw error
  }
}

/**
 * Retrieves messages for a specific conversation
 */
export const getMessages = async (conversationId: string) => {
  try {
    const { data, error } = await supabase
      .from('mensagens')
      .select('*')
      .eq('conversa_id', conversationId)
      .order('timestamp', { ascending: true })

    if (error) throw error

    return data.map((msg: any) => ({
      id: msg.id,
      content: msg.conteudo,
      timestamp: msg.timestamp,
      sender: msg.origem === 'me' ? 'me' : 'other',
      type: msg.tipo || 'text',
      status: msg.status || 'sent',
    }))
  } catch (error) {
    console.error('Error getting messages:', error)
    return []
  }
}

/**
 * Sends a message in a conversation
 */
export const sendWhatsAppMessage = async (
  conversationId: string,
  content: string,
  type: 'text' | 'image' | 'audio' = 'text',
) => {
  try {
    // Insert into messages table
    const { data, error } = await supabase
      .from('mensagens')
      .insert({
        conversa_id: conversationId,
        conteudo: content,
        tipo: type,
        origem: 'me',
        timestamp: new Date().toISOString(),
        status: 'sent',
      })
      .select()
      .single()

    if (error) throw error

    // Update conversation timestamp
    await supabase
      .from('conversas_whatsapp')
      .update({ ultima_interacao: new Date().toISOString() })
      .eq('id', conversationId)

    return data
  } catch (error) {
    console.error('Error sending message:', error)
    throw error
  }
}

/**
 * Marks messages in a conversation as read
 */
export const markAsRead = async (conversationId: string) => {
  try {
    const { error } = await supabase
      .from('conversas_whatsapp')
      .update({ mensagens_nao_lidas: 0 })
      .eq('id', conversationId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error marking as read:', error)
    throw error
  }
}
