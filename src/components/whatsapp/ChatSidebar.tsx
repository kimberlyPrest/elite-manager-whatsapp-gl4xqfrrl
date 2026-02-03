import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RefreshCw, Search, MessageSquare, Filter } from 'lucide-react'
import { WhatsAppConversation } from '@/services/whatsapp'
import { cn } from '@/lib/utils'
import { format, isToday, isYesterday } from 'date-fns'

interface ChatSidebarProps {
  conversations: WhatsAppConversation[]
  selectedId?: string
  onSelect: (id: string) => void
  onRefresh: () => void
  loading: boolean
}

export function ChatSidebar({
  conversations,
  selectedId,
  onSelect,
  onRefresh,
  loading,
}: ChatSidebarProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('Todas')

  const filters = ['Todas', 'Não Lidas', 'Crítico', 'Alto', 'Médio']

  const filteredConversations = conversations.filter((c) => {
    const matchesSearch =
      c.numero_whatsapp.includes(search) ||
      c.cliente?.nome_completo?.toLowerCase().includes(search.toLowerCase())

    if (!matchesSearch) return false

    if (filter === 'Todas') return true
    if (filter === 'Não Lidas') return c.mensagens_nao_lidas > 0
    return c.prioridade === filter
  })

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    if (isToday(date)) return format(date, 'HH:mm')
    if (isYesterday(date)) return 'Ontem'
    return format(date, 'dd/MM/yy')
  }

  const getPriorityColor = (priority: string) => {
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

  return (
    <div className="flex flex-col h-full bg-[#111111] border-r border-[#2a2a2a]">
      {/* Header */}
      <div className="p-4 border-b border-[#2a2a2a] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-white text-lg flex items-center gap-2">
            Conversas
            <Badge variant="secondary" className="bg-[#2a2a2a] text-gray-300">
              {filteredConversations.length}
            </Badge>
          </h2>
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

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conversa..."
            className="pl-9 bg-[#1a1a1a] border-[#2a2a2a] text-white focus:border-[#FFD700]/50"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                filter === f
                  ? 'bg-[#FFD700] text-black'
                  : 'bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a] hover:border-gray-500',
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            filteredConversations.map((chat) => (
              <div
                key={chat.id}
                onClick={() => onSelect(chat.id)}
                className={cn(
                  'flex items-start gap-3 p-4 border-b border-[#1a1a1a] cursor-pointer transition-colors hover:bg-[#1a1a1a]',
                  selectedId === chat.id &&
                    'bg-[#1a1a1a] border-l-2 border-l-[#FFD700]',
                )}
              >
                <div className="relative shrink-0">
                  <div className="h-10 w-10 rounded-full bg-[#2a2a2a] flex items-center justify-center text-[#FFD700] font-bold">
                    {chat.cliente?.nome_completo?.charAt(0) ||
                      chat.numero_whatsapp.slice(0, 2)}
                  </div>
                  {chat.mensagens_nao_lidas > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-[#FFD700] text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                      {chat.mensagens_nao_lidas}
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white truncate text-sm">
                      {chat.cliente?.nome_completo || chat.numero_whatsapp}
                    </span>
                    <span className="text-[10px] text-gray-500 whitespace-nowrap">
                      {formatTime(chat.ultima_interacao)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400 truncate max-w-[90%]">
                      {chat.ultima_mensagem}
                    </p>
                    <div
                      className={cn(
                        'h-2 w-2 rounded-full shrink-0',
                        getPriorityColor(chat.prioridade),
                      )}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
