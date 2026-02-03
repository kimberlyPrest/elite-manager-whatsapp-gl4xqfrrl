import { useState, useEffect } from 'react'
import {
  Crown,
  TrendingUp,
  Zap,
  DollarSign,
  SaveAll,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScopeCard } from './scope/ScopeCard'
import {
  fetchContextJSON,
  saveContextJSON,
  ScopeBase,
  ScopeScale,
  ScopeLabs,
  ScopeSales,
} from '@/services/context'
import { useToast } from '@/hooks/use-toast'

const DEFAULT_ELITE: ScopeBase = {
  description: '',
  targetAudience: '',
  duration: '',
  investment: '',
  methodology: '',
  callStructure: '',
  deliverables: '',
  expectedResults: '',
  differentials: '',
  notRecommendedFor: '',
  requirements: '',
}

const DEFAULT_SCALE: ScopeScale = {
  ...DEFAULT_ELITE,
  differenceFromElite: '',
  whenToRecommend: '',
  numberOfCalls: '',
}

const DEFAULT_LABS: ScopeLabs = {
  ...DEFAULT_ELITE,
  deliveryModel: '',
  projectTypes: '',
  labsDifferentials: '',
}

const DEFAULT_SALES: ScopeSales = {
  processDescription: '',
  qualificationCriteria: '',
  objections: [],
  nextSteps: '',
  supportMaterials: '',
}

export function ConsultancyScope({ onUpdate }: { onUpdate: () => void }) {
  const [eliteData, setEliteData] = useState<ScopeBase>(DEFAULT_ELITE)
  const [scaleData, setScaleData] = useState<ScopeScale>(DEFAULT_SCALE)
  const [labsData, setLabsData] = useState<ScopeLabs>(DEFAULT_LABS)
  const [salesData, setSalesData] = useState<ScopeSales>(DEFAULT_SALES)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingSection, setSavingSection] = useState<string | null>(null)

  const { toast } = useToast()

  useEffect(() => {
    loadAllScopes()
  }, [])

  const loadAllScopes = async () => {
    try {
      setLoading(true)
      const [elite, scale, labs, sales] = await Promise.all([
        fetchContextJSON<ScopeBase>('escopo_elite', DEFAULT_ELITE),
        fetchContextJSON<ScopeScale>('escopo_scale', DEFAULT_SCALE),
        fetchContextJSON<ScopeLabs>('escopo_labs', DEFAULT_LABS),
        fetchContextJSON<ScopeSales>('escopo_venda', DEFAULT_SALES),
      ])

      setEliteData(elite)
      setScaleData(scale)
      setLabsData(labs)
      setSalesData(sales)
    } catch (error) {
      console.error('Failed to load scopes', error)
      toast({
        title: 'Erro ao carregar',
        description: 'Não foi possível carregar os dados do escopo.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSection = async (section: string, data: any) => {
    setSavingSection(section)
    try {
      await saveContextJSON(section, data)
      toast({
        title: 'Salvo com sucesso',
        description: 'As alterações foram gravadas.',
        className: 'bg-green-900 border-green-800 text-white',
      })
      onUpdate()
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSavingSection(null)
    }
  }

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      await Promise.all([
        saveContextJSON('escopo_elite', eliteData),
        saveContextJSON('escopo_scale', scaleData),
        saveContextJSON('escopo_labs', labsData),
        saveContextJSON('escopo_venda', salesData),
      ])
      toast({
        title: 'Todos os escopos salvos',
        description: 'Todas as seções foram atualizadas com sucesso.',
        className: 'bg-green-900 border-green-800 text-white',
      })
      onUpdate()
    } catch (error) {
      toast({
        title: 'Erro ao salvar tudo',
        description: 'Algumas seções podem não ter sido salvas.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-[#1a1a1a] animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[#1a1a1a] p-4 rounded-lg border border-[#2a2a2a]">
        <div>
          <h2 className="text-xl font-bold text-white">
            Escopo da Consultoria
          </h2>
          <p className="text-sm text-gray-400">
            Defina os detalhes técnicos e comerciais de cada produto.
          </p>
        </div>
        <Button
          onClick={handleSaveAll}
          disabled={saving}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold shadow-[0_0_15px_rgba(234,179,8,0.2)]"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <SaveAll className="w-4 h-4 mr-2" />
          )}
          Salvar Tudo
        </Button>
      </div>

      <ScopeCard
        id="elite"
        title="Adapta Elite"
        description="Consultoria Premium High-Ticket"
        type="elite"
        icon={<Crown className="w-6 h-6" />}
        color="#9333ea"
        data={eliteData}
        onChange={setEliteData}
        onSave={() => handleSaveSection('escopo_elite', eliteData)}
        saving={savingSection === 'escopo_elite'}
      />

      <ScopeCard
        id="scale"
        title="Adapta Scale"
        description="Produto de entrada / Escala"
        type="scale"
        icon={<TrendingUp className="w-6 h-6" />}
        color="#3b82f6"
        data={scaleData}
        onChange={setScaleData}
        onSave={() => handleSaveSection('escopo_scale', scaleData)}
        saving={savingSection === 'escopo_scale'}
      />

      <ScopeCard
        id="labs"
        title="Adapta Labs"
        description="Projetos Experimentais e Inovação"
        type="labs"
        icon={<Zap className="w-6 h-6" />}
        color="#10b981"
        data={labsData}
        onChange={setLabsData}
        onSave={() => handleSaveSection('escopo_labs', labsData)}
        saving={savingSection === 'escopo_labs'}
      />

      <ScopeCard
        id="venda"
        title="Pipeline de Vendas"
        description="Processo comercial e tratamento de objeções"
        type="venda"
        icon={<DollarSign className="w-6 h-6" />}
        color="#f97316"
        data={salesData}
        onChange={setSalesData}
        onSave={() => handleSaveSection('escopo_venda', salesData)}
        saving={savingSection === 'escopo_venda'}
      />
    </div>
  )
}
