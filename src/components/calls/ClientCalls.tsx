import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { getCallsByClientId, Call } from '@/services/calls'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductCallsSection } from './ProductCallsSection'
import { supabase } from '@/lib/supabase/client'
import { Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScheduleCallModal } from './ScheduleCallModal'

export function ClientCalls() {
  const { id } = useParams()
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [clientData, setClientData] = useState<{
    name: string
    phone: string
  } | null>(null)

  const fetchData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const callsData = await getCallsByClientId(id)
      setCalls(callsData)

      if (!clientData) {
        const { data } = await supabase
          .from('clientes')
          .select('nome_completo, telefone')
          .eq('id', id)
          .single()
        if (data)
          setClientData({ name: data.nome_completo, phone: data.telefone })
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [id, clientData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full bg-[#1a1a1a]" />
        <Skeleton className="h-64 w-full bg-[#1a1a1a]" />
      </div>
    )
  }

  // Group calls by product
  const callsByProduct = calls.reduce(
    (acc, call) => {
      if (!call.produto) return acc
      if (!acc[call.produto.id]) {
        acc[call.produto.id] = {
          info: call.produto,
          calls: [],
        }
      }
      acc[call.produto.id].calls.push(call)
      return acc
    },
    {} as Record<string, { info: NonNullable<Call['produto']>; calls: Call[] }>,
  )

  const productIds = Object.keys(callsByProduct)

  if (productIds.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] animate-fade-in">
        <Phone className="h-16 w-16 mx-auto mb-6 opacity-20" />
        <h3 className="text-xl font-semibold text-white mb-2">
          Nenhuma call encontrada
        </h3>
        <p className="max-w-md mx-auto mb-8">
          Este cliente ainda não possui histórico de calls ou produtos
          compatíveis.
        </p>
        {id && (
          <ScheduleCallModal
            clientId={id}
            onSuccess={fetchData}
            trigger={
              <Button className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90">
                Agendar Primeira Call
              </Button>
            }
          />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {productIds.map((prodId) => {
        const { info, calls } = callsByProduct[prodId]
        return (
          <ProductCallsSection
            key={prodId}
            productId={prodId}
            productName={info.produto}
            clientId={id!}
            clientName={clientData?.name || ''}
            clientPhone={clientData?.phone || ''}
            calls={calls}
            totalCalls={info.num_calls_total || 0}
            callsDone={info.num_calls_realizadas || 0}
            onUpdate={fetchData}
          />
        )
      })}
    </div>
  )
}
