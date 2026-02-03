import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Sparkles, Save, Loader2, Info } from 'lucide-react'
import {
  fetchContextSections,
  saveContextSection,
  mockAISummarize,
} from '@/services/context'
import { useToast } from '@/hooks/use-toast'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function GeneralContextForm({ onUpdate }: { onUpdate: () => void }) {
  const [sections, setSections] = useState({
    institucional: '',
    tom_de_voz: '',
    produtos_servicos: '',
    exemplos_conversa: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [summarizing, setSummarizing] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const data = await fetchContextSections()
      const newSections = { ...sections }
      data.forEach((item) => {
        if (item.secao in newSections) {
          // @ts-expect-error key access
          newSections[item.secao] = item.conteudo
        }
      })
      setSections(newSections)
    } catch (error) {
      console.error('Error loading context', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (key: string, value: string) => {
    setSections((prev) => ({ ...prev, [key]: value }))
  }

  const handlePaste = async (key: string, content: string) => {
    if (content.length > 500) {
      toast({
        title: 'Texto longo detectado',
        description: 'Deseja que a IA resuma este conteúdo?',
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSummarize(key, content)}
            className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black"
          >
            Resumir
          </Button>
        ),
        duration: 8000,
      })
    }
  }

  const handleSummarize = async (key: string, text: string) => {
    setSummarizing(key)
    try {
      const summary = await mockAISummarize(text)
      handleChange(key, summary)
      toast({
        title: 'Resumo concluído',
        description: 'O texto foi otimizado pela IA.',
      })
    } catch (error) {
      toast({ title: 'Erro ao resumir', variant: 'destructive' })
    } finally {
      setSummarizing(null)
    }
  }

  const handleSave = async () => {
    // Validation
    if (!sections.institucional.trim() || !sections.produtos_servicos.trim()) {
      toast({
        title: 'Atenção',
        description:
          'Recomendamos preencher Institucional e Produtos para melhores resultados.',
        className: 'bg-yellow-900 border-yellow-800 text-white',
      })
    }

    setSaving(true)
    try {
      await Promise.all(
        Object.entries(sections).map(([key, value]) =>
          saveContextSection(key, value),
        ),
      )
      toast({
        title: 'Contexto salvo',
        description: 'As informações foram atualizadas com sucesso.',
        className: 'bg-green-900 border-green-800 text-white',
      })
      onUpdate()
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading)
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-[#1a1a1a] animate-pulse rounded-lg" />
        ))}
      </div>
    )

  return (
    <div className="space-y-6">
      <Card className="bg-[#1a1a1a] border-[#2a2a2a] shadow-lg">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            Informações Institucionais
            {summarizing === 'institucional' && (
              <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
            )}
          </CardTitle>
          <CardDescription>
            Descreva a história, missão e valores da empresa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={sections.institucional}
            onChange={(e) => handleChange('institucional', e.target.value)}
            onPaste={(e) =>
              handlePaste('institucional', e.clipboardData.getData('text'))
            }
            placeholder="Ex: A Elite Manager é uma consultoria especializada em..."
            className="bg-[#2a2a2a] border-[#3a3a3a] text-white min-h-[150px] focus-visible:ring-yellow-500/50"
          />
        </CardContent>
      </Card>

      <Card className="bg-[#1a1a1a] border-[#2a2a2a] shadow-lg">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            Produtos e Serviços
            {summarizing === 'produtos_servicos' && (
              <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
            )}
          </CardTitle>
          <CardDescription>
            Detalhes sobre o que a empresa oferece (preços, diferenciais).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={sections.produtos_servicos}
            onChange={(e) => handleChange('produtos_servicos', e.target.value)}
            onPaste={(e) =>
              handlePaste('produtos_servicos', e.clipboardData.getData('text'))
            }
            placeholder="Liste os principais produtos e suas características..."
            className="bg-[#2a2a2a] border-[#3a3a3a] text-white min-h-[150px] focus-visible:ring-yellow-500/50"
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[#1a1a1a] border-[#2a2a2a] shadow-lg">
          <CardHeader>
            <CardTitle className="text-white">Tom de Voz</CardTitle>
            <CardDescription>Como a IA deve se comunicar.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={sections.tom_de_voz}
              onChange={(e) => handleChange('tom_de_voz', e.target.value)}
              placeholder="Ex: Formal, empático, direto, usar emojis..."
              className="bg-[#2a2a2a] border-[#3a3a3a] text-white min-h-[120px] focus-visible:ring-yellow-500/50"
            />
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-[#2a2a2a] shadow-lg">
          <CardHeader>
            <CardTitle className="text-white">Exemplos de Conversa</CardTitle>
            <CardDescription>
              Pares de pergunta/resposta ideais.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={sections.exemplos_conversa}
              onChange={(e) =>
                handleChange('exemplos_conversa', e.target.value)
              }
              placeholder="Cliente: Qual o preço?&#10;Atendente: Nossos planos começam em..."
              className="bg-[#2a2a2a] border-[#3a3a3a] text-white min-h-[120px] focus-visible:ring-yellow-500/50"
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold w-full md:w-auto px-8"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
