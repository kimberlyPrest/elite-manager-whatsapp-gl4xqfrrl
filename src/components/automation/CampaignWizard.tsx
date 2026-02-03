import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { getClients, Client } from '@/services/clients'
import { filterClients, AutomationModel } from '@/services/automation'
import { Users, Plus, ArrowRight, ArrowLeft } from 'lucide-react'
import { ReviewModal } from './ReviewModal'

interface CampaignWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  initialModel?: AutomationModel | null
}

export function CampaignWizard({
  open,
  onOpenChange,
  onSuccess,
  initialModel,
}: CampaignWizardProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [allClients, setAllClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])

  // Step 1: Basic Info
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    description: '',
    scheduledDate: '',
  })

  // Step 2: Selection
  const [filters, setFilters] = useState({
    products: [] as string[],
    status: [] as string[],
    tags: [] as string[],
    engagement: [] as string[],
    status: [] as string[],
    tags: [] as string[],
    engagement: [] as string[],
    manualList: '',
    selectionMethod: 'filters' as 'filters' | 'manual',
    manualRecipients: [] as { name?: string; phone: string }[],
  })

  // Step 3: Messaging
  const [messages, setMessages] = useState<string[]>([''])

  // Step 4: Timing
  const [timing, setTiming] = useState({
    minInterval: 30,
    maxInterval: 300,
    businessHours: true,
    startTime: '09:00',
    endTime: '18:00',
    batchSize: 50,
    batchPauseMinutes: 10,
    enableBatchPause: false,
    daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  })

  const [showReview, setShowReview] = useState(false)

  // Populate from Model
  useEffect(() => {
    if (initialModel && open) {
      setBasicInfo((prev) => ({
        ...prev,
        name: `Campanha: ${initialModel.nome}`,
        description: initialModel.descricao,
      }))
      setMessages(
        initialModel.variacoes && initialModel.variacoes.length > 0
          ? initialModel.variacoes
          : [''],
      )
      setFilters((prev) => ({ ...prev, ...initialModel.filtros }))
      setTiming({
        minInterval: initialModel.intervalo_min_segundos || 30,
        maxInterval: initialModel.intervalo_max_segundos || 300,
        businessHours: initialModel.horario_comercial ?? true,
        startTime: initialModel.horario_inicio || '09:00',
        endTime: initialModel.horario_fim || '18:00',
      })
    }
  }, [initialModel, open])

  useEffect(() => {
    if (open) {
      setLoading(true)
      getClients()
        .then((data) => {
          setAllClients(data)
          setFilteredClients(data)
        })
        .finally(() => setLoading(false))
    } else {
      // Reset step on close
      setStep(1)
    }
  }, [open])

  useEffect(() => {
    if (filters.selectionMethod === 'filters') {
      const filtered = filterClients(allClients, filters)
      setFilteredClients(filtered)
    } else {
      // Parse manual list
      const lines = filters.manualList.split('\n').filter((l) => l.trim())
      const manualClients: Client[] = lines.map((line) => {
        // Simple CSV parse: phone,name or just phone
        const parts = line.split(',')
        const phone = parts[0].trim().replace(/\D/g, '')
        const name = parts[1]?.trim() || 'Desconhecido'

        // Check if client exists
        const existing = allClients.find(
          (c) =>
            c.telefone.replace(/\D/g, '') === phone ||
            c.whatsapp_number?.replace(/\D/g, '') === phone,
        )

        if (existing) return existing

        // Mock client structure for new contacts
        return {
          id: `temp-${Math.random()}`,
          nome_completo: name,
          telefone: phone,
          whatsapp_number: phone,
          primeiro_nome: name.split(' ')[0],
          email: '',
          pendente_classificacao: true,
          created_at: new Date().toISOString(),
        } as unknown as Client
      })
      setFilteredClients(manualClients)
    }
  }, [filters, allClients])

  const handleNext = () => {
    if (step < 4) setStep(step + 1)
    else setShowReview(true)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const addMessageVariation = () => {
    setMessages([...messages, ''])
  }

  const updateMessage = (index: number, value: string) => {
    const newMsgs = [...messages]
    newMsgs[index] = value
    setMessages(newMsgs)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl bg-[#111111] border-[#2a2a2a] text-white">
          <DialogHeader>
            <DialogTitle>Nova Campanha de Automação</DialogTitle>
            <DialogDescription>
              Configure os detalhes, público e mensagens da sua campanha.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between mb-6 px-1">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-[#FFD700] text-black' : 'bg-[#2a2a2a] text-gray-400'}`}
                >
                  {s}
                </div>
                <span
                  className={`text-sm ${step >= s ? 'text-white' : 'text-gray-500'} hidden md:block`}
                >
                  {s === 1
                    ? 'Básico'
                    : s === 2
                      ? 'Público'
                      : s === 3
                        ? 'Mensagem'
                        : 'Envio'}
                </span>
                {s < 4 && (
                  <div className="w-12 h-px bg-[#2a2a2a] mx-2 hidden md:block" />
                )}
              </div>
            ))}
          </div>

          <div className="py-4 min-h-[300px]">
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-2">
                  <Label>Nome da Campanha</Label>
                  <Input
                    placeholder="Ex: Recuperação de Leads Inativos"
                    value={basicInfo.name}
                    onChange={(e) =>
                      setBasicInfo({ ...basicInfo, name: e.target.value })
                    }
                    className="bg-[#1a1a1a] border-[#333]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Objetivo (Opcional)</Label>
                  <Textarea
                    placeholder="Descreva o objetivo desta campanha..."
                    value={basicInfo.description}
                    onChange={(e) =>
                      setBasicInfo({
                        ...basicInfo,
                        description: e.target.value,
                      })
                    }
                    className="bg-[#1a1a1a] border-[#333]"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <Tabs
                  value={filters.selectionMethod}
                  onValueChange={(v) =>
                    setFilters({ ...filters, selectionMethod: v as any })
                  }
                  className="w-full"
                >
                  <TabsList className="bg-[#1a1a1a] border-[#333] w-full">
                    <TabsTrigger value="filters" className="flex-1">
                      Por Filtros (Recomendado)
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="flex-1">
                      Lista Manual / CSV
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="filters" className="space-y-6 mt-4">
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-4">
                        <Label>Produtos</Label>
                        <div className="flex flex-wrap gap-2">
                          {['Elite', 'Scale', 'Labs', 'Venda'].map((p) => (
                            <div
                              key={p}
                              className="flex items-center space-x-2 border border-[#333] p-2 rounded bg-[#1a1a1a]"
                            >
                              <Checkbox
                                id={`prod-${p}`}
                                checked={filters.products.includes(p)}
                                onCheckedChange={(checked) => {
                                  if (checked)
                                    setFilters({
                                      ...filters,
                                      products: [...filters.products, p],
                                    })
                                  else
                                    setFilters({
                                      ...filters,
                                      products: filters.products.filter(
                                        (i) => i !== p,
                                      ),
                                    })
                                }}
                              />
                              <label
                                htmlFor={`prod-${p}`}
                                className="text-sm cursor-pointer"
                              >
                                {p}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex-1 space-y-4">
                        <Label>Nível de Engajamento</Label>
                        <Select
                          value={filters.engagement?.[0]}
                          onValueChange={(val) =>
                            setFilters({ ...filters, engagement: [val] })
                          }
                        >
                          <SelectTrigger className="bg-[#1a1a1a] border-[#333]">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Alto">Alto</SelectItem>
                            <SelectItem value="Médio">Médio</SelectItem>
                            <SelectItem value="Baixo">Baixo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="manual" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Cole os números (um por linha)</Label>
                      <Textarea
                        placeholder="5511999998888,Nome do Cliente&#10;5511988887777,Outro Cliente"
                        className="h-[200px] bg-[#1a1a1a] border-[#333] font-mono text-sm"
                        value={filters.manualList}
                        onChange={(e) =>
                          setFilters({ ...filters, manualList: e.target.value })
                        }
                      />
                      <p className="text-xs text-gray-500">
                        Formato: <code>telefone,nome</code> (nome opcional).
                        Aceita CSV simples.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#FFD700]/20 p-2 rounded-full">
                      <Users className="h-5 w-5 text-[#FFD700]" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">
                        {filteredClients.length} destinatários encontrados
                      </p>
                      <p className="text-xs text-gray-400">
                        {filters.selectionMethod === 'filters'
                          ? 'Baseado nos filtros aplicados'
                          : 'Baseado na lista manual'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div className="flex justify-between items-center">
                  <Label>Variações de Mensagem</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addMessageVariation}
                    className="text-[#FFD700]"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Adicionar Variação
                  </Button>
                </div>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  {messages.map((msg, idx) => (
                    <div key={idx} className="relative">
                      <span className="absolute top-2 right-2 text-xs text-gray-500 bg-[#111] px-1 rounded">
                        V{idx + 1}
                      </span>
                      <Textarea
                        value={msg}
                        onChange={(e) => updateMessage(idx, e.target.value)}
                        placeholder={`Olá {{primeiro_nome}}, tudo bem? Vimos que seu produto {{produto}} está...`}
                        className="bg-[#1a1a1a] border-[#333] min-h-[100px]"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Variáveis disponíveis:{' '}
                  <code className="text-[#FFD700]">{{ primeiro_nome }}</code>,{' '}
                  <code className="text-[#FFD700]">{{ produto }}</code>,{' '}
                  <code className="text-[#FFD700]">{{ status }}</code>
                </p>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Label>Intervalo entre envios (segundos)</Label>
                    <span className="text-[#FFD700] font-mono">
                      {timing.minInterval}s - {timing.maxInterval}s
                    </span>
                  </div>
                  <Slider
                    defaultValue={[30, 300]}
                    min={30}
                    max={600}
                    step={10}
                    value={[timing.minInterval, timing.maxInterval]}
                    onValueChange={(val) =>
                      setTiming({
                        ...timing,
                        minInterval: val[0],
                        maxInterval: val[1],
                      })
                    }
                    className="py-4"
                  />
                </div>

                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Respeitar Horário Comercial</Label>
                      <p className="text-xs text-gray-400">
                        Pausar envios fora do horário definido
                      </p>
                    </div>
                    <Switch
                      checked={timing.businessHours}
                      onCheckedChange={(c) =>
                        setTiming({ ...timing, businessHours: c })
                      }
                    />
                  </div>

                  {timing.businessHours && (
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-2">
                        <Label className="text-xs">Início</Label>
                        <Input
                          type="time"
                          value={timing.startTime}
                          onChange={(e) =>
                            setTiming({ ...timing, startTime: e.target.value })
                          }
                          className="bg-[#111] border-[#333]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Fim</Label>
                        <Input
                          type="time"
                          value={timing.endTime}
                          onChange={(e) =>
                            setTiming({ ...timing, endTime: e.target.value })
                          }
                          className="bg-[#111] border-[#333]"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-[#1a1a1a] p-4 rounded-lg border border-[#333] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Pausar entre Lotes</Label>
                      <p className="text-xs text-gray-400">
                        Faz uma pausa maior a cada X mensagens
                      </p>
                    </div>
                    <Switch
                      checked={timing.enableBatchPause}
                      onCheckedChange={(c) =>
                        setTiming({ ...timing, enableBatchPause: c })
                      }
                    />
                  </div>

                  {timing.enableBatchPause && (
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-2">
                        <Label className="text-xs">Mensagens por lote</Label>
                        <Input
                          type="number"
                          value={timing.batchSize}
                          onChange={(e) =>
                            setTiming({
                              ...timing,
                              batchSize: parseInt(e.target.value),
                            })
                          }
                          className="bg-[#111] border-[#333]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Pausa (minutos)</Label>
                        <Input
                          type="number"
                          value={timing.batchPauseMinutes}
                          onChange={(e) =>
                            setTiming({
                              ...timing,
                              batchPauseMinutes: parseInt(e.target.value),
                            })
                          }
                          className="bg-[#111] border-[#333]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between sm:justify-between w-full">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
              className="border-[#333] hover:bg-[#2a2a2a] text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            <Button
              onClick={handleNext}
              disabled={step === 1 && !basicInfo.name}
              className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90"
            >
              {step === 4 ? 'Revisar Campanha' : 'Próximo'}{' '}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReviewModal
        open={showReview}
        onOpenChange={setShowReview}
        data={{
          basicInfo,
          recipients: filteredClients,
          messages,
          timing,
          filters,
        }}
        onConfirm={() => {
          setShowReview(false)
          onOpenChange(false)
          onSuccess()
          // Increment usage if coming from a model
          if (initialModel) {
            // Call increment service here if needed, but safer to do in ReviewModal logic or onSuccess
          }
        }}
        initialModelId={initialModel?.id}
      />
    </>
  )
}
