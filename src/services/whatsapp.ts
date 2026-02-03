import { supabase } from '@/lib/supabase/client'

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
  origem: 'me' | 'other'
  conteudo: string
  timestamp: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  tipo: 'text' | 'image' | 'audio' | 'document' | 'template'
  url_midia?: string | null
}

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
  return data as WhatsAppConversation[]
}

export const getConversation = async (id: string) => {
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
  const { data, error } = await supabase
    .from('mensagens')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('timestamp', { ascending: true })

  if (error) {
    console.error('Error fetching messages:', error)
    return []
  }
  return data as WhatsAppMessage[]
}

export const sendWhatsAppMessage = async (
  conversationId: string,
  phone: string,
  message: string,
) => {
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

  await supabase
    .from('conversas_whatsapp')
    .update({
      ultima_interacao: new Date().toISOString(),
      ultimo_mensagem: message,
    })
    .eq('id', conversationId)

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

export const recalculatePriority = async (conversationId: string) => {
  const { error: updateError } = await supabase
    .from('conversas_whatsapp')
    .update({ prioridade_manual: false })
    .eq('id', conversationId)

  if (updateError) throw updateError

  const { data, error } = await supabase.functions.invoke(
    'calcular-prioridade-conversas',
    {
      body: { conversation_id: conversationId },
    },
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
