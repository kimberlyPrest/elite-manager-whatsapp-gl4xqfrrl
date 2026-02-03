import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MessageSquare, Send } from 'lucide-react'
import { sendCsat } from '@/services/calls'
import { toast } from '@/hooks/use-toast'
import { format } from 'date-fns'

interface SendCsatModalProps {
  callId: string
  clientName: string
  clientPhone: string
  callDate: string | null
  clientId: string
  productId: string
  onSuccess: () => void
}

export function SendCsatModal({
  callId,
  clientName,
  clientPhone,
  callDate,
  clientId,
  productId,
  onSuccess,
}: SendCsatModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const firstName = clientName.split(' ')[0]
  const formattedDate = callDate
    ? format(new Date(callDate), 'dd/MM')
    : 'recente'
  const defaultTemplate = `Olá ${firstName}! Como foi sua consultoria do dia ${formattedDate}? \n\nPor favor, avalie nosso atendimento: https://app.elite.com/csat/${callId}`

  const [message, setMessage] = useState(defaultTemplate)

  const handleSend = async () => {
    setLoading(true)
    try {
      await sendCsat(callId, clientPhone, message, clientId, productId)
      toast({
        title: 'CSAT Enviado',
        description: 'A pesquisa foi enviada para o WhatsApp do cliente.',
        className: 'bg-green-600 text-white',
      })
      onSuccess()
      setOpen(false)
    } catch (error) {
      toast({
        title: 'Erro ao enviar',
        description: 'Verifique a conexão com o WhatsApp.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 bg-[#1a1a1a] border-[#3a3a3a] text-gray-300 hover:text-white"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          CSAT
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[#1a1a1a] border-[#2a2a2a] text-white">
        <DialogHeader>
          <DialogTitle>Enviar Pesquisa CSAT</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Mensagem</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[150px] bg-[#0a0a0a] border-[#3a3a3a] text-gray-300 resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Variáveis disponíveis: {'{{primeiro_nome}}'}, {'{{data_call}}'},{' '}
              {'{{link_csat}}'} (Link é gerado automaticamente)
            </p>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-md">
            <p className="text-sm text-yellow-500">
              O cliente receberá esta mensagem via WhatsApp imediatamente.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="text-gray-400"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={loading}
            className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90"
          >
            {loading ? (
              'Enviando...'
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" /> Enviar Agora
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
