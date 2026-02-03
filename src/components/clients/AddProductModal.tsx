import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Plus } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Textarea } from '@/components/ui/textarea'
import { createProduct } from '@/services/products'
import { toast } from '@/hooks/use-toast'

const formSchema = z
  .object({
    type: z.string().min(1, 'Selecione um produto'),
    status: z.string().min(1, 'Selecione um status'),
    numCallsTotal: z.string().optional(),
    startDate: z.date(),
    endDate: z.date().optional(),
    notes: z.string().max(500, 'Máximo 500 caracteres').optional(),
  })
  .refine(
    (data) => {
      if (data.endDate) {
        return data.endDate > data.startDate
      }
      return true
    },
    {
      message: 'Data final deve ser maior que data inicial',
      path: ['endDate'],
    },
  )

type FormValues = z.infer<typeof formSchema>

interface AddProductModalProps {
  clientId: string
  onSuccess: () => void
}

export function AddProductModal({ clientId, onSuccess }: AddProductModalProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: '',
      status: '',
      notes: '',
      startDate: new Date(),
    },
  })

  const productType = form.watch('type')

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      let calls = 0
      switch (data.type) {
        case 'Elite':
          calls = 2
          break
        case 'Scale':
          calls = data.numCallsTotal ? parseInt(data.numCallsTotal) : 8
          break
        case 'Labs':
          calls = 12
          break
        case 'Venda':
          calls = 0
          break
      }

      await createProduct(clientId, {
        produto: data.type,
        status: data.status,
        num_calls_total: calls,
        data_inicio: data.startDate.toISOString(),
        data_fim_prevista: data.endDate?.toISOString() || null,
        observacoes_produto: data.notes,
      })

      toast({
        title: 'Produto adicionado',
        description: 'O produto foi adicionado com sucesso.',
        className: 'bg-green-600 text-white border-green-700',
      })

      form.reset()
      setOpen(false)
      onSuccess()
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o produto.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getProductStatuses = (type: string) => {
    switch (type) {
      case 'Elite':
      case 'Scale':
        return [
          'Novos Alunos',
          'Formulário Não Preenchido',
          'Em Consultoria Ativa',
          'Consultoria Concluída',
          'Pausado',
          'Reembolsado',
        ]
      case 'Labs':
        return ['Não Iniciado', 'Em Andamento', 'Concluído', 'Cancelado']
      case 'Venda':
        return [
          'Novo Lead',
          'Iniciado',
          'Em Contato',
          'Agendar FUP',
          'Negócio Fechado',
          'Perdido',
        ]
      default:
        return []
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-semibold gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Produto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[#1a1a1a] border-[#2a2a2a] text-white">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Produto</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-4"
          >
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Produto</FormLabel>
                  <Select
                    onValueChange={(val) => {
                      field.onChange(val)
                      form.setValue('status', '')
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-[#2a2a2a] border-transparent">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {['Elite', 'Scale', 'Labs', 'Venda'].map((p) => (
                        <SelectItem key={p} value={p}>
                          Adapta {p === 'Venda' ? '(Lead/Venda)' : p}
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!productType}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-[#2a2a2a] border-transparent">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {getProductStatuses(productType).map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {productType === 'Scale' && (
              <FormField
                control={form.control}
                name="numCallsTotal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Calls Contratadas</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || '8'}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-[#2a2a2a] border-transparent">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="6">6 Calls</SelectItem>
                        <SelectItem value="8">8 Calls</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Início</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'bg-[#2a2a2a] border-transparent pl-3 text-left font-normal hover:bg-[#3a3a3a] hover:text-white',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'dd/MM/yyyy')
                            ) : (
                              <span>Selecione</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Fim (Opcional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'bg-[#2a2a2a] border-transparent pl-3 text-left font-normal hover:bg-[#3a3a3a] hover:text-white',
                              !field.value && 'text-muted-foreground',
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'dd/MM/yyyy')
                            ) : (
                              <span>Selecione</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      className="bg-[#2a2a2a] border-transparent resize-none"
                      placeholder="Observações internas..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-semibold"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Produto'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
