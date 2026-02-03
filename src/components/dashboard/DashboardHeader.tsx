import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RefreshCw, Calendar as CalendarIcon, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Period } from '@/services/dashboard'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface DashboardHeaderProps {
  period: Period
  setPeriod: (period: Period) => void
  onRefresh: () => void
  loading: boolean
}

export function DashboardHeader({
  period,
  setPeriod,
  onRefresh,
  loading,
}: DashboardHeaderProps) {
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [countdown, setCountdown] = useState(60)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            onRefresh()
            return 60
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [autoRefresh, onRefresh])

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between space-y-2">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Visão geral de desempenho e métricas do sistema.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <div className="flex items-center space-x-2 bg-muted/50 p-2 rounded-lg border border-border/50">
          <Switch
            id="auto-refresh"
            checked={autoRefresh}
            onCheckedChange={setAutoRefresh}
          />
          <Label
            htmlFor="auto-refresh"
            className="text-xs font-medium cursor-pointer flex items-center gap-1"
          >
            Auto
            {autoRefresh && (
              <span className="text-primary tabular-nums">({countdown}s)</span>
            )}
          </Label>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select
            value={period}
            onValueChange={(val) => setPeriod(val as Period)}
          >
            <SelectTrigger className="w-[180px]">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="7dias">Últimos 7 dias</SelectItem>
              <SelectItem value="30dias">Últimos 30 dias</SelectItem>
              <SelectItem value="este_mes">Este Mês</SelectItem>
              <SelectItem value="mes_passado">Mês Passado</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={onRefresh}
            disabled={loading}
            variant="outline"
            size="icon"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
