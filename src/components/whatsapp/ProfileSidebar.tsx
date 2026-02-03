import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  X,
  User,
  Phone,
  Mail,
  FileText,
  Tag,
  Check,
  ExternalLink,
  RefreshCw,
  Info,
  AlertTriangle,
  Clock,
  Box,
} from 'lucide-react'
import {
  WhatsAppConversation,
  recalculatePriority,
  setManualPriority,
} from '@/services/whatsapp'
import { getClientProducts } from '@/services/products'
import { supabase } from '@/lib/supabase/client'
import { Link } from 'react-router-dom'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface ProfileSidebarProps {
  conversation: WhatsAppConversation
  onClose: () => void
}

export function ProfileSidebar({ conversation, onClose }: ProfileSidebarProps) {
  const [products, setProducts] = useState<any[]>([])
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [savingNotes, setSavingNotes] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [recalculating, setRecalculating] = useState(false)

  // Fetch detailed data for score breakdown
  const fetchData = async () => {
    if (conversation.cliente_id) {
      getClientProducts(conversation.cliente_id).then(setProducts)

      supabase
        .from('clientes')
        .select(
          'observacoes, tags_cliente(tipo_tag, ativo), vendas(status_venda)',
        )
        .eq('id', conversation.cliente_id)
        .single()
        .then(({ data }) => {
          if (data) {
            setNotes(data.observacoes || '')
            setTags(data.tags_cliente || [])
            setSales(data.vendas || [])
          }
        })
    }
  }

  useEffect(() => {
    fetchData()
  }, [conversation.id])

  const handleSaveNotes = async () => {
    if (!conversation.cliente_id) return
    setSavingNotes(true)
    try {
      await supabase
        .from('clientes')
        .update({ observacoes: notes })
        .eq('id', conversation.cliente_id)
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 2000)
    } catch (e) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    } finally {
      setSavingNotes(false)
    }
  }

  const handlePriorityChange = async (val: string) => {
    try {
      await setManualPriority(conversation.id, val)
      toast({ title: 'Prioridade atualizada manualmente' })
    } catch (e) {
      toast({ title: 'Erro', variant: 'destructive' })
    }
  }

  const handleRecalculate = async () => {
    setRecalculating(true)
    try {
      await recalculatePriority(conversation.id)
      toast({ title: 'Prioridade recalculada' })
      // Refresh parent ideally, but for now we rely on realtime subscription in WhatsApp.tsx
    } catch (e) {
      toast({ title: 'Erro', variant: 'destructive' })
    } finally {
      setRecalculating(false)
    }
  }

  // Calculate breakdown for display (Mirrors Edge Function Logic)
  const breakdown = useMemo(() => {
    const points: { label: string; pts: number; icon: any; color: string }[] =
      []
    let total = 0

    // 1. Time (Estimative - frontend might not have exact last message time sent by us easily without messages prop,
    // assuming Last Interaction is what triggered it or just displaying generic logic if not precise)
    // We'll skip Time exact calculation in display to avoid confusion, or use 'ultima_interacao'
    const now = new Date()
    const lastInter = conversation.ultima_interacao
      ? new Date(conversation.ultima_interacao)
      : null
    if (lastInter) {
      const diff = Math.floor(
        (now.getTime() - lastInter.getTime()) / (1000 * 60 * 60 * 24),
      )
      if (diff >= 2) {
        const pts = diff >= 8 ? 30 : diff >= 4 ? 20 : 10
        points.push({
          label: `Sem resposta há ${diff}d`,
          pts,
          icon: Clock,
          color: 'text-blue-400',
        })
        total += pts
      }
    }

    // 2. Product
    let prodPts = 0
    let prodName = 'Nenhum'
    products.forEach((p) => {
      let current = 5
      if (['Elite', 'Scale'].includes(p.produto)) current = 25
      else if (['Labs', 'Venda'].includes(p.produto)) current = 15

      if (current > prodPts) {
        prodPts = current
        prodName = p.produto
      }
    })
    if (products.length === 0) prodPts = 5
    points.push({
      label: `Produto: ${prodName}`,
      pts: prodPts,
      icon: Box,
      color: 'text-purple-400',
    })
    total += prodPts

    // 3. Status
    const statusMap: Record<string, number> = {
      Reembolsado: 25,
      'Tempo Esgotado': 25,
      Pausado: 20,
      'Formulário Não Preenchido': 15,
      'Perto do Final': 15,
      'Novos Alunos': 10,
    }
    let statusPts = 0
    products.forEach((p) => {
      if (statusMap[p.status]) statusPts += statusMap[p.status]
    })
    sales.forEach((s) => {
      if (['Perdido', 'Novo Lead'].includes(s.status_venda)) statusPts += 10
    })
    statusPts = Math.min(25, statusPts)
    if (statusPts > 0)
      points.push({
        label: 'Status Crítico',
        pts: statusPts,
        icon: AlertTriangle,
        color: 'text-red-400',
      })
    total += statusPts

    // 4. Tags
    let tagPts = 0
    tags
      .filter((t) => t.ativo)
      .forEach((t) => {
        // Simple approximation
        if (t.tipo_tag.includes('14_dias') || t.tipo_tag.includes('esgotado'))
          tagPts += 10
        else if (t.tipo_tag.includes('7_dias')) tagPts += 7
        else tagPts += 5
      })
    tagPts = Math.min(20, tagPts)
    if (tagPts > 0)
      points.push({
        label: 'Tags de Alerta',
        pts: tagPts,
        icon: Tag,
        color: 'text-yellow-400',
      })
    total += tagPts

    return points
  }, [products, tags, sales, conversation.ultima_interacao])

  const priorityColor =
    conversation.prioridade === 'Crítico'
      ? 'text-red-500'
      : conversation.prioridade === 'Alto'
        ? 'text-orange-500'
        : conversation.prioridade === 'Médio'
          ? 'text-yellow-500'
          : 'text-blue-500'

  const score = conversation.score_prioridade || 0

  return (
    <div className="h-full bg-[#111111] border-l border-[#2a2a2a] flex flex-col w-full">
      <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
        <h3 className="font-semibold text-white">Perfil do Cliente</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-gray-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Identity */}
        <div className="flex flex-col items-center text-center">
          <div className="h-20 w-20 rounded-full bg-[#2a2a2a] flex items-center justify-center mb-3">
            <img
              src={`https://img.usecurling.com/ppl/medium?gender=male&seed=${conversation.cliente_id}`}
              alt="Avatar"
              className="h-full w-full rounded-full object-cover opacity-80"
            />
          </div>
          <h2 className="text-lg font-bold text-white">
            {conversation.cliente?.nome_completo || 'Desconhecido'}
          </h2>
          <p className="text-sm text-gray-500">
            {conversation.numero_whatsapp}
          </p>

          {conversation.cliente_id && (
            <Link to={`/clients/${conversation.cliente_id}`} className="mt-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs border-[#2a2a2a] text-[#FFD700] hover:text-[#FFD700] bg-transparent"
              >
                Ver Ficha Completa <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>

        {/* Priority Section */}
        <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#2a2a2a] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-400 uppercase">
                Score de Prioridade
              </span>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-gray-600" />
                </TooltipTrigger>
                <TooltipContent className="max-w-[200px] text-xs">
                  O score é calculado automaticamente com base em tempo de
                  resposta, produto e tags.
                </TooltipContent>
              </Tooltip>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={handleRecalculate}
              disabled={recalculating}
            >
              <RefreshCw
                className={cn('h-3 w-3', recalculating && 'animate-spin')}
              />
            </Button>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-end">
              <span className={cn('text-xl font-bold', priorityColor)}>
                {conversation.prioridade}
              </span>
              <span className="text-2xl font-black text-white">
                {score}
                <span className="text-xs font-normal text-gray-500">/100</span>
              </span>
            </div>
            <Progress
              value={score}
              className={cn(
                'h-2',
                conversation.prioridade === 'Crítico'
                  ? '[&>div]:bg-red-500'
                  : conversation.prioridade === 'Alto'
                    ? '[&>div]:bg-orange-500'
                    : conversation.prioridade === 'Médio'
                      ? '[&>div]:bg-yellow-500'
                      : '[&>div]:bg-blue-500',
              )}
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-[#2a2a2a]">
            {breakdown.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 text-gray-300">
                  <item.icon className={cn('h-3 w-3', item.color)} />
                  <span>{item.label}</span>
                </div>
                <span className="font-mono text-gray-500">+{item.pts}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 mt-2 border-t border-[#2a2a2a]">
            <div className="flex items-center gap-2 mb-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase">
                Definir Manualmente
              </label>
              {conversation.prioridade_manual && (
                <Badge
                  variant="outline"
                  className="text-[9px] h-4 px-1 text-yellow-500 border-yellow-900"
                >
                  Manual
                </Badge>
              )}
            </div>
            <Select
              value={conversation.prioridade}
              onValueChange={handlePriorityChange}
            >
              <SelectTrigger className="bg-[#111] border-[#2a2a2a] text-white h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Crítico">Crítico</SelectItem>
                <SelectItem value="Alto">Alto</SelectItem>
                <SelectItem value="Médio">Médio</SelectItem>
                <SelectItem value="Baixo">Baixo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
            <FileText className="h-3 w-3" /> Produtos Contratados
          </label>
          {products.length === 0 ? (
            <p className="text-xs text-gray-500 italic">
              Nenhum produto encontrado.
            </p>
          ) : (
            <div className="space-y-2">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="bg-[#1a1a1a] p-2 rounded border border-[#2a2a2a]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">
                      {p.produto}
                    </span>
                    <Badge variant="outline" className="text-[10px] h-4 px-1">
                      {p.status}
                    </Badge>
                  </div>
                  {p.produto !== 'Venda' && (
                    <div className="text-[10px] text-gray-400">
                      Calls: {p.num_calls_realizadas || 0}/
                      {p.num_calls_total || 0}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-500 uppercase">
              Observações Rápidas
            </label>
            {savedSuccess && (
              <span className="text-[10px] text-green-500 flex items-center gap-1">
                <Check className="h-3 w-3" /> Salvo
              </span>
            )}
          </div>
          <Textarea
            className="bg-[#1a1a1a] border-[#2a2a2a] text-sm min-h-[120px] resize-none"
            placeholder="Anote algo sobre o cliente..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleSaveNotes}
          />
        </div>
      </div>
    </div>
  )
}
