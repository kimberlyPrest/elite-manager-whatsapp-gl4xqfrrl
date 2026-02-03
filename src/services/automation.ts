import { supabase } from '@/lib/supabase/client'
import { Client } from './clients'

export interface AutomationModel {
  id: string
  nome: string
  descricao: string
  categoria: string
  tipo_selecao: string
  filtros: Record<string, any>
  variacoes: string[]
  intervalo_min_segundos: number
  intervalo_max_segundos: number
  horario_comercial: boolean
  horario_inicio: string
  horario_fim: string
  dias_semana: string[]
  vezes_usado: number
  ultima_utilizacao: string | null
  taxa_resposta_media: number
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
  data_resposta: string | null
  erro_mensagem: string | null
  variacao_index: number
}

// Models CRUD
export const getModels = async (): Promise<AutomationModel[]> => {
  const { data, error } = await supabase
    .from('modelos_automacao')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export const createModel = async (
  model: Omit<
    AutomationModel,
    | 'id'
    | 'created_at'
    | 'vezes_usado'
    | 'ultima_utilizacao'
    | 'taxa_resposta_media'
  >,
) => {
  const { data, error } = await supabase
    .from('modelos_automacao')
    .insert({
      ...model,
      vezes_usado: 0,
      taxa_resposta_media: 0,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export const updateModel = async (
  id: string,
  model: Partial<AutomationModel>,
) => {
  const { data, error } = await supabase
    .from('modelos_automacao')
    .update(model)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteModel = async (id: string) => {
  const { error } = await supabase
    .from('modelos_automacao')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export const incrementModelUsage = async (id: string) => {
  // Safe increment using rpc or just fetch-update for MVP
  const { data } = await supabase
    .from('modelos_automacao')
    .select('vezes_usado')
    .eq('id', id)
    .single()
  if (data) {
    await supabase
      .from('modelos_automacao')
      .update({
        vezes_usado: (data.vezes_usado || 0) + 1,
        ultima_utilizacao: new Date().toISOString(),
      })
      .eq('id', id)
  }
}

// Campaign History
export const getCampaignsHistory = async (
  status?: string,
  dateRange?: { start: Date; end: Date },
): Promise<AutomationCampaign[]> => {
  let query = supabase
    .from('automacoes_massa')
    .select('*')
    .order('created_at', { ascending: false })

  if (status && status !== 'Todas') {
    query = query.eq('status_automacao', status.toLowerCase())
  }

  if (dateRange) {
    query = query
      .gte('created_at', dateRange.start.toISOString())
      .lte('created_at', dateRange.end.toISOString())
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export const getCampaignDetails = async (id: string) => {
  // Fetch campaign
  const { data: campaign, error: cErr } = await supabase
    .from('automacoes_massa')
    .select('*')
    .eq('id', id)
    .single()
  if (cErr) throw cErr

  // Fetch recipients for stats
  const { data: recipients, error: rErr } = await supabase
    .from('automacoes_massa_destinatarios')
    .select('*')
    .eq('automacao_id', id)
  if (rErr) throw rErr

  // Calculate stats
  const total = recipients.length
  const sent = recipients.filter((r) => r.status_envio === 'enviado').length
  const failed = recipients.filter((r) => r.status_envio === 'falhou').length
  const responded = recipients.filter((r) => !!r.data_resposta).length // Assuming logic adds this date

  const responseRate = sent > 0 ? (responded / sent) * 100 : 0
  const deliveryRate = total > 0 ? (sent / total) * 100 : 0

  // Avg Response Time
  let totalResponseTime = 0
  let responseCount = 0
  recipients.forEach((r) => {
    if (r.data_envio && r.data_resposta) {
      const diff =
        new Date(r.data_resposta).getTime() - new Date(r.data_envio).getTime()
      totalResponseTime += diff
      responseCount++
    }
  })
  const avgResponseTimeMinutes =
    responseCount > 0 ? totalResponseTime / responseCount / 60000 : 0

  return {
    campaign,
    recipients: recipients as AutomationRecipient[],
    stats: {
      total,
      sent,
      failed,
      responded,
      responseRate,
      deliveryRate,
      avgResponseTimeMinutes,
    },
  }
}

// Helper to calculate score
export const calculateEngagementScore = (
  responseRate: number,
  deliveryRate: number,
) => {
  return responseRate * 0.7 + deliveryRate * 0.3
}

// Retry Logic
export const retryFailedRecipients = async (originalCampaignId: string) => {
  const { campaign, recipients } = await getCampaignDetails(originalCampaignId)

  const failedRecipients = recipients.filter((r) => r.status_envio === 'falhou')
  if (failedRecipients.length === 0) return null

  // Create new campaign based on old one
  const newCampaign = await createCampaign(
    {
      tipo_selecao: campaign.tipo_selecao,
      configuracao_envio: {
        min_interval: campaign.intervalo_min_segundos,
        max_interval: campaign.intervalo_max_segundos,
        business_hours_enabled:
          campaign.configuracao_envio?.business_hours_enabled ?? true,
        start_time: campaign.configuracao_envio?.start_time ?? '09:00',
        end_time: campaign.configuracao_envio?.end_time ?? '18:00',
      },
      variacoes_mensagem: campaign.variacoes_mensagem,
      filtros: campaign.filtros_aplicados,
      start_now: true,
    },
    failedRecipients.map((r) => ({
      id: r.cliente_id,
      nome_completo: r.nome_destinatario,
      telefone: r.numero_whatsapp,
      message: r.mensagem_personalizada,
    })),
  )

  return newCampaign
}

// Existing methods needed for the rest of the app...
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
      nome: campaign.nome,
      objetivo: campaign.objetivo,
      tipo_selecao: campaign.tipo_selecao,
      status_automacao: 'aguardando',
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
  const recipientsPayload = recipients.map((r) => {
    const isTemp = r.id && r.id.toString().startsWith('temp-')
    return {
      automacao_id: automacao.id,
      cliente_id: isTemp ? null : r.id,
      numero_whatsapp: r.telefone || r.numero_whatsapp,
      nome_destinatario: r.nome_completo || r.nome_destinatario,
      mensagem_personalizada: r.message,
      status_envio: 'aguardando',
      tempo_espera_segundos: 0,
      variacao_index: r.variationIndex || 0,
    }
  })

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
    .order('id')

  if (error) throw error
  return data
}

export const triggerQueueProcessing = async () => {
  const { data, error } = await supabase.functions.invoke(
    'processar-fila-automacao',
  )
  return { data, error }
}

export const filterClients = (clients: Client[], filters: any): Client[] => {
  return clients.filter((client) => {
    if (filters.products && filters.products.length > 0) {
      const hasProduct = client.produtos_cliente.some((p) =>
        filters.products.includes(p.produto),
      )
      if (!hasProduct) return false
    }
    if (filters.status && filters.status.length > 0) {
      const hasStatus = client.produtos_cliente.some((p) =>
        filters.status.includes(p.status),
      )
      if (!hasStatus) return false
    }
    if (filters.tags && filters.tags.length > 0) {
      const hasTag = client.tags_cliente.some(
        (t) => filters.tags.includes(t.tipo_tag) && t.ativo,
      )
      if (!hasTag) return false
    }
    if (filters.engagement && filters.engagement.length > 0) {
      if (!filters.engagement.includes(client.nivel_engajamento || ''))
        return false
    }
    return true
  })
}
