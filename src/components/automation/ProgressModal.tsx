import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import {
  AutomationCampaign,
  triggerQueueProcessing,
} from '@/services/automation'
import { Loader2, CheckCircle, AlertTriangle, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface ProgressModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaign: AutomationCampaign
}

export function ProgressModal({
  open,
  onOpenChange,
  campaign,
}: ProgressModalProps) {
  // Use local state for real-time updates without re-fetching full campaign constantly
  const [stats, setStats] = useState({
    sent: campaign.total_envios_concluidos,
    failed: campaign.total_envios_falhados,
    total: campaign.total_envios_planejados,
  })

  useEffect(() => {
    if (!open) return
    setStats({
      sent: campaign.total_envios_concluidos,
      failed: campaign.total_envios_falhados,
      total: campaign.total_envios_planejados,
    })
  }, [open, campaign])

  // Polling Effect
  useEffect(() => {
    if (!open || campaign.status_automacao !== 'ativa') return

    const interval = setInterval(async () => {
      // Trigger edge function
      await triggerQueueProcessing()

      // Refresh local stats (Optimized: In a real app we'd use a subscription or efficient query)
      const { data } = await supabase
        .from('automacoes_massa')
        .select('total_envios_concluidos, total_envios_falhados')
        .eq('id', campaign.id)
        .single()

      if (data) {
        setStats((prev) => ({
          ...prev,
          sent: data.total_envios_concluidos,
          failed: data.total_envios_falhados,
        }))
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [open, campaign.id, campaign.status_automacao])

  const percentage = stats.total > 0 ? (stats.sent / stats.total) * 100 : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#111111] border-[#2a2a2a] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-[#FFD700]" />
            Monitoramento em Tempo Real
          </DialogTitle>
        </DialogHeader>

        <div className="py-6 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-bold">{Math.floor(percentage)}%</h2>
            <Progress value={percentage} className="h-3 bg-[#2a2a2a]" />
            <p className="text-sm text-gray-400">Progresso Geral</p>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-[#1a1a1a] p-3 rounded-lg border border-[#333]">
              <CheckCircle className="h-5 w-5 text-green-500 mx-auto mb-1" />
              <div className="text-xl font-bold">{stats.sent}</div>
              <div className="text-xs text-gray-400">Enviados</div>
            </div>
            <div className="bg-[#1a1a1a] p-3 rounded-lg border border-[#333]">
              <Clock className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
              <div className="text-xl font-bold">
                {stats.total - stats.sent - stats.failed}
              </div>
              <div className="text-xs text-gray-400">Na Fila</div>
            </div>
            <div className="bg-[#1a1a1a] p-3 rounded-lg border border-[#333]">
              <AlertTriangle className="h-5 w-5 text-red-500 mx-auto mb-1" />
              <div className="text-xl font-bold">{stats.failed}</div>
              <div className="text-xs text-gray-400">Falhas</div>
            </div>
          </div>

          <div className="text-xs text-center text-gray-500 animate-pulse">
            Atualizando a cada 5 segundos...
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
