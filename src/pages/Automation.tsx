import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Zap, MessageSquare, Clock, ArrowRight } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

type AutomationRule = {
  id: string
  name: string
  description: string
  active: boolean
  trigger: string
}

export default function Automation() {
  const [rules, setRules] = useState<AutomationRule[]>([
    {
      id: '1',
      name: 'Mensagem de Boas-vindas',
      description: 'Envia mensagem automática para novos leads.',
      active: true,
      trigger: 'Novo Contato',
    },
    {
      id: '2',
      name: 'Resposta Ausente',
      description: 'Responde automaticamente fora do horário comercial.',
      active: false,
      trigger: 'Horário',
    },
    {
      id: '3',
      name: 'Follow-up de 24h',
      description: 'Envia lembrete após 24h sem resposta.',
      active: true,
      trigger: 'Sem Resposta',
    },
    {
      id: '4',
      name: 'Qualificação Automática',
      description: 'Envia formulário inicial para novos clientes.',
      active: false,
      trigger: 'Tag: Lead',
    },
  ])

  const toggleRule = (id: string) => {
    setRules(
      rules.map((rule) => {
        if (rule.id === id) {
          const newState = !rule.active
          toast({
            title: newState ? 'Automação Ativada' : 'Automação Desativada',
            description: `A regra "${rule.name}" foi ${newState ? 'ativada' : 'desativada'}.`,
            className: 'border-primary text-foreground bg-background',
          })
          return { ...rule, active: newState }
        }
        return rule
      }),
    )
  }

  const handleNewAutomation = () => {
    toast({
      title: 'Criar Nova Automação',
      description: 'O fluxo de criação será aberto.',
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Fluxos de Automação
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure respostas automáticas e fluxos de trabalho
          </p>
        </div>
        <Button
          onClick={handleNewAutomation}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Automação
        </Button>
      </div>

      <div className="grid gap-4">
        {rules.map((rule) => (
          <Card
            key={rule.id}
            className="bg-card border-border hover:border-primary/50 transition-colors duration-200"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Zap
                  className={`h-4 w-4 ${rule.active ? 'text-primary' : 'text-muted-foreground'}`}
                />
                {rule.name}
              </CardTitle>
              <Switch
                checked={rule.active}
                onCheckedChange={() => toggleRule(rule.id)}
                className="data-[state=checked]:bg-primary"
              />
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base mb-4">
                {rule.description}
              </CardDescription>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-border text-muted-foreground"
                  >
                    Gatilho: {rule.trigger}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary/80 hover:bg-primary/10"
                >
                  Configurar <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
