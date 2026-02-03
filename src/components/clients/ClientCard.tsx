import React from 'react'
import { Client } from '@/services/clients'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Phone,
  Mail,
  Calendar,
  ArrowRight,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'

interface ClientCardProps {
  client: Client
}

export const ClientCard = React.memo(({ client }: ClientCardProps) => {
  const navigate = useNavigate()

  const handleCardClick = () => {
    navigate(`/clients/${client.id}`)
  }

  const getProductColor = (product: string) => {
    switch (product.toLowerCase()) {
      case 'elite':
        return 'bg-[#9333ea] hover:bg-[#9333ea]/90'
      case 'scale':
        return 'bg-[#3b82f6] hover:bg-[#3b82f6]/90'
      case 'labs':
        return 'bg-[#10b981] hover:bg-[#10b981]/90'
      case 'venda':
        return 'bg-[#f97316] hover:bg-[#f97316]/90'
      default:
        return 'bg-secondary text-secondary-foreground'
    }
  }

  // Tag Logic
  const criticalTags = ['sem_resposta_7_dias', 'tempo_esgotado']
  const attentionTags = ['csat_pendente', 'ultima_call_mais_20_dias']

  const activeTags = client.tags_cliente.filter((t) => t.ativo)
  const displayTags = activeTags.slice(0, 3)
  const moreTagsCount = activeTags.length - 3

  return (
    <Card
      className="group relative bg-[#1a1a1a] border-[#2a2a2a] overflow-hidden transition-all duration-300 hover:border-[#FFD700]/50 cursor-pointer shadow-sm hover:shadow-md"
      onClick={handleCardClick}
    >
      <div className="absolute inset-0 bg-[#FFD700]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0" />

      {/* Overlay Button */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 bg-black/40 backdrop-blur-[2px]">
        <Button className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-semibold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
          Ver Detalhes
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <CardContent className="p-5 relative z-0 space-y-4">
        {/* Header: Name and Pendente Badge */}
        <div className="flex justify-between items-start gap-2">
          <h3
            className="font-bold text-base text-white line-clamp-1"
            title={client.nome_completo}
          >
            {client.nome_completo}
          </h3>
          {client.pendente_classificacao && (
            <Badge className="bg-[#fbbf24] text-black hover:bg-[#fbbf24]/90 shrink-0 whitespace-nowrap">
              Pendente
            </Badge>
          )}
        </div>

        {/* Contact Info */}
        <div className="space-y-1.5">
          <div className="flex items-center text-sm text-muted-foreground gap-2">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{client.telefone}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground gap-2">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate" title={client.email || ''}>
              {client.email || 'Não informado'}
            </span>
          </div>
        </div>

        {/* Products */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {client.produtos_cliente.length > 0 ? (
              client.produtos_cliente.map((p) => (
                <Badge
                  key={p.id}
                  className={cn(
                    'text-white border-0 px-2 py-0.5 text-[10px] uppercase tracking-wider',
                    getProductColor(p.produto),
                  )}
                >
                  {p.produto}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground italic">
                Sem produtos
              </span>
            )}
          </div>

          {/* Product Statuses */}
          <div className="space-y-1">
            {client.produtos_cliente.slice(0, 2).map((p) => (
              <div
                key={`status-${p.id}`}
                className="flex items-center gap-2 text-xs text-gray-400"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                <span className="truncate">{p.status}</span>
              </div>
            ))}
            {client.produtos_cliente.length > 2 && (
              <p className="text-[10px] text-muted-foreground pl-3.5">
                +{client.produtos_cliente.length - 2} outros
              </p>
            )}
          </div>
        </div>

        {/* Automated Tags */}
        {activeTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {displayTags.map((tag) => {
              const isCritical = criticalTags.includes(tag.tipo_tag)
              const isAttention = attentionTags.includes(tag.tipo_tag)

              return (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className={cn(
                    'text-[10px] h-5 px-1.5 border-dashed',
                    isCritical
                      ? 'border-red-500 text-red-500 bg-red-500/10'
                      : isAttention
                        ? 'border-yellow-500 text-yellow-500 bg-yellow-500/10'
                        : 'border-muted text-muted-foreground',
                  )}
                >
                  {isCritical ? (
                    <AlertCircle className="h-3 w-3 mr-1" />
                  ) : isAttention ? (
                    <AlertTriangle className="h-3 w-3 mr-1" />
                  ) : null}
                  {tag.tipo_tag.replace(/_/g, ' ')}
                </Badge>
              )
            })}
            {moreTagsCount > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] h-5 px-1.5 border-dashed border-muted text-muted-foreground"
              >
                +{moreTagsCount}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-5 pt-0 relative z-0">
        <div className="flex items-center text-[10px] text-muted-foreground/60 gap-1.5 w-full pt-4 border-t border-[#2a2a2a]">
          <Calendar className="h-3 w-3" />
          Cliente desde{' '}
          {client.created_at
            ? format(new Date(client.created_at), 'dd/MM/yyyy')
            : '-'}
        </div>
      </CardFooter>
    </Card>
  )
})

ClientCard.displayName = 'ClientCard'
