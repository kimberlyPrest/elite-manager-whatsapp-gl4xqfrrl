import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Filter, MoreHorizontal } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from '@/hooks/use-toast'

type Client = {
  id: string
  name: string
  phone: string
  status: 'Ativo' | 'Arquivado' | 'Aguardando'
  lastInteraction: string
  plan: string
}

const initialClients: Client[] = [
  {
    id: '1',
    name: 'João Silva',
    phone: '+55 11 99999-0001',
    status: 'Ativo',
    lastInteraction: '10/05/2024',
    plan: 'Premium',
  },
  {
    id: '2',
    name: 'Maria Souza',
    phone: '+55 11 99999-0002',
    status: 'Aguardando',
    lastInteraction: '08/05/2024',
    plan: 'Standard',
  },
  {
    id: '3',
    name: 'Carlos Oliveira',
    phone: '+55 11 99999-0003',
    status: 'Arquivado',
    lastInteraction: '01/04/2024',
    plan: 'Basic',
  },
  {
    id: '4',
    name: 'Fernanda Lima',
    phone: '+55 11 99999-0004',
    status: 'Ativo',
    lastInteraction: '12/05/2024',
    plan: 'Premium',
  },
  {
    id: '5',
    name: 'Roberto Santos',
    phone: '+55 11 99999-0005',
    status: 'Ativo',
    lastInteraction: '11/05/2024',
    plan: 'Standard',
  },
]

export default function Clients() {
  const [clients] = useState<Client[]>(initialClients)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.phone.includes(searchTerm),
  )

  const handleAddClient = () => {
    toast({
      title: 'Funcionalidade em desenvolvimento',
      description: 'A criação de clientes será implementada na próxima versão.',
      className: 'border-primary text-foreground bg-background',
    })
  }

  const getStatusColor = (status: Client['status']) => {
    switch (status) {
      case 'Ativo':
        return 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
      case 'Aguardando':
        return 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30'
      case 'Arquivado':
        return 'bg-gray-500/20 text-gray-400 hover:bg-gray-500/30'
      default:
        return 'bg-secondary'
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Gestão de Clientes
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie sua base de contatos e status de consultoria
          </p>
        </div>
        <Button
          onClick={handleAddClient}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Cliente
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
            <CardTitle>Base de Clientes</CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por nome ou telefone..."
                  className="pl-9 bg-background border-border focus-visible:ring-primary"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 border-border text-foreground hover:bg-secondary"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader className="bg-secondary/50">
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-muted-foreground">Nome</TableHead>
                  <TableHead className="text-muted-foreground">
                    Telefone
                  </TableHead>
                  <TableHead className="text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="text-muted-foreground">Plano</TableHead>
                  <TableHead className="text-muted-foreground">
                    Última Interação
                  </TableHead>
                  <TableHead className="text-right text-muted-foreground">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length > 0 ? (
                  filteredClients.map((client) => (
                    <TableRow
                      key={client.id}
                      className="border-border hover:bg-secondary/30"
                    >
                      <TableCell className="font-medium text-foreground">
                        {client.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {client.phone}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(client.status)}>
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-foreground">
                        {client.plan}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {client.lastInteraction}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                            >
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-popover border-border text-popover-foreground"
                          >
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem className="focus:bg-secondary focus:text-primary">
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem className="focus:bg-secondary focus:text-primary">
                              Editar Cliente
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-border" />
                            <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                              Arquivar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Nenhum cliente encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
