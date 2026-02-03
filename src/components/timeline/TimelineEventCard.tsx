import {
  TimelineEvent,
  resolveTimelineEvent,
  deleteTimelineEvent,
} from '@/services/timeline'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Phone,
  ArrowRight,
  MessageSquare,
  FileText,
  Settings,
  AlertCircle,
  Trash2,
  CheckCircle2,
  Clock,
  MoreHorizontal,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useState } from 'react'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface TimelineEventCardProps {
  event: TimelineEvent
  onUpdate: () => void
}

export function TimelineEventCard({ event, onUpdate }: TimelineEventCardProps) {
  const [loading, setLoading] = useState(false)

  const handleResolve = async () => {
    setLoading(true)
    try {
      await resolveTimelineEvent(event.id, !event.resolvido)
      onUpdate()
    } catch (e) {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return
    try {
      await deleteTimelineEvent(event.id)
      onUpdate()
      toast({ title: 'Evento excluído' })
    } catch (e) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  // Visual Logic
  const getEventStyle = (type: string) => {
    if (type === 'mudanca_status')
      return {
        color: 'bg-purple-500',
        icon: ArrowRight,
        border: 'border-purple-500/20',
      }
    if (type === 'call')
      return { color: 'bg-blue-500', icon: Phone, border: 'border-blue-500/20' }
    if (type.startsWith('fup'))
      return {
        color: 'bg-green-500',
        icon: Clock,
        border: 'border-green-500/20',
      }
    if (type === 'sistema')
      return {
        color: 'bg-gray-500',
        icon: Settings,
        border: 'border-gray-500/20',
      }
    if (['tag', 'alerta'].includes(type))
      return {
        color: 'bg-orange-500',
        icon: AlertCircle,
        border: 'border-orange-500/20',
      }
    return {
      color: 'bg-yellow-500',
      icon: FileText,
      border: 'border-yellow-500/20',
    } // Nota/Outro
  }

  const style = getEventStyle(event.tipo_evento)
  const Icon = style.icon
  const isManual =
    ['nota', 'outro', 'call', 'fup_geral'].includes(event.tipo_evento) ||
    !event.tipo_evento.includes('_')
  const isResolvable =
    event.tipo_evento.startsWith('fup') ||
    ['tag', 'alerta'].includes(event.tipo_evento)

  return (
    <div
      className={cn(
        'relative flex gap-4 md:gap-8 group',
        event.resolvido && 'opacity-60',
      )}
    >
      {/* Dot */}
      <div className="absolute left-[7px] top-6 h-full w-[2px] bg-[#3a3a3a] -z-10 group-last:hidden" />
      <div
        className={cn(
          'mt-6 h-4 w-4 rounded-full border-2 border-[#0a0a0a] shrink-0 z-10',
          style.color,
        )}
      />

      {/* Card Content */}
      <div className="flex-1 min-w-0 py-4">
        <div
          className={cn(
            'bg-[#1a1a1a] border rounded-lg p-4 transition-all hover:border-opacity-50',
            'border-[#2a2a2a]',
            style.border,
          )}
        >
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] uppercase',
                    style.color.replace('bg-', 'text-').replace('500', '400'),
                    style.border,
                  )}
                >
                  {event.tipo_evento.replace('_', ' ')}
                </Badge>
                {event.produto && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] bg-[#2a2a2a]"
                  >
                    {event.produto.produto}
                  </Badge>
                )}
                {event.resolvido && (
                  <span className="flex items-center text-green-500 text-xs font-medium">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Resolvido
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-200 whitespace-pre-wrap">
                {event.descricao}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isResolvable && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-8 w-8',
                    event.resolvido
                      ? 'text-green-500'
                      : 'text-gray-400 hover:text-green-500',
                  )}
                  onClick={handleResolve}
                  disabled={loading}
                  title={event.resolvido ? 'Reabrir' : 'Resolver'}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}

              {isManual && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-500 hover:text-white"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-gray-200"
                  >
                    <DropdownMenuItem
                      className="hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] cursor-pointer text-red-400 focus:text-red-400"
                      onClick={handleDelete}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Timestamp */}
      <div className="hidden md:block w-32 py-6 text-right text-xs text-gray-500 shrink-0 font-mono">
        {format(new Date(event.data_evento), 'dd/MM/yy')} <br />
        {format(new Date(event.data_evento), 'HH:mm')}
      </div>
    </div>
  )
}
