import { cn } from '@/lib/utils'
import { format, isToday, isYesterday } from 'date-fns'
import { Check, CheckCheck } from 'lucide-react'
import { WhatsAppMessage } from '@/services/whatsapp'

interface MessageBubbleProps {
  message: WhatsAppMessage
  isGrouped?: boolean
}

export function MessageBubble({ message, isGrouped }: MessageBubbleProps) {
  const isMe = message.origem === 'me'
  const date = new Date(message.timestamp || new Date())

  return (
    <div
      className={cn(
        'flex w-full mb-1',
        isMe ? 'justify-end' : 'justify-start',
        !isGrouped && 'mt-3',
      )}
    >
      <div
        className={cn(
          'relative max-w-[65%] px-4 py-2 rounded-lg text-sm shadow-sm break-words',
          isMe
            ? 'bg-[#FFD700] text-black rounded-tr-none'
            : 'bg-[#1a1a1a] text-white border border-[#2a2a2a] rounded-tl-none',
        )}
      >
        <p className="whitespace-pre-wrap leading-relaxed">
          {message.conteudo}
        </p>

        <div
          className={cn(
            'flex items-center justify-end gap-1 mt-1 text-[10px]',
            isMe ? 'text-black/60' : 'text-gray-400',
          )}
        >
          <span>{format(date, 'HH:mm')}</span>
          {isMe && (
            <span>
              {message.status_leitura ? (
                <CheckCheck className="h-3 w-3 text-blue-600" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
