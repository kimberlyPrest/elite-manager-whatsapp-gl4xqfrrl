import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, UserPlus, Users } from 'lucide-react'
import {
  getClients,
  getClientCounts,
  Client,
  ClientFilter,
} from '@/services/clients'
import { ClientCard } from '@/components/clients/ClientCard'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState<ClientFilter>('Todos')
  const [counts, setCounts] = useState<Record<string, number>>({
    Todos: 0,
    Elite: 0,
    Scale: 0,
    Labs: 0,
    Venda: 0,
    Pendente: 0,
  })

  const debouncedSearch = useDebounce(searchTerm, 300)

  // Fetch Counts once on mount
  useEffect(() => {
    getClientCounts()
      .then(setCounts)
      .catch((err) => console.error('Failed to fetch counts', err))
  }, [])

  // Fetch Clients when filter or search changes
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const data = await getClients(debouncedSearch, activeFilter)
        setClients(data)
      } catch (error) {
        toast({
          title: 'Erro ao carregar clientes',
          description: 'Não foi possível buscar os dados. Tente novamente.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [debouncedSearch, activeFilter])

  const filters: ClientFilter[] = [
    'Todos',
    'Elite',
    'Scale',
    'Labs',
    'Venda',
    'Pendente',
  ]

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto min-h-[calc(100vh-4rem)] flex flex-col">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-white tracking-tight">
            Clientes
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {counts['Todos']} clientes cadastrados
          </p>
        </div>
        <Button className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-semibold shadow-lg transition-all">
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      {/* 2. Search & Filter System */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou e-mail..."
            className="pl-10 h-11 bg-[#1a1a1a] border-[#3a3a3a] text-white focus:ring-[#FFD700]/50 focus:border-[#FFD700]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Horizontal Quick Filter Pills */}
        <div className="flex flex-wrap gap-2 pb-2">
          {filters.map((filter) => {
            const isActive = activeFilter === filter
            const count = counts[filter] || 0

            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  'flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border',
                  isActive
                    ? 'bg-[#FFD700]/20 border-[#FFD700] text-[#FFD700]'
                    : 'bg-transparent border-[#3a3a3a] text-gray-400 hover:border-gray-500 hover:text-white',
                )}
              >
                {filter === 'Pendente' ? 'Pendente Classificação' : filter}
                <span
                  className={cn(
                    'text-xs ml-0.5',
                    isActive ? 'text-[#FFD700]/80' : 'text-gray-600',
                  )}
                >
                  ({count})
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Responsive Client Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 space-y-4 h-[220px]"
            >
              <div className="flex justify-between">
                <Skeleton className="h-5 w-32 bg-[#2a2a2a]" />
                <Skeleton className="h-5 w-16 bg-[#2a2a2a]" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-40 bg-[#2a2a2a]" />
                <Skeleton className="h-4 w-48 bg-[#2a2a2a]" />
              </div>
              <div className="pt-2 flex gap-2">
                <Skeleton className="h-5 w-16 bg-[#2a2a2a]" />
                <Skeleton className="h-5 w-16 bg-[#2a2a2a]" />
              </div>
              <div className="pt-4 mt-auto">
                <Skeleton className="h-4 w-full bg-[#2a2a2a]" />
              </div>
            </div>
          ))}
        </div>
      ) : clients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-fade-in">
          {clients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex-1 flex flex-col items-center justify-center text-center py-20 border-2 border-dashed border-[#2a2a2a] rounded-xl bg-[#1a1a1a]/50">
          <div className="h-20 w-20 rounded-full bg-[#2a2a2a] flex items-center justify-center mb-6">
            <Users className="h-10 w-10 text-[#4a4a4a]" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Nenhum cliente encontrado
          </h3>
          <p className="text-muted-foreground max-w-sm mb-8">
            Não encontramos resultados para sua busca ou filtro. Tente ajustar
            os termos ou cadastre um novo cliente.
          </p>
          <Button className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-semibold">
            Cadastrar Primeiro Cliente
          </Button>
        </div>
      )}
    </div>
  )
}
