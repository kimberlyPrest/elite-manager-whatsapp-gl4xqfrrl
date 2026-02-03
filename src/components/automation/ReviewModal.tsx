import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { createCampaign } from '@/services/automation'
import { toast } from '@/hooks/use-toast'
import { Loader2, Shuffle } from 'lucide-react'

interface ReviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: any
  onConfirm: () => void
}

export function ReviewModal({
  open,
  onOpenChange,
  data,
  onConfirm,
}: ReviewModalProps) {
  const [submitting, setSubmitting] = useState(false)

  // Assign initial variations randomly
  const [recipients, setRecipients] = useState(() => {
    return data.recipients.map((r: any) => {
      const varIndex = Math.floor(Math.random() * data.messages.length)
      const msgTemplate = data.messages[varIndex]
      // Simple variable replacement
      const processedMsg = msgTemplate
        .replace('{{primeiro_nome}}', r.primeiro_nome || '')
        .replace('{{produto}}', r.produtos_cliente?.[0]?.produto || '')
        .replace('{{status}}', r.produtos_cliente?.[0]?.status || '')

      return {
        ...r,
        variationIndex: varIndex,
        message: processedMsg,
      }
    })
  })

  const handleShuffle = () => {
    setRecipients(
      recipients.map((r: any) => {
        const varIndex = Math.floor(Math.random() * data.messages.length)
        const msgTemplate = data.messages[varIndex]
        const processedMsg = msgTemplate
          .replace('{{primeiro_nome}}', r.primeiro_nome || '')
          .replace('{{produto}}', r.produtos_cliente?.[0]?.produto || '')
          .replace('{{status}}', r.produtos_cliente?.[0]?.status || '')
        return { ...r, variationIndex: varIndex, message: processedMsg }
      }),
    )
    toast({ title: 'Variações misturadas!' })
  }

  const handleStart = async () => {
    setSubmitting(true)
    try {
      await createCampaign(
        {
          tipo_selecao: 'Filtros',
          configuracao_envio: {
            min_interval: data.timing.minInterval,
            max_interval: data.timing.maxInterval,
            business_hours_enabled: data.timing.businessHours,
            start_time: data.timing.startTime,
            end_time: data.timing.endTime,
          },
          variacoes_mensagem: data.messages,
          filtros: data.filters,
          start_now: true,
        },
        recipients,
      )

      toast({ title: 'Campanha criada com sucesso!' })
      onConfirm()
    } catch (e) {
      toast({ title: 'Erro ao criar campanha', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl bg-[#111111] border-[#2a2a2a] text-white max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Revisar e Aprovar</DialogTitle>
        </DialogHeader>

        <div className="flex justify-between items-center my-2">
          <div className="text-sm text-gray-400">
            Total:{' '}
            <span className="text-white font-bold">{recipients.length}</span>{' '}
            destinatários
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShuffle}
            className="text-[#FFD700] border-[#333]"
          >
            <Shuffle className="h-3 w-3 mr-2" /> Redistribuir Variações
          </Button>
        </div>

        <ScrollArea className="flex-1 border border-[#2a2a2a] rounded-md">
          <Table>
            <TableHeader className="bg-[#1a1a1a] sticky top-0">
              <TableRow className="border-[#2a2a2a] hover:bg-transparent">
                <TableHead className="text-gray-400">Nome</TableHead>
                <TableHead className="text-gray-400">Telefone</TableHead>
                <TableHead className="text-gray-400">Variação</TableHead>
                <TableHead className="text-gray-400 w-[40%]">
                  Preview da Mensagem
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipients.map((r: any, i: number) => (
                <TableRow
                  key={r.id}
                  className="border-[#2a2a2a] hover:bg-[#1a1a1a]"
                >
                  <TableCell>{r.nome_completo}</TableCell>
                  <TableCell>{r.telefone}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-[#333]">
                      V{r.variationIndex + 1}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className="text-xs text-gray-300 font-mono truncate max-w-xs"
                    title={r.message}
                  >
                    {r.message}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#333] hover:bg-[#2a2a2a] text-white"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleStart}
            disabled={submitting}
            className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90"
          >
            {submitting ? (
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
            ) : null}
            Iniciar Envios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
