import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  getCampaignDetails,
  AutomationRecipient,
  retryFailedRecipients,
} from '@/services/automation'
import {
  Loader2,
  Download,
  MessageSquare,
  ExternalLink,
  RefreshCw,
  Smartphone,
  TrendingUp,
  Clock,
  Users,
} from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import { toast } from '@/hooks/use-toast'
import { format } from 'date-fns'

interface CampaignReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId: string
}

export function CampaignReportModal({
  open,
  onOpenChange,
  campaignId,
}: CampaignReportModalProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [recipientFilter, setRecipientFilter] = useState('Todos')
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    if (open && campaignId) {
      setLoading(true)
      getCampaignDetails(campaignId)
        .then(setData)
        .catch(() =>
          toast({
            title: 'Erro ao carregar relatório',
            variant: 'destructive',
          }),
        )
        .finally(() => setLoading(false))
    }
  }, [open, campaignId])

  const handleRetry = async () => {
    setRetrying(true)
    try {
      await retryFailedRecipients(campaignId)
      toast({ title: 'Nova campanha criada para contatos falhados!' })
      onOpenChange(false)
    } catch (e) {
      toast({ title: 'Erro ao tentar novamente', variant: 'destructive' })
    } finally {
      setRetrying(false)
    }
  }

  const handleExportCSV = () => {
    if (!data) return
    const headers = [
      'Nome',
      'Telefone',
      'Status',
      'Variação',
      'Enviado Em',
      'Respondeu Em',
    ]
    const rows = data.recipients.map((r: any) => [
      r.nome_destinatario,
      r.numero_whatsapp,
      r.status_envio,
      `V${r.variacao_index + 1}`,
      r.data_envio || '',
      r.data_resposta || '',
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `campanha_${campaignId}_report.csv`)
    document.body.appendChild(link)
    link.click()
  }

  const handlePrint = () => {
    window.print()
  }

  if (!data && !loading) return null

  // Process Variations Data for Chart
  const variationsData =
    data?.campaign.variacoes_mensagem.map((msg: string, idx: number) => {
      const recipients = data.recipients.filter(
        (r: any) => r.variacao_index === idx,
      )
      const sent = recipients.filter(
        (r: any) => r.status_envio === 'enviado',
      ).length
      const responded = recipients.filter((r: any) => !!r.data_resposta).length
      const rate = sent > 0 ? (responded / sent) * 100 : 0
      return {
        name: `Variação ${idx + 1}`,
        rate: Math.round(rate),
        sent,
        responded,
      }
    }) || []

  const winner = variationsData.reduce(
    (prev: any, current: any) => (prev.rate > current.rate ? prev : current),
    { rate: -1 },
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1100px] bg-[#111111] border-[#2a2a2a] text-white h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b border-[#2a2a2a] bg-[#111]">
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                Relatório da Campanha
                <Badge
                  variant="outline"
                  className="text-gray-400 border-gray-700 font-mono"
                >
                  #{campaignId.slice(0, 8)}
                </Badge>
              </DialogTitle>
              <p className="text-gray-400 mt-1">
                Análise detalhada de performance e engajamento.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-[#333]"
                onClick={handleExportCSV}
              >
                <Download className="h-4 w-4 mr-2" /> CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-[#333]"
                onClick={handlePrint}
              >
                <ExternalLink className="h-4 w-4 mr-2" /> PDF / Print
              </Button>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#FFD700]" />
          </div>
        ) : (
          <Tabs
            defaultValue="summary"
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="px-6 pt-4 bg-[#111]">
              <TabsList className="bg-[#1a1a1a] border border-[#2a2a2a]">
                <TabsTrigger value="summary">Resumo Geral</TabsTrigger>
                <TabsTrigger value="recipients">Destinatários</TabsTrigger>
                <TabsTrigger value="variations">
                  Análise de Variações
                </TabsTrigger>
                <TabsTrigger value="timeline">Timeline de Envios</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-[#0a0a0a]">
              <TabsContent value="summary" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-400">
                        Total Destinatários
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">
                        {data.stats.total}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-400">
                        Taxa de Entrega
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-400">
                        {Math.round(data.stats.deliveryRate)}%
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-400">
                        Taxa de Resposta
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-400">
                        {Math.round(data.stats.responseRate)}%
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-400">
                        Tempo Médio Resp.
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-yellow-400">
                        {Math.round(data.stats.avgResponseTimeMinutes)}min
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-400">
                        Engajamento Score
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-400">
                        8.5
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <SettingsIcon className="h-5 w-5 text-gray-400" />{' '}
                        Configuração
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Intervalo</p>
                          <p className="text-white">
                            {data.campaign.intervalo_min_segundos}-
                            {data.campaign.intervalo_max_segundos}s
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Horário Comercial</p>
                          <p className="text-white">
                            {data.campaign.configuracao_envio
                              ?.business_hours_enabled
                              ? 'Sim'
                              : 'Não'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Filtros</p>
                          <p
                            className="text-white truncate"
                            title={JSON.stringify(
                              data.campaign.filtros_aplicados,
                            )}
                          >
                            {Object.keys(
                              data.campaign.filtros_aplicados || {},
                            ).join(', ') || 'Nenhum'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Criado em</p>
                          <p className="text-white">
                            {format(
                              new Date(data.campaign.created_at),
                              'dd/MM/yyyy',
                            )}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-gray-400" />{' '}
                        Performance da Variação Vencedora
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {winner.rate > -1 ? (
                        <div className="text-center py-4">
                          <div className="text-4xl font-bold text-[#FFD700] mb-2">
                            {winner.name}
                          </div>
                          <p className="text-gray-400 mb-4">
                            Com {winner.rate}% de taxa de resposta
                          </p>
                          <div className="w-full bg-[#333] h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-[#FFD700] h-full"
                              style={{ width: `${winner.rate}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-500 text-center py-8">
                          Dados insuficientes
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="recipients" className="mt-0 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    {['Todos', 'Enviado', 'Falhou', 'Respondeu'].map((f) => (
                      <Button
                        key={f}
                        variant={
                          recipientFilter === f ? 'secondary' : 'outline'
                        }
                        size="sm"
                        onClick={() => setRecipientFilter(f)}
                        className={
                          recipientFilter === f
                            ? 'bg-[#FFD700] text-black hover:bg-[#FFD700]/90'
                            : 'border-[#333] text-gray-400'
                        }
                      >
                        {f}
                      </Button>
                    ))}
                  </div>
                  {data.stats.failed > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleRetry}
                      disabled={retrying}
                    >
                      <RefreshCw
                        className={`h-4 w-4 mr-2 ${retrying ? 'animate-spin' : ''}`}
                      />
                      Tentar Novamente ({data.stats.failed})
                    </Button>
                  )}
                </div>

                <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#2a2a2a] hover:bg-transparent">
                        <TableHead className="text-gray-400">Nome</TableHead>
                        <TableHead className="text-gray-400">
                          Telefone
                        </TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                        <TableHead className="text-gray-400">
                          Variação
                        </TableHead>
                        <TableHead className="text-gray-400">Enviado</TableHead>
                        <TableHead className="text-right text-gray-400">
                          Ações
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recipients
                        .filter((r: any) => {
                          if (recipientFilter === 'Todos') return true
                          if (recipientFilter === 'Respondeu')
                            return !!r.data_resposta
                          return (
                            r.status_envio?.toLowerCase() ===
                            recipientFilter.toLowerCase()
                          )
                        })
                        .map((r: any) => (
                          <TableRow
                            key={r.id}
                            className="border-[#2a2a2a] hover:bg-[#222]"
                          >
                            <TableCell className="font-medium text-white">
                              {r.nome_destinatario}
                            </TableCell>
                            <TableCell className="text-gray-400">
                              {r.numero_whatsapp}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  r.status_envio === 'enviado'
                                    ? 'bg-green-500/20 text-green-500'
                                    : r.status_envio === 'falhou'
                                      ? 'bg-red-500/20 text-red-500'
                                      : 'bg-gray-500/20 text-gray-500'
                                }
                              >
                                {r.status_envio}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                V{r.variacao_index + 1}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-400 text-xs">
                              {r.data_envio
                                ? format(new Date(r.data_envio), 'HH:mm:ss')
                                : '-'}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                title={r.mensagem_personalizada}
                              >
                                <MessageSquare className="h-4 w-4 text-gray-400" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>

              <TabsContent value="variations" className="mt-0 h-full">
                <Card className="bg-[#1a1a1a] border-[#2a2a2a] h-[500px] flex flex-col">
                  <CardHeader>
                    <CardTitle>Comparativo de Variações</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ChartContainer
                      config={{
                        rate: {
                          label: 'Taxa de Resposta (%)',
                          color: 'hsl(var(--chart-1))',
                        },
                      }}
                      className="h-full w-full"
                    >
                      <BarChart data={variationsData}>
                        <CartesianGrid vertical={false} stroke="#333" />
                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={10}
                          stroke="#666"
                        />
                        <YAxis stroke="#666" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar
                          dataKey="rate"
                          fill="var(--color-rate)"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  {variationsData.map((v: any) => (
                    <Card
                      key={v.name}
                      className={`bg-[#1a1a1a] border-[#2a2a2a] ${winner.name === v.name ? 'border-[#FFD700] border-2' : ''}`}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">
                          {v.name} {winner.name === v.name && '👑'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold mb-2">{v.rate}%</div>
                        <div className="text-sm text-gray-500">
                          {v.responded} respostas de {v.sent} envios
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="timeline" className="mt-0">
                <Card className="bg-[#1a1a1a] border-[#2a2a2a] p-6">
                  <h3 className="text-lg font-bold mb-6 text-white">
                    Linha do Tempo de Execução
                  </h3>
                  <div className="space-y-8 relative before:absolute before:left-[15px] before:top-2 before:bottom-0 before:w-[2px] before:bg-[#333]">
                    {/* Start Event */}
                    <div className="relative pl-10">
                      <div className="absolute left-[6px] top-1 w-5 h-5 rounded-full bg-blue-500 border-4 border-[#1a1a1a]" />
                      <div className="text-sm text-gray-400">
                        {format(new Date(data.campaign.created_at), 'HH:mm')}
                      </div>
                      <div className="text-white font-medium">
                        Campanha Criada
                      </div>
                      <div className="text-sm text-gray-500">
                        Iniciado processamento de {data.stats.total} contatos.
                      </div>
                    </div>

                    {/* First Send */}
                    {data.recipients[0]?.data_envio && (
                      <div className="relative pl-10">
                        <div className="absolute left-[6px] top-1 w-5 h-5 rounded-full bg-green-500 border-4 border-[#1a1a1a]" />
                        <div className="text-sm text-gray-400">
                          {format(
                            new Date(data.recipients[0].data_envio),
                            'HH:mm',
                          )}
                        </div>
                        <div className="text-white font-medium">
                          Primeiro Envio
                        </div>
                      </div>
                    )}

                    {/* Last Send */}
                    {data.recipients
                      .filter((r: any) => r.status_envio === 'enviado')
                      .pop()?.data_envio && (
                      <div className="relative pl-10">
                        <div className="absolute left-[6px] top-1 w-5 h-5 rounded-full bg-green-500 border-4 border-[#1a1a1a]" />
                        <div className="text-sm text-gray-400">
                          {format(
                            new Date(
                              data.recipients
                                .filter(
                                  (r: any) => r.status_envio === 'enviado',
                                )
                                .pop().data_envio,
                            ),
                            'HH:mm',
                          )}
                        </div>
                        <div className="text-white font-medium">
                          Último Envio
                        </div>
                      </div>
                    )}

                    {/* Completion */}
                    {data.campaign.status_automacao === 'concluida' && (
                      <div className="relative pl-10">
                        <div className="absolute left-[6px] top-1 w-5 h-5 rounded-full bg-[#FFD700] border-4 border-[#1a1a1a]" />
                        <div className="text-white font-medium">
                          Campanha Concluída
                        </div>
                        <div className="text-sm text-gray-500">
                          Todos os envios processados.
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}

function SettingsIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
