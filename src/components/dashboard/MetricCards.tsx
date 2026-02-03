import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users,
  MessageSquare,
  Phone,
  Tag,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface MetricCardsProps {
  metrics: any
  loading: boolean
}

export function MetricCards({ metrics, loading }: MetricCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <Skeleton className="h-4 w-24" />
              </CardTitle>
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Clients */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total de Clientes
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.clients.total}</div>
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            {metrics.clients.new > 0 ? (
              <span className="text-green-500 flex items-center font-medium mr-1">
                <TrendingUp className="h-3 w-3 mr-0.5" /> +{metrics.clients.new}
              </span>
            ) : (
              <span className="text-muted-foreground mr-1">0</span>
            )}
            nos últimos 30 dias
          </p>
        </CardContent>
      </Card>

      {/* Active Conversations */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Conversas Ativas
          </CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.conversations.total}
          </div>
          <div className="flex gap-2 mt-1">
            <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded-md font-medium border border-yellow-200">
              {metrics.conversations.unread} não lidas
            </span>
            <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded-md font-medium border border-red-200">
              {metrics.conversations.critical} críticas
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Scheduled Calls */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Calls Agendadas</CardTitle>
          <Phone className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.calls.total}</div>
          <p className="text-xs text-muted-foreground mt-1 mb-2">
            {metrics.calls.thisWeek} nesta semana
          </p>
          {metrics.calls.next ? (
            <div className="text-xs bg-muted/50 p-2 rounded border border-border/50 flex items-center justify-between">
              <span>Próx: {metrics.calls.next.clientName.split(' ')[0]}</span>
              <span className="font-mono text-[10px]">
                {format(new Date(metrics.calls.next.date), "dd/MM HH'h'", {
                  locale: ptBR,
                })}
              </span>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground italic">
              Nenhuma call próxima
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Tags */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tags Ativas</CardTitle>
          <Tag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.tags.total}</div>
          <p className="text-xs text-muted-foreground mt-1">
            em {metrics.tags.clients} clientes
          </p>
          <div className="flex gap-1 mt-2 overflow-hidden">
            {metrics.tags.top.map((t: any, i: number) => (
              <span
                key={i}
                className="text-[10px] px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded-full truncate max-w-[80px]"
              >
                {t.name}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
