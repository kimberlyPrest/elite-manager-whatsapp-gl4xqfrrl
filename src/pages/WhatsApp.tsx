import { useState, useEffect } from 'react'
import { ChatSidebar } from '@/components/whatsapp/ChatSidebar'
import { ChatWindow } from '@/components/whatsapp/ChatWindow'
import { ProfileSidebar } from '@/components/whatsapp/ProfileSidebar'
import {
  getConversations,
  getEvolutionConfig,
  WhatsAppConversation,
  recalculatePriority,
} from '@/services/whatsapp'
import {
  MessageSquare,
  AlertTriangle,
  ArrowUpDown,
  Loader2,
  RefreshCcw,
} from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { supabase } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function WhatsApp() {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [loading, setLoading] = useState(true)
  const [configError, setConfigError] = useState(false)
  const [isRecalculating, setIsRecalculating] = useState(false)

  const isMobile = useIsMobile()

  const loadData = async () => {
    setLoading(true)
    try {
      const config = await getEvolutionConfig()
      if (!config.url || !config.apikey || !config.instance) {
        setConfigError(true)
      } else {
        setConfigError(false)
      }

      const data = await getConversations()
      // Ensure data is an array
      setConversations(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error(e)
      toast({ title: 'Erro ao carregar conversas', variant: 'destructive' })
      setConversations([])
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

    const channel = supabase
      .channel('public:conversas_whatsapp')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversas_whatsapp' },
        (payload) => {
          getConversations().then((data) => setConversations(data || []))

          if (
            payload.eventType === 'UPDATE' ||
            payload.eventType === 'INSERT'
          ) {
            const newRec = payload.new as WhatsAppConversation
            const oldRec = payload.old as WhatsAppConversation | undefined

            if (
              newRec &&
              ['Alto', 'Crítico'].includes(newRec.prioridade) &&
              (!oldRec || !['Alto', 'Crítico'].includes(oldRec.prioridade))
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

  // Safe check for conversations
  const selectedConversation = Array.isArray(conversations)
    ? conversations.find((c) => c.id === selectedId)
    : undefined

  if (loading && conversations.length === 0 && !configError) {
    return (
      <div className="h-[calc(100vh-4rem)] flex overflow-hidden border border-[#2a2a2a] rounded-lg bg-[#0a0a0a] p-4">
        <div className="w-[340px] shrink-0 border-r border-[#2a2a2a] flex flex-col space-y-4">
          <Skeleton className="h-10 w-full bg-[#1a1a1a]" />
          <Skeleton className="h-20 w-full bg-[#1a1a1a]" />
          <Skeleton className="h-20 w-full bg-[#1a1a1a]" />
          <Skeleton className="h-20 w-full bg-[#1a1a1a]" />
        </div>
        <div className="flex-1 p-4 flex flex-col space-y-4">
          <Skeleton className="h-16 w-full bg-[#1a1a1a]" />
          <Skeleton className="h-full w-full bg-[#1a1a1a]" />
        </div>
      </div>
    )
  }

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
            Configure a instância <strong>org-prestes</strong>.
          </p>
          <div className="flex gap-2 justify-center">
            <Button
              variant="outline"
              onClick={loadData}
              className="border-[#333] text-white"
            >
              <RefreshCcw className="mr-2 h-4 w-4" /> Tentar Novamente
            </Button>
            <Link to="/settings">
              <Button className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90">
                Ir para Configurações
              </Button>
            </Link>
          </div>
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
            <p className="max-w-xs text-sm">
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
