import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RefreshCw, Search, MessageSquare, Filter } from 'lucide-react'
import { WhatsAppConversation } from '@/services/whatsapp'
import { cn } from '@/lib/utils'
import { format, isToday, isYesterday } from 'date-fns'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import { Skeleton } from '@/components/ui/skeleton'

interface ChatSidebarProps {
  conversations: WhatsAppConversation[]
  selectedId?: string
  onSelect: (id: string) => void
  onRefresh: () => void
  loading: boolean
}

export function ChatSidebar({
  conversations = [], // Default to empty array
  selectedId,
  onSelect,
  onRefresh,
  loading,
}: ChatSidebarProps) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('priority')
  const [scoreRange, setScoreRange] = useState([0, 100])
  const [showFilters, setShowFilters] = useState(false)

  const filteredConversations = useMemo(() => {
    if (!conversations) return []

    let result = conversations.filter((c) => {
      if (!c) return false

      const phone = c.numero_whatsapp || ''
      const name = c.cliente?.nome_completo || ''

      const matchesSearch =
        phone.includes(search) ||
        name.toLowerCase().includes(search.toLowerCase())
      if (!matchesSearch) return false

      const score = c.score_prioridade || 0
      if (score < scoreRange[0] || score > scoreRange[1]) return false

      return true
    })

    result.sort((a, b) => {
      if (sortBy === 'priority' || sortBy === 'score') {
        const scoreA = a.score_prioridade || 0
        const scoreB = b.score_prioridade || 0
        if (scoreA !== scoreB) return scoreB - scoreA
      }

      if (sortBy === 'name') {
        const nameA = a.cliente?.nome_completo || a.numero_whatsapp || ''
        const nameB = b.cliente?.nome_completo || b.numero_whatsapp || ''
        return nameA.localeCompare(nameB)
      }

      // Safe date parsing
      const dateA = a.ultima_interacao
        ? new Date(a.ultima_interacao).getTime()
        : 0
      const dateB = b.ultima_interacao
        ? new Date(b.ultima_interacao).getTime()
        : 0
      return dateB - dateA
    })

    return result
  }, [conversations, search, sortBy, scoreRange])

  const groupedConversations = useMemo(() => {
    if (sortBy !== 'priority') return null

    const groups: Record<string, WhatsAppConversation[]> = {
      Crítico: [],
      Alto: [],
      Médio: [],
      Baixo: [],
    }

    filteredConversations.forEach((c) => {
      const p = c.prioridade || 'Baixo'
      if (groups[p]) groups[p].push(c)
      else groups['Baixo'].push(c)
    })

    return groups
  }, [filteredConversations, sortBy])

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return ''
      if (isToday(date)) return format(date, 'HH:mm')
      if (isYesterday(date)) return 'Ontem'
      return format(date, 'dd/MM/yy')
    } catch {
      return ''
    }
  }

  const getPriorityColor = (priority: string | undefined) => {
    switch (priority) {
      case 'Crítico':
        return 'bg-red-500'
      case 'Alto':
        return 'bg-orange-500'
      case 'Médio':
        return 'bg-yellow-500'
      case 'Baixo':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
  }

  const renderConversationItem = (chat: WhatsAppConversation) => (
    <div
      key={chat.id}
      onClick={() => onSelect(chat.id)}
      className={cn(
        'flex items-start gap-3 p-4 border-b border-[#1a1a1a] cursor-pointer transition-colors hover:bg-[#1a1a1a]',
        selectedId === chat.id && 'bg-[#1a1a1a] border-l-2 border-l-[#FFD700]',
      )}
    >
      <div className="relative shrink-0">
        <div className="h-10 w-10 rounded-full bg-[#2a2a2a] flex items-center justify-center text-[#FFD700] font-bold">
          {chat.cliente?.nome_completo?.charAt(0) ||
            chat.numero_whatsapp?.slice(0, 2) ||
            '?'}
        </div>
        {(chat.mensagens_nao_lidas ?? 0) > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-[#FFD700] text-black text-[10px] font-bold rounded-full flex items-center justify-center">
            {chat.mensagens_nao_lidas}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-white truncate text-sm">
            {chat.cliente?.nome_completo || chat.numero_whatsapp || 'Sem nome'}
          </span>
          <span className="text-[10px] text-gray-500 whitespace-nowrap">
            {formatTime(chat.ultima_interacao)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 truncate max-w-[80%] min-h-[1.5em]">
            {chat.ultima_mensagem || ''}
          </p>
          <div className="flex items-center gap-1">
            <span
              className={cn(
                'text-[10px] px-1 rounded',
                chat.prioridade === 'Crítico'
                  ? 'text-red-500 bg-red-950/30'
                  : chat.prioridade === 'Alto'
                    ? 'text-orange-500 bg-orange-950/30'
                    : chat.prioridade === 'Médio'
                      ? 'text-yellow-500 bg-yellow-950/30'
                      : 'text-gray-500',
              )}
            >
              {chat.score_prioridade ?? 0}
            </span>
            <div
              className={cn(
                'h-2 w-2 rounded-full shrink-0',
                getPriorityColor(chat.prioridade),
              )}
            />
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full bg-[#111111]">
      <div className="p-4 border-b border-[#2a2a2a] space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-white text-lg flex items-center gap-2">
            Conversas
            {loading ? (
              <Skeleton className="h-5 w-8 bg-[#2a2a2a] rounded-full" />
            ) : (
              <Badge variant="secondary" className="bg-[#2a2a2a] text-gray-300">
                {filteredConversations.length}
              </Badge>
            )}
          </h2>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'text-gray-400 hover:text-white',
                showFilters && 'text-[#FFD700]',
              )}
            >
              <Filter className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={loading}
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
            </Button>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conversa..."
            className="pl-9 bg-[#1a1a1a] border-[#2a2a2a] text-white focus:border-[#FFD700]/50 h-9 text-sm"
          />
        </div>

        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleContent className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="text-[10px] uppercase text-gray-500 font-bold">
                Ordenar por
              </label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-8 bg-[#1a1a1a] border-[#2a2a2a] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="priority">Prioridade (Padrão)</SelectItem>
                  <SelectItem value="score">Score Numérico</SelectItem>
                  <SelectItem value="date">Data Recente</SelectItem>
                  <SelectItem value="name">Nome do Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] text-gray-400 uppercase font-bold">
                <span>Score Min: {scoreRange[0]}</span>
                <span>Max: {scoreRange[1]}</span>
              </div>
              <Slider
                defaultValue={[0, 100]}
                max={100}
                step={5}
                value={scoreRange}
                onValueChange={setScoreRange}
                className="py-1"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <ScrollArea className="flex-1">
        <div className="flex flex-col pb-2">
          {loading && conversations.length === 0 ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 border-b border-[#1a1a1a] flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full bg-[#1a1a1a]" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24 bg-[#1a1a1a]" />
                  <Skeleton className="h-3 w-full bg-[#1a1a1a]" />
                </div>
              </div>
            ))
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Nenhuma conversa encontrada</p>
            </div>
          ) : groupedConversations ? (
            Object.entries(groupedConversations).map(([key, list]) => {
              if (list.length === 0) return null
              return (
                <div key={key}>
                  <div className="px-4 py-1.5 bg-[#1a1a1a]/50 text-[10px] font-bold text-gray-500 uppercase flex items-center justify-between border-y border-[#1a1a1a]">
                    <span>{key}</span>
                    <span>({list.length})</span>
                  </div>
                  {list.map(renderConversationItem)}
                </div>
              )
            })
          ) : (
            filteredConversations.map(renderConversationItem)
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
