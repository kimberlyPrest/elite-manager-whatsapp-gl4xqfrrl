import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Download,
  Upload,
  Lightbulb,
  MoreVertical,
  BookOpen,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ExampleModal } from './examples/ExampleModal'
import {
  fetchContextJSON,
  saveContextJSON,
  ConversationExample,
} from '@/services/context'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const CATEGORY_COLORS: Record<string, string> = {
  Agendamento: '#3b82f6',
  Dúvidas: '#10b981',
  Objeções: '#f97316',
  CSAT: '#fbbf24',
  Suporte: '#6b7280',
  'Check-in': '#9333ea',
  Networking: '#ec4899',
}

export function ConversationExamples({ onUpdate }: { onUpdate: () => void }) {
  const [examples, setExamples] = useState<ConversationExample[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingExample, setEditingExample] =
    useState<ConversationExample | null>(null)

  const { toast } = useToast()

  useEffect(() => {
    loadExamples()
  }, [])

  const loadExamples = async () => {
    try {
      setLoading(true)
      const data = await fetchContextJSON<ConversationExample[]>(
        'exemplos_conversas',
        [],
      )
      setExamples(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading examples', error)
      toast({
        title: 'Erro ao carregar exemplos',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const saveExamples = async (newExamples: ConversationExample[]) => {
    try {
      await saveContextJSON('exemplos_conversas', newExamples)
      setExamples(newExamples)
      onUpdate()
      toast({
        title: 'Exemplos atualizados',
        description: 'As alterações foram salvas com sucesso.',
        className: 'bg-green-900 border-green-800 text-white',
      })
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        variant: 'destructive',
      })
    }
  }

  const handleSaveExample = (exampleData: any) => {
    let newExamples = [...examples]
    const timestamp = Date.now()

    if (exampleData.id) {
      // Edit
      newExamples = newExamples.map((ex) =>
        ex.id === exampleData.id
          ? { ...ex, ...exampleData, updatedAt: timestamp }
          : ex,
      )
    } else {
      // Create
      const newExample: ConversationExample = {
        ...exampleData,
        id: crypto.randomUUID(),
        createdAt: timestamp,
        updatedAt: timestamp,
      }
      newExamples.push(newExample)
    }
    saveExamples(newExamples)
  }

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este exemplo?')) {
      const newExamples = examples.filter((ex) => ex.id !== id)
      saveExamples(newExamples)
    }
  }

  const handleDuplicate = (example: ConversationExample) => {
    const duplicated: ConversationExample = {
      ...example,
      id: crypto.randomUUID(),
      title: `${example.title} (Cópia)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    saveExamples([...examples, duplicated])
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(examples, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `exemplos_conversa_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string)
          if (Array.isArray(json)) {
            // Check structure roughly
            const valid = json.every((item) => item.title && item.pairs)
            if (valid) {
              if (
                confirm(
                  `Deseja importar ${json.length} exemplos? Eles serão adicionados aos atuais.`,
                )
              ) {
                const imported = json.map((ex: any) => ({
                  ...ex,
                  id: crypto.randomUUID(),
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                }))
                saveExamples([...examples, ...imported])
              }
            } else {
              throw new Error('Formato inválido')
            }
          } else {
            throw new Error('Não é um array')
          }
        } catch (err) {
          toast({
            title: 'Erro na importação',
            description: 'Arquivo inválido.',
            variant: 'destructive',
          })
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const filteredExamples = examples.filter((ex) => {
    const matchesSearch =
      ex.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ex.context.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory
      ? ex.category === selectedCategory
      : true
    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set(examples.map((ex) => ex.category)))

  if (loading)
    return <div className="h-40 animate-pulse bg-[#1a1a1a] rounded-lg" />

  return (
    <div className="space-y-6">
      <Card className="bg-yellow-900/10 border-yellow-500/20 shadow-none">
        <CardContent className="flex items-start gap-4 p-4">
          <div className="bg-yellow-500/10 p-2 rounded-full hidden md:block">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <h3 className="font-semibold text-white mb-1">Few-Shot Learning</h3>
            <p className="text-sm text-gray-400">
              Fornecer exemplos de alta qualidade é a melhor maneira de treinar
              a IA. Recomendamos entre{' '}
              <span className="text-yellow-500 font-bold">5 a 10 exemplos</span>{' '}
              variados para cobrir a maioria dos cenários de atendimento.
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 bg-[#1a1a1a] px-3 py-1 rounded border border-[#3a3a3a]">
            <span className="text-2xl font-bold text-white">
              {examples.length}
            </span>
            <span className="text-xs text-gray-500 uppercase font-semibold">
              Exemplos
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex flex-1 gap-2 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Buscar cenários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-[#1a1a1a] border-[#2a2a2a] text-white focus-visible:ring-yellow-500/50"
            />
          </div>
          {categories.length > 0 && (
            <div className="hidden md:flex gap-1 overflow-x-auto pb-1 max-w-[400px]">
              <Badge
                variant="outline"
                className={cn(
                  'cursor-pointer hover:bg-yellow-500 hover:text-black transition-colors border-[#2a2a2a] text-gray-400',
                  !selectedCategory &&
                    'bg-yellow-500 text-black border-yellow-500',
                )}
                onClick={() => setSelectedCategory(null)}
              >
                Todos
              </Badge>
              {categories.map((cat) => (
                <Badge
                  key={cat}
                  variant="outline"
                  className={cn(
                    'cursor-pointer hover:bg-yellow-500 hover:text-black transition-colors border-[#2a2a2a] text-gray-400 whitespace-nowrap',
                    selectedCategory === cat &&
                      'bg-yellow-500 text-black border-yellow-500',
                  )}
                  style={
                    selectedCategory === cat
                      ? {
                          backgroundColor: CATEGORY_COLORS[cat] || '#fbbf24',
                          color: 'black',
                          borderColor: 'transparent',
                        }
                      : {}
                  }
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            className="bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:text-white"
            onClick={handleImport}
            title="Importar JSON"
          >
            <Upload className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Importar</span>
          </Button>
          <Button
            variant="outline"
            className="bg-[#1a1a1a] border-[#2a2a2a] text-gray-400 hover:text-white"
            onClick={handleExport}
            title="Exportar JSON"
          >
            <Download className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">Exportar</span>
          </Button>
          <Button
            onClick={() => {
              setEditingExample(null)
              setIsModalOpen(true)
            }}
            className="bg-yellow-500 hover:bg-yellow-600 text-black w-full md:w-auto font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Exemplo
          </Button>
        </div>
      </div>

      {filteredExamples.length === 0 ? (
        <div className="text-center py-16 border border-[#2a2a2a] rounded-lg bg-[#1a1a1a] flex flex-col items-center">
          <div className="bg-[#2a2a2a] p-4 rounded-full mb-4">
            <BookOpen className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">
            Nenhum exemplo cadastrado
          </h3>
          <p className="text-gray-400 max-w-sm mb-6">
            Comece adicionando conversas reais ou ideais para treinar a IA com
            sua metodologia de vendas.
          </p>
          <Button
            onClick={() => {
              setEditingExample(null)
              setIsModalOpen(true)
            }}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeiro Exemplo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExamples.map((example) => (
            <Card
              key={example.id}
              className="bg-[#1a1a1a] border-[#2a2a2a] group hover:border-yellow-500/30 transition-all flex flex-col h-full"
            >
              <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-2 pr-2">
                  <Badge
                    variant="outline"
                    className="text-xs border-none text-black"
                    style={{
                      backgroundColor:
                        CATEGORY_COLORS[example.category] || '#fbbf24',
                    }}
                  >
                    {example.category}
                  </Badge>
                  <CardTitle
                    className="text-base text-white line-clamp-1"
                    title={example.title}
                  >
                    {example.title}
                  </CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-white"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                  >
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingExample(example)
                        setIsModalOpen(true)
                      }}
                    >
                      <Edit2 className="w-4 h-4 mr-2" /> Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicate(example)}>
                      <Copy className="w-4 h-4 mr-2" /> Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-500 focus:text-red-500"
                      onClick={() => handleDelete(example.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="p-4 pt-2 flex-1 flex flex-col">
                <p className="text-xs text-gray-500 mb-3 line-clamp-2 min-h-[2.5em]">
                  {example.context}
                </p>
                <div className="bg-[#2a2a2a]/50 p-3 rounded text-xs space-y-3 border border-[#3a3a3a] mt-auto">
                  <div className="flex gap-2 border-l-2 border-blue-500 pl-2">
                    <span className="font-bold text-blue-400 shrink-0">
                      Cliente:
                    </span>
                    <span className="text-gray-300 line-clamp-2">
                      {example.pairs[0]?.client}
                    </span>
                  </div>
                  <div className="flex gap-2 border-l-2 border-yellow-500 pl-2">
                    <span className="font-bold text-yellow-500 shrink-0">
                      IA:
                    </span>
                    <span className="text-gray-300 line-clamp-2">
                      {example.pairs[0]?.ai}
                    </span>
                  </div>
                  {example.pairs.length > 1 && (
                    <div className="pt-2 text-[10px] text-gray-500 text-center border-t border-[#3a3a3a] mt-1">
                      + {example.pairs.length - 1} outros pares de mensagem
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ExampleModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        example={editingExample}
        onSave={handleSaveExample}
      />
    </div>
  )
}
