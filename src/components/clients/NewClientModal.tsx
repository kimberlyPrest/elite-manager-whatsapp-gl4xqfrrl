import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import {
  Calendar as CalendarIcon,
  X,
  Plus,
  Trash2,
  UserPlus,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  createClient,
  NewClientPayload,
  NewProductPayload,
} from '@/services/clients'
import { toast } from '@/hooks/use-toast'

const phoneRegex = /^\+55 \(\d{2}\) \d{5}-\d{4}$/

const formSchema = z.object({
  nomeCompleto: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  telefone: z
    .string()
    .regex(phoneRegex, 'Formato inválido: +55 (XX) XXXXX-XXXX'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  segmento: z.string().min(1, 'Selecione um segmento'),
  nivelEngajamento: z.string().min(1, 'Selecione o nível'),
  dorPrincipal: z.string().max(500, 'Máximo 500 caracteres'),
  observacoes: z.string().max(1000, 'Máximo 1000 caracteres'),
  potencialUpsell: z.boolean().default(false),
  pendenteClassificacao: z.boolean().default(false),
  products: z.array(
    z
      .object({
        type: z.string().min(1, 'Selecione um produto'),
        status: z.string().min(1, 'Selecione um status'),
        numCallsTotal: z.string().optional(),
        startDate: z.date(),
        endDate: z.date(),
        notes: z.string().max(500, 'Máximo 500 caracteres'),
      })
      .refine((data) => data.endDate > data.startDate, {
        message: 'Data final deve ser maior que data inicial',
        path: ['endDate'],
      }),
  ),
})

type FormValues = z.infer<typeof formSchema>

interface NewClientModalProps {
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function NewClientModal({ trigger, onSuccess }: NewClientModalProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nomeCompleto: '',
      telefone: '',
      email: '',
      segmento: '',
      nivelEngajamento: '',
      dorPrincipal: '',
      observacoes: '',
      potencialUpsell: false,
      pendenteClassificacao: true,
      products: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'products',
  })

  const handlePhoneChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: string) => void,
  ) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length > 13) value = value.slice(0, 13)

    if (value.startsWith('55')) value = value.substring(2)

    let formatted = '+55 '
    if (value.length > 0) {
      formatted += `(${value.substring(0, 2)}`
    }
    if (value.length >= 3) {
      formatted += `) ${value.substring(2, 7)}`
    }
    if (value.length >= 8) {
      formatted += `-${value.substring(7, 11)}`
    }

    onChange(formatted)
  }

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      const nameParts = data.nomeCompleto.trim().split(' ')
      const firstName = nameParts[0]
      const lastName = nameParts.slice(1).join(' ')

      const clientPayload: NewClientPayload = {
        nome_completo: data.nomeCompleto,
        primeiro_nome: firstName,
        sobrenome: lastName,
        telefone: data.telefone,
        whatsapp_number: data.telefone,
        email: data.email || '',
        segmento: data.segmento,
        nivel_engajamento: data.nivelEngajamento,
        dor_principal: data.dorPrincipal,
        observacoes: data.observacoes,
        potencial_upsell: data.potencialUpsell,
        pendente_classificacao:
          data.products.length === 0 ? true : data.pendenteClassificacao,
      }

      const productsPayload: NewProductPayload[] = data.products.map((p) => {
        let mappedType = p.type
        let calls = 0

        switch (p.type) {
          case 'Elite':
            mappedType = 'Elite'
            calls = 2
            break
          case 'Scale':
            mappedType = 'Scale'
            calls = p.numCallsTotal ? parseInt(p.numCallsTotal) : 8
            break
          case 'Labs':
            mappedType = 'Labs'
            calls = 12
            break
          case 'Venda':
            mappedType = 'venda'
            calls = 0
            break
        }

        return {
          produto: mappedType,
          status: p.status,
          num_calls_total: calls,
          data_inicio: p.startDate.toISOString(),
          data_fim_prevista: p.endDate.toISOString(),
          observacoes_produto: p.notes,
        }
      })

      await createClient(clientPayload, productsPayload)

      toast({
        title: 'Sucesso!',
        description: 'Cliente cadastrado com sucesso!',
        className: 'bg-green-600 text-white border-green-700',
      })

      form.reset()
      setOpen(false)
      if (onSuccess) onSuccess()
    } catch (error: any) {
      console.error(error)
      const msg = error.message.includes('telefone')
        ? 'Cliente com este telefone já existe'
        : 'Erro ao cadastrar cliente. Tente novamente.'

      toast({
        title: 'Erro',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const productsCount = form.watch('products')?.length || 0

  const segments = [
    'Marketing',
    'Jurídico',
    'Saúde',
    'Tecnologia',
    'Educação',
    'Consultoria',
    'E-commerce',
    'Indústria',
    'Serviços',
    'Outro',
  ]
  const engagements = ['Alto', 'Médio', 'Baixo']

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
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-[700px] w-[95vw] max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border-[#2a2a2a] text-white p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b border-[#2a2a2a] sticky top-0 bg-[#1a1a1a] z-10">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[#FFD700]" />
            <DialogTitle className="text-xl font-bold">
              Novo Cliente
            </DialogTitle>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 hover:text-red-500 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>

        <div className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  Dados Pessoais
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nomeCompleto"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Nome Completo *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: João da Silva"
                            className="bg-[#2a2a2a] border-transparent focus:border-[#FFD700]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="+55 (XX) XXXXX-XXXX"
                            className="bg-[#2a2a2a] border-transparent focus:border-[#FFD700]"
                            {...field}
                            onChange={(e) =>
                              handlePhoneChange(e, field.onChange)
                            }
                            maxLength={19}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="cliente@email.com"
                            className="bg-[#2a2a2a] border-transparent focus:border-[#FFD700]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="segmento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Segmento</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-[#2a2a2a] border-transparent focus:ring-[#FFD700]">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {segments.map((s) => (
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

                  <FormField
                    control={form.control}
                    name="nivelEngajamento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nível de Engajamento</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="bg-[#2a2a2a] border-transparent focus:ring-[#FFD700]">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {engagements.map((e) => (
                              <SelectItem key={e} value={e}>
                                {e}
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
                    name="dorPrincipal"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>
                          Dor Principal{' '}
                          <span className="text-xs text-muted-foreground ml-2">
                            ({field.value.length}/500)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            rows={3}
                            className="bg-[#2a2a2a] border-transparent focus:border-[#FFD700] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="observacoes"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>
                          Observações{' '}
                          <span className="text-xs text-muted-foreground ml-2">
                            ({field.value.length}/1000)
                          </span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            rows={4}
                            className="bg-[#2a2a2a] border-transparent focus:border-[#FFD700] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-6 pt-2 sm:col-span-2">
                    <FormField
                      control={form.control}
                      name="potencialUpsell"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-[#FFD700] data-[state=checked]:text-black border-gray-500"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Potencial Upsell</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="pendenteClassificacao"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={productsCount === 0 || field.value}
                              onCheckedChange={field.onChange}
                              disabled={productsCount === 0}
                              className="data-[state=checked]:bg-[#FFD700] data-[state=checked]:text-black border-gray-500 disabled:opacity-50"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Pendente Classificação</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-[#2a2a2a]">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Produtos Contratados
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      append({
                        type: '',
                        status: '',
                        startDate: new Date(),
                        endDate: new Date(),
                        notes: '',
                      })
                    }
                    className="border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700]/10"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Produto
                  </Button>
                </div>

                <div className="space-y-4">
                  {fields.map((field, index) => {
                    const currentType = form.watch(`products.${index}.type`)

                    return (
                      <div
                        key={field.id}
                        className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-4 relative animate-fade-in"
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-2 text-gray-500 hover:text-red-500"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pr-8">
                          <FormField
                            control={form.control}
                            name={`products.${index}.type`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Produto</FormLabel>
                                <Select
                                  onValueChange={(val) => {
                                    field.onChange(val)
                                    form.setValue(
                                      `products.${index}.status`,
                                      '',
                                    )
                                  }}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a]">
                                      <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {['Elite', 'Scale', 'Labs', 'Venda'].map(
                                      (p) => (
                                        <SelectItem key={p} value={p}>
                                          Adapta{' '}
                                          {p === 'Venda' ? '(Lead/Venda)' : p}
                                        </SelectItem>
                                      ),
                                    )}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`products.${index}.status`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  disabled={!currentType}
                                >
                                  <FormControl>
                                    <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a]">
                                      <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {getProductStatuses(currentType).map(
                                      (s) => (
                                        <SelectItem key={s} value={s}>
                                          {s}
                                        </SelectItem>
                                      ),
                                    )}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {currentType === 'Scale' && (
                            <FormField
                              control={form.control}
                              name={`products.${index}.numCallsTotal`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Calls Contratadas</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value || '8'}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a]">
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

                          <FormField
                            control={form.control}
                            name={`products.${index}.startDate`}
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Data de Início</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          'bg-[#1a1a1a] border-[#3a3a3a] pl-3 text-left font-normal',
                                          !field.value &&
                                            'text-muted-foreground',
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
                                  <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                  >
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
                            name={`products.${index}.endDate`}
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Data Fim Prevista</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          'bg-[#1a1a1a] border-[#3a3a3a] pl-3 text-left font-normal',
                                          !field.value &&
                                            'text-muted-foreground',
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
                                  <PopoverContent
                                    className="w-auto p-0"
                                    align="start"
                                  >
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
                            name={`products.${index}.notes`}
                            render={({ field }) => (
                              <FormItem className="sm:col-span-2">
                                <FormLabel>Observações do Produto</FormLabel>
                                <FormControl>
                                  <Textarea
                                    rows={2}
                                    className="bg-[#1a1a1a] border-[#3a3a3a] resize-none"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {form.formState.errors.products?.[index]?.endDate && (
                          <div className="text-red-500 text-sm mt-2 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            {
                              form.formState.errors.products[index].endDate
                                ?.message
                            }
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {fields.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-[#2a2a2a] rounded-lg text-muted-foreground text-sm">
                      Nenhum produto adicionado. O cliente será marcado como
                      pendente.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-[#2a2a2a]">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !form.formState.isValid}
                  className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-semibold"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Cliente'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
