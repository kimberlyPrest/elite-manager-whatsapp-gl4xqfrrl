import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Paperclip, Send, Wand2, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSend: (text: string) => Promise<void>
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = async () => {
    if (!message.trim() || sending) return

    setSending(true)
    try {
      await onSend(message)
      setMessage('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch (error) {
      toast({
        title: 'Erro ao enviar',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }

  useEffect(() => {
    adjustHeight()
  }, [message])

  return (
    <div className="p-3 bg-[#111111] border-t border-[#2a2a2a] flex items-end gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="text-gray-400 hover:text-[#FFD700] mb-0.5"
        disabled={disabled}
      >
        <Paperclip className="h-5 w-5" />
      </Button>

      <div className="flex-1 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] focus-within:border-[#FFD700]/50 transition-colors flex items-end p-2 gap-2">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite uma mensagem..."
          className="min-h-[24px] max-h-[150px] p-0 border-0 bg-transparent resize-none focus-visible:ring-0 text-white placeholder:text-gray-500 leading-6"
          disabled={disabled}
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-[#FFD700] hover:text-[#FFD700]/80 hover:bg-transparent"
          title="Sugerir resposta com IA"
        >
          <Wand2 className="h-4 w-4" />
        </Button>
      </div>

      <Button
        onClick={handleSend}
        disabled={!message.trim() || sending || disabled}
        className={cn(
          'rounded-full h-10 w-10 p-0 mb-0.5 transition-all',
          message.trim()
            ? 'bg-[#FFD700] text-black hover:bg-[#FFD700]/90'
            : 'bg-[#2a2a2a] text-gray-500',
        )}
      >
        {sending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Send className="h-5 w-5 ml-0.5" />
        )}
      </Button>
    </div>
  )
}
