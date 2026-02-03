import { useState, useEffect } from 'react'
import { ChatSidebar } from '@/components/whatsapp/ChatSidebar'
import { ChatWindow } from '@/components/whatsapp/ChatWindow'
import { ProfileSidebar } from '@/components/whatsapp/ProfileSidebar'
import {
  getConversations,
  getWhatsappConfig,
  WhatsAppConversation,
  recalculatePriority,
} from '@/services/whatsapp'
import {
  MessageSquare,
  AlertTriangle,
  ArrowUpDown,
  Loader2,
} from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function WhatsApp() {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [loading, setLoading] = useState(true)
  const [configError, setConfigError] = useState(false)

  // New State for Global Actions
  const [isRecalculating, setIsRecalculating] = useState(false)

  const isMobile = useIsMobile()

  const loadData = async () => {
    setLoading(true)
    try {
      const config = await getWhatsappConfig()
      if (!config.url || !config.apikey) {
        setConfigError(true)
      }
      const data = await getConversations()
      setConversations(data)
    } catch (e) {
      toast({ title: 'Erro ao carregar conversas', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleGlobalRecalculate = async () => {
    setIsRecalculating(true)
    try {
      await recalculatePriority()
      toast({ title: 'Prioridades recalculadas com sucesso!' })
      await loadData()
    } catch (e) {
      toast({ title: 'Erro ao recalcular', variant: 'destructive' })
    } finally {
      setIsRecalculating(false)
    }
  }

  useEffect(() => {
    loadData()

    // Realtime subscription for conversation list updates
    const channel = supabase
      .channel('public:conversas_whatsapp')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversas_whatsapp' },
        (payload) => {
          // Optimistic or full refresh. For priority changes, full refresh is safer to resort list
          // We debounce or just call loadData (which sets loading true - maybe intrusive)
          // Better: get updated list silently
          getConversations().then(setConversations)

          // Notification Logic for High Priority
          if (
            payload.eventType === 'UPDATE' ||
            payload.eventType === 'INSERT'
          ) {
            const newRec = payload.new as WhatsAppConversation
            const oldRec = payload.old as WhatsAppConversation | undefined

            if (
              ['Alto', 'Crítico'].includes(newRec.prioridade) &&
              oldRec &&
              !['Alto', 'Crítico'].includes(oldRec.prioridade)
            ) {
              toast({
                title: 'Nova Conversa Prioritária',
                description: `${newRec.numero_whatsapp} agora é ${newRec.prioridade}`,
                variant: 'default',
                className: 'border-l-4 border-l-red-500',
              })
            }
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleSelectConversation = (id: string) => {
    setSelectedId(id)
  }

  const selectedConversation = conversations.find((c) => c.id === selectedId)

  if (configError) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center space-y-4 max-w-md p-6 bg-[#1a1a1a] rounded-xl border border-red-900/50">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">
            WhatsApp Desconectado
          </h2>
          <p className="text-gray-400">
            A integração com a Evolution API não está configurada corretamente.
          </p>
          <Link to="/settings">
            <button className="bg-[#FFD700] text-black px-4 py-2 rounded font-semibold hover:bg-[#FFD700]/90 mt-2">
              Ir para Configurações
            </button>
          </Link>
        </div>
      </div>
    )
  }

  if (isMobile) {
    if (selectedId && showProfile && selectedConversation) {
      return (
        <div className="h-[calc(100vh-4rem)]">
          <ProfileSidebar
            conversation={selectedConversation}
            onClose={() => setShowProfile(false)}
          />
        </div>
      )
    }
    if (selectedId && selectedConversation) {
      return (
        <div className="h-[calc(100vh-4rem)] flex flex-col">
          <button
            onClick={() => setSelectedId(null)}
            className="p-2 bg-[#111111] text-gray-400 text-xs text-left border-b border-[#2a2a2a]"
          >
            &larr; Voltar para lista
          </button>
          <ChatWindow
            conversation={selectedConversation}
            onToggleProfile={() => setShowProfile(true)}
          />
        </div>
      )
    }
    return (
      <div className="h-[calc(100vh-4rem)]">
        <ChatSidebar
          conversations={conversations}
          onSelect={setSelectedId}
          onRefresh={loadData}
          loading={loading}
        />
      </div>
    )
  }

  // Desktop Layout
  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden border border-[#2a2a2a] rounded-lg bg-[#0a0a0a]">
      {/* Sidebar */}
      <div className="w-[340px] shrink-0 border-r border-[#2a2a2a] flex flex-col">
        <div className="bg-[#111111] border-b border-[#2a2a2a] px-2 py-1 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="text-[10px] h-6 text-gray-400 hover:text-[#FFD700]"
            onClick={handleGlobalRecalculate}
            disabled={isRecalculating}
          >
            {isRecalculating ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <ArrowUpDown className="h-3 w-3 mr-1" />
            )}
            Recalcular Prioridades
          </Button>
        </div>
        <div className="flex-1 min-h-0">
          <ChatSidebar
            conversations={conversations}
            selectedId={selectedId || undefined}
            onSelect={handleSelectConversation}
            onRefresh={loadData}
            loading={loading}
          />
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            onToggleProfile={() => setShowProfile(!showProfile)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center bg-[#0a0a0a] text-gray-500">
            <div className="h-20 w-20 bg-[#FFD700]/10 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="h-10 w-10 text-[#FFD700]" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">
              Selecione uma conversa para começar
            </h2>
            <p className="max-w-xs">
              Escolha um cliente na lista ao lado para visualizar o histórico e
              enviar mensagens.
            </p>
          </div>
        )}
      </div>

      {/* Profile Sidebar */}
      {selectedConversation && showProfile && (
        <div className="w-[300px] shrink-0 border-l border-[#2a2a2a] animate-in slide-in-from-right duration-300">
          <ProfileSidebar
            conversation={selectedConversation}
            onClose={() => setShowProfile(false)}
          />
        </div>
      )}
    </div>
  )
}
