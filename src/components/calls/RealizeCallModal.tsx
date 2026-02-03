import { useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { realizeCall } from '@/services/calls'
import { toast } from '@/hooks/use-toast'

const formSchema = z.object({
  date: z.string().min(1, 'Data é obrigatória'),
  duration: z.coerce.number().min(1, 'Duração inválida'),
})

interface RealizeCallModalProps {
  callId: string
  clientId: string
  productId: string
  onSuccess: () => void
}

export function RealizeCallModal({
  callId,
  clientId,
  productId,
  onSuccess,
}: RealizeCallModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 16),
      duration: 60,
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true)
    try {
      await realizeCall(
        callId,
        new Date(values.date).toISOString(),
        values.duration,
        clientId,
        productId,
      )
      toast({
        title: 'Call Realizada',
        description: 'Status atualizado com sucesso.',
        className: 'bg-green-600 text-white',
      })
      onSuccess()
      setOpen(false)
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
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
          size="sm"
          className="h-8 gap-2 bg-green-600 hover:bg-green-700 text-white border-none"
        >
          <Check className="h-3.5 w-3.5" />
          Realizar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[#1a1a1a] border-[#2a2a2a] text-white">
        <DialogHeader>
          <DialogTitle>Concluir Call</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-4"
          >
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Realizada</FormLabel>
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

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duração (minutos)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
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
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? 'Salvando...' : 'Confirmar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
