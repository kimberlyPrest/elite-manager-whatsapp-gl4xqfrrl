import { supabase } from '@/lib/supabase/client'
import {
  startOfDay,
  subDays,
  startOfMonth,
  subMonths,
  format,
  parseISO,
} from 'date-fns'

export type Period =
  | 'hoje'
  | '7dias'
  | '30dias'
  | 'este_mes'
  | 'mes_passado'
  | 'personalizado'

export const getDateRange = (period: Period) => {
  const now = new Date()
  switch (period) {
    case 'hoje':
      return { start: startOfDay(now), end: now }
    case '7dias':
      return { start: subDays(now, 7), end: now }
    case '30dias':
      return { start: subDays(now, 30), end: now }
    case 'este_mes':
      return { start: startOfMonth(now), end: now }
    case 'mes_passado': {
      const startLastMonth = startOfMonth(subMonths(now, 1))
      const endLastMonth = startOfMonth(now)
      return { start: startLastMonth, end: endLastMonth }
    }
    default:
      return { start: subDays(now, 30), end: now }
  }
}

// Helper to safely get count with head: true to avoid JSON parsing errors on empty body
const safeCount = async (query: any) => {
  const { count, error } = await query
  if (error) {
    console.error('Count query error:', error)
    return 0
  }
  return count || 0
}

export const fetchDashboardMetrics = async (period: Period) => {
  const defaults = {
    clients: { total: 0, new: 0 },
    conversations: { total: 0, unread: 0, critical: 0 },
    calls: { total: 0, thisWeek: 0, next: null },
    tags: { total: 0, clients: 0, top: [] },
  }

  try {
    const { start } = getDateRange(period)
    const startIso = start.toISOString()
    const now = new Date()

    // Execute independent groups of queries in parallel
    const [clientsData, activeConversationsData, callsData, tagsData] =
      await Promise.all([
        // 1. Clients
        Promise.all([
          supabase.from('clientes').select('*', { count: 'exact', head: true }),
          supabase
            .from('clientes')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', startIso),
        ]),

        // 2. Active Conversations (Last 30 days)
        supabase
          .from('conversas_whatsapp')
          .select('id, prioridade, mensagens_nao_lidas, ultima_interacao')
          .gte('ultima_interacao', subDays(new Date(), 30).toISOString()),

        // 3. Calls (Optimized: Count Total, Count Week, Fetch Next)
        Promise.all([
          // Total future calls
          supabase
            .from('calls')
            .select('*', { count: 'exact', head: true })
            .gte('data_agendada', now.toISOString()),
          // Calls this week
          supabase
            .from('calls')
            .select('*', { count: 'exact', head: true })
            .gte('data_agendada', now.toISOString())
            .lte(
              'data_agendada',
              new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            ),
          // Next call details
          supabase
            .from('calls')
            .select('id, data_agendada, produto_cliente_id')
            .gte('data_agendada', now.toISOString())
            .order('data_agendada', { ascending: true })
            .limit(1),
        ]),

        // 4. Tags
        supabase
          .from('tags_cliente')
          .select('tipo_tag, cliente_id')
          .eq('ativo', true),
      ])

    // Process Clients
    const totalClients = clientsData[0].count || 0
    const newClients = clientsData[1].count || 0

    // Process Conversations
    const activeConversations = activeConversationsData.data || []
    const totalActiveConversations = activeConversations.length
    const unreadMessages = activeConversations.reduce(
      (acc, curr) => acc + (curr.mensagens_nao_lidas || 0),
      0,
    )
    const criticalConversations = activeConversations.filter(
      (c) => c.prioridade === 'Crítico',
    ).length

    // Process Calls
    const totalCalls = callsData[0].count || 0
    const callsThisWeek = callsData[1].count || 0
    const nextCall = callsData[2].data?.[0]

    let nextCallDetails = null
    if (nextCall) {
      const { data: product } = await supabase
        .from('produtos_cliente')
        .select('cliente:clientes(nome_completo)')
        .eq('id', nextCall.produto_cliente_id)
        .maybeSingle()

      if (product?.cliente) {
        nextCallDetails = {
          clientName: (product.cliente as any).nome_completo,
          date: nextCall.data_agendada,
        }
      }
    }

    // Process Tags
    const tags = tagsData.data || []
    const totalTags = tags.length
    const uniqueClientsWithTags = new Set(tags.map((t) => t.cliente_id)).size
    const tagCounts: Record<string, number> = {}
    tags.forEach((t) => {
      tagCounts[t.tipo_tag] = (tagCounts[t.tipo_tag] || 0) + 1
    })
    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }))

    return {
      clients: { total: totalClients, new: newClients },
      conversations: {
        total: totalActiveConversations,
        unread: unreadMessages,
        critical: criticalConversations,
      },
      calls: {
        total: totalCalls,
        thisWeek: callsThisWeek,
        next: nextCallDetails,
      },
      tags: { total: totalTags, clients: uniqueClientsWithTags, top: topTags },
    }
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    return defaults
  }
}

