import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, Edit2, Search, Zap, Loader2 } from 'lucide-react'
import {
  fetchTemplates,
  saveTemplate,
  deleteTemplate,
  ResponseTemplate,
} from '@/services/context'
import { useToast } from '@/hooks/use-toast'

const CATEGORIES = [
  { id: 'agendamento', label: 'Agendamento', color: '#3b82f6' },
  { id: 'csat', label: 'CSAT', color: '#10b981' },
  { id: 'follow-up', label: 'Follow-up', color: '#fbbf24' },
  { id: 'institucional', label: 'Institucional', color: '#9333ea' },
  { id: 'vendas', label: 'Vendas', color: '#f97316' },
  { id: 'suporte', label: 'Suporte', color: '#6b7280' },
]

export function TemplateManager({ onUpdate }: { onUpdate: () => void }) {
  const [templates, setTemplates] = useState<ResponseTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<
    Partial<ResponseTemplate>
  >({})
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const data = await fetchTemplates()
      setTemplates(data)
    } catch (error) {
      console.error('Error loading templates', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (template?: ResponseTemplate) => {
    if (template) {
      setEditingTemplate(template)
    } else {
      setEditingTemplate({
        ativo: true,
        categoria: 'institucional',
        conteudo: '',
        nome: '',
        atalho: '',
      })
    }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!editingTemplate.nome || !editingTemplate.conteudo) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Nome e Conteúdo são obrigatórios.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      // @ts-expect-error partial type match
      await saveTemplate(editingTemplate)
      toast({
        title: 'Sucesso',
        description: 'Template salvo com sucesso.',
        className: 'bg-green-900 border-green-800 text-white',
      })
      setIsModalOpen(false)
      loadTemplates()
      onUpdate()
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return

    try {
      await deleteTemplate(id)
      toast({
        title: 'Template removido',
        description: 'O template foi excluído com sucesso.',
      })
      loadTemplates()
      onUpdate()
    } catch (error) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  const filteredTemplates = templates.filter(
    (t) =>
      t.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.atalho?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.conteudo.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading)
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-[#1a1a1a] animate-pulse rounded-lg" />
        ))}
      </div>
    )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Buscar templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-[#1a1a1a] border-[#2a2a2a] text-white focus-visible:ring-yellow-500/50"
          />
        </div>
        <Button
          onClick={() => handleOpenModal()}
          className="w-full md:w-auto bg-yellow-500 hover:bg-yellow-600 text-black"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => {
          const category = CATEGORIES.find((c) => c.id === template.categoria)
          return (
            <Card
              key={template.id}
              className="bg-[#1a1a1a] border-[#2a2a2a] shadow-sm hover:border-yellow-500/30 transition-colors group"
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <Badge
                    className="text-white border-none"
                    style={{ backgroundColor: category?.color || '#6b7280' }}
                  >
                    {category?.label || template.categoria}
                  </Badge>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-gray-400 hover:text-white"
                      onClick={() => handleOpenModal(template)}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-gray-400 hover:text-red-500"
                      onClick={() => handleDelete(template.id!)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-1">
                    {template.nome}
                  </h4>
                  {template.atalho && (
                    <span className="text-xs font-mono text-yellow-500 bg-yellow-900/20 px-1.5 py-0.5 rounded">
                      /{template.atalho}
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-400 line-clamp-3">
                  {template.conteudo}
                </p>
              </CardContent>
            </Card>
          )
        })}

        {filteredTemplates.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500">
            Nenhum template encontrado. Crie o primeiro para agilizar seu
            atendimento.
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate.id ? 'Editar Template' : 'Novo Template'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do Template</label>
              <Input
                value={editingTemplate.nome || ''}
                onChange={(e) =>
                  setEditingTemplate({
                    ...editingTemplate,
                    nome: e.target.value,
                  })
                }
                className="bg-[#2a2a2a] border-[#3a3a3a]"
                placeholder="Ex: Saudação Inicial"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Atalho (opcional)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    /
                  </span>
                  <Input
                    value={editingTemplate.atalho || ''}
                    onChange={(e) =>
                      setEditingTemplate({
                        ...editingTemplate,
                        atalho: e.target.value.replace(/[^a-zA-Z0-9-]/g, ''),
                      })
                    }
                    className="bg-[#2a2a2a] border-[#3a3a3a] pl-6"
                    placeholder="saudacao"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Categoria</label>
                <Select
                  value={editingTemplate.categoria || 'institucional'}
                  onValueChange={(v) =>
                    setEditingTemplate({ ...editingTemplate, categoria: v })
                  }
                >
                  <SelectTrigger className="bg-[#2a2a2a] border-[#3a3a3a]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Conteúdo da Mensagem
              </label>
              <Textarea
                value={editingTemplate.conteudo || ''}
                onChange={(e) =>
                  setEditingTemplate({
                    ...editingTemplate,
                    conteudo: e.target.value,
                  })
                }
                className="bg-[#2a2a2a] border-[#3a3a3a] min-h-[120px]"
                placeholder="Olá! Tudo bem? Como posso ajudar..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
              className="text-gray-400"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Salvar Template'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
