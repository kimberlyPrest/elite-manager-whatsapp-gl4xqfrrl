import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Sparkles,
  Copy,
  RefreshCw,
  Check,
  Edit2,
  Zap,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { SuggestionResponse } from '@/services/ai'

interface SuggestionModalProps {
  isOpen: boolean
  onClose: () => void
  data: SuggestionResponse | null
  loading: boolean
  onUse: (text: string, wasEdited: boolean) => void
  onRegenerate: () => void
}

export function SuggestionModal({
  isOpen,
  onClose,
  data,
  loading,
  onUse,
  onRegenerate,
}: SuggestionModalProps) {
  const [editedText, setEditedText] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (data?.suggestion) {
      setEditedText(data.suggestion)
      setIsEditing(false)
    }
  }, [data])

  const handleCopy = () => {
    navigator.clipboard.writeText(editedText)
    setCopied(true)
    toast({
      title: 'Copiado',
      description: 'Sugestão copiada para a área de transferência.',
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleUse = () => {
    const wasEdited = editedText !== data?.suggestion
    onUse(editedText, wasEdited)
    onClose()
  }

  if (!isOpen && !loading) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] bg-[#1a1a1a] border-[#2a2a2a] text-white p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2 text-[#FFD700]">
            <Sparkles className="h-5 w-5" />
            Sugestão da IA
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Revise e personalize a resposta gerada pelo Gemini.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
              <div className="relative">
                <div className="absolute inset-0 bg-[#FFD700] blur-xl opacity-20 animate-pulse rounded-full" />
                <Sparkles className="h-12 w-12 text-[#FFD700] animate-bounce relative z-10" />
              </div>
              <div>
                <p className="text-white font-medium">Analisando contexto...</p>
                <p className="text-sm text-gray-500">
                  Lendo histórico, produtos e perfil do cliente.
                </p>
              </div>
            </div>
          ) : data ? (
            <>
              <div className="relative group">
                {isEditing ? (
                  <Textarea
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    className="min-h-[200px] bg-[#111] border-[#333] text-base leading-relaxed p-4 resize-none focus-visible:ring-[#FFD700]/50"
                    autoFocus
                  />
                ) : (
                  <div className="min-h-[200px] bg-[#111] border border-[#2a2a2a] rounded-md p-4 text-gray-100 whitespace-pre-wrap leading-relaxed relative">
                    {editedText}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditing(true)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#2a2a2a] hover:bg-[#333] text-xs h-7"
                    >
                      <Edit2 className="h-3 w-3 mr-1" /> Editar
                    </Button>
                  </div>
                )}
              </div>

              <Accordion
                type="single"
                collapsible
                className="w-full border border-[#2a2a2a] rounded-lg bg-[#111]/50"
              >
                <AccordionItem value="context" className="border-0">
                  <AccordionTrigger className="px-4 py-2 text-xs text-gray-500 hover:text-gray-300">
                    <span className="flex items-center gap-2">
                      <AlertCircle className="h-3 w-3" /> Ver Contexto Utilizado
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
                      <div>
                        <span className="font-semibold text-gray-300 block mb-1">
                          Cliente
                        </span>
                        {data.contextUsed.clientName}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-300 block mb-1">
                          Produtos
                        </span>
                        {data.contextUsed.products}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-300 block mb-1">
                          Configuração
                        </span>
                        Temp: {data.contextUsed.temperature} |{' '}
                        {data.contextUsed.lengthPreference}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-300 block mb-1">
                          Tags
                        </span>
                        {data.contextUsed.tags}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </>
          ) : null}
        </div>

        <DialogFooter className="p-6 pt-2 bg-[#1a1a1a] border-t border-[#2a2a2a] gap-2 sm:gap-0">
          {!loading && (
            <>
              <div className="flex items-center mr-auto gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRegenerate}
                  className="text-gray-400 hover:text-white"
                >
                  <RefreshCw className="h-4 w-4 mr-2" /> Tentar Novamente
                </Button>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  className="border-[#333] bg-transparent text-gray-300 hover:bg-[#2a2a2a] hover:text-white flex-1 sm:flex-none"
                >
                  {copied ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  Copiar
                </Button>
                <Button
                  onClick={handleUse}
                  className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 flex-1 sm:flex-none font-semibold"
                >
                  <Zap className="h-4 w-4 mr-2 fill-current" />
                  Usar Resposta
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
