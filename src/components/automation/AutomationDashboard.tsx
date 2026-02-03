import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Play,
  Pause,
  XCircle,
  Clock,
  CheckCircle,
  BarChart,
  Settings,
  Loader2,
} from 'lucide-react'
import {
  AutomationCampaign,
  startCampaign,
  pauseCampaign,
  cancelCampaign,
} from '@/services/automation'
import { format } from 'date-fns'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { ProgressModal } from './ProgressModal'

interface AutomationDashboardProps {
  campaigns: AutomationCampaign[]
  onRefresh: () => void
}

export function AutomationDashboard({
  campaigns,
  onRefresh,
}: AutomationDashboardProps) {
  const [activeCampaign, setActiveCampaign] =
    useState<AutomationCampaign | null>(null)
  const [showProgress, setShowProgress] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleAction = async (
    action: 'start' | 'pause' | 'cancel',
    campaign: AutomationCampaign,
  ) => {
    setProcessingId(campaign.id)
    try {
      if (action === 'start') {
        await startCampaign(campaign.id)
        toast({
          title: 'Campanha Iniciada',
          description: 'O envio de mensagens começou.',
        })
      } else if (action === 'pause') {
        await pauseCampaign(campaign.id)
        toast({
          title: 'Campanha Pausada',
          description: 'O envio foi interrompido temporariamente.',
        })
      } else if (action === 'cancel') {
        if (
          confirm(
            'Tem certeza que deseja cancelar? Isso não pode ser desfeito.',
          )
        ) {
          await cancelCampaign(campaign.id)
          toast({
            title: 'Campanha Cancelada',
            description: 'A campanha foi encerrada.',
          })
        }
      }
      onRefresh()
    } catch (e) {
      toast({ title: 'Erro na ação', variant: 'destructive' })
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'aguardando':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
      case 'concluida':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'cancelada':
        return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'pausada':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  const activeCampaigns = campaigns.filter((c) =>
    ['ativa', 'aguardando', 'pausada'].includes(c.status_automacao),
  )

  return (
    <div className="space-y-6">
      {activeCampaigns.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-[#2a2a2a] rounded-xl bg-[#1a1a1a]/50">
          <Clock className="h-10 w-10 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white">
            Nenhuma campanha ativa
          </h3>
          <p className="text-gray-400">
            Crie uma nova campanha para começar a automação.
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {activeCampaigns.map((campaign) => {
            const progress =
              campaign.total_envios_planejados > 0
                ? (campaign.total_envios_concluidos /
                    campaign.total_envios_planejados) *
                  100
                : 0

            return (
              <Card
                key={campaign.id}
                className="bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a] transition-all"
              >
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <Badge
                        className={cn(
                          'capitalize border',
                          getStatusColor(campaign.status_automacao),
                        )}
                      >
                        {campaign.status_automacao}
                      </Badge>
                      <span className="text-sm text-gray-400">
                        Criada em{' '}
                        {format(
                          new Date(campaign.created_at),
                          'dd/MM/yyyy HH:mm',
                        )}
                      </span>
                    </div>
                    <CardTitle className="text-lg font-semibold text-white">
                      Campanha #{campaign.id.slice(0, 8)}
                    </CardTitle>
                    <CardDescription>
                      {campaign.variacoes_mensagem.length} variações • Intervalo{' '}
                      {campaign.intervalo_min_segundos}-
                      {campaign.intervalo_max_segundos}s
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {campaign.status_automacao === 'ativa' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActiveCampaign(campaign)
                          setShowProgress(true)
                        }}
                        className="border-[#333] hover:bg-[#2a2a2a]"
                      >
                        <BarChart className="h-4 w-4 mr-2" /> Monitorar
                      </Button>
                    )}
                    {campaign.status_automacao === 'ativa' ? (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleAction('pause', campaign)}
                        disabled={!!processingId}
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-green-500 hover:text-green-400"
                        onClick={() => handleAction('start', campaign)}
                        disabled={!!processingId}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-red-500 hover:text-red-400"
                      onClick={() => handleAction('cancel', campaign)}
                      disabled={!!processingId}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Progresso</span>
                        <span className="text-white font-medium">
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{campaign.total_envios_concluidos} enviados</span>
                        <span>{campaign.total_envios_planejados} total</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex flex-col">
                        <span className="text-gray-500">Falhas</span>
                        <span
                          className={cn(
                            'font-medium',
                            campaign.total_envios_falhados > 0
                              ? 'text-red-400'
                              : 'text-white',
                          )}
                        >
                          {campaign.total_envios_falhados}
                        </span>
                      </div>
                      <div className="w-px h-8 bg-[#2a2a2a]" />
                      <div className="flex flex-col">
                        <span className="text-gray-500">Próximo Envio</span>
                        <span className="text-white">
                          {campaign.proximo_envio_timestamp
                            ? format(
                                new Date(campaign.proximo_envio_timestamp),
                                'HH:mm:ss',
                              )
                            : 'Aguardando'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      {campaign.status_automacao === 'ativa' && (
                        <div className="flex items-center gap-2 text-xs text-blue-400 animate-pulse">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Processando fila...
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {activeCampaign && (
        <ProgressModal
          open={showProgress}
          onOpenChange={setShowProgress}
          campaign={activeCampaign}
        />
      )}
    </div>
  )
}
