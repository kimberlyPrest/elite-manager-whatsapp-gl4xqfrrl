import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Save, Loader2 } from 'lucide-react'

export interface GeneralConfig {
  notifications: boolean
  sound: boolean
  refreshInterval: number
}

interface GeneralTabProps {
  initialConfig: GeneralConfig
  onSave: (config: GeneralConfig) => Promise<boolean>
}

export function GeneralTab({ initialConfig, onSave }: GeneralTabProps) {
  const [config, setConfig] = useState<GeneralConfig>(initialConfig)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setConfig(initialConfig)
  }, [initialConfig])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(config)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="bg-[#1a1a1a] border-[#333] shadow-md">
      <CardHeader>
        <CardTitle className="text-xl text-white">Preferências</CardTitle>
        <CardDescription className="text-gray-400">
          Ajustes gerais do sistema.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-4 rounded-lg bg-[#111] border border-[#333]">
          <div className="space-y-1">
            <Label className="text-white text-base">Notificações Visuais</Label>
            <p className="text-sm text-gray-500">
              Exibir alertas (Toasts) quando chegarem mensagens.
            </p>
          </div>
          <Switch
            checked={config.notifications}
            onCheckedChange={(v) => setConfig({ ...config, notifications: v })}
            className="data-[state=checked]:bg-[#FFD700]"
          />
        </div>

        <div className="flex items-center justify-between p-4 rounded-lg bg-[#111] border border-[#333]">
          <div className="space-y-1">
            <Label className="text-white text-base">Efeitos Sonoros</Label>
            <p className="text-sm text-gray-500">
              Tocar som sutil ao receber nova mensagem.
            </p>
          </div>
          <Switch
            checked={config.sound}
            onCheckedChange={(v) => setConfig({ ...config, sound: v })}
            className="data-[state=checked]:bg-[#FFD700]"
          />
        </div>

        <div className="space-y-3 p-4 rounded-lg bg-[#111] border border-[#333]">
          <Label className="text-white text-base">Atualização Automática</Label>
          <div className="flex items-center gap-4">
            <Input
              type="number"
              min={5}
              max={60}
              value={config.refreshInterval}
              onChange={(e) =>
                setConfig({
                  ...config,
                  refreshInterval: parseInt(e.target.value) || 10,
                })
              }
              className="w-24 bg-[#1a1a1a] border-[#333] text-white focus:border-[#FFD700]"
            />
            <span className="text-sm text-gray-500">segundos (5-60s)</span>
          </div>
          <p className="text-xs text-gray-600">
            Intervalo para buscar novas mensagens no servidor.
          </p>
        </div>
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
          Salvar Preferências
        </Button>
      </CardFooter>
    </Card>
  )
}
