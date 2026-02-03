import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  AreaChart,
  Area,
  ResponsiveContainer,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'

interface ChartsSectionProps {
  data: any
  loading: boolean
}

const COLORS = {
  priority: {
    Crítico: '#ef4444',
    Alto: '#f97316',
    Médio: '#fbbf24',
    Baixo: '#10b981',
  },
  products: {
    Elite: '#8884d8',
    Scale: '#3b82f6',
    Labs: '#22c55e',
    Venda: '#f97316',
  },
}

export function ChartsSection({ data, loading }: ChartsSectionProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        <Skeleton className="h-[300px] lg:col-span-2 rounded-xl" />
        <Skeleton className="h-[300px] lg:col-span-3 rounded-xl" />
        <Skeleton className="h-[300px] lg:col-span-2 rounded-xl" />
        <Skeleton className="h-[300px] lg:col-span-4 rounded-xl" />
        <Skeleton className="h-[300px] lg:col-span-3 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
      {/* 1. Distribuição de Prioridade */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Distribuição de Prioridade
          </CardTitle>
          <CardDescription>Conversas por nível</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-0">
          <ChartContainer
            config={{
              critical: { label: 'Crítico', color: COLORS.priority.Crítico },
              high: { label: 'Alto', color: COLORS.priority.Alto },
              medium: { label: 'Médio', color: COLORS.priority.Médio },
              low: { label: 'Baixo', color: COLORS.priority.Baixo },
            }}
            className="h-[200px] w-full"
          >
            <PieChart>
              <Pie
                data={data.priority}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
                strokeWidth={5}
              >
                {data.priority.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      COLORS.priority[
                        entry.name as keyof typeof COLORS.priority
                      ] || '#ccc'
                    }
                  />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <ChartLegend
                content={<ChartLegendContent />}
                className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
              />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* 2. Atividade de Conversas (Area Chart) */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Atividade de Conversas
          </CardTitle>
          <CardDescription>Recebidas vs Enviadas (30 dias)</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              sent: { label: 'Enviadas', color: '#fbbf24' },
              received: { label: 'Recebidas', color: '#3b82f6' },
            }}
            className="h-[200px] w-full"
          >
            <AreaChart
              data={data.activity}
              margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="#e5e7eb"
              />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
                minTickGap={32}
              />
              <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
              <Area
                type="monotone"
                dataKey="sent"
                stroke="#fbbf24"
                fillOpacity={1}
                fill="url(#colorSent)"
              />
              <Area
                type="monotone"
                dataKey="received"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorReceived)"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* 3. Produtos Contratados (Horizontal Bar) */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Produtos Contratados
          </CardTitle>
          <CardDescription>Clientes por produto</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              value: { label: 'Clientes', color: 'hsl(var(--primary))' },
            }}
            className="h-[200px] w-full"
          >
            <BarChart
              data={data.products}
              layout="vertical"
              margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
              barCategoryGap="20%"
            >
              <CartesianGrid
                horizontal={true}
                vertical={false}
                strokeDasharray="3 3"
                stroke="#e5e7eb"
                opacity={0.5}
              />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                fontSize={12}
                width={50}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {data.products.map((entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      COLORS.products[
                        entry.name as keyof typeof COLORS.products
                      ] || '#8884d8'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* 4. Tempo Médio de Resposta (Bar Chart) */}
      <Card className="lg:col-span-4">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Tempo Médio de Resposta
          </CardTitle>
          <CardDescription>Minutos por dia da semana</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              minutes: { label: 'Minutos', color: 'hsl(var(--chart-1))' },
            }}
            className="h-[200px] w-full"
          >
            <BarChart data={data.responseTime}>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="#e5e7eb"
              />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                fontSize={12}
              />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="minutes"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
                barSize={40}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* 5. Status das Consultorias */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Status das Consultorias
          </CardTitle>
          <CardDescription>Distribuição por produto</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              active: { label: 'Ativo', color: '#22c55e' },
              paused: { label: 'Pausado', color: '#f97316' },
              canceled: { label: 'Cancelado', color: '#ef4444' },
            }}
            className="h-[200px] w-full"
          >
            <BarChart data={data.status}>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="#e5e7eb"
              />
              <XAxis
                dataKey="product"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                fontSize={12}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="Ativo"
                stackId="a"
                fill="#22c55e"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="Pausado"
                stackId="a"
                fill="#f97316"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="Cancelado"
                stackId="a"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
