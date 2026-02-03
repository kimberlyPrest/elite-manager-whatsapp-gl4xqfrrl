import { supabase } from '@/lib/supabase/client'

export interface ContextSection {
  id?: string
  secao: string
  conteudo: string
  updated_at?: string
}

export interface ResponseTemplate {
  id?: string
  nome: string
  conteudo: string
  atalho: string | null
  categoria: string | null
  ativo: boolean
  updated_at?: string
}

export interface CompletenessStats {
  products: boolean
  institutional: boolean
  toneOfVoice: boolean
  templates: boolean
  examples: boolean
  totalPercentage: number
}

// Scope Types
export interface ScopeBase {
  description: string // Visão Geral / Descrição
  targetAudience: string // Público Alvo
  duration: string // Duração
  investment: string // Investimento
  methodology: string // Metodologia
  callStructure: string // Estrutura de Calls
  deliverables: string // Entregáveis
  expectedResults: string // Resultados Esperados
  differentials: string // Diferenciais
  notRecommendedFor: string // Não recomendado para
  requirements: string // Requisitos
}

export interface ScopeScale extends ScopeBase {
  differenceFromElite: string
  whenToRecommend: string
  numberOfCalls: '6' | '8' | 'Flexible' | ''
}

export interface ScopeLabs extends ScopeBase {
  deliveryModel: string
  projectTypes: string
  labsDifferentials: string
}

export interface Objection {
  objection: string
  response: string
}

export interface ScopeSales {
  processDescription: string
  qualificationCriteria: string // Qualified vs Disqualified
  objections: Objection[]
  nextSteps: string
  supportMaterials: string
}

// Conversation Example Types
export interface MessagePair {
  client: string
  ai: string
}

export interface ConversationExample {
  id: string
  title: string
  category: string
  context: string
  pairs: MessagePair[]
  createdAt: number
  updatedAt: number
}

// Fetch all general context sections
export const fetchContextSections = async (): Promise<ContextSection[]> => {
  const { data, error } = await supabase.from('contexto_geral').select('*')

  if (error) throw error
  return data || []
}

// Save a specific context section
export const saveContextSection = async (secao: string, conteudo: string) => {
  const { data, error } = await supabase
    .from('contexto_geral')
    .upsert({ secao, conteudo }, { onConflict: 'secao' })
    .select()
    .single()

  if (error) throw error
  return data
}

// Helper to save JSON data to context section
export const saveContextJSON = async (secao: string, data: any) => {
  return saveContextSection(secao, JSON.stringify(data))
}

// Helper to fetch JSON data from context section
export const fetchContextJSON = async <T>(
  secao: string,
  defaultValue: T,
): Promise<T> => {
  const { data, error } = await supabase
    .from('contexto_geral')
    .select('conteudo')
    .eq('secao', secao)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error(`Error fetching ${secao}:`, error)
    return defaultValue
  }

  if (!data?.conteudo) return defaultValue

  try {
    return JSON.parse(data.conteudo) as T
  } catch (e) {
    console.error(`Error parsing JSON for ${secao}:`, e)
    return defaultValue
  }
}

// Fetch all response templates
export const fetchTemplates = async (): Promise<ResponseTemplate[]> => {
  const { data, error } = await supabase
    .from('templates_resposta')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data || []
}

// Save a template (create or update)
export const saveTemplate = async (
  template: Omit<ResponseTemplate, 'updated_at'>,
) => {
  // Check for duplicate shortcut
  if (template.atalho) {
    let query = supabase
      .from('templates_resposta')
      .select('id')
      .eq('atalho', template.atalho)

    if (template.id) {
      query = query.neq('id', template.id)
    }

    const { data: duplicates } = await query

    if (duplicates && duplicates.length > 0) {
      throw new Error(
        `Atalho @${template.atalho} já está em uso. Escolha outro.`,
      )
    }
  }

  const { data, error } = await supabase
    .from('templates_resposta')
    .upsert(template)
    .select()
    .single()

  if (error) throw error
  return data
}

