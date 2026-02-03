import { supabase } from '@/lib/supabase/client'

export const createTimelineEvent = async (
  clientId: string,
  type: string,
  description: string,
  productClienteId?: string,
) => {
  const { error } = await supabase.from('timeline_eventos').insert({
    cliente_id: clientId,
    tipo_evento: type,
    descricao: description,
    produto_cliente_id: productClienteId,
    data_evento: new Date().toISOString(),
    resolvido: true,
  })

  if (error) throw error
}
