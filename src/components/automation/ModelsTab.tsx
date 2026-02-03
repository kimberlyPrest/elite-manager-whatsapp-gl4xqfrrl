import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  getModels,
  AutomationModel,
  deleteModel,
  createModel,
  updateModel,
} from '@/services/automation'
import { Plus, Search, Copy, Edit, Trash, Play, Calendar } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ModelFormModal } from './ModelFormModal'

interface ModelsTabProps {
  onUseModel: (model: AutomationModel) => void
}

export function ModelsTab({ onUseModel }: ModelsTabProps) {
  const [models, setModels] = useState<AutomationModel[]>([])
  const [search, setSearch] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingModel, setEditingModel] = useState<AutomationModel | null>(null)

  useEffect(() => {
    loadModels()
  }, [])

  const loadModels = async () => {
    try {
      const data = await getModels()
      setModels(data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este modelo?')) {
      try {
        await deleteModel(id)
        setModels(models.filter((m) => m.id !== id))
        toast({ title: 'Modelo excluído' })
      } catch (e) {
        toast({ title: 'Erro ao excluir', variant: 'destructive' })
      }
    }
  }

  const handleDuplicate = async (model: AutomationModel) => {
    try {
      const {
        id,
        created_at,
        vezes_usado,
        ultima_utilizacao,
        taxa_resposta_media,
        ...rest
      } = model
      await createModel({ ...rest, nome: `${model.nome} (Cópia)` })
      loadModels()
      toast({ title: 'Modelo duplicado' })
    } catch (e) {
      toast({ title: 'Erro ao duplicar', variant: 'destructive' })
    }
  }

  const handleSaveModel = async (data: any) => {
    try {
      if (editingModel) {
        await updateModel(editingModel.id, data)
        toast({ title: 'Modelo atualizado' })
      } else {
        await createModel(data)
        toast({ title: 'Modelo criado' })
      }
      setIsFormOpen(false)
      setEditingModel(null)
      loadModels()
    } catch (e) {
      toast({ title: 'Erro ao salvar modelo', variant: 'destructive' })
    }
  }

  const handleExportModels = () => {
    const json = JSON.stringify(models, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'modelos_automacao.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const filteredModels = models.filter((m) =>
    m.nome.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[#1a1a1a] p-4 rounded-xl border border-[#2a2a2a]">
        <div className="flex items-center gap-2 max-w-sm w-full">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar modelos..."
            className="bg-transparent border-none focus-visible:ring-0 px-0 h-auto"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-[#333]"
            onClick={handleExportModels}
          >
            Exportar
          </Button>
          <Button
            className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90"
            onClick={() => {
              setEditingModel(null)
              setIsFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" /> Novo Modelo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModels.map((model) => (
          <Card
            key={model.id}
            className="bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a] transition-all flex flex-col group"
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <Badge
                  variant="secondary"
                  className="bg-[#333] text-gray-300 hover:bg-[#444]"
                >
                  {model.categoria}
                </Badge>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingModel(model)
                      setIsFormOpen(true)
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDuplicate(model)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-400"
                    onClick={() => handleDelete(model.id)}
                  >
                    <Trash className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-lg text-white mt-2">
                {model.nome}
              </CardTitle>
              <p className="text-sm text-gray-400 line-clamp-2">
                {model.descricao}
              </p>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div className="bg-[#111] p-3 rounded text-sm text-gray-400 font-mono line-clamp-3">
                {model.variacoes[0] || 'Sem mensagem configurada'}
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Play className="h-3 w-3" /> {model.vezes_usado} usos
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />{' '}
                  {model.ultima_utilizacao
                    ? format(new Date(model.ultima_utilizacao), 'dd/MM/yy')
                    : 'Nunca'}
                </span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-[#2a2a2a] hover:bg-[#333] text-white"
                onClick={() => onUseModel(model)}
              >
                Usar Este Modelo
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <ModelFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialData={editingModel}
        onSave={handleSaveModel}
      />
    </div>
  )
}