export const fetchChartsData = async () => {
  const defaults = {
    priority: [],
    products: [],
    activity: [],
    responseTime: [],
    status: [],
  }

  try {
    const [prioritiesRes, productsRes, messagesRes, productStatusRes] =
      await Promise.all([
        supabase.from('conversas_whatsapp').select('prioridade'),
        supabase.from('produtos_cliente').select('produto'),
        supabase
          .from('mensagens')
          .select('timestamp, origem')
          .gte('timestamp', subDays(new Date(), 30).toISOString())
          .order('timestamp', { ascending: true }),
        supabase.from('produtos_cliente').select('produto, status'),
      ])

    // 1. Priority
    const priorityCount = { Crítico: 0, Alto: 0, Médio: 0, Baixo: 0 }
    prioritiesRes.data?.forEach((p) => {
      const key = p.prioridade as keyof typeof priorityCount
      if (priorityCount[key] !== undefined) priorityCount[key]++
    })

    // 2. Products
    const productCount = { Elite: 0, Scale: 0, Labs: 0, Venda: 0 }
    productsRes.data?.forEach((p) => {
      const key = Object.keys(productCount).find((k) =>
        p.produto.includes(k),
      ) as keyof typeof productCount
      if (key) productCount[key]++
    })

    // 3. Activity
    const activityMap: Record<string, { sent: number; received: number }> = {}
    messagesRes.data?.forEach((m) => {
      if (!m.timestamp) return
      const date = format(parseISO(m.timestamp), 'dd/MM')
      if (!activityMap[date]) activityMap[date] = { sent: 0, received: 0 }
      if (m.origem === 'me') activityMap[date].sent++
      else activityMap[date].received++
    })
    const activityData = Object.entries(activityMap).map(([date, data]) => ({
      name: date,
      sent: data.sent,
      received: data.received,
    }))

    // 4. Response Time (Mock)
    const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const responseTimeData = daysOfWeek.map((day) => ({
      name: day,
      minutes: Math.floor(Math.random() * 60) + 15,
    }))

    // 5. Status
    const statusMap: Record<string, Record<string, number>> = {}
    productStatusRes.data?.forEach((p) => {
      if (!statusMap[p.produto]) statusMap[p.produto] = {}
      const status = p.status || 'Ativo'
      statusMap[p.produto][status] = (statusMap[p.produto][status] || 0) + 1
    })
    const statusData = Object.entries(statusMap).map(([product, statuses]) => ({
      product,
      ...statuses,
    }))

    return {
      priority: Object.entries(priorityCount).map(([name, value]) => ({
        name,
        value,
      })),
      products: Object.entries(productCount).map(([name, value]) => ({
        name,
        value,
      })),
      activity: activityData,
      responseTime: responseTimeData,
      status: statusData,
    }
  } catch (error) {
    console.error('Error fetching charts data:', error)
    return defaults
  }
}

