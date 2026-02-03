import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  X,
  User,
  Phone,
  Mail,
  FileText,
  Tag,
  Check,
  ExternalLink,
} from 'lucide-react'
import { WhatsAppConversation } from '@/services/whatsapp'
import { getClientProducts } from '@/services/products'
import { supabase } from '@/lib/supabase/client'
import { Link } from 'react-router-dom'
import { toast } from '@/hooks/use-toast'

interface ProfileSidebarProps {
  conversation: WhatsAppConversation
  onClose: () => void
}

export function ProfileSidebar({ conversation, onClose }: ProfileSidebarProps) {
  const [products, setProducts] = useState<any[]>([])
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    if (conversation.cliente_id) {
      // Fetch products
      getClientProducts(conversation.cliente_id).then(setProducts)

      // Fetch current notes from client
      supabase
        .from('clientes')
        .select('observacoes')
        .eq('id', conversation.cliente_id)
        .single()
        .then(({ data }) => setNotes(data?.observacoes || ''))
    }
  }, [conversation.id])

  const handleSaveNotes = async () => {
    if (!conversation.cliente_id) return
    setSavingNotes(true)
    try {
      await supabase
        .from('clientes')
        .update({ observacoes: notes })
        .eq('id', conversation.cliente_id)
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 2000)
    } catch (e) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    } finally {
      setSavingNotes(false)
    }
  }

  const handlePriorityChange = async (val: string) => {
    try {
      await supabase
        .from('conversas_whatsapp')
        .update({ prioridade: val })
        .eq('id', conversation.id)
      toast({ title: 'Prioridade atualizada' })
    } catch (e) {
      toast({ title: 'Erro', variant: 'destructive' })
    }
  }

  return (
    <div className="h-full bg-[#111111] border-l border-[#2a2a2a] flex flex-col w-full md:w-[280px]">
      <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between">
        <h3 className="font-semibold text-white">Perfil do Cliente</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-gray-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Identity */}
        <div className="flex flex-col items-center text-center">
          <div className="h-20 w-20 rounded-full bg-[#2a2a2a] flex items-center justify-center mb-3">
            <img
              src={`https://img.usecurling.com/ppl/medium?gender=male&seed=${conversation.cliente_id}`}
              alt="Avatar"
              className="h-full w-full rounded-full object-cover opacity-80"
            />
          </div>
          <h2 className="text-lg font-bold text-white">
            {conversation.cliente?.nome_completo || 'Desconhecido'}
          </h2>
          <p className="text-sm text-gray-500">
            {conversation.numero_whatsapp}
          </p>

          {conversation.cliente_id && (
            <Link to={`/clients/${conversation.cliente_id}`} className="mt-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs border-[#2a2a2a] text-[#FFD700] hover:text-[#FFD700] bg-transparent"
              >
                Ver Ficha Completa <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          )}
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase">
            Prioridade
          </label>
          <Select
            defaultValue={conversation.prioridade || 'Médio'}
            onValueChange={handlePriorityChange}
          >
            <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Crítico">Crítico</SelectItem>
              <SelectItem value="Alto">Alto</SelectItem>
              <SelectItem value="Médio">Médio</SelectItem>
              <SelectItem value="Baixo">Baixo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-2">
            <FileText className="h-3 w-3" /> Produtos Contratados
          </label>
          {products.length === 0 ? (
            <p className="text-xs text-gray-500 italic">
              Nenhum produto encontrado.
            </p>
          ) : (
            <div className="space-y-2">
              {products.map((p) => (
                <div
                  key={p.id}
                  className="bg-[#1a1a1a] p-2 rounded border border-[#2a2a2a]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">
                      {p.produto}
                    </span>
                    <Badge variant="outline" className="text-[10px] h-4 px-1">
                      {p.status}
                    </Badge>
                  </div>
                  {p.produto !== 'Venda' && (
                    <div className="text-[10px] text-gray-400">
                      Calls: {p.num_calls_realizadas || 0}/
                      {p.num_calls_total || 0}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-500 uppercase">
              Observações Rápidas
            </label>
            {savedSuccess && (
              <span className="text-[10px] text-green-500 flex items-center gap-1">
                <Check className="h-3 w-3" /> Salvo
              </span>
            )}
          </div>
          <Textarea
            className="bg-[#1a1a1a] border-[#2a2a2a] text-sm min-h-[120px] resize-none"
            placeholder="Anote algo sobre o cliente..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleSaveNotes}
          />
        </div>
      </div>
    </div>
  )
}