// Delete a template
export const deleteTemplate = async (id: string) => {
  const { error } = await supabase
    .from('templates_resposta')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Calculate completeness stats
export const getCompletenessStats = async (): Promise<CompletenessStats> => {
  const { count: productsCount } = await supabase
    .from('produtos_cliente')
    .select('*', { count: 'exact' })
    .limit(0)

  const { data: contextData } = await supabase
    .from('contexto_geral')
    .select('secao, conteudo')

  const { count: templatesCount } = await supabase
    .from('templates_resposta')
    .select('*', { count: 'exact' })
    .limit(0)

  const contextMap = new Map(
    contextData?.map((c) => [c.secao, c.conteudo]) || [],
  )

  const products =
    (productsCount !== null && productsCount > 0) ||
    (!!contextMap.get('produtos_servicos') &&
      contextMap.get('produtos_servicos')!.length > 50)

  const institutional =
    !!contextMap.get('institucional') &&
    contextMap.get('institucional')!.length > 50

  const toneOfVoice =
    !!contextMap.get('tom_de_voz') && contextMap.get('tom_de_voz')!.length > 20

  const templates = templatesCount !== null && templatesCount >= 3

  // Check if we have new structured examples OR old text examples
  const oldExamples = contextMap.get('exemplos_conversa') || ''
  const newExamplesRaw = contextMap.get('exemplos_conversas')
  let newExamplesCount = 0
  if (newExamplesRaw) {
    try {
      const parsed = JSON.parse(newExamplesRaw)
      if (Array.isArray(parsed)) newExamplesCount = parsed.length
    } catch {
      // Ignore invalid JSON
    }
  }

  const examples = oldExamples.length > 100 || newExamplesCount >= 2

  let totalPercentage = 0
  if (products) totalPercentage += 25
  if (institutional) totalPercentage += 25
  if (toneOfVoice) totalPercentage += 25
  if (templates) totalPercentage += 15
  if (examples) totalPercentage += 10

  return {
    products,
    institutional,
    toneOfVoice,
    templates,
    examples,
    totalPercentage,
  }
}

// Export all context data
export const exportContextData = async () => {
  const [context, templates] = await Promise.all([
    fetchContextSections(),
    fetchTemplates(),
  ])

  return {
    contexto_geral: context,
    templates_resposta: templates,
    metadata: {
      exported_at: new Date().toISOString(),
      version: '1.0',
    },
  }
}

// Import context data
export const importContextData = async (json: any) => {
  if (!json.contexto_geral || !json.templates_resposta) {
    throw new Error('Arquivo de contexto inválido.')
  }

  // Upsert context
  if (json.contexto_geral.length > 0) {
    const { error: contextError } = await supabase
      .from('contexto_geral')
      .upsert(
        json.contexto_geral.map((c: any) => ({
          secao: c.secao,
          conteudo: c.conteudo,
        })),
        { onConflict: 'secao' },
      )
    if (contextError) throw contextError
  }

  // Upsert templates
  if (json.templates_resposta.length > 0) {
    const { error: templatesError } = await supabase
      .from('templates_resposta')
      .upsert(
        json.templates_resposta.map((t: any) => ({
          nome: t.nome,
          conteudo: t.conteudo,
          atalho: t.atalho,
          categoria: t.categoria,
          ativo: t.ativo,
        })),
      )
    if (templatesError) throw templatesError
  }

  return true
}

// Mock AI Service
export const mockAISummarize = async (text: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        `[Resumo IA]: ${text.substring(0, 100)}... (Texto resumido para otimizar contexto)`,
      )
    }, 1500)
  })
}

export const mockAITesing = async (
  question: string,
  context: string,
): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(
        `Com base no contexto fornecido, aqui está uma resposta sugerida para "${question}":\n\nOlá! Agradeço seu contato. Nossos serviços são focados em... (Resposta gerada simulando o contexto: ${context.substring(0, 20)}...)`,
      )
    }, 2000)
  })
}
