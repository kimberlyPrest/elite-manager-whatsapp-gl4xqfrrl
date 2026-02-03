import { supabase } from '@/lib/supabase/client'

export interface TagResult {
  success: boolean
  processados: number
  tags_criadas: number
  tags_desativadas: number
  detalhes: string[]
  error?: string
}

export const recalculateTags = async (
  clientId?: string,
): Promise<TagResult> => {
  try {
    const { data, error } = await supabase.functions.invoke(
      'calcular-tags-cliente',
      {
        body: { cliente_id: clientId },
      },
    )

    if (error) throw error

    return data as TagResult
  } catch (error: any) {
    console.error('Error recalculating tags:', error)
    throw new Error(error.message || 'Erro ao recalcular tags')
  }
}
