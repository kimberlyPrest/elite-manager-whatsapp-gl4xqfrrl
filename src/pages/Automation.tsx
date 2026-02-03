import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, LayoutTemplate, History as HistoryIcon, Zap } from 'lucide-react'
import { AutomationDashboard } from '@/components/automation/AutomationDashboard'
import { CampaignWizard } from '@/components/automation/CampaignWizard'
import { HistoryTab } from '@/components/automation/HistoryTab'
import { ModelsTab } from '@/components/automation/ModelsTab'
import {
  getCampaigns,
  AutomationCampaign,
  AutomationModel,
  triggerQueueProcessing,
} from '@/services/automation'
import { toast } from '@/hooks/use-toast'

export default function Automation() {
  const [activeTab, setActiveTab] = useState('active')
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [campaigns, setCampaigns] = useState<AutomationCampaign[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [selectedModel, setSelectedModel] = useState<AutomationModel | null>(
    null,
  )

  useEffect(() => {
    const fetchCampaigns = () => {
      getCampaigns()
        .then(setCampaigns)
        .catch(() => console.error('Erro ao carregar campanhas no background'))
    }

    fetchCampaigns()

    // Polling for UI updates (every 5s)
    const intervalId = setInterval(fetchCampaigns, 5000)

    return () => clearInterval(intervalId)
  }, [refreshTrigger])

  // "Poor Man's Cron" - Trigger Queue Processing while Admin is online (every 15s)
  useEffect(() => {
    const queueInterval = setInterval(async () => {
      const hasActive = campaigns.some((c) => c.status_automacao === 'ativa')
      if (hasActive) {
        console.log('Triggering automation queue...')
        await triggerQueueProcessing()
      }
    }, 15000)

    return () => clearInterval(queueInterval)
  }, [campaigns])

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleCampaignCreated = () => {
    handleRefresh()
    setActiveTab('active')
  }

  const handleUseModel = (model: AutomationModel) => {
    setSelectedModel(model)
    setIsWizardOpen(true)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Automação de Mensagens
          </h1>
          <p className="text-gray-400 mt-1">
            Envie mensagens em massa de forma inteligente e personalizada.
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedModel(null)
            setIsWizardOpen(true)
          }}
          className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-semibold shadow-lg shadow-yellow-500/10"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Campanha
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="bg-[#1a1a1a] border border-[#2a2a2a] p-1 h-auto">
          <TabsTrigger
            value="active"
            className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-black text-gray-400 px-6 py-2 transition-all"
          >
            <Zap className="mr-2 h-4 w-4" /> Campanhas Ativas
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-black text-gray-400 px-6 py-2 transition-all"
          >
            <HistoryIcon className="mr-2 h-4 w-4" /> Histórico
          </TabsTrigger>
          <TabsTrigger
            value="models"
            className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-black text-gray-400 px-6 py-2 transition-all"
          >
            <LayoutTemplate className="mr-2 h-4 w-4" /> Modelos Salvos
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="active"
          className="animate-fade-in focus-visible:outline-none"
        >
          <AutomationDashboard
            campaigns={campaigns}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent
          value="history"
          className="animate-fade-in focus-visible:outline-none"
        >
          <HistoryTab />
        </TabsContent>

        <TabsContent
          value="models"
          className="animate-fade-in focus-visible:outline-none"
        >
          <ModelsTab onUseModel={handleUseModel} />
        </TabsContent>
      </Tabs>

      <CampaignWizard
        open={isWizardOpen}
        onOpenChange={(open) => {
          setIsWizardOpen(open)
          if (!open) setSelectedModel(null)
        }}
        onSuccess={handleCampaignCreated}
        initialModel={selectedModel}
      />
    </div>
  )
}
