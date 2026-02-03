import { useState, useEffect, useCallback } from 'react'
import {
  getTimelineEvents,
  getTimelineSummary,
  TimelineEvent,
  TimelineSummary,
} from '@/services/timeline'
import { TimelineEventCard } from './TimelineEventCard'
import { TimelineSummary as Summary } from './TimelineSummary'
import { AddEventModal } from './AddEventModal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Download, Filter, FileText } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface ClientTimelineProps {
  clientId: string
}

export function ClientTimeline({ clientId }: ClientTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [summary, setSummary] = useState<TimelineSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('Todos')

  const debouncedSearch = useDebounce(search, 300)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [eventsData, summaryData] = await Promise.all([
        getTimelineEvents(clientId, debouncedSearch, filter),
        getTimelineSummary(clientId),
      ])
      setEvents(eventsData)
      setSummary(summaryData)
    } catch (error) {
      toast({ title: 'Erro ao carregar timeline', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [clientId, debouncedSearch, filter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleExport = () => {
    // Basic CSV export logic
    const headers = ['Data', 'Tipo', 'Descrição', 'Produto', 'Resolvido']
    const csvContent = [
      headers.join(','),
      ...events.map((e) =>
        [
          new Date(e.data_evento).toLocaleDateString(),
          e.tipo_evento,
          `"${e.descricao.replace(/"/g, '""')}"`,
          e.produto?.produto || '-',
          e.resolvido ? 'Sim' : 'Não',
        ].join(','),
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `timeline_${clientId}.csv`
    link.click()
  }

  const filters = [
    'Todos',
    'Mudanças de Status',
    'Calls',
    'Follow-ups',
    'Notas',
    'Sistema',
    'Alertas',
  ]

  return (
    <div className="space-y-6">
      {summary && <Summary summary={summary} loading={loading} />}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar eventos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-[#1a1a1a] border-[#2a2a2a]"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleExport}
            title="Exportar CSV"
            className="border-[#2a2a2a] bg-[#1a1a1a]"
          >
            <Download className="h-4 w-4" />
          </Button>
          <AddEventModal clientId={clientId} onSuccess={fetchData} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pb-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1 text-xs rounded-full border transition-colors',
              filter === f
                ? 'bg-[#FFD700] text-black border-[#FFD700] font-medium'
                : 'bg-transparent border-[#2a2a2a] text-gray-400 hover:text-white',
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="relative pl-2 md:pl-4">
        {events.length === 0 && !loading ? (
          <div className="text-center py-20 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Nenhum evento encontrado.</p>
          </div>
        ) : (
          <div className="animate-fade-in-up">
            {events.map((event) => (
              <TimelineEventCard
                key={event.id}
                event={event}
                onUpdate={fetchData}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
