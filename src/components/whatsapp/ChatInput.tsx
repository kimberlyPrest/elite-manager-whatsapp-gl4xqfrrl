import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Paperclip, Send, Sparkles, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSend: (text: string) => Promise<void>
  onSuggest?: () => void
  disabled?: boolean
  suggestionLoading?: boolean
  inputText?: string
  setInputText?: (text: string) => void
}

export function ChatInput({
  onSend,
  onSuggest,
  disabled,
  suggestionLoading,
  inputText,
  setInputText,
}: ChatInputProps) {
  // Use internal state if props are not provided (backward compatibility)
  const [internalMessage, setInternalMessage] = useState('')
  const message = inputText !== undefined ? inputText : internalMessage
  const setMessage = setInputText || setInternalMessage

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
    // Alt+S for Suggestion
    if (e.altKey && e.key.toLowerCase() === 's' && onSuggest) {
      e.preventDefault()
      onSuggest()
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

  // Focus textarea when text changes externally (e.g. suggestion used)
  useEffect(() => {
    if (message && !disabled) {
      adjustHeight()
      textareaRef.current?.focus()
    }
  }, [message, disabled])

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
          placeholder="Digite uma mensagem... (Alt+S para IA)"
          className="min-h-[24px] max-h-[150px] p-0 border-0 bg-transparent resize-none focus-visible:ring-0 text-white placeholder:text-gray-500 leading-6"
          disabled={disabled}
        />
      </div>

      {onSuggest && (
        <Button
          onClick={onSuggest}
          disabled={disabled || suggestionLoading}
          variant="secondary"
          className={cn(
            'mb-0.5 h-10 px-3 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 text-indigo-300 hover:text-white hover:border-indigo-400 hover:shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all',
            suggestionLoading && 'opacity-80 cursor-wait',
          )}
          title="Sugerir resposta (Alt+S)"
        >
          {suggestionLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="hidden md:inline text-xs">Gerando...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline text-xs font-medium">
                Sugerir
              </span>
            </>
          )}
        </Button>
      )}

      <Button
        onClick={handleSend}
        disabled={!message.trim() || sending || disabled}
        className={cn(
          'rounded-full h-10 w-10 p-0 mb-0.5 transition-all shadow-lg',
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
