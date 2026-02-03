import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  getCampaignsHistory,
  AutomationCampaign,
  getCampaignDetails,
} from '@/services/automation'
import { CampaignReportModal } from './CampaignReportModal'
import { format, subDays, startOfMonth } from 'date-fns'
import { Search, Filter, Eye, ArrowRight, Calendar } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'

export function HistoryTab() {
  const [campaigns, setCampaigns] = useState<AutomationCampaign[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todas')
  const [periodFilter, setPeriodFilter] = useState('30dias')
  const [loading, setLoading] = useState(false)

  // Report Modal
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null,
  )
  const [isReportOpen, setIsReportOpen] = useState(false)

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    loadCampaigns()
  }, [debouncedSearch, statusFilter, periodFilter])

  const loadCampaigns = async () => {
    setLoading(true)
    try {
      const now = new Date()
      let range = { start: subDays(now, 30), end: now }

      if (periodFilter === '7dias') range = { start: subDays(now, 7), end: now }
      if (periodFilter === 'este_mes')
        range = { start: startOfMonth(now), end: now }
      // For 'Custom' we would need a date picker, sticking to presets for MVP as per AC suggestions

      const data = await getCampaignsHistory(statusFilter, range)

      const filtered = data.filter(
        (c) =>
          c.id.includes(debouncedSearch) ||
          (c.mensagem_template || '')
            .toLowerCase()
            .includes(debouncedSearch.toLowerCase()) ||
          c.variacoes_mensagem.some((v) =>
            v.toLowerCase().includes(debouncedSearch.toLowerCase()),
          ),
      )
      setCampaigns(filtered)
    } catch (error) {
      console.error('Failed to load history', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenReport = (id: string) => {
    setSelectedCampaignId(id)
    setIsReportOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-[#1a1a1a] p-4 rounded-xl border border-[#2a2a2a]">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar por ID ou conteúdo..."
            className="bg-transparent border-none focus-visible:ring-0 px-0 h-auto"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-[#111] border-[#333]">
              <Filter className="h-3 w-3 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas</SelectItem>
              <SelectItem value="concluida">Concluídas</SelectItem>
              <SelectItem value="cancelada">Canceladas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[180px] bg-[#111] border-[#333]">
              <Calendar className="h-3 w-3 mr-2" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7dias">Últimos 7 dias</SelectItem>
              <SelectItem value="30dias">Últimos 30 dias</SelectItem>
              <SelectItem value="este_mes">Este Mês</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Campaign List */}
      <div className="grid gap-4">
        {campaigns.map((campaign) => {
          const total = campaign.total_envios_planejados
          const sent = campaign.total_envios_concluidos
          const successRate = total > 0 ? (sent / total) * 100 : 0

          let rateColor = 'text-red-500'
          if (successRate >= 90) rateColor = 'text-green-500'
          else if (successRate >= 70) rateColor = 'text-yellow-500'

          return (
            <Card
              key={campaign.id}
              className="bg-[#1a1a1a] border-[#2a2a2a] hover:border-[#3a3a3a] transition-all group"
            >
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-gray-400">
                      #{campaign.id.slice(0, 8)}
                    </span>
                    {campaign.status_automacao === 'concluida' ? (
                      <Badge
                        variant="outline"
                        className="bg-green-500/10 text-green-500 border-green-500/20"
                      >
                        Concluída ✓
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-red-500/10 text-red-500 border-red-500/20"
                      >
                        Cancelada ✗
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {format(new Date(campaign.created_at), 'dd/MM/yyyy HH:mm')}{' '}
                    • {campaign.variacoes_mensagem.length} variações
                  </div>
                </div>

                <div className="flex gap-8 text-sm">
                  <div className="text-center">
                    <p className="text-gray-500 text-xs uppercase tracking-wider">
                      Envios
                    </p>
                    <p className="font-bold text-white">
                      {sent} <span className="text-gray-600">/ {total}</span>
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500 text-xs uppercase tracking-wider">
                      Taxa Sucesso
                    </p>
                    <p className={`font-bold ${rateColor}`}>
                      {Math.round(successRate)}%
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  className="text-[#FFD700] hover:text-[#FFD700] hover:bg-[#FFD700]/10 gap-2 group-hover:translate-x-1 transition-transform"
                  onClick={() => handleOpenReport(campaign.id)}
                >
                  Detalhes <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )
        })}

        {campaigns.length === 0 && !loading && (
          <div className="text-center py-20 text-gray-500">
            Nenhuma campanha encontrada com os filtros atuais.
          </div>
        )}
      </div>

      {selectedCampaignId && (
        <CampaignReportModal
          open={isReportOpen}
          onOpenChange={setIsReportOpen}
          campaignId={selectedCampaignId}
        />
      )}
    </div>
  )
}
