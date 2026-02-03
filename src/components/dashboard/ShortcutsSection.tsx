import { Card } from '@/components/ui/card'
import {
  UserPlus,
  MessageSquare,
  Send,
  RefreshCw,
  ArrowUpDown,
  Settings,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { recalculateTags } from '@/services/tags'
import { recalculatePriority } from '@/services/whatsapp'

export function ShortcutsSection() {
  const handleRecalculateTags = async () => {
    toast.promise(recalculateTags(), {
      loading: 'Recalculando tags...',
      success: (data) => `Processado! ${data.tags_criadas} tags criadas.`,
      error: 'Erro ao recalcular tags',
    })
  }

  const handleRecalculatePriority = async () => {
    toast.promise(recalculatePriority(), {
      loading: 'Recalculando prioridades...',
      success: 'Prioridades atualizadas com sucesso!',
      error: 'Erro ao recalcular prioridades',
    })
  }

  const shortcuts = [
    {
      label: 'Novo Cliente',
      icon: UserPlus,
      to: '/clients?action=new',
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      label: 'Abrir WhatsApp',
      icon: MessageSquare,
      to: '/whatsapp',
      color: 'text-green-500',
      bg: 'bg-green-50',
    },
    {
      label: 'Nova Campanha',
      icon: Send,
      to: '/automation?action=new',
      color: 'text-purple-500',
      bg: 'bg-purple-50',
    },
    {
      label: 'Recalcular Tags',
      icon: RefreshCw,
      onClick: handleRecalculateTags,
      color: 'text-orange-500',
      bg: 'bg-orange-50',
    },
    {
      label: 'Recalc. Prioridade',
      icon: ArrowUpDown,
      onClick: handleRecalculatePriority,
      color: 'text-red-500',
      bg: 'bg-red-50',
    },
    {
      label: 'Configurações',
      icon: Settings,
      to: '/settings',
      color: 'text-gray-500',
      bg: 'bg-gray-50',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {shortcuts.map((s, i) => {
        const Content = () => (
          <>
            <div
              className={`p-3 rounded-full ${s.bg} mb-3 transition-transform group-hover:scale-110`}
            >
              <s.icon className={`h-6 w-6 ${s.color}`} />
            </div>
            <span className="font-medium text-sm text-center">{s.label}</span>
          </>
        )

        const cardClass =
          'flex flex-col items-center justify-center p-4 h-[120px] cursor-pointer hover:shadow-md transition-all group border-border/50'

        if (s.to) {
          return (
            <Link key={i} to={s.to}>
              <Card className={cardClass}>
                <Content />
              </Card>
            </Link>
          )
        }

        return (
          <Card key={i} className={cardClass} onClick={s.onClick}>
            <Content />
          </Card>
        )
      })}
    </div>
  )
}
