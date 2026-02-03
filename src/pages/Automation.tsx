import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, LayoutTemplate, History as HistoryIcon, Zap } from 'lucide-react'
import { AutomationDashboard } from '@/components/automation/AutomationDashboard'
import { CampaignWizard } from '@/components/automation/CampaignWizard'
import { getCampaigns, AutomationCampaign } from '@/services/automation'
import { toast } from '@/hooks/use-toast'

export default function Automation() {
  const [activeTab, setActiveTab] = useState('active')
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [campaigns, setCampaigns] = useState<AutomationCampaign[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    getCampaigns()
      .then(setCampaigns)
      .catch(() =>
        toast({ title: 'Erro ao carregar campanhas', variant: 'destructive' }),
      )
  }, [refreshTrigger])

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleCampaignCreated = () => {
    handleRefresh()
    setActiveTab('active')
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
          onClick={() => setIsWizardOpen(true)}
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
          <div className="text-center py-20 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-gray-500">
            <HistoryIcon className="h-10 w-10 mx-auto mb-4 opacity-50" />
            <p>O histórico de campanhas aparecerá aqui.</p>
          </div>
        </TabsContent>

        <TabsContent
          value="models"
          className="animate-fade-in focus-visible:outline-none"
        >
          <div className="text-center py-20 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-gray-500">
            <LayoutTemplate className="h-10 w-10 mx-auto mb-4 opacity-50" />
            <p>Seus modelos salvos aparecerão aqui.</p>
          </div>
        </TabsContent>
      </Tabs>

      <CampaignWizard
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        onSuccess={handleCampaignCreated}
      />
    </div>
  )
}
