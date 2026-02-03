import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AutomationModel } from '@/services/automation'

interface ModelFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: AutomationModel | null
  onSave: (data: any) => void
}

export function ModelFormModal({
  open,
  onOpenChange,
  initialData,
  onSave,
}: ModelFormModalProps) {
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    categoria: 'Geral',
    variacoes: [''],
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        nome: initialData.nome,
        descricao: initialData.descricao,
        categoria: initialData.categoria,
        variacoes: initialData.variacoes.length ? initialData.variacoes : [''],
      })
    } else {
      setFormData({
        nome: '',
        descricao: '',
        categoria: 'Geral',
        variacoes: [''],
      })
    }
  }, [initialData, open])

  const handleSubmit = () => {
    onSave({
      ...formData,
      // Default values for other fields not in this simple form
      filtros: initialData?.filtros || {},
      intervalo_min_segundos: initialData?.intervalo_min_segundos || 30,
      intervalo_max_segundos: initialData?.intervalo_max_segundos || 300,
      horario_comercial: initialData?.horario_comercial ?? true,
      tipo_selecao: 'Filtros',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#111] border-[#2a2a2a] text-white">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Editar Modelo' : 'Novo Modelo'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nome do Modelo</Label>
            <Input
              value={formData.nome}
              onChange={(e) =>
                setFormData({ ...formData, nome: e.target.value })
              }
              className="bg-[#1a1a1a] border-[#333]"
            />
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={formData.categoria}
              onValueChange={(v) => setFormData({ ...formData, categoria: v })}
            >
              <SelectTrigger className="bg-[#1a1a1a] border-[#333]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Geral">Geral</SelectItem>
                <SelectItem value="Follow-up">Follow-up</SelectItem>
                <SelectItem value="Reengajamento">Reengajamento</SelectItem>
                <SelectItem value="CSAT">CSAT</SelectItem>
                <SelectItem value="Vendas">Vendas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={formData.descricao}
              onChange={(e) =>
                setFormData({ ...formData, descricao: e.target.value })
              }
              className="bg-[#1a1a1a] border-[#333]"
            />
          </div>
          <div className="space-y-2">
            <Label>Mensagem Padrão</Label>
            <Textarea
              value={formData.variacoes[0]}
              onChange={(e) =>
                setFormData({ ...formData, variacoes: [e.target.value] })
              }
              className="bg-[#1a1a1a] border-[#333] min-h-[100px]"
              placeholder="Olá {{primeiro_nome}}..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-[#333]"
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="bg-[#FFD700] text-black">
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
