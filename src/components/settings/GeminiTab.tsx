import { useState, useEffect } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import {
  Zap,
  Sparkles,
  ExternalLink,
  Eye,
  EyeOff,
  Save,
  Loader2,
} from 'lucide-react'

export interface GeminiConfig {
  apikey: string
  model: string
  temperature: number
  length: string
}

interface GeminiTabProps {
  initialConfig: GeminiConfig
  onSave: (config: GeminiConfig) => Promise<boolean>
}

export function GeminiTab({ initialConfig, onSave }: GeminiTabProps) {
  const [config, setConfig] = useState<GeminiConfig>(initialConfig)
  const [showKey, setShowKey] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isConfigured, setIsConfigured] = useState(!!initialConfig.apikey)

  useEffect(() => {
    setConfig(initialConfig)
    setIsConfigured(!!initialConfig.apikey)
  }, [initialConfig])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const success = await onSave(config)
      if (success) setIsConfigured(!!config.apikey)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = async () => {
    if (!config.apikey) return
    setIsTesting(true)
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apikey}`,
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
          title: 'Sucesso!',
          description: 'A API do Gemini respondeu corretamente.',
          className: 'bg-green-500 text-white',
        })
      } else {
        throw new Error('API Error')
      }
    } catch (e) {
      toast({
        title: 'Erro no Teste',
        description: 'Verifique a API Key e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <Card className="bg-[#1a1a1a] border-[#333] shadow-md">
      <CardHeader>
        <CardTitle className="text-xl text-white flex items-center gap-2">
          IA do Google Gemini
          {isConfigured ? (
            <Badge className="bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25 border-0">
              Configurado
            </Badge>
          ) : (
            <Badge variant="outline" className="text-gray-500 border-gray-700">
              Não Configurado
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-gray-400">
          Personalize as sugestões de resposta automática.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="gemini-key" className="text-gray-300">
              API Key <span className="text-red-500">*</span>
            </Label>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              className="text-xs text-[#FFD700] hover:underline flex items-center gap-1"
            >
              Obter chave <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="relative">
            <Input
              id="gemini-key"
              type={showKey ? 'text' : 'password'}
              value={config.apikey}
              onChange={(e) => setConfig({ ...config, apikey: e.target.value })}
              placeholder="Cole sua API Key do Google AI Studio"
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

        <div className="space-y-2">
          <Label className="text-gray-300">Modelo</Label>
          <Select
            value={config.model}
            onValueChange={(v) => setConfig({ ...config, model: v })}
          >
            <SelectTrigger className="bg-[#111] border-[#333] text-white">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1a] border-[#333] text-white">
              <SelectItem value="gemini-2.0-flash-exp">
                Gemini 2.0 Flash (Rápido)
              </SelectItem>
              <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
              <SelectItem value="gemini-1.5-pro">
                Gemini 1.5 Pro (Mais Inteligente)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4 pt-4 border-t border-[#333]">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#FFD700]" /> Parâmetros
          </h3>
          <div className="space-y-6 bg-[#111] p-4 rounded-lg border border-[#333]">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label className="text-gray-400 text-xs">
                  Criatividade (Temperatura)
                </Label>
                <span className="text-xs text-[#FFD700] font-mono">
                  {config.temperature}
                </span>
              </div>
              <Slider
                defaultValue={[0.7]}
                max={1}
                step={0.1}
                value={[config.temperature]}
                onValueChange={(v) =>
                  setConfig({ ...config, temperature: v[0] })
                }
                className="[&>span:first-child]:bg-[#333] [&_[role=slider]]:bg-[#FFD700] [&_[role=slider]]:border-[#FFD700]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400 text-xs">
                Tamanho da Resposta
              </Label>
              <Select
                value={config.length}
                onValueChange={(v) => setConfig({ ...config, length: v })}
              >
                <SelectTrigger className="h-8 bg-[#1a1a1a] border-[#333] text-xs text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#333] text-white">
                  <SelectItem value="Curta">Curta</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Longa">Longa</SelectItem>
                  <SelectItem value="Adaptativa">Adaptativa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={handleTest}
          disabled={isTesting || !config.apikey}
          className="w-full border-[#333] text-gray-300 hover:text-white hover:bg-[#222]"
        >
          {isTesting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Zap className="mr-2 h-4 w-4 text-[#FFD700]" />
          )}
          Testar Inteligência
        </Button>
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
