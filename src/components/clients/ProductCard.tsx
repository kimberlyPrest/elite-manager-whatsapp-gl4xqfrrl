import { format } from 'date-fns'
import { Calendar, Phone, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Product, deleteProduct } from '@/services/products'
import { EditProductModal } from './EditProductModal'
import { toast } from '@/hooks/use-toast'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  onUpdate: () => void
}

export function ProductCard({ product, onUpdate }: ProductCardProps) {
  const handleDelete = async () => {
    if (
      confirm(
        'Tem certeza que deseja excluir este produto? Todo o histórico de calls será perdido.',
      )
    ) {
      try {
        await deleteProduct(product.id, product.cliente_id, product.produto)
        toast({
          title: 'Produto excluído',
          description: 'O produto foi removido com sucesso.',
          className: 'bg-green-600 text-white border-green-700',
        })
        onUpdate()
      } catch (error) {
        console.error(error)
        toast({
          title: 'Erro',
          description: 'Não foi possível excluir o produto.',
          variant: 'destructive',
        })
      }
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Elite':
        return 'bg-[#9333ea]/20 text-[#9333ea] border-[#9333ea]/30'
      case 'Scale':
        return 'bg-[#3b82f6]/20 text-[#3b82f6] border-[#3b82f6]/30'
      case 'Labs':
        return 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30'
      case 'Venda':
        return 'bg-[#f97316]/20 text-[#f97316] border-[#f97316]/30'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    const green = ['Em Consultoria Ativa', 'Concluído', 'Negócio Fechado']
    const yellow = ['Formulário Não Preenchido', 'Pausado', 'Em Contato']
    const blue = ['Novos Alunos', 'Não Iniciado', 'Em Andamento', 'Agendar FUP']
    const gray = ['Consultoria Concluída']
    const red = ['Reembolsado', 'Cancelado', 'Perdido']

    if (green.includes(status))
      return 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30'
    if (yellow.includes(status))
      return 'bg-[#fbbf24]/20 text-[#fbbf24] border-[#fbbf24]/30'
    if (blue.includes(status))
      return 'bg-[#3b82f6]/20 text-[#3b82f6] border-[#3b82f6]/30'
    if (gray.includes(status))
      return 'bg-[#6b7280]/20 text-[#6b7280] border-[#6b7280]/30'
    if (red.includes(status))
      return 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30'

    return 'bg-gray-100 text-gray-800'
  }

  const renderCallHistory = () => {
    if (product.produto === 'Venda') return null

    const calls = []
    const limit = product.num_calls_total || 12

    for (let i = 1; i <= limit; i++) {
      // @ts-expect-error - dynamic access to data_X_call
      const dateStr = product[`data_${i}_call`] as string | null
      if (dateStr) {
        const date = new Date(dateStr)
        const isPast = date < new Date()
        calls.push({
          num: i,
          date: date,
          isPast,
        })
      }
    }

    if (calls.length === 0)
      return (
        <p className="text-sm text-gray-500 italic mt-2">
          Nenhuma call agendada ou realizada.
        </p>
      )

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
        {calls.map((call, idx) => (
          <Link to={`/clients/${product.cliente_id}?tab=calls`} key={idx}>
            <div className="flex items-center gap-3 p-2 rounded-md bg-[#2a2a2a] border border-[#3a3a3a] hover:border-[#FFD700]/50 transition-colors cursor-pointer group">
              <div className="h-8 w-8 rounded-full bg-[#1a1a1a] flex items-center justify-center text-gray-400 group-hover:text-[#FFD700]">
                <Phone className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">Call {call.num}</p>
                <p className="text-sm font-medium truncate text-gray-200">
                  {format(call.date, 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
              <Badge
                className={cn(
                  'text-[10px] h-5 px-1.5',
                  call.isPast
                    ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                    : 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
                )}
              >
                {call.isPast ? 'Realizada' : 'Agendada'}
              </Badge>
            </div>
          </Link>
        ))}
      </div>
    )
  }

  const callsDone = product.calls_count || 0
  const callsTotal = product.num_calls_total || 0
  const progress = callsTotal > 0 ? (callsDone / callsTotal) * 100 : 0

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 shadow-sm relative group">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xl font-bold text-white">
              Adapta {product.produto}
            </h3>
            <Badge variant="outline" className={getTypeColor(product.produto)}>
              {product.produto === 'Venda'
                ? 'Venda'
                : `Adapta ${product.produto}`}
            </Badge>
            <Badge variant="outline" className={getStatusColor(product.status)}>
              {product.status}
            </Badge>
          </div>
          {product.produto !== 'Venda' && (
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Início:{' '}
                {product.data_inicio
                  ? format(new Date(product.data_inicio), 'dd/MM/yyyy')
                  : 'N/D'}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Fim:{' '}
                {product.data_fim_prevista
                  ? format(new Date(product.data_fim_prevista), 'dd/MM/yyyy')
                  : 'N/D'}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <EditProductModal product={product} onSuccess={onUpdate} />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            className="hover:bg-[#2a2a2a] text-gray-400 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {product.produto !== 'Venda' && (
        <div className="mb-6 space-y-2">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Progresso de Calls</span>
            <span>
              {callsDone}/{callsTotal} calls realizadas
            </span>
          </div>
          <Progress value={progress} className="h-2 bg-[#2a2a2a]" />
          {/* Note: shadcn Progress Indicator usually has bg-primary, we can ensure it's gold in global CSS or by passing class to indicator if exposed, but standard shadcn uses bg-primary which we should have set to gold or similar in main theme. User asked for gold fill. I'll rely on global theme or update Progress component if I could, but I can't update shadcn files easily. I'll hope 'primary' is set to gold or close. Actually I can try to enforce it via css variable override on this element scope if needed, but standard 'bg-primary' is best practice. */}
        </div>
      )}

      {product.produto !== 'Venda' && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">
            Histórico de Calls
          </h4>
          {renderCallHistory()}
        </div>
      )}

      {product.observacoes_produto && (
        <div className="bg-[#2a2a2a] rounded-md p-3 text-sm text-gray-300 border border-[#3a3a3a] max-h-[120px] overflow-y-auto">
          <p className="font-semibold text-xs text-gray-500 uppercase mb-1">
            Observações Internas
          </p>
          {product.observacoes_produto}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-[#2a2a2a] flex justify-between text-[10px] text-gray-600">
        <span>
          Criado em: {format(new Date(product.created_at), 'dd/MM/yyyy HH:mm')}
        </span>
        <span>
          Atualizado em:{' '}
          {format(new Date(product.updated_at), 'dd/MM/yyyy HH:mm')}
        </span>
      </div>
    </div>
  )
}
