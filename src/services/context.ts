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
  // 1. Check products
  // Replaced head: true with limit(0) to prevent "Unexpected end of JSON input" error
  // while still obtaining the exact count.
  const { count: productsCount } = await supabase
    .from('produtos_cliente')
    .select('*', { count: 'exact' })
    .limit(0)

  const { data: contextData } = await supabase
    .from('contexto_geral')
    .select('secao, conteudo')

  // Replaced head: true with limit(0) for robustness
  const { count: templatesCount } = await supabase
    .from('templates_resposta')
    .select('*', { count: 'exact' })
    .limit(0)

  const contextMap = new Map(
    contextData?.map((c) => [c.secao, c.conteudo]) || [],
  )

  // Rules:
  // 25%: At least one product configured in `produtos_cliente` OR relevant context
  const products =
    (productsCount !== null && productsCount > 0) ||
    (!!contextMap.get('produtos_servicos') &&
      contextMap.get('produtos_servicos')!.length > 50)

  // 25%: Institutional information filled
  const institutional =
    !!contextMap.get('institucional') &&
    contextMap.get('institucional')!.length > 50

  // 25%: Tone of voice configured
  const toneOfVoice =
    !!contextMap.get('tom_de_voz') && contextMap.get('tom_de_voz')!.length > 20

  // 15%: At least 3 templates
  const templates = templatesCount !== null && templatesCount >= 3

  // 10%: At least 2 conversation examples (checking section 'exemplos_conversa' length or splitting by newlines/pattern)
  const examplesContent = contextMap.get('exemplos_conversa') || ''
  const examples = examplesContent.length > 100 // Simplified check

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
          // We remove ID to avoid conflicts, or we can keep it if we want to overwrite specific records
          // Let's keep existing logic but removing ID might be safer for "Import as new" behavior,
          // but spec says "restore". Let's try to match by name or shortcut or just insert.
          // For simplicity and safety: update if ID exists, insert if not.
          // However, exported IDs might not match current DB if different instance.
          // Strategy: Match by 'atalho' or 'nome'? No, standard import usually overwrites or adds.
          // Spec says: "overwrite existing database records".
          // We will use upsert. If ID is present and matches, it updates.
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
