import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { createTimelineEvent } from '@/services/timeline'
import { getClientProducts, Product } from '@/services/products'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface AddEventModalProps {
  clientId: string
  onSuccess: () => void
  trigger?: React.ReactNode
}

export function AddEventModal({
  clientId,
  onSuccess,
  trigger,
}: AddEventModalProps) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [products, setProducts] = useState<Product[]>([])

  // Form State
  const [type, setType] = useState('nota')
  const [productId, setProductId] = useState<string>('none')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [resolved, setResolved] = useState(false)

  useEffect(() => {
    if (open) {
      // Set default date to now formatted for datetime-local
      const now = new Date()
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
      setDate(now.toISOString().slice(0, 16))

      // Fetch products
      getClientProducts(clientId).then(setProducts)
    }
  }, [open, clientId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await createTimelineEvent(
        clientId,
        type,
        description,
        productId === 'none' ? undefined : productId,
        new Date(date).toISOString(),
      )

      toast({ title: 'Evento criado com sucesso' })
      setOpen(false)
      setDescription('')
      setType('nota')
      setProductId('none')
      onSuccess()
    } catch (error) {
      toast({ title: 'Erro ao criar evento', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Evento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
        <DialogHeader>
          <DialogTitle>Adicionar Evento Manual</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Evento</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-[#111] border-[#333]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nota">Nota</SelectItem>
                  <SelectItem value="call">Call (Manual)</SelectItem>
                  <SelectItem value="fup_geral">Follow-up</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Produto Relacionado</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger className="bg-[#111] border-[#333]">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.produto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Data e Hora</Label>
            <Input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-[#111] border-[#333] text-white"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-[#111] border-[#333] min-h-[100px]"
              maxLength={1000}
              placeholder="Detalhes do evento..."
              required
            />
            <p className="text-xs text-gray-500 text-right">
              {description.length}/1000
            </p>
          </div>

          {type.startsWith('fup') && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="resolved"
                checked={resolved}
                onCheckedChange={(c) => setResolved(c === true)}
              />
              <Label htmlFor="resolved">Marcar como resolvido</Label>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Salvar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
