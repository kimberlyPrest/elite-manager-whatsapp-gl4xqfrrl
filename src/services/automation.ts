import { supabase } from '@/lib/supabase/client'
import { Client } from './clients'

export interface AutomationModel {
  id: string
  nome: string
  descricao: string
  filtros: Record<string, any>
  mensagens: string[]
  configuracao: Record<string, any>
  created_at: string
}

export interface AutomationCampaign {
  id: string
  status_automacao:
    | 'ativa'
    | 'pausada'
    | 'concluida'
    | 'cancelada'
    | 'rascunho'
    | 'aguardando'
  data_inicio: string | null
  total_envios_planejados: number
  total_envios_concluidos: number
  total_envios_falhados: number
  intervalo_min_segundos: number
  intervalo_max_segundos: number
  mensagem_template?: string
  variacoes_mensagem: string[]
  configuracao_envio: {
    business_hours_enabled: boolean
    start_time: string
    end_time: string
    pause_after?: number
    pause_duration?: number
  }
  proximo_envio_timestamp?: string
  filtros_aplicados: Record<string, any>
  created_at: string
}

export interface AutomationRecipient {
  id: string
  automacao_id: string
  cliente_id: string | null
  numero_whatsapp: string
  nome_destinatario: string | null
  mensagem_personalizada: string | null
  status_envio: 'aguardando' | 'enviado' | 'falhou'
  data_envio: string | null
  erro_mensagem: string | null
}

export const getModels = async (): Promise<AutomationModel[]> => {
  const { data, error } = await supabase
    .from('modelos_automacao')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export const createModel = async (
  model: Omit<AutomationModel, 'id' | 'created_at'>,
) => {
  const { data, error } = await supabase
    .from('modelos_automacao')
    .insert(model)
    .select()
    .single()
  if (error) throw error
  return data
}

export const getCampaigns = async (): Promise<AutomationCampaign[]> => {
  const { data, error } = await supabase
    .from('automacoes_massa')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const createCampaign = async (campaign: any, recipients: any[]) => {
  // 1. Create Campaign
  const { data: automacao, error: campError } = await supabase
    .from('automacoes_massa')
    .insert({
      tipo_selecao: campaign.tipo_selecao,
      status_automacao: 'aguardando', // Created as 'aguardando' (Draft/Ready to Review)
      intervalo_min_segundos: campaign.configuracao_envio.min_interval,
      intervalo_max_segundos: campaign.configuracao_envio.max_interval,
      tempo_estimado_segundos:
        recipients.length *
        ((campaign.configuracao_envio.min_interval +
          campaign.configuracao_envio.max_interval) /
          2),
      total_envios_planejados: recipients.length,
      variacoes_mensagem: campaign.variacoes_mensagem,
      configuracao_envio: campaign.configuracao_envio,
      filtros_aplicados: campaign.filtros,
      data_inicio: campaign.start_now
        ? new Date().toISOString()
        : campaign.scheduled_date,
    })
    .select()
    .single()

  if (campError) throw campError

  // 2. Create Recipients
  const recipientsPayload = recipients.map((r, index) => ({
    automacao_id: automacao.id,
    cliente_id: r.id,
    numero_whatsapp: r.telefone,
    nome_destinatario: r.nome_completo,
    mensagem_personalizada: r.message, // Pre-calculated or empty if dynamic
    status_envio: 'aguardando',
    tempo_espera_segundos: 0, // Will be managed by edge function logic
  }))

  // Insert in batches of 100
  for (let i = 0; i < recipientsPayload.length; i += 100) {
    const batch = recipientsPayload.slice(i, i + 100)
    const { error: recError } = await supabase
      .from('automacoes_massa_destinatarios')
      .insert(batch)
    if (recError) throw recError
  }

  return automacao
}

export const startCampaign = async (id: string) => {
  const { error } = await supabase
    .from('automacoes_massa')
    .update({
      status_automacao: 'ativa',
      proximo_envio_timestamp: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) throw error
}

export const pauseCampaign = async (id: string) => {
  const { error } = await supabase
    .from('automacoes_massa')
    .update({ status_automacao: 'pausada' })
    .eq('id', id)

  if (error) throw error
}

export const cancelCampaign = async (id: string) => {
  const { error } = await supabase
    .from('automacoes_massa')
    .update({ status_automacao: 'cancelada' })
    .eq('id', id)

  if (error) throw error
}

export const getCampaignRecipients = async (
  id: string,
): Promise<AutomationRecipient[]> => {
  const { data, error } = await supabase
    .from('automacoes_massa_destinatarios')
    .select('*')
    .eq('automacao_id', id)
    .order('id') // Stable order

  if (error) throw error
  return data
}

export const triggerQueueProcessing = async () => {
  const { data, error } = await supabase.functions.invoke(
    'processar-fila-automacao',
  )
  return { data, error }
}

// Helper to filter clients (Client-side implementation of Step 2 wizard)
export const filterClients = (clients: Client[], filters: any): Client[] => {
  return clients.filter((client) => {
    // Products Filter
    if (filters.products && filters.products.length > 0) {
      const hasProduct = client.produtos_cliente.some((p) =>
        filters.products.includes(p.produto),
      )
      if (!hasProduct) return false
    }

    // Status Filter (Checking inside products)
    if (filters.status && filters.status.length > 0) {
      const hasStatus = client.produtos_cliente.some((p) =>
        filters.status.includes(p.status),
      )
      if (!hasStatus) return false
    }

    // Tags Filter
    if (filters.tags && filters.tags.length > 0) {
      const hasTag = client.tags_cliente.some(
        (t) => filters.tags.includes(t.tipo_tag) && t.ativo,
      )
      if (!hasTag) return false
    }

    // Engagement Level
    if (filters.engagement && filters.engagement.length > 0) {
      if (!filters.engagement.includes(client.nivel_engajamento || ''))
        return false
    }

    return true
  })
}
