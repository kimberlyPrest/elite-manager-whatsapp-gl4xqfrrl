import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import {
  Loader2,
  RefreshCw,
  QrCode,
  Wifi,
  WifiOff,
  Power,
  CheckCircle2,
  Eye,
  EyeOff,
  Save,
  AlertTriangle,
  Database,
  Radio,
} from 'lucide-react'
import {
  EvolutionConfig,
  checkInstanceConnection,
  connectInstance,
  logoutInstance,
  configureWebhook,
  syncHistory,
} from '@/services/whatsapp'
import { QRCodeDisplay } from './QRCodeDisplay'

interface EvolutionTabProps {
  initialConfig: EvolutionConfig
  onSave: (config: EvolutionConfig) => Promise<boolean>
}

type ConnectionState =
  | 'open'
  | 'close'
  | 'connecting'
  | 'unknown'
  | 'error'
  | 'unauthorized'
  | 'not_found'

export function EvolutionTab({ initialConfig, onSave }: EvolutionTabProps) {
  const [config, setConfig] = useState<EvolutionConfig>(initialConfig)
  const [showKey, setShowKey] = useState(false)

  // Connection States
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('unknown')
  const [isChecking, setIsChecking] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isConfiguringWebhook, setIsConfiguringWebhook] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  // QR Code State
  const [qrCode, setQrCode] = useState<string | null>(null)

  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setConfig(initialConfig)
  }, [initialConfig])

  // Verify connection logic
  const verifyConnection = useCallback(
    async (cfg: EvolutionConfig, silent = true) => {
      if (!cfg.url || !cfg.apikey || !cfg.instance) return

      if (!silent) setIsChecking(true)
      try {
        const result = await checkInstanceConnection(cfg)
        const newState = result.state as ConnectionState
        setConnectionState(newState)

        if (!silent) {
          showMessageForState(newState)
        }
      } catch (error) {
        setConnectionState('error')
        if (!silent) {
          toast({
            title: 'Erro de Conexão',
            description: 'Não foi possível contactar o servidor.',
            variant: 'destructive',
          })
        }
      } finally {
        if (!silent) setIsChecking(false)
      }
    },
    [],
  )

  const showMessageForState = (state: ConnectionState) => {
    if (state === 'open') {
      toast({
        title: 'Conexão Estabelecida',
        description: 'A instância está online e pronta.',
        className: 'bg-green-500 text-white border-green-600',
      })
    } else if (state === 'close') {
      toast({
        title: 'Instância Desconectada',
        description: 'A instância existe mas não está conectada ao WhatsApp.',
        variant: 'default',
      })
    } else if (state === 'unauthorized') {
      toast({
        title: 'Erro de Autenticação',
        description: 'Verifique sua API Key.',
        variant: 'destructive',
      })
    } else if (state === 'not_found') {
      toast({
        title: 'Instância Não Encontrada',
        description: 'Verifique o nome da instância.',
        variant: 'destructive',
      })
    }
  }

  // Initial check
  useEffect(() => {
    if (initialConfig.url && initialConfig.instance) {
      verifyConnection(initialConfig, true)
    }
  }, [initialConfig, verifyConnection])

  // Polling Effect
  useEffect(() => {
    if (qrCode || connectionState === 'connecting') {
      pollingRef.current = setInterval(() => {
        verifyConnection(config, true)
      }, 3000)
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [qrCode, connectionState, config, verifyConnection])

  // Watch for connection success to clear QR
  useEffect(() => {
    if (connectionState === 'open' && qrCode) {
      setQrCode(null)
      toast({
        title: 'WhatsApp Conectado!',
        description: 'Dispositivo sincronizado com sucesso.',
        className: 'bg-green-500 text-white border-green-600',
      })
    }
  }, [connectionState, qrCode])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const success = await onSave(config)
      if (success) {
        verifyConnection(config, false)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleConnect = async () => {
    if (!config.url || !config.instance) return

    setIsConnecting(true)
    setQrCode(null) // Reset old QR

    try {
      const data = await connectInstance(config)

      if (data?.base64 || data?.qrcode?.base64) {
        setQrCode(data.base64 || data.qrcode.base64)
        setConnectionState('connecting')
        toast({
          title: 'QR Code Gerado',
          description: 'Escaneie o código com seu WhatsApp.',
        })
      } else if (data?.instance?.state === 'open' || data?.state === 'open') {
        setConnectionState('open')
        toast({
          title: 'Conectado',
          description: 'Instância já estava conectada.',
        })
      } else {
        // Fallback
        setConnectionState('connecting')
        toast({
          title: 'Solicitado',
          description: 'Aguardando resposta da instância...',
        })
      }
    } catch (e: any) {
      toast({
        title: 'Erro ao conectar',
        description: e.message || 'Falha na comunicação com a API.',
        variant: 'destructive',
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm('Tem certeza? Isso irá parar as automações.')) return

    setIsDisconnecting(true)
    try {
      await logoutInstance(config)
      setConnectionState('close')
      setQrCode(null)
      toast({ title: 'Desconectado', description: 'Instância desconectada.' })
    } catch (e: any) {
      toast({
        title: 'Erro',
        description:
          'Falha ao desconectar. Verifique se a instância está ativa.',
        variant: 'destructive',
      })
    } finally {
      setIsDisconnecting(false)
    }
  }

  const handleConfigureWebhook = async () => {
    setIsConfiguringWebhook(true)
    try {
      await configureWebhook(config)
      toast({
        title: 'Webhook Configurado',
        description: 'Recebimento de mensagens ativado com sucesso.',
        className: 'bg-green-500 text-white',
      })
    } catch (e: any) {
      toast({
        title: 'Erro no Webhook',
        description: e.message,
        variant: 'destructive',
      })
    } finally {
      setIsConfiguringWebhook(false)
    }
  }

  const handleSyncHistory = async () => {
    setIsSyncing(true)
    try {
      const result = await syncHistory(config)
      toast({
        title: 'Histórico Sincronizado',
        description: `${result.count} mensagens antigas foram importadas.`,
        className: 'bg-green-500 text-white',
      })
    } catch (e: any) {
      toast({
        title: 'Erro na Sincronização',
        description: e.message,
        variant: 'destructive',
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const getConnectionColor = (status: ConnectionState) => {
    switch (status) {
      case 'open':
        return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20'
      case 'close':
        return 'bg-yellow-500/15 text-yellow-500 border-yellow-500/20'
      case 'connecting':
        return 'bg-blue-500/15 text-blue-500 border-blue-500/20'
      case 'error':
      case 'unauthorized':
      case 'not_found':
        return 'bg-red-500/15 text-red-500 border-red-500/20'
      default:
        return 'bg-secondary text-muted-foreground'
    }
  }

  const getConnectionText = (status: ConnectionState) => {
    const map: Record<string, string> = {
      open: 'Conectado',
      close: 'Desconectado',
      connecting: 'Conectando...',
      unauthorized: 'Não Autorizado',
      not_found: 'Não Encontrada',
      error: 'Erro',
      unknown: 'Desconhecido',
    }
    return map[status] || status
  }

  return (
    <Card className="bg-[#1a1a1a] border-[#333] shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl text-white flex items-center gap-2">
              Integração WhatsApp
              <Badge
                variant="outline"
                className={getConnectionColor(connectionState)}
              >
                {isChecking ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : connectionState === 'open' ? (
                  <Wifi className="h-3 w-3 mr-1" />
                ) : (
                  <WifiOff className="h-3 w-3 mr-1" />
                )}
                {getConnectionText(connectionState)}
              </Badge>
            </CardTitle>
            <CardDescription className="text-gray-400">
              Configure a conexão com sua instância Evolution API.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="url" className="text-gray-300">
              URL da API <span className="text-red-500">*</span>
            </Label>
            <Input
              id="url"
              value={config.url}
              onChange={(e) => setConfig({ ...config, url: e.target.value })}
              placeholder="https://api.exemplo.com"
              className="bg-[#111] border-[#333] text-white focus:border-[#FFD700]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="instance" className="text-gray-300">
              Instância <span className="text-red-500">*</span>
            </Label>
            <Input
              id="instance"
              value={config.instance}
              onChange={(e) =>
                setConfig({ ...config, instance: e.target.value })
              }
              placeholder="nome-instancia"
              className="bg-[#111] border-[#333] text-white focus:border-[#FFD700]"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="apikey" className="text-gray-300">
            API Key <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Input
              id="apikey"
              type={showKey ? 'text' : 'password'}
              value={config.apikey}
              onChange={(e) => setConfig({ ...config, apikey: e.target.value })}
              placeholder="Sua Global API Key"
              className="bg-[#111] border-[#333] text-white focus:border-[#FFD700] pr-10"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Actions Area */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-[#333] mt-6">
          <Button
            variant="outline"
            onClick={() => verifyConnection(config, false)}
            disabled={isChecking || !config.url}
            className="flex-1 border-[#333] text-gray-300 hover:text-white hover:bg-[#222]"
          >
            {isChecking ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Testar Conexão
          </Button>

          {connectionState !== 'open' ? (
            <Button
              onClick={handleConnect}
              disabled={isConnecting || !config.url || !config.instance}
              className="flex-1 bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-semibold"
            >
              {isConnecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <QrCode className="mr-2 h-4 w-4" />
              )}
              Gerar QR Code
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="flex-1 bg-red-900/50 hover:bg-red-900 border border-red-900"
            >
              {isDisconnecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Power className="mr-2 h-4 w-4" />
              )}
              Desconectar
            </Button>
          )}
        </div>

        {/* Dynamic Content Area */}

        {/* QR Code Display Component */}
        {qrCode && connectionState !== 'open' && (
          <QRCodeDisplay
            qrCode={qrCode}
            onRefresh={handleConnect}
            loading={isConnecting}
          />
        )}

        {/* Error Feedback Display */}
        {connectionState === 'error' && !qrCode && (
          <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-red-400">
                Falha na Conexão
              </h4>
              <p className="text-xs text-red-300/80">
                Não foi possível conectar à instância. Verifique se a URL e a
                API Key estão corretas. Certifique-se de que a Evolution API
                está online e acessível.
              </p>
            </div>
          </div>
        )}

        {connectionState === 'open' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="mt-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0 shadow-lg shadow-emerald-900/20">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-semibold text-emerald-500 text-lg">
                  Sistema Online
                </h4>
                <p className="text-sm text-emerald-500/80">
                  Sua instância <strong>{config.instance}</strong> está conectada
                  e pronta para uso.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleConfigureWebhook}
                disabled={isConfiguringWebhook}
                variant="outline"
                className="flex-1 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400"
              >
                {isConfiguringWebhook ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Radio className="mr-2 h-4 w-4" />
                )}
                Configurar Webhook
              </Button>
              <Button
                onClick={handleSyncHistory}
                disabled={isSyncing}
                variant="outline"
                className="flex-1 border-blue-500/30 text-blue-500 hover:bg-blue-500/10 hover:text-blue-400"
              >
                {isSyncing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Database className="mr-2 h-4 w-4" />
                )}
                Sincronizar Histórico
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-[#111] p-6 border-t border-[#333]">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full h-12 bg-white text-black hover:bg-gray-200 font-bold text-base"
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Save className="mr-2 h-5 w-5" />
          )}
          Salvar Configurações
        </Button>
      </CardFooter>
    </Card>
  )
}
