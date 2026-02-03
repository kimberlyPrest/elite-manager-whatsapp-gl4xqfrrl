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
import { useToast } from '@/hooks/use-toast'
import { Separator } from '@/components/ui/separator'

export default function Index() {
  const [period, setPeriod] = useState<Period>('30dias')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>({
    metrics: null,
    charts: null,
    tasks: null,
    criticalClients: [],
    summary: null,
  })
  const { toast } = useToast()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [metrics, charts, tasks, criticalClients, summary] =
        await Promise.all([
          fetchDashboardMetrics(period),
          fetchChartsData(),
          fetchTaskLists(),
          fetchCriticalClients(),
          fetchSystemSummary(),
        ])

      setData({
        metrics,
        charts,
        tasks,
        criticalClients,
        summary,
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível atualizar o dashboard.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [period, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <div className="space-y-8 pb-10 max-w-[1600px] mx-auto">
      <DashboardHeader
        period={period}
        setPeriod={setPeriod}
        onRefresh={loadData}
        loading={loading}
      />

      <MetricCards metrics={data.metrics} loading={loading} />

      <ChartsSection data={data.charts} loading={loading} />

      <div className="grid grid-cols-1 gap-4">
        <TaskAttentionSection
          tasks={data.tasks}
          criticalClients={data.criticalClients}
          loading={loading}
        />
      </div>

      <SystemSummarySection summary={data.summary} loading={loading} />

      <Separator />

      <ShortcutsSection />
    </div>
  )
}
