import { supabase } from '@/lib/supabase/client'
import { startOfMonth, differenceInDays } from 'date-fns'

export interface TimelineEvent {
  id: string
  cliente_id: string
  produto_cliente_id?: string
  tipo_evento: string
  descricao: string
  data_evento: string
  resolvido: boolean
  data_resolucao?: string
  created_at: string
  produto?: {
    produto: string
  }
}

export interface TimelineSummary {
  total: number
  thisMonth: number
  pendingFups: number
  daysSinceLastInteraction: number
}

export const getTimelineEvents = async (
  clientId: string,
  search: string = '',
  filter: string = 'Todos',
  limit: number = 50,
): Promise<TimelineEvent[]> => {
  let query = supabase
    .from('timeline_eventos')
    .select(
      `
      *,
      produto:produtos_cliente(produto)
    `,
    )
    .eq('cliente_id', clientId)
    .order('data_evento', { ascending: false })
    .limit(limit)

  if (search) {
    query = query.ilike('descricao', `%${search}%`)
  }

  if (filter !== 'Todos') {
    switch (filter) {
      case 'Mudanças de Status':
        query = query.eq('tipo_evento', 'mudanca_status')
        break
      case 'Calls':
        query = query.eq('tipo_evento', 'call')
        break
      case 'Follow-ups':
        query = query.ilike('tipo_evento', 'fup_%')
        break
      case 'Notas':
        query = query.in('tipo_evento', ['nota', 'outro'])
        break
      case 'Sistema':
        query = query.eq('tipo_evento', 'sistema')
        break
      case 'Alertas':
        query = query.in('tipo_evento', ['tag', 'alerta'])
        break
    }
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching timeline events:', error)
    throw error
  }

  return data as TimelineEvent[]
}

export const getTimelineSummary = async (
  clientId: string,
): Promise<TimelineSummary> => {
  const now = new Date()
  const startOfMonthDate = startOfMonth(now).toISOString()

  // We'll run parallel queries for performance
  const [totalRes, monthRes, pendingRes, lastRes] = await Promise.all([
    // Total count
    supabase
      .from('timeline_eventos')
      .select('id', { count: 'exact', head: true })
      .eq('cliente_id', clientId),
    // This month count
    supabase
      .from('timeline_eventos')
      .select('id', { count: 'exact', head: true })
      .eq('cliente_id', clientId)
      .gte('data_evento', startOfMonthDate),
    // Pending Follow-ups
    supabase
      .from('timeline_eventos')
      .select('id', { count: 'exact', head: true })
      .eq('cliente_id', clientId)
      .ilike('tipo_evento', 'fup_%')
      .eq('resolvido', false),
    // Last interaction
    supabase
      .from('timeline_eventos')
      .select('data_evento')
      .eq('cliente_id', clientId)
      .order('data_evento', { ascending: false })
      .limit(1)
      .single(),
  ])

  let daysSince = 0
  if (lastRes.data) {
    daysSince = differenceInDays(now, new Date(lastRes.data.data_evento || now))
  }

  return {
    total: totalRes.count || 0,
    thisMonth: monthRes.count || 0,
    pendingFups: pendingRes.count || 0,
    daysSinceLastInteraction: daysSince,
  }
}

export const createTimelineEvent = async (
  clientId: string,
  type: string,
  description: string,
  productClienteId?: string,
  date?: string,
) => {
  const { data, error } = await supabase
    .from('timeline_eventos')
    .insert({
      cliente_id: clientId,
      tipo_evento: type,
      descricao: description,
      produto_cliente_id: productClienteId,
      data_evento: date || new Date().toISOString(),
      resolvido: false,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateTimelineEvent = async (
  id: string,
  updates: Partial<TimelineEvent>,
) => {
  const { data, error } = await supabase
    .from('timeline_eventos')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const resolveTimelineEvent = async (id: string, resolved: boolean) => {
  return updateTimelineEvent(id, {
    resolvido: resolved,
    data_resolucao: resolved ? new Date().toISOString() : undefined,
  })
}

export const deleteTimelineEvent = async (id: string) => {
  const { error } = await supabase
    .from('timeline_eventos')
    .delete()
    .eq('id', id)
  if (error) throw error
}
