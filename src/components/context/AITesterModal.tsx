import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Loader2, Bot } from 'lucide-react'
import { mockAITesing } from '@/services/context'
import { useToast } from '@/hooks/use-toast'

interface AITesterModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contextSummary: string
}

export function AITesterModal({
  open,
  onOpenChange,
  contextSummary,
}: AITesterModalProps) {
  const [question, setQuestion] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleTest = async () => {
    if (!question.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'Por favor, digite uma pergunta para testar.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const result = await mockAITesing(question, contextSummary)
      setResponse(result)
    } catch (error) {
      toast({
        title: 'Erro ao gerar resposta',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-[#1a1a1a] border-[#2a2a2a] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            Testar Contexto da IA
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Simule como a IA responderá às perguntas dos seus clientes com base
            no contexto atual.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Digite uma pergunta de teste
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Quais são os valores da consultoria?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="bg-[#2a2a2a] border-[#3a3a3a] text-white"
                onKeyDown={(e) => e.key === 'Enter' && handleTest()}
              />
              <Button
                onClick={handleTest}
                disabled={loading}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold min-w-[100px]"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Gerar'
                )}
              </Button>
            </div>
          </div>

          {response && (
            <div className="space-y-2 animate-fade-in-up">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Bot className="w-4 h-4 text-yellow-500" />
                Resposta sugerida pela IA
              </label>
              <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-4 text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                {response}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
