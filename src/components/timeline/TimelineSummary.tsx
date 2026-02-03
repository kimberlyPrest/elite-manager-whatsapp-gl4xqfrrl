import { TimelineSummary as SummaryType } from '@/services/timeline'
import { Card, CardContent } from '@/components/ui/card'
import { Activity, CalendarDays, CheckCircle2, Clock } from 'lucide-react'

interface TimelineSummaryProps {
  summary: SummaryType
  loading: boolean
}

export function TimelineSummary({ summary, loading }: TimelineSummaryProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] animate-pulse"
          />
        ))}
      </div>
    )
  }

  const items = [
    {
      label: 'Total de Eventos',
      value: summary.total,
      icon: Activity,
      color: 'text-blue-500',
    },
    {
      label: 'Este Mês',
      value: summary.thisMonth,
      icon: CalendarDays,
      color: 'text-purple-500',
    },
    {
      label: 'FUPs Pendentes',
      value: summary.pendingFups,
      icon: Clock,
      color: 'text-orange-500',
    },
    {
      label: 'Dias sem Interação',
      value: summary.daysSinceLastInteraction,
      icon: CheckCircle2,
      color: 'text-green-500',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {items.map((item, index) => (
        <Card key={index} className="bg-[#1a1a1a] border-[#2a2a2a]">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                {item.label}
              </span>
              <item.icon className={`h-4 w-4 ${item.color}`} />
            </div>
            <div className="text-2xl font-bold text-white">{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
