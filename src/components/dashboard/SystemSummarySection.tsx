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
import { Sparkles, Zap, FileText, Send } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface SystemSummarySectionProps {
  summary: any
  loading: boolean
}

export function SystemSummarySection({
  summary,
  loading,
}: SystemSummarySectionProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton className="h-[250px] lg:col-span-2 rounded-xl" />
        <div className="space-y-4">
          <Skeleton className="h-[120px] rounded-xl" />
          <Skeleton className="h-[120px] rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Campanhas Recentes */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            Campanhas Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campanha</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Progresso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.campaigns.map((camp: any) => (
                <TableRow key={camp.id}>
                  <TableCell className="font-medium">
                    {camp.nome || 'Campanha #' + camp.id.slice(0, 4)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {camp.created_at
                      ? format(new Date(camp.created_at), 'dd/MM', {
                          locale: ptBR,
                        })
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        camp.status_automacao === 'concluida'
                          ? 'default'
                          : 'secondary'
                      }
                      className="text-[10px]"
                    >
                      {camp.status_automacao}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    {camp.total_envios_concluidos}/
                    {camp.total_envios_planejados}
                  </TableCell>
                </TableRow>
              ))}
              {summary.campaigns.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-muted-foreground text-xs py-6"
                  >
                    Nenhuma campanha recente
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {/* Sugestões de IA */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              Performance da IA (Hoje)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-2xl font-bold">{summary.ai.total}</span>
                <span className="text-xs text-muted-foreground">Sugestões</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-green-600">
                  {summary.ai.timeSaved}m
                </span>
                <span className="text-xs text-muted-foreground">
                  Tempo Salvo
                </span>
              </div>
            </div>
            <div className="mt-3 text-xs text-muted-foreground border-t pt-2">
              {summary.ai.used} sugestões utilizadas (
              {summary.ai.total > 0
                ? Math.round((summary.ai.used / summary.ai.total) * 100)
                : 0}
              %)
            </div>
          </CardContent>
        </Card>

        {/* Templates Mais Usados */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-500" />
              Templates Populares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {summary.templates.map((t: any, i: number) => (
                <li
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="truncate max-w-[200px]">{t.nome}</span>
                  <Badge variant="outline" className="text-[10px]">
                    Top {i + 1}
                  </Badge>
                </li>
              ))}
              {summary.templates.length === 0 && (
                <li className="text-xs text-muted-foreground">
                  Sem dados de templates
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
