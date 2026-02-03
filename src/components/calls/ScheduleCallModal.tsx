import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar, Edit } from 'lucide-react'
import { scheduleCall, Call } from '@/services/calls'
import { toast } from '@/hooks/use-toast'
import { getClientProducts } from '@/services/products'

const formSchema = z.object({
  productId: z.string().min(1, 'Produto obrigatório'),
  callNumber: z.coerce.number().min(1).max(12),
  date: z.string().min(1, 'Data é obrigatória'),
})

interface ScheduleCallModalProps {
  clientId: string
  existingCall?: Call
  preSelectedProductId?: string
  trigger?: React.ReactNode
  onSuccess: () => void
}

export function ScheduleCallModal({
  clientId,
  existingCall,
  preSelectedProductId,
  trigger,
  onSuccess,
}: ScheduleCallModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<any[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productId: existingCall?.produto_cliente_id || preSelectedProductId || '',
      callNumber: existingCall?.numero_call || 1,
      date: existingCall?.data_agendada
        ? new Date(existingCall.data_agendada).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
    },
  })

  useEffect(() => {
    if (open && !products.length) {
      getClientProducts(clientId).then(setProducts)
    }
  }, [open, clientId, products.length])

  // Update form if props change
  useEffect(() => {
    if (existingCall) {
      form.reset({
        productId: existingCall.produto_cliente_id,
        callNumber: existingCall.numero_call,
        date: existingCall.data_agendada
          ? new Date(existingCall.data_agendada).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16),
      })
    }
  }, [existingCall, form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true)
    try {
      await scheduleCall({
        id: existingCall?.id,
        clientId,
        produto_cliente_id: values.productId,
        numero_call: values.callNumber,
        data_agendada: new Date(values.date).toISOString(),
      })

      toast({
        title: existingCall ? 'Agendamento atualizado' : 'Call agendada',
        className: 'bg-green-600 text-white',
      })
      onSuccess()
      setOpen(false)
      if (!existingCall) form.reset()
    } catch (error: any) {
      toast({
        title: 'Erro ao agendar',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-semibold gap-2">
            <Calendar className="h-4 w-4" />
            Agendar Call
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[#1a1a1a] border-[#2a2a2a] text-white">
        <DialogHeader>
          <DialogTitle>
            {existingCall ? 'Editar Agendamento' : 'Agendar Call'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control}
              name="productId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Produto</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!!existingCall || !!preSelectedProductId}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-[#0a0a0a] border-[#3a3a3a]">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-[#1a1a1a] border-[#3a3a3a] text-white">
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.produto}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="callNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número da Call</FormLabel>
                  <Select
                    onValueChange={(val) => field.onChange(Number(val))}
                    defaultValue={String(field.value)}
                    disabled={!!existingCall}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-[#0a0a0a] border-[#3a3a3a]">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-[#1a1a1a] border-[#3a3a3a] text-white">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          Call {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data e Hora</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      className="bg-[#0a0a0a] border-[#3a3a3a]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="text-gray-400"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90"
              >
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
