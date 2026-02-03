import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Users, MessageSquare, TrendingUp } from 'lucide-react'

// Mock Data for the chart
const data = [
  { name: 'Seg', total: 120 },
  { name: 'Ter', total: 150 },
  { name: 'Qua', total: 180 },
  { name: 'Qui', total: 220 },
  { name: 'Sex', total: 250 },
  { name: 'Sáb', total: 190 },
  { name: 'Dom', total: 140 },
]

export default function Index() {
  return (
    <div className="relative flex flex-col gap-8 h-full max-w-6xl mx-auto">
      {/* Background visual element */}
      <div className="absolute inset-0 -z-10 opacity-10 pointer-events-none overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line
              type="monotone"
              dataKey="total"
              stroke="#FFD700"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border shadow-elevation hover:border-primary/50 transition-colors duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Consultas Ativas
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">12</div>
            <p className="text-xs text-muted-foreground mt-1">
              +2 desde a semana passada
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-elevation hover:border-primary/50 transition-colors duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mensagens Hoje
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">1,248</div>
            <p className="text-xs text-muted-foreground mt-1">
              +15% em relação a ontem
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border shadow-elevation hover:border-primary/50 transition-colors duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Novos Leads
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">24</div>
            <p className="text-xs text-muted-foreground mt-1">
              +4 nesta semana
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center min-h-[40vh] text-center z-10">
        <h1 className="text-5xl md:text-7xl font-bold text-primary tracking-tight animate-fade-in-up">
          Dashboard
        </h1>
        <p
          className="mt-4 text-xl text-muted-foreground max-w-lg animate-fade-in-up"
          style={{ animationDelay: '0.1s' }}
        >
          Bem-vindo ao Elite Manager. Seu painel de controle executivo para
          gestão de consultoria.
        </p>
      </div>

      <Card className="col-span-4 bg-card border-border">
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <ChartContainer
            config={{
              total: {
                label: 'Mensagens',
                color: 'hsl(var(--chart-1))',
              },
            }}
            className="h-[200px] w-full"
          >
            <LineChart
              data={data}
              margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
            >
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Total
                            </span>
                            <span className="font-bold text-foreground">
                              {payload[0].value}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Line
                type="monotone"
                dataKey="total"
                strokeWidth={2}
                activeDot={{ r: 8 }}
                stroke="var(--color-total)"
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
