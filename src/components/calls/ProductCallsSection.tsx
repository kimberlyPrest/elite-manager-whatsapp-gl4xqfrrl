import { Call } from '@/services/calls'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Calendar, Plus } from 'lucide-react'
import { CallCard } from './CallCard'
import { ScheduleCallModal } from './ScheduleCallModal'
import { Badge } from '@/components/ui/badge'

interface ProductCallsSectionProps {
  productName: string
  productId: string
  clientId: string
  clientName: string
  clientPhone: string
  calls: Call[]
  totalCalls: number
  callsDone: number
  onUpdate: () => void
}

export function ProductCallsSection({
  productName,
  productId,
  clientId,
  clientName,
  clientPhone,
  calls,
  totalCalls,
  callsDone,
  onUpdate,
}: ProductCallsSectionProps) {
  const progress = totalCalls > 0 ? (callsDone / totalCalls) * 100 : 0

  const getTypeColor = (name: string) => {
    if (name.includes('Elite'))
      return 'text-[#9333ea] border-[#9333ea]/30 bg-[#9333ea]/10'
    if (name.includes('Scale'))
      return 'text-[#3b82f6] border-[#3b82f6]/30 bg-[#3b82f6]/10'
    if (name.includes('Labs'))
      return 'text-[#10b981] border-[#10b981]/30 bg-[#10b981]/10'
    return 'text-gray-400'
  }

  return (
    <div className="space-y-6 bg-[#111111] p-6 rounded-xl border border-[#2a2a2a]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">
              Adapta {productName}
            </h2>
            <Badge variant="outline" className={getTypeColor(productName)}>
              Ativo
            </Badge>
          </div>

          <div className="flex items-center gap-4 w-full max-w-md">
            <Progress
              value={progress}
              className="h-2.5 bg-[#2a2a2a] flex-1"
              indicatorClassName="bg-gradient-to-r from-yellow-600 to-yellow-400"
            />
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {callsDone} de {totalCalls} calls ({Math.round(progress)}%)
            </span>
          </div>
        </div>

        <ScheduleCallModal
          clientId={clientId}
          preSelectedProductId={productId}
          onSuccess={onUpdate}
        />
      </div>

      {/* Grid */}
      {calls.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {calls.map((call) => (
            <CallCard
              key={call.id}
              call={call}
              clientId={clientId}
              clientName={clientName}
              clientPhone={clientPhone}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-[#1a1a1a]/50 rounded-lg border border-dashed border-[#2a2a2a]">
          <Calendar className="h-10 w-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">
            Nenhuma call agendada para este produto.
          </p>
          <ScheduleCallModal
            clientId={clientId}
            preSelectedProductId={productId}
            onSuccess={onUpdate}
            trigger={
              <Button
                variant="outline"
                className="border-[#3a3a3a] text-gray-300 hover:text-white hover:bg-[#2a2a2a]"
              >
                Agendar Primeira Call
              </Button>
            }
          />
        </div>
      )}
    </div>
  )
}
