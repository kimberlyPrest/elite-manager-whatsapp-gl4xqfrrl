import { useEffect, useState } from 'react'
import { Progress } from '@/components/ui/progress'
import { getCompletenessStats, CompletenessStats } from '@/services/context'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ContextProgress({
  refreshTrigger,
}: {
  refreshTrigger: number
}) {
  const [stats, setStats] = useState<CompletenessStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getCompletenessStats()
        setStats(data)
      } catch (error) {
        console.error('Failed to load stats', error)
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [refreshTrigger])

  if (loading || !stats)
    return <div className="h-20 animate-pulse bg-[#1a1a1a] rounded-lg mb-6" />

  return (
    <div className="mb-8 p-6 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a]">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-white">
          Contexto {stats.totalPercentage}% completo
        </h3>
        {stats.totalPercentage < 100 && (
          <span className="text-sm text-yellow-500 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            Complete para melhor precisão
          </span>
        )}
        {stats.totalPercentage === 100 && (
          <span className="text-sm text-green-500 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" />
            Contexto Otimizado
          </span>
        )}
      </div>

      {/* Custom Progress Bar with Gold Gradient */}
      <div className="h-2 w-full bg-[#2a2a2a] rounded overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-300 transition-all duration-1000 ease-out"
          style={{ width: `${stats.totalPercentage}%` }}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-muted-foreground">
        <StatusItem label="Produtos" done={stats.products} />
        <StatusItem label="Institucional" done={stats.institutional} />
        <StatusItem label="Tom de Voz" done={stats.toneOfVoice} />
        <StatusItem label="Templates (3+)" done={stats.templates} />
        <StatusItem label="Exemplos (2+)" done={stats.examples} />
      </div>
    </div>
  )
}

function StatusItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5',
        done ? 'text-green-500' : 'text-gray-500',
      )}
    >
      <CheckCircle2
        className={cn('w-3.5 h-3.5', done ? 'opacity-100' : 'opacity-30')}
      />
      <span>{label}</span>
    </div>
  )
}
