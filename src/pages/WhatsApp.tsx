import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCcw, Smartphone, MessageSquare } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'

export default function WhatsApp() {
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleConnect = () => {
    setLoading(true)
    // Simulate connection delay
    setTimeout(() => {
      setLoading(false)
      setIsConnected(true)
      toast({
        title: 'Sucesso',
        description: 'WhatsApp conectado com sucesso.',
        className: 'border-primary text-foreground bg-background',
      })
    }, 2000)
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    toast({
      title: 'Desconectado',
      description: 'Sessão do WhatsApp encerrada.',
      variant: 'destructive',
    })
  }

  const chats = [
    {
      id: 1,
      name: 'João Silva',
      message: 'Gostaria de agendar uma consultoria...',
      time: '10:30',
      unread: 2,
    },
    {
      id: 2,
      name: 'Maria Souza',
      message: 'Obrigado pelo relatório!',
      time: 'Ontem',
      unread: 0,
    },
    {
      id: 3,
      name: 'Empresa X',
      message: 'Podemos rever o contrato?',
      time: 'Ontem',
      unread: 0,
    },
    {
      id: 4,
      name: 'Carlos Oliveira',
      message: 'Confirmado para amanhã.',
      time: 'Terça',
      unread: 1,
    },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1 bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Status da Conexão
              <Badge
                variant={isConnected ? 'default' : 'destructive'}
                className={isConnected ? 'bg-green-500 hover:bg-green-600' : ''}
              >
                {isConnected ? 'Conectado' : 'Desconectado'}
              </Badge>
            </CardTitle>
            <CardDescription>
              Gerencie a conexão do seu dispositivo WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            {!isConnected ? (
              <div className="text-center space-y-4">
                {loading ? (
                  <Skeleton className="h-48 w-48 mx-auto rounded-xl" />
                ) : (
                  <div className="h-48 w-48 mx-auto bg-white p-2 rounded-xl flex items-center justify-center">
                    {/* Placeholder QR Code */}
                    <img
                      src="https://img.usecurling.com/i?q=qr-code&color=black"
                      alt="QR Code"
                      className="w-full h-full object-contain opacity-90"
                    />
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Escaneie o QR Code com seu WhatsApp
                </p>
                <Button
                  onClick={handleConnect}
                  disabled={loading}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 w-full max-w-xs"
                >
                  {loading ? (
                    <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Smartphone className="mr-2 h-4 w-4" />
                  )}
                  {loading ? 'Conectando...' : 'Gerar Novo QR Code'}
                </Button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="h-24 w-24 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
                  <Smartphone className="h-12 w-12 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-foreground">
                    Dispositivo Conectado
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Elite Manager Web (Chrome)
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleDisconnect}
                  className="w-full max-w-xs"
                >
                  Desconectar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex-1 md:flex-[1.5] bg-card border-border">
          <CardHeader>
            <CardTitle>Conversas Recentes</CardTitle>
            <CardDescription>Últimas interações processadas</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <div className="space-y-1">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className="flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer border-l-2 border-transparent hover:border-primary"
                >
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <span className="font-semibold text-primary">
                      {chat.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground truncate">
                        {chat.name}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {chat.time}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                      {chat.message}
                    </p>
                  </div>
                  {chat.unread > 0 && (
                    <Badge className="bg-primary text-primary-foreground h-5 w-5 rounded-full flex items-center justify-center p-0 text-[10px]">
                      {chat.unread}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-border mt-2">
              <Button
                variant="outline"
                className="w-full text-primary border-primary/50 hover:bg-primary/10 hover:text-primary"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Ver todas as conversas
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
