import { useState, useEffect } from 'react'
import { ChatSidebar } from '@/components/whatsapp/ChatSidebar'
import { ChatWindow } from '@/components/whatsapp/ChatWindow'
import { ProfileSidebar } from '@/components/whatsapp/ProfileSidebar'
import {
  getConversations,
  getWhatsappConfig,
  WhatsAppConversation,
} from '@/services/whatsapp'
import { MessageSquare, AlertTriangle } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { Link } from 'react-router-dom'

export default function WhatsApp() {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [loading, setLoading] = useState(true)
  const [configError, setConfigError] = useState(false)

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

  useEffect(() => {
    loadData()

    // Realtime subscription for conversation list updates
    const channel = supabase
      .channel('public:conversas_whatsapp')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversas_whatsapp' },
        () => {
          // Refresh list on any change
          getConversations().then(setConversations)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleSelectConversation = (id: string) => {
    setSelectedId(id)
    if (isMobile) {
      // Logic to handle mobile view navigation could be added here if not using direct layout switching
    }
  }

  const selectedConversation = conversations.find((c) => c.id === selectedId)

  // Layout Logic
  // Mobile:
  // - List View: !selectedId
  // - Chat View: selectedId && !showProfile
  // - Profile View: selectedId && showProfile

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
      <div className="w-[320px] shrink-0 border-r border-[#2a2a2a]">
        <ChatSidebar
          conversations={conversations}
          selectedId={selectedId || undefined}
          onSelect={handleSelectConversation}
          onRefresh={loadData}
          loading={loading}
        />
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
        <div className="w-[280px] shrink-0 border-l border-[#2a2a2a] animate-in slide-in-from-right duration-300">
          <ProfileSidebar
            conversation={selectedConversation}
            onClose={() => setShowProfile(false)}
          />
        </div>
      )}
    </div>
  )
}
