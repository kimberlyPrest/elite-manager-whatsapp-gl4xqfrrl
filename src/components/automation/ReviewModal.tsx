import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  createCampaign,
  createModel,
  incrementModelUsage,
} from '@/services/automation'
import { toast } from '@/hooks/use-toast'
import { Loader2, Shuffle, Save, Eye } from 'lucide-react'

interface ReviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: any
  onConfirm: () => void
  initialModelId?: string
}

export function ReviewModal({
  open,
  onOpenChange,
  data,
  onConfirm,
  initialModelId,
}: ReviewModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [saveAsModel, setSaveAsModel] = useState(false)
  const [modelName, setModelName] = useState('')
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])
  const [previewMessage, setPreviewMessage] = useState<string | null>(null)

  // Assign initial variations randomly
  const [recipients, setRecipients] = useState(() => {
    return data.recipients.map((r: any) => {
      const varIndex = Math.floor(Math.random() * data.messages.length)
      const msgTemplate = data.messages[varIndex] || ''
      const processedMsg = msgTemplate
        .replace(/{{primeiro_nome}}/g, r.primeiro_nome || '')
        .replace(/{{nome_completo}}/g, r.nome_completo || '')
        .replace(/{{produto}}/g, r.produtos_cliente?.[0]?.produto || '')
        .replace(/{{status}}/g, r.produtos_cliente?.[0]?.status || '')

      return {
        ...r,
        id: r.id || `temp-${Math.random()}`,
        variationIndex: varIndex,
        message: processedMsg,
      }
    })
  })

  // Initialize selection
  useEffect(() => {
    if (recipients.length > 0) {
      setSelectedRecipients(recipients.map((r: any) => r.id))
    }
  }, [recipients])

  const handleShuffle = () => {
    setRecipients(
      recipients.map((r: any) => {
        const varIndex = Math.floor(Math.random() * data.messages.length)
        const msgTemplate = data.messages[varIndex] || ''
        const processedMsg = msgTemplate
          .replace(/{{primeiro_nome}}/g, r.primeiro_nome || '')
          .replace(/{{nome_completo}}/g, r.nome_completo || '')
          .replace(/{{produto}}/g, r.produtos_cliente?.[0]?.produto || '')
          .replace(/{{status}}/g, r.produtos_cliente?.[0]?.status || '')
        return { ...r, variationIndex: varIndex, message: processedMsg }
      }),
    )
    toast({ title: 'Variações misturadas!' })
  }

  const toggleSelectAll = () => {
    if (selectedRecipients.length === recipients.length) {
      setSelectedRecipients([])
    } else {
      setSelectedRecipients(recipients.map((r: any) => r.id))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedRecipients.includes(id)) {
      setSelectedRecipients(selectedRecipients.filter((i) => i !== id))
    } else {
      setSelectedRecipients([...selectedRecipients, id])
    }
  }

  const handleStart = async () => {
    setSubmitting(true)
    try {
      await createCampaign(
        {
          nome: data.basicInfo.name,
          objetivo: data.basicInfo.objective,
          tipo_selecao:
            data.filters.selectionMethod === 'manual' ? 'Manual' : 'Filtros',
          configuracao_envio: {
            min_interval: data.timing.minInterval,
            max_interval: data.timing.maxInterval,
            business_hours_enabled: data.timing.businessHours,
            start_time: data.timing.startTime,
            end_time: data.timing.endTime,
            pause_after: data.timing.enableBatchPause
              ? data.timing.batchSize
              : undefined,
            pause_duration: data.timing.enableBatchPause
              ? data.timing.batchPauseMinutes
              : undefined,
          },
          variacoes_mensagem: data.messages,
          filtros: data.filters,
          start_now: true,
        },
        recipients.filter((r: any) => selectedRecipients.includes(r.id)),
      )

      if (saveAsModel && modelName) {
        await createModel({
          nome: modelName,
          descricao: data.basicInfo.description,
          categoria: 'Geral',
          tipo_selecao:
            data.filters.selectionMethod === 'manual' ? 'Manual' : 'Filtros',
          filtros: data.filters,
          variacoes: data.messages,
          intervalo_min_segundos: data.timing.minInterval,
          intervalo_max_segundos: data.timing.maxInterval,
          horario_comercial: data.timing.businessHours,
          horario_inicio: data.timing.startTime,
          horario_fim: data.timing.endTime,
          dias_semana: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        })
        toast({ title: 'Modelo salvo!' })
      }

      if (initialModelId) {
        await incrementModelUsage(initialModelId)
      }

      toast({ title: 'Campanha criada com sucesso!' })
      onConfirm()
    } catch (e: any) {
      console.error(e)
      toast({
        title: 'Erro ao criar campanha',
        description: e.message,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1000px] w-full bg-[#111111] border-[#2a2a2a] text-white h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2 border-b border-[#2a2a2a]">
          <DialogTitle>Revisar Campanha: {data.basicInfo.name}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center px-6 py-4 bg-[#151515]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={
                    selectedRecipients.length === recipients.length &&
                    recipients.length > 0
                  }
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm text-gray-300">Selecionar Todos</span>
              </div>
              <div className="h-4 w-px bg-[#333]" />
              <span className="text-sm text-gray-400">
                <span className="text-[#FFD700] font-bold">
                  {selectedRecipients.length}
                </span>{' '}
                selecionados de {recipients.length}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShuffle}
              className="text-[#FFD700] hover:bg-[#FFD700]/10"
            >
              <Shuffle className="h-3 w-3 mr-2" /> Redistribuir Variações
            </Button>
          </div>

          <ScrollArea className="flex-1 w-full">
            <Table>
              <TableHeader className="bg-[#1a1a1a] sticky top-0 z-10">
                <TableRow className="border-[#2a2a2a] hover:bg-transparent">
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead className="text-gray-400">Nome</TableHead>
                  <TableHead className="text-gray-400">Telefone</TableHead>
                  <TableHead className="text-gray-400">Variação</TableHead>
                  <TableHead className="text-gray-400 w-[40%]">
                    Preview da Mensagem
                  </TableHead>
                  <TableHead className="text-gray-400 text-right">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipients.map((r: any) => (
                  <TableRow
                    key={r.id}
                    className={`border-[#2a2a2a] hover:bg-[#1a1a1a] transition-colors ${
                      !selectedRecipients.includes(r.id)
                        ? 'opacity-50 grayscale'
                        : ''
                    }`}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedRecipients.includes(r.id)}
                        onCheckedChange={() => toggleSelect(r.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-white">
                      {r.nome_completo || 'Desconhecido'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {r.telefone}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-[#333] bg-[#222]"
                      >
                        V{r.variationIndex + 1}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="text-xs text-gray-400 font-mono truncate max-w-xs cursor-pointer hover:text-white"
                      onClick={() => setPreviewMessage(r.message)}
                      title="Clique para ver completa"
                    >
                      {r.message}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-gray-400 hover:text-white"
                        onClick={() => setPreviewMessage(r.message)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        <div className="p-6 border-t border-[#2a2a2a] bg-[#111111]">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="save-model"
                checked={saveAsModel}
                onCheckedChange={(c) => setSaveAsModel(c === true)}
              />
              <Label
                htmlFor="save-model"
                className="cursor-pointer text-sm font-normal text-gray-300"
              >
                Salvar estas configurações como modelo para uso futuro
              </Label>
            </div>
            {saveAsModel && (
              <Input
                placeholder="Nome do Modelo (Ex: Promoção Scale)"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="bg-[#1a1a1a] border-[#333]"
              />
            )}

            <div className="flex justify-between items-center mt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-[#333] hover:bg-[#2a2a2a] text-white min-w-[120px]"
              >
                Cancelar
              </Button>
              <div className="flex items-center gap-4">
                <div className="text-right mr-4">
                  <p className="text-xs text-gray-400">Tempo estimado</p>
                  <p className="font-mono text-[#FFD700]">
                    ~
                    {Math.ceil(
                      selectedRecipients.length *
                        ((data.timing.minInterval + data.timing.maxInterval) /
                          2 /
                          60),
                    )}{' '}
                    min
                  </p>
                </div>
                <Button
                  onClick={handleStart}
                  disabled={
                    submitting ||
                    (saveAsModel && !modelName) ||
                    selectedRecipients.length === 0
                  }
                  className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 min-w-[150px] font-semibold"
                >
                  {submitting ? (
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Iniciar Campanha ({selectedRecipients.length})
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Message Preview Modal */}
        <Dialog
          open={!!previewMessage}
          onOpenChange={(o) => !o && setPreviewMessage(null)}
        >
          <DialogContent className="bg-[#1a1a1a] border-[#333]">
            <DialogHeader>
              <DialogTitle>Visualização da Mensagem</DialogTitle>
            </DialogHeader>
            <div className="p-4 bg-[#111] rounded-md border border-[#333] mt-2 whitespace-pre-wrap text-sm text-gray-300 font-mono max-h-[400px] overflow-y-auto">
              {previewMessage}
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}
