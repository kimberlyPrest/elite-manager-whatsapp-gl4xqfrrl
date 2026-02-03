import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Edit2 } from 'lucide-react'

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
import { updateProduct, Product } from '@/services/products'
import { toast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'

const formSchema = z
  .object({
    status: z.string().min(1, 'Selecione um status'),
    numCallsTotal: z.string().optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    notes: z.string().max(500, 'Máximo 500 caracteres').optional(),
  })
  .refine(
    (data) => {
      if (data.endDate && data.startDate) {
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

interface EditProductModalProps {
  product: Product
  onSuccess: () => void
}

export function EditProductModal({
  product,
  onSuccess,
}: EditProductModalProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: product.status,
      numCallsTotal: product.num_calls_total?.toString(),
      startDate: product.data_inicio
        ? new Date(product.data_inicio)
        : undefined,
      endDate: product.data_fim_prevista
        ? new Date(product.data_fim_prevista)
        : undefined,
      notes: product.observacoes_produto || '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        status: product.status,
        numCallsTotal: product.num_calls_total?.toString(),
        startDate: product.data_inicio
          ? new Date(product.data_inicio)
          : undefined,
        endDate: product.data_fim_prevista
          ? new Date(product.data_fim_prevista)
          : undefined,
        notes: product.observacoes_produto || '',
      })
    }
  }, [open, product, form])

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      const isComplete = ['Concluído', 'Consultoria Concluída'].includes(
        data.status,
      )
      const createTimeline = isComplete && data.status !== product.status

      let confirmTimeline = false
      if (createTimeline) {
        confirmTimeline = window.confirm(
          'Status alterado para Concluído. Deseja criar um evento na timeline?',
        )
      }

      await updateProduct(
        product.id,
        {
          status: data.status,
          num_calls_total: data.numCallsTotal
            ? parseInt(data.numCallsTotal)
            : product.num_calls_total,
          data_inicio: data.startDate?.toISOString(),
          data_fim_prevista: data.endDate?.toISOString() || null,
          observacoes_produto: data.notes,
        },
        confirmTimeline,
        product.cliente_id,
        product.produto,
      )

      toast({
        title: 'Produto atualizado',
        description: 'As informações foram salvas com sucesso.',
        className: 'bg-green-600 text-white border-green-700',
      })

      setOpen(false)
      onSuccess()
    } catch (error) {
      console.error(error)
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o produto.',
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
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-[#2a2a2a] text-gray-400 hover:text-white"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-[#1a1a1a] border-[#2a2a2a] text-white">
        <DialogHeader>
          <DialogTitle>Editar Produto</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-4"
          >
            <div className="space-y-2">
              <FormLabel>Produto</FormLabel>
              <Input
                value={product.produto}
                disabled
                className="bg-[#2a2a2a] border-transparent opacity-50 cursor-not-allowed"
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-[#2a2a2a] border-transparent">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {getProductStatuses(product.produto).map((s) => (
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

            {product.produto === 'Scale' &&
              (!product.num_calls_realizadas ||
                product.num_calls_realizadas === 0) && (
                <FormField
                  control={form.control}
                  name="numCallsTotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calls Contratadas</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
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
                    <FormLabel>Data Fim (Prevista)</FormLabel>
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
                {isSubmitting ? 'Salvar Alterações' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