export const fetchTaskLists = async () => {
  const defaults = {
    csatPending: 0,
    missingTranscriptions: 0,
    noResponseTags: 0,
    upcomingCalls: 0,
  }

  try {
    const now = new Date()
    const next48h = new Date(now.getTime() + 48 * 60 * 60 * 1000)

    const [csatRes, transcriptionRes, noResponseRes, upcomingRes] =
      await Promise.all([
        // CSAT Pending
        supabase
          .from('calls')
          .select('id', { count: 'exact', head: true })
          .lt('data_realizada', now.toISOString())
          .eq('csat_enviado', false),

        // Missing Transcriptions
        supabase
          .from('calls')
          .select('id', { count: 'exact', head: true })
          .lt('data_realizada', now.toISOString())
          .is('transcricao', null),

        // No Response Tags
        supabase
          .from('tags_cliente')
          .select('id', { count: 'exact', head: true })
          .ilike('tipo_tag', 'sem_resposta_%')
          .eq('ativo', true),

        // Upcoming Calls (48h)
        supabase
          .from('calls')
          .select('id', { count: 'exact', head: true })
          .gte('data_agendada', now.toISOString())
          .lte('data_agendada', next48h.toISOString()),
      ])

    return {
      csatPending: csatRes.count || 0,
      missingTranscriptions: transcriptionRes.count || 0,
      noResponseTags: noResponseRes.count || 0,
      upcomingCalls: upcomingRes.count || 0,
    }
  } catch (error) {
    console.error('Error fetching task lists:', error)
    return defaults
  }
}

export const fetchCriticalClients = async () => {
  try {
    const { data, error } = await supabase
      .from('conversas_whatsapp')
      .select(
        `
        id,
        score_prioridade,
        cliente:clientes(id, nome_completo, primeiro_nome, sobrenome),
        mensagens_nao_lidas
      `,
      )
      .order('score_prioridade', { ascending: false })
      .limit(10)

    if (error) throw error

    return (
      data?.map((item) => ({
        id: item.id,
        clientId: (item.cliente as any)?.id,
        name: (item.cliente as any)?.nome_completo || 'Cliente Desconhecido',
        initials: (item.cliente as any)?.primeiro_nome?.[0] || '?',
        score: item.score_prioridade || 0,
        unread: item.mensagens_nao_lidas || 0,
      })) || []
    )
  } catch (error) {
    console.error('Error fetching critical clients:', error)
    return []
  }
}

export const fetchSystemSummary = async () => {
  const defaults = {
    campaigns: [],
    ai: { total: 0, used: 0, timeSaved: 0 },
    templates: [],
    responseRate: 0,
  }

  try {
    const startToday = startOfDay(new Date()).toISOString()

    const [campaignsRes, aiStatsRes, templatesRes] = await Promise.all([
      supabase
        .from('automacoes_massa')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('analytics_sugestoes_ia')
        .select('foi_usada, created_at')
        .gte('created_at', startToday),
      supabase.from('templates_resposta').select('nome').limit(10),
    ])

    // Campaigns
    const campaigns = campaignsRes.data || []

    // AI Stats
    const aiStats = aiStatsRes.data || []
    const aiTotal = aiStats.length
    const aiUsed = aiStats.filter((s) => s.foi_usada).length
    const aiTimeSaved = aiUsed * 2

    // Templates
    const templates = templatesRes.data || []
    const topTemplates = templates.sort(() => 0.5 - Math.random()).slice(0, 3)

    return {
      campaigns,
      ai: { total: aiTotal, used: aiUsed, timeSaved: aiTimeSaved },
      templates: topTemplates,
      responseRate: 85, // Mock value
    }
  } catch (error) {
    console.error('Error fetching system summary:', error)
    return defaults
  }
}
