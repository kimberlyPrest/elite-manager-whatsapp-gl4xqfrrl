import { useState, useEffect } from 'react'
import { CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Label } from '@/components/ui/label'
import {
  ChevronDown,
  ChevronUp,
  Save,
  RotateCcw,
  Plus,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScopeCardProps {
  id: string
  title: string
  description: string
  type: 'elite' | 'scale' | 'labs' | 'venda'
  icon: React.ReactNode
  color: string
  data: any
  onChange: (data: any) => void
  onSave: () => void
  saving?: boolean
}

export function ScopeCard({
  id,
  title,
  description,
  type,
  icon,
  color,
  data,
  onChange,
  onSave,
  saving = false,
}: ScopeCardProps) {
  // Persistence for open state
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem(`scope_card_${id}_open`)
    return saved ? JSON.parse(saved) : false
  })

  useEffect(() => {
    localStorage.setItem(`scope_card_${id}_open`, JSON.stringify(isOpen))
  }, [isOpen, id])

  const handleChange = (field: string, value: any) => {
    onChange({ ...data, [field]: value })
  }

  // Calculate completeness for color indicator in header
  const getCompletionStats = () => {
    const fields = Object.values(data)
    const filled = fields.filter((f: any) => {
      if (Array.isArray(f)) return f.length > 0
      return f && f.toString().trim().length > 0
    }).length
    const total = Object.keys(data).length || 1
    const percentage = Math.round((filled / total) * 100)

    let colorClass = 'text-green-500'
    if (percentage <= 30) colorClass = 'text-red-500'
    else if (percentage <= 70) colorClass = 'text-yellow-500'

    return { percentage, colorClass }
  }

  const { percentage, colorClass } = getCompletionStats()

  const handleClear = () => {
    if (confirm('Tem certeza que deseja limpar este formulário?')) {
      const emptyData: any = {}
      Object.keys(data).forEach((key) => {
        if (Array.isArray(data[key])) emptyData[key] = []
        else emptyData[key] = ''
      })
      onChange(emptyData)
    }
  }

  const handleAddObjection = () => {
    const current = data.objections || []
    handleChange('objections', [...current, { objection: '', response: '' }])
  }

  const handleRemoveObjection = (index: number) => {
    const current = [...(data.objections || [])]
    current.splice(index, 1)
    handleChange('objections', current)
  }

  const handleObjectionChange = (
    index: number,
    field: 'objection' | 'response',
    value: string,
  ) => {
    const current = [...(data.objections || [])]
    current[index][field] = value
    handleChange('objections', current)
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="border border-[#2a2a2a] rounded-lg bg-[#1a1a1a] shadow-sm"
    >
      <div className="flex items-center justify-between p-4 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-3">
          <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none">
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
            <div
              className="p-2 rounded-md bg-opacity-10"
              style={{ backgroundColor: `${color}20` }}
            >
              <div style={{ color }}>{icon}</div>
            </div>
          </CollapsibleTrigger>
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              {title}
              <Badge
                className="text-xs"
                style={{ backgroundColor: color, color: '#000' }}
              >
                {type === 'venda' ? 'Pipeline' : 'Produto'}
              </Badge>
            </h3>
            <p className="text-xs text-gray-400 hidden md:block">
              {description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn('text-sm font-bold', colorClass)}>
            {percentage}%
          </span>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onSave()
            }}
            disabled={saving}
            className="bg-yellow-500 hover:bg-yellow-600 text-black border-none font-medium"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      <CollapsibleContent>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Common Fields for Products */}
            {type !== 'venda' && (
              <>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-white">Descrição Geral *</Label>
                  <Textarea
                    value={data.description || ''}
                    onChange={(e) =>
                      handleChange('description', e.target.value)
                    }
                    placeholder="Descrição completa do produto..."
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-white"
                    maxLength={1500}
                  />
                  <div className="text-xs text-gray-500 text-right">
                    Max: 1500 chars
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Público-Alvo *</Label>
                  <Textarea
                    value={data.targetAudience || ''}
                    onChange={(e) =>
                      handleChange('targetAudience', e.target.value)
                    }
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-white h-24"
                    maxLength={800}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Duração Padrão</Label>
                  <Input
                    value={data.duration || ''}
                    onChange={(e) => handleChange('duration', e.target.value)}
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-white"
                  />
                  <Label className="text-white mt-4 block">
                    Valor de Investimento
                  </Label>
                  <Input
                    value={data.investment || ''}
                    onChange={(e) => handleChange('investment', e.target.value)}
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-white mt-2"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-white">Metodologia Aplicada *</Label>
                  <Textarea
                    value={data.methodology || ''}
                    onChange={(e) =>
                      handleChange('methodology', e.target.value)
                    }
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-white h-32"
                    maxLength={2000}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-white">Estrutura das Calls</Label>
                  <Textarea
                    value={data.callStructure || ''}
                    onChange={(e) =>
                      handleChange('callStructure', e.target.value)
                    }
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-white h-24"
                    maxLength={1000}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-white">Principais Entregas *</Label>
                  <Textarea
                    value={data.deliverables || ''}
                    onChange={(e) =>
                      handleChange('deliverables', e.target.value)
                    }
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-white h-32"
                    maxLength={2000}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-white">Resultados Esperados</Label>
                  <Textarea
                    value={data.expectedResults || ''}
                    onChange={(e) =>
                      handleChange('expectedResults', e.target.value)
                    }
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-white h-24"
                    maxLength={1000}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Diferenciais do Elite</Label>
                  <Textarea
                    value={data.differentials || ''}
                    onChange={(e) =>
                      handleChange('differentials', e.target.value)
                    }
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-white"
                    maxLength={1000}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Quando NÃO Recomendado</Label>
                  <Textarea
                    value={data.notRecommendedFor || ''}
                    onChange={(e) =>
                      handleChange('notRecommendedFor', e.target.value)
                    }
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-white"
                    maxLength={800}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-white">Pré-requisitos</Label>
                  <Textarea
                    value={data.requirements || ''}
                    onChange={(e) =>
                      handleChange('requirements', e.target.value)
                    }
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-white h-20"
                    maxLength={800}
                  />
                </div>
              </>
            )}

            {/* Specific Fields: Scale */}
            {type === 'scale' && (
              <>
                <div className="space-y-2">
                  <Label className="text-white">Diferença do Elite</Label>
                  <Textarea
                    value={data.differenceFromElite || ''}
                    onChange={(e) =>
                      handleChange('differenceFromElite', e.target.value)
                    }
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-white"
                    maxLength={1000}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">
                    Quando Recomendar Scale vs Elite
                  </Label>
                  <Textarea
                    value={data.whenToRecommend || ''}
                    onChange={(e) =>
                      handleChange('whenToRecommend', e.target.value)
                    }
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-white"
                    maxLength={1000}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-white">Número de Calls</Label>
                  <Select
                    value={data.numberOfCalls || 'Flexível'}
                    onValueChange={(v) => handleChange('numberOfCalls', v)}
                  >
                    <SelectTrigger className="bg-[#2a2a2a] border-[#3a3a3a] text-white w-full md:w-1/2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6 calls">6 calls</SelectItem>
                      <SelectItem value="8 calls">8 calls</SelectItem>
                      <SelectItem value="Flexível">Flexível</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Specific Fields: Labs */}
            {type === 'labs' && (
              <>
                <div className="space-y-2">
                  <Label className="text-white">Modelo de Entrega</Label>
                  <Textarea
                    value={data.deliveryModel || ''}
                    onChange={(e) =>
                      handleChange('deliveryModel', e.target.value)
                    }
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-white"
                    maxLength={1000}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Tipo de Projeto</Label>
                  <Textarea
                    value={data.projectTypes || ''}
                    onChange={(e) =>
                      handleChange('projectTypes', e.target.value)
                    }
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-white"
                    maxLength={800}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-white">Diferencial Labs</Label>
                  <Textarea
                    value={data.labsDifferentials || ''}
                    onChange={(e) =>
                      handleChange('labsDifferentials', e.target.value)
                    }
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-white"
                    maxLength={800}
                  />
                </div>
              </>
            )}

            {/* Specific Fields: Sales Pipeline */}
            {type === 'venda' && (
              <>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-white">
                    Como Funciona o Processo *
                  </Label>
                  <Textarea
                    value={data.processDescription || ''}
                    onChange={(e) =>
                      handleChange('processDescription', e.target.value)
                    }
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-white min-h-[120px]"
                    maxLength={2500}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-white">
                    Critérios de Qualificação *
                  </Label>
                  <Textarea
                    value={data.qualificationCriteria || ''}
                    onChange={(e) =>
                      handleChange('qualificationCriteria', e.target.value)
                    }
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-white min-h-[120px]"
                    maxLength={2000}
                  />
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-base text-white">
                      Objeções Comuns e Respostas *
                    </Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddObjection}
                      className="text-xs bg-[#2a2a2a] border-[#3a3a3a] text-white hover:bg-[#3a3a3a]"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Adicionar Objeção
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {data.objections?.map((obj: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-[#2a2a2a]/50 p-4 rounded-md border border-[#3a3a3a] relative group"
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveObjection(idx)}
                          className="absolute top-2 right-2 h-6 w-6 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-400">
                              Objeção
                            </Label>
                            <Textarea
                              value={obj.objection}
                              onChange={(e) =>
                                handleObjectionChange(
                                  idx,
                                  'objection',
                                  e.target.value,
                                )
                              }
                              className="bg-[#1a1a1a] border-[#3a3a3a] text-sm h-20 text-white"
                              placeholder="Ex: Está caro..."
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-400">
                              Resposta Ideal
                            </Label>
                            <Textarea
                              value={obj.response}
                              onChange={(e) =>
                                handleObjectionChange(
                                  idx,
                                  'response',
                                  e.target.value,
                                )
                              }
                              className="bg-[#1a1a1a] border-[#3a3a3a] text-sm h-20 text-white"
                              placeholder="Ex: Entendo, mas considerando o ROI..."
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!data.objections || data.objections.length === 0) && (
                      <p className="text-sm text-gray-500 italic text-center py-4">
                        Nenhuma objeção mapeada ainda.
                      </p>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Label className="text-white">Próximos Passos</Label>
                  <Textarea
                    value={data.nextSteps || ''}
                    onChange={(e) => handleChange('nextSteps', e.target.value)}
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-white"
                    maxLength={1000}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-white">Materiais de Apoio</Label>
                  <Textarea
                    value={data.supportMaterials || ''}
                    onChange={(e) =>
                      handleChange('supportMaterials', e.target.value)
                    }
                    className="bg-[#2a2a2a] border-[#3a3a3a] text-white"
                    maxLength={800}
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-[#2a2a2a]">
            <Button
              variant="ghost"
              onClick={handleClear}
              className="text-red-400 hover:text-red-300 hover:bg-red-900/20 mr-2"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Limpar Formulário
            </Button>
            <Button
              onClick={onSave}
              disabled={saving}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
            >
              {saving
                ? 'Salvando...'
                : 'Salvar ' + (type === 'venda' ? 'Pipeline' : 'Produto')}
            </Button>
          </div>
        </CardContent>
      </CollapsibleContent>
    </Collapsible>
  )
}
