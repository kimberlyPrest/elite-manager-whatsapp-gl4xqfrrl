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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConversationExample, MessagePair } from '@/services/context'
import { Plus, Trash2, ArrowRight, Save, User, Bot } from 'lucide-react'

interface ExampleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  example?: ConversationExample | null
  onSave: (
    example: Omit<ConversationExample, 'id' | 'createdAt' | 'updatedAt'> & {
      id?: string
    },
  ) => void
}

const CATEGORIES = [
  'Agendamento',
  'Dúvidas',
  'Objeções',
  'CSAT',
  'Suporte',
  'Check-in',
  'Networking',
]

export function ExampleModal({
  open,
  onOpenChange,
  example,
  onSave,
}: ExampleModalProps) {
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [context, setContext] = useState('')
  const [pairs, setPairs] = useState<MessagePair[]>([{ client: '', ai: '' }])

  useEffect(() => {
    if (open) {
      if (example) {
        setTitle(example.title)
        setCategory(example.category)
        setContext(example.context)
        setPairs(
          example.pairs && example.pairs.length > 0
            ? example.pairs
            : [{ client: '', ai: '' }],
        )
      } else {
        // Reset
        setTitle('')
        setCategory('')
        setContext('')
        setPairs([{ client: '', ai: '' }])
      }
      setStep(1)
    }
  }, [open, example])

  const handleAddPair = () => {
    if (pairs.length < 5) {
      setPairs([...pairs, { client: '', ai: '' }])
    }
  }

  const handleRemovePair = (index: number) => {
    if (pairs.length > 1) {
      const newPairs = [...pairs]
      newPairs.splice(index, 1)
      setPairs(newPairs)
    }
  }

  const handlePairChange = (
    index: number,
    field: 'client' | 'ai',
    value: string,
  ) => {
    const newPairs = [...pairs]
    newPairs[index][field] = value
    setPairs(newPairs)
  }

  const handleSave = () => {
    onSave({
      id: example?.id,
      title,
      category,
      context,
      pairs,
    })
    onOpenChange(false)
  }

  const isStep1Valid = title.trim() && category && context.trim()
  const isStep2Valid = pairs.every((p) => p.client.trim() && p.ai.trim())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-[#1a1a1a] border-[#2a2a2a] text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {example ? 'Editar Exemplo' : 'Adicionar Exemplo'}
          </DialogTitle>
          <DialogDescription>
            Passo {step} de 3 -{' '}
            {step === 1
              ? 'Informações Básicas'
              : step === 2
                ? 'Diálogo'
                : 'Revisão'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label>Título do Cenário *</Label>
                <Input
                  placeholder="Ex: Cliente questionando preço alto"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-[#2a2a2a] border-[#3a3a3a] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-[#2a2a2a] border-[#3a3a3a] text-white">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Contexto do Cliente *</Label>
                <Textarea
                  placeholder="Descreva quem é o cliente, seu momento e sentimento..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="bg-[#2a2a2a] border-[#3a3a3a] h-24 text-white"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <p className="text-sm text-gray-400">
                Defina o fluxo da conversa. Use exemplos reais para treinar
                melhor a IA.
              </p>

              {pairs.map((pair, idx) => (
                <div
                  key={idx}
                  className="bg-[#2a2a2a]/50 p-4 rounded-lg border border-[#3a3a3a] space-y-3 relative group"
                >
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-yellow-600 text-white flex items-center justify-center text-xs font-bold shadow-sm z-10">
                    {idx + 1}
                  </div>

                  {pairs.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemovePair(idx)}
                      className="absolute top-2 right-2 h-6 w-6 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}

                  <div className="grid gap-2">
                    <Label className="text-xs text-blue-300 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Mensagem do Cliente *
                    </Label>
                    <Textarea
                      value={pair.client}
                      onChange={(e) =>
                        handlePairChange(idx, 'client', e.target.value)
                      }
                      className="bg-[#1a1a1a] border-[#3a3a3a] text-sm h-16 text-white"
                      placeholder="O que o cliente disse..."
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-xs text-yellow-500 flex items-center gap-1">
                      <Bot className="w-3 h-3" />
                      Resposta Ideal *
                    </Label>
                    <Textarea
                      value={pair.ai}
                      onChange={(e) =>
                        handlePairChange(idx, 'ai', e.target.value)
                      }
                      className="bg-[#1a1a1a] border-[#3a3a3a] text-sm h-16 text-white"
                      placeholder="Como a IA deveria responder..."
                    />
                  </div>
                </div>
              ))}

              {pairs.length < 5 && (
                <Button
                  variant="outline"
                  onClick={handleAddPair}
                  className="w-full border-dashed border-[#3a3a3a] text-gray-400 hover:text-white hover:bg-[#2a2a2a] bg-transparent"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Outro Par de Mensagens
                </Button>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-[#2a2a2a] p-4 rounded-lg border border-[#3a3a3a]">
                <h4 className="font-bold text-white mb-1">{title}</h4>
                <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <span className="bg-yellow-900/40 text-yellow-500 px-2 py-0.5 rounded text-xs">
                    {category}
                  </span>
                </div>
                <p className="text-sm text-gray-300 italic border-l-2 border-yellow-500 pl-3 py-1 bg-[#1a1a1a]/50 mb-4">
                  "{context}"
                </p>

                <div className="space-y-3">
                  {pairs.map((pair, idx) => (
                    <div key={idx} className="space-y-2 text-sm">
                      <div className="bg-[#1a1a1a] p-2 rounded-lg rounded-tl-none border-l-4 border-l-blue-500 border border-[#3a3a3a] ml-4 text-blue-100">
                        <span className="block text-xs text-blue-500 font-bold mb-1">
                          Cliente:
                        </span>
                        {pair.client}
                      </div>
                      <div className="bg-yellow-900/20 p-2 rounded-lg rounded-tr-none border-r-4 border-r-yellow-500 border border-yellow-900/30 mr-4 text-yellow-100 text-right">
                        <span className="block text-xs text-yellow-500 font-bold mb-1">
                          IA:
                        </span>
                        {pair.ai}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between w-full">
          {step > 1 ? (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="border-[#3a3a3a] text-gray-300 bg-transparent hover:bg-[#2a2a2a] hover:text-white"
            >
              Voltar
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
            >
              Cancelar
            </Button>
          )}

          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
              className="bg-yellow-500 text-black hover:bg-yellow-600"
            >
              Próximo
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSave}
              className="bg-green-600 text-white hover:bg-green-700 border-none"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Exemplo
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
