import { supabase } from '@/lib/supabase/client'

export interface SuggestionResponse {
  suggestion: string
  analyticsId: string
  contextUsed: {
    clientName: string
    products: string
    tags: string
    lengthPreference: string
    temperature: number
  }
}

export const generateResponseSuggestion = async (
  conversationId: string,
): Promise<SuggestionResponse> => {
  const { data, error } = await supabase.functions.invoke(
    'gerar-sugestao-resposta',
    {
      body: { conversa_id: conversationId },
    },
  )

  if (error) {
    const errorBody = await error.context?.json?.().catch(() => ({}))
    throw new Error(
      errorBody?.error || error.message || 'Falha ao gerar sugestão',
    )
  }

  return data
}

export const trackSuggestionUsage = async (
  analyticsId: string,
  used: boolean,
  edited: boolean,
  feedback?: { positive: boolean; comment?: string },
) => {
  if (!analyticsId) return

  const { error } = await supabase
    .from('analytics_sugestoes_ia')
    .update({
      foi_usada: used,
      foi_editada: edited,
      ...(feedback
        ? {
            feedback_positivo: feedback.positive,
            feedback_comentario: feedback.comment,
          }
        : {}),
    })
    .eq('id', analyticsId)

  if (error) console.error('Error tracking usage:', error)
}

export const sendSuggestionFeedback = async (
  analyticsId: string,
  positive: boolean,
) => {
  if (!analyticsId) return

  const { error } = await supabase
    .from('analytics_sugestoes_ia')
    .update({
      feedback_positivo: positive,
    })
    .eq('id', analyticsId)

  if (error) console.error('Error sending feedback:', error)
}
