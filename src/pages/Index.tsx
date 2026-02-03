import { useState, useEffect, useCallback } from 'react'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { MetricCards } from '@/components/dashboard/MetricCards'
import { ChartsSection } from '@/components/dashboard/ChartsSection'
import { TaskAttentionSection } from '@/components/dashboard/TaskAttentionSection'
import { SystemSummarySection } from '@/components/dashboard/SystemSummarySection'
import { ShortcutsSection } from '@/components/dashboard/ShortcutsSection'
import {
  fetchDashboardMetrics,
  fetchChartsData,
  fetchTaskLists,
  fetchCriticalClients,
  fetchSystemSummary,
  Period,
} from '@/services/dashboard'
import { Separator } from '@/components/ui/separator'

export default function Index() {
  const [period, setPeriod] = useState<Period>('30dias')

  // Independent loading states for each section to prevent total page crash
  const [metrics, setMetrics] = useState<any>(null)
  const [loadingMetrics, setLoadingMetrics] = useState(true)

  const [charts, setCharts] = useState<any>(null)
  const [loadingCharts, setLoadingCharts] = useState(true)

  const [tasks, setTasks] = useState<any>(null)
  const [criticalClients, setCriticalClients] = useState<any[]>([])
  const [loadingTasks, setLoadingTasks] = useState(true)

  const [summary, setSummary] = useState<any>(null)
  const [loadingSummary, setLoadingSummary] = useState(true)

  // Load Metrics
  const loadMetrics = useCallback(async () => {
    setLoadingMetrics(true)
    try {
      const data = await fetchDashboardMetrics(period)
      setMetrics(data)
    } catch (error) {
      console.error('Error loading metrics', error)
      // Defaults are returned by service on error, but if something else fails:
      setMetrics({
        clients: { total: 0, new: 0 },
        conversations: { total: 0, unread: 0, critical: 0 },
        calls: { total: 0, thisWeek: 0, next: null },
        tags: { total: 0, clients: 0, top: [] },
      })
    } finally {
      setLoadingMetrics(false)
    }
  }, [period])

  // Load Charts
  const loadCharts = useCallback(async () => {
    setLoadingCharts(true)
    try {
      const data = await fetchChartsData()
      setCharts(data)
    } catch (error) {
      console.error('Error loading charts', error)
      setCharts({
        priority: [],
        products: [],
        activity: [],
        responseTime: [],
        status: [],
      })
    } finally {
      setLoadingCharts(false)
    }
  }, [])

  // Load Tasks
  const loadTasks = useCallback(async () => {
    setLoadingTasks(true)
    try {
      const [tasksData, criticalData] = await Promise.all([
        fetchTaskLists(),
        fetchCriticalClients(),
      ])
      setTasks(tasksData)
      setCriticalClients(criticalData)
    } catch (error) {
      console.error('Error loading tasks', error)
      setTasks({
        csatPending: 0,
        missingTranscriptions: 0,
        noResponseTags: 0,
        upcomingCalls: 0,
      })
      setCriticalClients([])
    } finally {
      setLoadingTasks(false)
    }
  }, [])

  // Load Summary
  const loadSummary = useCallback(async () => {
    setLoadingSummary(true)
    try {
      const data = await fetchSystemSummary()
      setSummary(data)
    } catch (error) {
      console.error('Error loading summary', error)
      setSummary({
        campaigns: [],
        ai: { total: 0, used: 0, timeSaved: 0 },
        templates: [],
        responseRate: 0,
      })
    } finally {
      setLoadingSummary(false)
    }
  }, [])

  // Orchestrate loading
  const loadAll = useCallback(() => {
    loadMetrics()
    loadCharts()
    loadTasks()
    loadSummary()
  }, [loadMetrics, loadCharts, loadTasks, loadSummary])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  return (
    <div className="space-y-8 pb-10 max-w-[1600px] mx-auto">
      <DashboardHeader
        period={period}
        setPeriod={setPeriod}
        onRefresh={loadAll}
        loading={
          loadingMetrics || loadingCharts || loadingTasks || loadingSummary
        }
      />

      <MetricCards metrics={metrics} loading={loadingMetrics} />

      <ChartsSection data={charts} loading={loadingCharts} />

      <div className="grid grid-cols-1 gap-4">
        <TaskAttentionSection
          tasks={tasks}
          criticalClients={criticalClients}
          loading={loadingTasks}
        />
      </div>

      <SystemSummarySection summary={summary} loading={loadingSummary} />

      <Separator />

      <ShortcutsSection />
    </div>
  )
}
