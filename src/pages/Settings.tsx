import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import {
  Settings as SettingsIcon,
  MessageSquare,
  Zap,
  LayoutGrid,
} from 'lucide-react'
import { EvolutionTab } from '@/components/settings/EvolutionTab'
import { GeminiTab, GeminiConfig } from '@/components/settings/GeminiTab'
import { GeneralTab, GeneralConfig } from '@/components/settings/GeneralTab'
import { EvolutionConfig } from '@/services/whatsapp'

export default function Settings() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('evolution')

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
        }
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Falha ao carregar configurações.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const saveToSupabase = async (
    configs: { chave: string; valor: string }[],
  ) => {
    const { error } = await supabase
      .from('configuracoes')
      .upsert(configs, { onConflict: 'chave' })
    if (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao salvar.',
        variant: 'destructive',
      })
      return false
    }
    toast({
      title: 'Salvo',
      description: 'Configurações atualizadas com sucesso.',
      className: 'bg-green-500 text-white',
    })
    return true
  }

  const handleSaveEvolution = async (config: EvolutionConfig) => {
    const cleanUrl = config.url.trim().replace(/\/$/, '')
    const success = await saveToSupabase([
      { chave: 'evolution_url', valor: cleanUrl },
      { chave: 'evolution_apikey', valor: config.apikey },
      { chave: 'evolution_instance', valor: config.instance },
    ])
    if (success) setEvolutionConfig({ ...config, url: cleanUrl })
    return success
  }

  const handleSaveGemini = async (config: GeminiConfig) => {
    const success = await saveToSupabase([
      { chave: 'gemini_apikey', valor: config.apikey },
      { chave: 'gemini_model', valor: config.model },
      { chave: 'gemini_temperature', valor: String(config.temperature) },
      { chave: 'gemini_response_length', valor: config.length },
    ])
    if (success) setGeminiConfig(config)
    return success
  }

  const handleSaveGeneral = async (config: GeneralConfig) => {
    const success = await saveToSupabase([
      { chave: 'notificacoes_ativas', valor: String(config.notifications) },
      { chave: 'som_ativo', valor: String(config.sound) },
      { chave: 'intervalo_atualizacao', valor: String(config.refreshInterval) },
    ])
    if (success) setGeneralConfig(config)
    return success
  }

  if (loading) return null

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <SettingsIcon className="h-8 w-8 text-[#FFD700]" />
          Configurações
        </h1>
        <p className="text-gray-400">
          Gerencie integrações e preferências do sistema.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b border-[#333] bg-transparent p-0 mb-6">
          <TabsTrigger
            value="evolution"
            className="relative rounded-none border-b-2 border-transparent px-6 pb-3 pt-2 font-semibold text-gray-500 data-[state=active]:border-[#FFD700] data-[state=active]:text-[#FFD700] transition-all hover:text-white"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger
            value="gemini"
            className="relative rounded-none border-b-2 border-transparent px-6 pb-3 pt-2 font-semibold text-gray-500 data-[state=active]:border-[#FFD700] data-[state=active]:text-[#FFD700] transition-all hover:text-white"
          >
            <Zap className="mr-2 h-4 w-4" />
            Inteligência Artificial
          </TabsTrigger>
          <TabsTrigger
            value="general"
            className="relative rounded-none border-b-2 border-transparent px-6 pb-3 pt-2 font-semibold text-gray-500 data-[state=active]:border-[#FFD700] data-[state=active]:text-[#FFD700] transition-all hover:text-white"
          >
            <LayoutGrid className="mr-2 h-4 w-4" />
            Geral
          </TabsTrigger>
        </TabsList>

        <TabsContent value="evolution" className="outline-none">
          <EvolutionTab
            initialConfig={evolutionConfig}
            onSave={handleSaveEvolution}
          />
        </TabsContent>

        <TabsContent value="gemini" className="outline-none">
          <GeminiTab initialConfig={geminiConfig} onSave={handleSaveGemini} />
        </TabsContent>

        <TabsContent value="general" className="outline-none">
          <GeneralTab
            initialConfig={generalConfig}
            onSave={handleSaveGeneral}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
