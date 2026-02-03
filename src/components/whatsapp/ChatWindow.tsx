import { useState, useEffect, useRef } from 'react'
import {
  WhatsAppConversation,
  WhatsAppMessage,
  getMessages,
  sendWhatsAppMessage,
  markAsRead,
} from '@/services/whatsapp'
import {
  generateResponseSuggestion,
  trackSuggestionUsage,
  SuggestionResponse,
} from '@/services/ai'
import { ChatInput } from './ChatInput'
import { MessageBubble } from './MessageBubble'
import { SuggestionModal } from './SuggestionModal'
import { Button } from '@/components/ui/button'
import { User, MoreVertical, Phone, Loader2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { supabase } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from '@/hooks/use-toast'

interface ChatWindowProps {
  conversation: WhatsAppConversation
  onToggleProfile: () => void
}

export function ChatWindow({ conversation, onToggleProfile }: ChatWindowProps) {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [inputText, setInputText] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // AI Suggestion State
  const [suggestionModalOpen, setSuggestionModalOpen] = useState(false)
  const [suggestionLoading, setSuggestionLoading] = useState(false)
  const [suggestionData, setSuggestionData] =
    useState<SuggestionResponse | null>(null)

  const scrollToBottom = () => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector(
        '[data-radix-scroll-area-viewport]',
      )
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }

  useEffect(() => {
    let mounted = true

    const fetch = async () => {
      setLoading(true)
      try {
        const data = await getMessages(conversation.id)
        if (mounted) {
          setMessages(data)
          await markAsRead(conversation.id)
        }
      } catch (error) {
        console.error(error)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetch()

    // Subscribe to new messages for this conversation
    const channel = supabase
      .channel(`chat:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens',
          filter: `conversa_id=eq.${conversation.id}`,
        },
        (payload) => {
          const newMessage = payload.new as WhatsAppMessage
          setMessages((prev) => [...prev, newMessage])
        },
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [conversation.id])

  useEffect(() => {
    if (!loading) scrollToBottom()
  }, [messages, loading])

  const handleSend = async (text: string) => {
    await sendWhatsAppMessage(
      conversation.id,
      conversation.numero_whatsapp,
      text,
    )
  }

  const handleSuggest = async () => {
    if (messages.length === 0) {
      toast({
        title: 'Histórico insuficiente',
        description:
          'É necessário haver mensagens trocadas para gerar contexto.',
        variant: 'secondary',
      })
      return
    }

    setSuggestionLoading(true)
    setSuggestionModalOpen(true) // Open immediately to show loading state
    setSuggestionData(null)

    try {
      const data = await generateResponseSuggestion(conversation.id)
      setSuggestionData(data)
    } catch (error: any) {
      setSuggestionModalOpen(false)
      if (error.message.includes('API Key not configured')) {
        toast({
          title: 'Configuração Necessária',
          description: 'A chave da API Gemini não está configurada.',
          variant: 'destructive',
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => (window.location.href = '/settings')}
            >
              Configurar
            </Button>
          ),
        })
      } else {
        toast({
          title: 'Erro na IA',
          description: error.message,
          variant: 'destructive',
        })
      }
    } finally {
      setSuggestionLoading(false)
    }
  }

  const handleUseSuggestion = (text: string, wasEdited: boolean) => {
    setInputText(text)
    if (suggestionData?.analyticsId) {
      trackSuggestionUsage(suggestionData.analyticsId, true, wasEdited)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Header */}
      <div className="h-16 border-b border-[#2a2a2a] flex items-center justify-between px-4 bg-[#111111]">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={onToggleProfile}
        >
          <div className="h-10 w-10 rounded-full bg-[#FFD700] flex items-center justify-center text-black font-bold text-lg">
            {conversation.cliente?.nome_completo?.charAt(0) || (
              <User className="h-5 w-5" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-white leading-tight">
              {conversation.cliente?.nome_completo ||
                conversation.numero_whatsapp}
            </h3>
            <p className="text-xs text-gray-400">
              {conversation.ultima_interacao
                ? `Visto ${formatDistanceToNow(new Date(conversation.ultima_interacao), { addSuffix: true, locale: ptBR })}`
                : 'Offline'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
          >
            <Phone className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
            onClick={onToggleProfile}
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea
        ref={scrollRef}
        className="flex-1 p-4 bg-[url('https://img.usecurling.com/i?q=subtle-pattern&color=black')] bg-repeat opacity-95"
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-[#FFD700]" />
          </div>
        ) : (
          <div className="flex flex-col justify-end min-h-full pb-2">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 my-10">
                <p className="text-sm">
                  Esta é o início da sua conversa com{' '}
                  {conversation.cliente?.nome_completo ||
                    conversation.numero_whatsapp}
                  .
                </p>
                <p className="text-xs mt-1">
                  As mensagens são protegidas de ponta a ponta.
                </p>
              </div>
            )}
            {messages.map((msg, idx) => {
              const prevMsg = messages[idx - 1]
              const isGrouped =
                prevMsg &&
                prevMsg.origem === msg.origem &&
                new Date(msg.timestamp).getTime() -
                  new Date(prevMsg.timestamp).getTime() <
                  120000
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isGrouped={!!isGrouped}
                />
              )
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        disabled={loading}
        onSuggest={handleSuggest}
        suggestionLoading={suggestionLoading}
        inputText={inputText}
        setInputText={setInputText}
      />

      <SuggestionModal
        isOpen={suggestionModalOpen}
        onClose={() => setSuggestionModalOpen(false)}
        loading={suggestionLoading}
        data={suggestionData}
        onUse={handleUseSuggestion}
        onRegenerate={handleSuggest}
      />
    </div>
  )
}
