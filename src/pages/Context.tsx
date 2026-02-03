import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, Download, Upload } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ContextProgress } from '@/components/context/ContextProgress'
import { GeneralContextForm } from '@/components/context/GeneralContextForm'
import { TemplateManager } from '@/components/context/TemplateManager'
import { AITesterModal } from '@/components/context/AITesterModal'
import { ImportModal } from '@/components/context/ImportModal'
import { exportContextData } from '@/services/context'
import { useToast } from '@/hooks/use-toast'

export default function Context() {
  const [activeTab, setActiveTab] = useState('geral')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isAITesterOpen, setIsAITesterOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const { toast } = useToast()

  const handleUpdate = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const handleExport = async () => {
    try {
      toast({ title: 'Preparando exportação...', duration: 2000 })
      const data = await exportContextData()
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `contexto_adapta_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast({ title: 'Exportação concluída com sucesso' })
    } catch (error) {
      toast({ title: 'Erro ao exportar', variant: 'destructive' })
    }
  }

  // Get current context summary for AI Tester (simplified)
  // In a real app we might pass the full context, but for mock purposes we pass a string
  const contextSummary = 'Simulação de contexto carregado...'

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Contexto da IA</h1>
          <p className="text-gray-400 mt-1">
            Gerencie a base de conhecimento e treine sua assistente.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-[#2a2a2a] bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button
            variant="outline"
            className="border-[#2a2a2a] bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white"
            onClick={() => setIsImportOpen(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button
            className="bg-yellow-500 hover:bg-yellow-600 text-black shadow-lg shadow-yellow-500/10"
            onClick={() => setIsAITesterOpen(true)}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Testar com IA
          </Button>
        </div>
      </div>

      <ContextProgress refreshTrigger={refreshTrigger} />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="bg-[#1a1a1a] border border-[#2a2a2a] p-1 h-auto">
          <TabsTrigger
            value="geral"
            className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black text-gray-400 px-6 py-2 transition-all"
          >
            Contexto Geral
          </TabsTrigger>
          <TabsTrigger
            value="templates"
            className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black text-gray-400 px-6 py-2 transition-all"
          >
            Templates de Resposta
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="geral"
          className="animate-fade-in focus-visible:outline-none"
        >
          <GeneralContextForm onUpdate={handleUpdate} />
        </TabsContent>

        <TabsContent
          value="templates"
          className="animate-fade-in focus-visible:outline-none"
        >
          <TemplateManager onUpdate={handleUpdate} />
        </TabsContent>
      </Tabs>

      <AITesterModal
        open={isAITesterOpen}
        onOpenChange={setIsAITesterOpen}
        contextSummary={contextSummary}
      />

      <ImportModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSuccess={handleUpdate}
      />
    </div>
  )
}
