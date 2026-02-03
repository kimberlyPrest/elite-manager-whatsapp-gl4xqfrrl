import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Call, deleteCall } from '@/services/calls'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Clock,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { ScheduleCallModal } from './ScheduleCallModal'
import { RealizeCallModal } from './RealizeCallModal'
import { TranscriptionModal } from './TranscriptionModal'
import { SendCsatModal } from './SendCsatModal'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

interface CallCardProps {
  call: Call
  clientId: string
  clientName: string
  clientPhone: string
  onUpdate: () => void
}

export function CallCard({
  call,
  clientId,
  clientName,
  clientPhone,
  onUpdate,
}: CallCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmCheck, setConfirmCheck] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isRealized = !!call.data_realizada
  const isScheduled =
    !!call.data_agendada &&
    new Date(call.data_agendada) > new Date() &&
    !isRealized
  const isNoShow =
    !!call.data_agendada &&
    new Date(call.data_agendada) < new Date() &&
    !isRealized
  const isNoDate = !call.data_agendada && !isRealized

  let statusColor = 'bg-gray-100 text-gray-800'
  let statusText = 'Sem Data'

  if (isRealized) {
    statusColor = 'bg-green-500/20 text-green-500 border-green-500/30'
    statusText = 'Realizada'
  } else if (isScheduled) {
    statusColor = 'bg-blue-500/20 text-blue-500 border-blue-500/30'
    statusText = 'Agendada'
  } else if (isNoShow) {
    statusColor = 'bg-red-500/20 text-red-500 border-red-500/30'
    statusText = 'Não Realizada'
  }

  const handleDelete = async () => {
    if (!confirmCheck) return
    setDeleting(true)
    try {
      await deleteCall(call.id, call.produto_cliente_id, call.numero_call)
      toast({ title: 'Call excluída com sucesso' })
      onUpdate()
    } catch (error) {
      toast({ title: 'Erro ao excluir call', variant: 'destructive' })
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5 flex flex-col gap-4 relative group hover:border-[#3a3a3a] transition-all">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <span className="text-xs text-gray-400 font-mono mb-1">
            CALL {call.numero_call.toString().padStart(2, '0')}
          </span>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white">
              {call.data_agendada
                ? format(new Date(call.data_agendada), "dd 'de' MMMM", {
                    locale: ptBR,
                  })
                : 'Data indefinida'}
            </h3>
            <Badge variant="outline" className={cn('ml-2', statusColor)}>
              {statusText}
            </Badge>
          </div>
          {call.data_agendada && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <Clock className="h-3 w-3" />
              {format(new Date(call.data_agendada), 'HH:mm')}
              {call.duracao_minutos &&
                isRealized &&
                ` • ${call.duracao_minutos} min`}
            </div>
          )}
        </div>

        <div className="flex gap-1">
          <ScheduleCallModal
            clientId={clientId}
            existingCall={call}
            onSuccess={onUpdate}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
              >
                <Edit className="h-4 w-4" />
              </Button>
            }
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-[#2a2a2a]"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-[#2a2a2a]">
        {!isRealized && (
          <RealizeCallModal
            callId={call.id}
            clientId={clientId}
            productId={call.produto_cliente_id}
            onSuccess={onUpdate}
          />
        )}

        <TranscriptionModal
          callId={call.id}
          initialText={call.transcricao}
          initialFilename={call.transcricao_filename}
          clientId={clientId}
          productId={call.produto_cliente_id}
          onSuccess={onUpdate}
        />

        {isRealized && !call.csat_enviado && (
          <SendCsatModal
            callId={call.id}
            clientName={clientName}
            clientPhone={clientPhone}
            callDate={call.data_realizada}
            clientId={clientId}
            productId={call.produto_cliente_id}
            onSuccess={onUpdate}
          />
        )}

        {isRealized && call.csat_enviado && (
          <Badge
            variant="secondary"
            className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 h-8 px-3 gap-1"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> CSAT Enviado
          </Badge>
        )}
      </div>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
          <DialogHeader>
            <DialogTitle>Excluir Call {call.numero_call}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Esta ação é irreversível. Todos os dados desta call, incluindo
              transcrições e status, serão perdidos.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-4">
            <Checkbox
              id="confirm"
              checked={confirmCheck}
              onCheckedChange={(c) => setConfirmCheck(c as boolean)}
            />
            <Label htmlFor="confirm" className="text-sm">
              Confirmo que desejo excluir permanentemente esta call.
            </Label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={!confirmCheck || deleting}
              onClick={handleDelete}
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
