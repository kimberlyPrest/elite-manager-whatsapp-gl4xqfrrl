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

export const getWhatsappConfig = async () => {
  const { data, error } = await supabase
    .from('configuracoes')
    .select('chave, valor')
    .in('chave', ['evolution_url', 'evolution_apikey', 'evolution_instance'])

  if (error) throw error

  const config: Record<string, string> = {}
  data?.forEach((item) => {
    config[item.chave] = item.valor || ''
  })

  return {
    url: config['evolution_url'],
    apikey: config['evolution_apikey'],
    instance: config['evolution_instance'],
  }
}

export const getConversations = async (
  search: string = '',
  filter: string = 'Todas',
) => {
  let query = supabase
    .from('conversas_whatsapp')
    .select(
      `
      *,
      cliente:clientes(id, nome_completo, primeiro_nome)
    `,
    )
    .order('mensagens_nao_lidas', { ascending: false })
    .order('ultima_interacao', { ascending: false })

  if (search) {
    // Note: Supabase doesn't support easy joining filter on referenced tables in one go without flattened view
    // We will filter client name in memory for simplicity or use specific search logic
    // For now, let's filter by number or if possible
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

  // Client name filtering in memory if search is present
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

  // 1. Send via Evolution API
  const response = await fetch(
    `${config.url}/message/sendText/${config.instance}`,
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

  // 2. Save to Database (Optimistic or Confirmed)
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

  // 3. Update Conversation
  await supabase
    .from('conversas_whatsapp')
    .update({
      ultima_mensagem: text,
      ultima_mensagem_timestamp: new Date().toISOString(),
      ultima_interacao: new Date().toISOString(),
    })
    .eq('id', conversationId)

  return data
}

export const markAsRead = async (conversationId: string) => {
  await supabase
    .from('conversas_whatsapp')
    .update({ mensagens_nao_lidas: 0 })
    .eq('id', conversationId)
}
