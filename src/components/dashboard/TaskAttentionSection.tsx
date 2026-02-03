import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  MessageCircle,
  ExternalLink,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface TaskAttentionSectionProps {
  tasks: any
  criticalClients: any[]
  loading: boolean
}

export function TaskAttentionSection({
  tasks,
  criticalClients,
  loading,
}: TaskAttentionSectionProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-[350px] rounded-xl" />
        <Skeleton className="h-[350px] rounded-xl" />
      </div>
    )
  }

  // Safety check
  if (!tasks) {
    return (
      <div className="p-4 text-center text-muted-foreground bg-muted/20 rounded-lg">
        Não foi possível carregar as tarefas.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Ações Pendentes */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Pendentes</CardTitle>
          <CardDescription>
            Tarefas que requerem sua atenção imediata
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-full">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">CSATs Pendentes</span>
                <span className="text-xs text-muted-foreground">
                  Avaliações não enviadas
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono">
                {tasks.csatPending}
              </Badge>
              <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                <Link to="/clients?filter=csat">
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 text-yellow-700 rounded-full">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  Transcrições Faltantes
                </span>
                <span className="text-xs text-muted-foreground">
                  Calls sem transcrição
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono">
                {tasks.missingTranscriptions}
              </Badge>
              <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                <Link to="/clients?filter=transcription">
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 text-red-700 rounded-full">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Tags Sem Resposta</span>
                <span className="text-xs text-muted-foreground">
                  Clientes parados
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono">
                {tasks.noResponseTags}
              </Badge>
              <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                <Link to="/clients?filter=no-response">
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg border border-border/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 text-green-700 rounded-full">
                <Clock className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Calls Próximas 48h</span>
                <span className="text-xs text-muted-foreground">
                  Prepare-se
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-mono">
                {tasks.upcomingCalls}
              </Badge>
              <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                <Link to="/clients?filter=calls">
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prioridade Crítica */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Prioridade Crítica
          </CardTitle>
          <CardDescription>
            Top 10 clientes com maior score de prioridade
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[300px] overflow-y-auto px-6 pb-6 space-y-3">
            {criticalClients.map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between group p-2 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {client.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium truncate max-w-[150px]">
                      {client.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">
                        {client.unread} não lidas
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="destructive" className="font-mono text-xs">
                    {client.score}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    asChild
                  >
                    <Link to={`/whatsapp?id=${client.id}`}>Abrir</Link>
                  </Button>
                </div>
              </div>
            ))}
            {criticalClients.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nenhum cliente crítico no momento.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
