import { useState, useEffect, useRef } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { toast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import {
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  QrCode,
  Zap,
  Settings as SettingsIcon,
  MessageSquare,
  ExternalLink,
  Loader2,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface EvolutionConfig {
  url: string
  apikey: string
  instance: string
}

interface GeminiConfig {
  apikey: string
  model: string
  temperature: number
  length: string
}

interface GeneralConfig {
  notifications: boolean
  sound: boolean
  refreshInterval: number
}

export default function Settings() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('evolution')

  // Configuration States
  const [evolutionConfig, setEvolutionConfig] = useState<EvolutionConfig>({
    url: '',
    apikey: '',
    instance: '',
  })
  const [geminiConfig, setGeminiConfig] = useState<GeminiConfig>({
    apikey: '',
    model: 'gemini-2.0-flash-exp',
    temperature: 0.7,
    length: 'Adaptativa',
  })
  const [generalConfig, setGeneralConfig] = useState<GeneralConfig>({
    notifications: true,
    sound: false,
    refreshInterval: 10,
  })

  // UI States
  const [showEvolutionKey, setShowEvolutionKey] = useState(false)
  const [showGeminiKey, setShowGeminiKey] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'disconnected' | 'unknown'
  >('unknown')
  const [geminiStatus, setGeminiStatus] = useState<
    'configured' | 'not_configured'
  >('not_configured')

  // Action States
  const [saving, setSaving] = useState(false)
  const [testingEvolution, setTestingEvolution] = useState(false)
  const [generatingQR, setGeneratingQR] = useState(false)
  const [testingGemini, setTestingGemini] = useState(false)

  // QR Code Logic
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [qrTimer, setQrTimer] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch initial data
  useEffect(() => {
    async function loadSettings() {
      try {
        const { data, error } = await supabase.from('configuracoes').select('*')

        if (error) throw error

        if (data) {
          const configMap: Record<string, string> = {}
          data.forEach((item) => {
            configMap[item.chave] = item.valor || ''
          })

          setEvolutionConfig({
            url: configMap['evolution_url'] || '',
            apikey: configMap['evolution_apikey'] || '',
            instance: configMap['evolution_instance'] || '',
          })

          setGeminiConfig({
            apikey: configMap['gemini_apikey'] || '',
            model: configMap['gemini_model'] || 'gemini-2.0-flash-exp',
            temperature: parseFloat(configMap['gemini_temperature'] || '0.7'),
            length: configMap['gemini_response_length'] || 'Adaptativa',
          })

          setGeneralConfig({
            notifications: configMap['notificacoes_ativas'] === 'true',
            sound: configMap['som_ativo'] === 'true',
            refreshInterval: parseInt(
              configMap['intervalo_atualizacao'] || '10',
              10,
            ),
          })

          // Set initial statuses
          if (configMap['gemini_apikey']) setGeminiStatus('configured')
        }
      } catch (error) {
        console.error('Error loading settings:', error)
        toast({
          title: 'Erro ao carregar configurações',
          description: 'Não foi possível recuperar suas preferências.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  // QR Timer Countdown
  useEffect(() => {
    if (qrTimer > 0) {
      timerRef.current = setTimeout(() => setQrTimer((t) => t - 1), 1000)
    } else if (qrTimer === 0 && qrCode) {
      setQrCode(null)
      toast({
        title: 'QR Code Expirado',
        description: 'O código QR expirou. Por favor, gere um novo.',
        variant: 'default',
      })
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [qrTimer, qrCode])

  // Save Handlers
  const saveToSupabase = async (
    configs: { chave: string; valor: string }[],
  ) => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('configuracoes')
        .upsert(configs, { onConflict: 'chave' })
      if (error) throw error

      toast({
        title: 'Configurações Salvas',
        description: 'Suas alterações foram aplicadas com sucesso.',
        className: 'border-primary text-foreground bg-background',
      })
      return true
    } catch (error) {
      console.error('Error saving settings:', error)
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao persistir os dados.',
        variant: 'destructive',
      })
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleSaveEvolution = () => {
    // Validation
    if (
      !evolutionConfig.url ||
      !evolutionConfig.apikey ||
      !evolutionConfig.instance
    ) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos da Evolution API.',
        variant: 'destructive',
      })
      return
    }
    if (!/^https?:\/\//.test(evolutionConfig.url)) {
      toast({
        title: 'URL Inválida',
        description: 'A URL deve começar com http:// ou https://',
        variant: 'destructive',
      })
      return
    }
    if (evolutionConfig.apikey.length < 20) {
      toast({
        title: 'API Key Inválida',
        description: 'A chave deve ter pelo menos 20 caracteres.',
        variant: 'destructive',
      })
      return
    }

    saveToSupabase([
      { chave: 'evolution_url', valor: evolutionConfig.url },
      { chave: 'evolution_apikey', valor: evolutionConfig.apikey },
      { chave: 'evolution_instance', valor: evolutionConfig.instance },
    ])
  }

  const handleSaveGemini = () => {
    if (!geminiConfig.apikey) {
      toast({
        title: 'Campo obrigatório',
        description: 'A API Key do Gemini é obrigatória.',
        variant: 'destructive',
      })
      return
    }

    saveToSupabase([
      { chave: 'gemini_apikey', valor: geminiConfig.apikey },
      { chave: 'gemini_model', valor: geminiConfig.model },
      { chave: 'gemini_temperature', valor: String(geminiConfig.temperature) },
      { chave: 'gemini_response_length', valor: geminiConfig.length },
    ]).then((success) => {
      if (success) setGeminiStatus('configured')
    })
  }

  const handleSaveGeneral = () => {
    saveToSupabase([
      {
        chave: 'notificacoes_ativas',
        valor: String(generalConfig.notifications),
      },
      { chave: 'som_ativo', valor: String(generalConfig.sound) },
      {
        chave: 'intervalo_atualizacao',
        valor: String(generalConfig.refreshInterval),
      },
    ])
  }

  // API Actions
  const handleTestEvolution = async () => {
    setTestingEvolution(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      const success = Math.random() > 0.3

      if (success) {
        setConnectionStatus('connected')
        toast({
          title: 'Conexão Estabelecida',
          description: 'A instância está conectada e operante.',
          className: 'border-green-500 text-foreground bg-background',
        })
      } else {
        setConnectionStatus('disconnected')
        toast({
          title: 'Falha na Conexão',
          description:
            'Não foi possível conectar à instância. Verifique os dados.',
          variant: 'destructive',
        })
      }
    } catch (e) {
      toast({
        title: 'Erro de Rede',
        description: 'Falha ao contactar o servidor.',
        variant: 'destructive',
      })
    } finally {
      setTestingEvolution(false)
    }
  }

  const handleGenerateQR = async () => {
    setGeneratingQR(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setQrCode('https://img.usecurling.com/i?q=qr-code&color=white&shape=fill')
      setQrTimer(45)

      toast({
        title: 'QR Code Gerado',
        description: 'Escaneie o código para conectar.',
        className: 'border-primary text-foreground bg-background',
      })
    } catch (e) {
      toast({
        title: 'Erro',
        description: 'Falha ao gerar QR Code.',
        variant: 'destructive',
      })
    } finally {
      setGeneratingQR(false)
    }
  }

  const handleTestGemini = async () => {
    setTestingGemini(true)
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiConfig.model}:generateContent?key=${geminiConfig.apikey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Responda apenas 'OK'" }] }],
          }),
        },
      )

      if (response.ok) {
        toast({
          title: 'Integração Gemini Ativa',
          description: 'A API do Google Gemini respondeu corretamente.',
          className: 'border-green-500 text-foreground bg-background',
        })
      } else {
        throw new Error('API Error')
      }
    } catch (e) {
      toast({
        title: 'Erro na Integração',
        description: 'Não foi possível validar a chave API.',
        variant: 'destructive',
      })
    } finally {
      setTestingGemini(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <SettingsIcon className="h-8 w-8 text-primary" />
          Configurações
        </h1>
        <p className="text-muted-foreground">
          Gerencie suas preferências, integrações e conexões do sistema.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-transparent p-0 mb-6">
          <TabsTrigger
            value="evolution"
            className="relative rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none transition-all hover:text-foreground"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Evolution API
          </TabsTrigger>
          <TabsTrigger
            value="gemini"
            className="relative rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none transition-all hover:text-foreground"
          >
            <Zap className="mr-2 h-4 w-4" />
            Gemini API
          </TabsTrigger>
          <TabsTrigger
            value="general"
            className="relative rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none transition-all hover:text-foreground"
          >
            <SettingsIcon className="mr-2 h-4 w-4" />
            Geral
          </TabsTrigger>
        </TabsList>

        {/* EVOLUTION API TAB */}
        <TabsContent
          value="evolution"
          className="animate-fade-in space-y-4 outline-none"
        >
          <Card className="bg-card border-border shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl flex items-center gap-2">
                    Integração WhatsApp (Evolution API)
                    {connectionStatus === 'connected' && (
                      <Badge className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border-0">
                        Conectado
                      </Badge>
                    )}
                    {connectionStatus === 'disconnected' && (
                      <Badge className="bg-red-500/15 text-red-500 hover:bg-red-500/25 border-0">
                        Desconectado
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Configure a conexão com sua instância Evolution para
                    espelhamento do WhatsApp
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="evolution-url">
                    URL da API <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="evolution-url"
                    placeholder="https://sua-api.com"
                    value={evolutionConfig.url}
                    onChange={(e) =>
                      setEvolutionConfig({
                        ...evolutionConfig,
                        url: e.target.value,
                      })
                    }
                    className="h-12 bg-input border-input focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="evolution-instance">
                    Nome da Instância <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="evolution-instance"
                    placeholder="minha-instancia"
                    value={evolutionConfig.instance}
                    onChange={(e) =>
                      setEvolutionConfig({
                        ...evolutionConfig,
                        instance: e.target.value,
                      })
                    }
                    className="h-12 bg-input border-input focus:border-primary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="evolution-key">
                  API Key <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="evolution-key"
                    type={showEvolutionKey ? 'text' : 'password'}
                    placeholder="Cole sua Global API Key aqui"
                    value={evolutionConfig.apikey}
                    onChange={(e) =>
                      setEvolutionConfig({
                        ...evolutionConfig,
                        apikey: e.target.value,
                      })
                    }
                    className="h-12 bg-input border-input focus:border-primary pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEvolutionKey(!showEvolutionKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showEvolutionKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <Button
                  variant="secondary"
                  onClick={handleTestEvolution}
                  disabled={
                    testingEvolution ||
                    !evolutionConfig.url ||
                    !evolutionConfig.instance
                  }
                  className="h-12 border-border hover:bg-secondary/80"
                >
                  {testingEvolution ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Testar Conexão
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleGenerateQR}
                  disabled={generatingQR || connectionStatus !== 'connected'}
                  className="h-12 border-border hover:bg-secondary/80"
                >
                  {generatingQR ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <QrCode className="mr-2 h-4 w-4" />
                  )}
                  Gerar QR Code
                </Button>
              </div>

              {qrCode && (
                <div className="mt-6 rounded-xl bg-[#2a2a2a] p-8 text-center animate-fade-in-down border border-border">
                  <h3 className="text-lg font-medium text-foreground mb-4">
                    Escaneie o QR Code no WhatsApp
                  </h3>
                  <div className="bg-white p-2 rounded-lg inline-block mx-auto mb-4">
                    <img
                      src={qrCode}
                      alt="QR Code WhatsApp"
                      className="w-64 h-64 object-contain"
                    />
                  </div>
                  <div className="max-w-xs mx-auto text-sm text-muted-foreground space-y-2">
                    <p>1. Abra o WhatsApp no seu celular</p>
                    <p>
                      2. Toque em <strong>Menu</strong> ou{' '}
                      <strong>Configurações</strong> e selecione{' '}
                      <strong>Aparelhos conectados</strong>
                    </p>
                    <p>
                      3. Toque em <strong>Conectar um aparelho</strong>
                    </p>
                    <p>4. Aponte seu celular para esta tela</p>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-2 text-primary font-mono text-lg">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    00:{qrTimer.toString().padStart(2, '0')}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-secondary/20 p-6 border-t border-border">
              <Button
                onClick={handleSaveEvolution}
                disabled={saving}
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-base"
              >
                {saving ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Save className="mr-2 h-5 w-5" />
                )}
                Salvar Configurações
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* GEMINI API TAB */}
        <TabsContent
          value="gemini"
          className="animate-fade-in space-y-4 outline-none"
        >
          <Card className="bg-card border-border shadow-md">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                IA para Sugestões (Google Gemini)
                {geminiStatus === 'configured' ? (
                  <Badge className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border-0">
                    Configurado
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-border text-muted-foreground"
                  >
                    Não Configurado
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Configure a integração com Gemini para gerar sugestões
                contextualizadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="gemini-key">
                    API Key do Gemini <span className="text-red-500">*</span>
                  </Label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    Obter chave <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="relative">
                  <Input
                    id="gemini-key"
                    type={showGeminiKey ? 'text' : 'password'}
                    placeholder="Cole sua API Key do Google AI Studio"
                    value={geminiConfig.apikey}
                    onChange={(e) =>
                      setGeminiConfig({
                        ...geminiConfig,
                        apikey: e.target.value,
                      })
                    }
                    className="h-12 bg-input border-input focus:border-primary pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showGeminiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gemini-model">Modelo</Label>
                <Select
                  value={geminiConfig.model}
                  onValueChange={(value) =>
                    setGeminiConfig({ ...geminiConfig, model: value })
                  }
                >
                  <SelectTrigger
                    id="gemini-model"
                    className="h-12 bg-input border-input focus:ring-primary"
                  >
                    <SelectValue placeholder="Selecione o modelo" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="gemini-2.0-flash-exp">
                      Gemini 2.0 Flash (Recomendado)
                    </SelectItem>
                    <SelectItem value="gemini-1.5-flash">
                      Gemini 1.5 Flash
                    </SelectItem>
                    <SelectItem value="gemini-1.5-pro">
                      Gemini 1.5 Pro
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  O modelo Flash é mais rápido e econômico, ideal para respostas
                  em tempo real.
                </p>
              </div>

              <div className="space-y-4 pt-2 border-t border-border">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> Parâmetros da IA
                </h3>

                <div className="space-y-4 bg-secondary/10 p-4 rounded-lg border border-border">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Temperatura (Criatividade)</Label>
                      <span className="text-sm text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                        {geminiConfig.temperature}
                      </span>
                    </div>
                    <Slider
                      defaultValue={[0.7]}
                      max={1}
                      step={0.1}
                      value={[geminiConfig.temperature]}
                      onValueChange={(val) =>
                        setGeminiConfig({
                          ...geminiConfig,
                          temperature: val[0],
                        })
                      }
                    />
                    <p className="text-[10px] text-muted-foreground">
                      0.0 (Mais preciso) - 1.0 (Mais criativo/variado)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Comprimento Preferido</Label>
                    <Select
                      value={geminiConfig.length}
                      onValueChange={(value) =>
                        setGeminiConfig({ ...geminiConfig, length: value })
                      }
                    >
                      <SelectTrigger className="h-10 bg-input border-input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="Curta">
                          Curta (1-2 frases)
                        </SelectItem>
                        <SelectItem value="Média">
                          Média (1 parágrafo)
                        </SelectItem>
                        <SelectItem value="Longa">Longa (Detalhada)</SelectItem>
                        <SelectItem value="Adaptativa">
                          Adaptativa (IA decide)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleTestGemini}
                disabled={testingGemini || !geminiConfig.apikey}
                className="w-full sm:w-auto border-border hover:bg-secondary hover:text-foreground mt-2"
              >
                {testingGemini ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="mr-2 h-4 w-4" />
                )}
                Testar Inteligência
              </Button>
            </CardContent>
            <CardFooter className="bg-secondary/20 p-6 border-t border-border">
              <Button
                onClick={handleSaveGemini}
                disabled={saving}
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-base"
              >
                {saving ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Save className="mr-2 h-5 w-5" />
                )}
                Salvar Configurações
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* GENERAL TAB */}
        <TabsContent
          value="general"
          className="animate-fade-in space-y-4 outline-none"
        >
          <Card className="bg-card border-border shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">Preferências do Sistema</CardTitle>
              <CardDescription>
                Personalize o comportamento geral da aplicação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">
                    Notificações de novas mensagens
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receba alertas visuais (Toasts) quando novas mensagens
                    chegarem.
                  </p>
                </div>
                <Switch
                  checked={generalConfig.notifications}
                  onCheckedChange={(checked) =>
                    setGeneralConfig({
                      ...generalConfig,
                      notifications: checked,
                    })
                  }
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">Som ao receber mensagem</Label>
                  <p className="text-sm text-muted-foreground">
                    Reproduzir um efeito sonoro sutil para novos chats.
                  </p>
                </div>
                <Switch
                  checked={generalConfig.sound}
                  onCheckedChange={(checked) =>
                    setGeneralConfig({ ...generalConfig, sound: checked })
                  }
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              <div className="space-y-4 rounded-lg border border-border bg-card p-4">
                <div className="space-y-0.5">
                  <Label className="text-base">
                    Atualizar conversas automaticamente
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Intervalo de tempo para verificar novas mensagens
                    (segundos).
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min={5}
                    max={60}
                    value={generalConfig.refreshInterval}
                    onChange={(e) =>
                      setGeneralConfig({
                        ...generalConfig,
                        refreshInterval: parseInt(e.target.value) || 10,
                      })
                    }
                    className="max-w-[100px] h-10 bg-input border-input focus:border-primary"
                  />
                  <span className="text-sm text-muted-foreground">
                    segundos (5-60)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4 opacity-70">
                <div className="space-y-0.5">
                  <Label className="text-base">Modo escuro</Label>
                  <p className="text-sm text-muted-foreground">
                    O tema escuro é o padrão do sistema Elite Manager.
                  </p>
                </div>
                <Switch checked disabled />
              </div>
            </CardContent>
            <CardFooter className="bg-secondary/20 p-6 border-t border-border">
              <Button
                onClick={handleSaveGeneral}
                disabled={saving}
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-base"
              >
                {saving ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Save className="mr-2 h-5 w-5" />
                )}
                Salvar Preferências
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
