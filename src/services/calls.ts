import { supabase } from '@/lib/supabase/client'
import { sendWhatsAppMessage } from './whatsapp'
import { addDays, format } from 'date-fns'

export interface Call {
  id: string
  produto_cliente_id: string
  numero_call: number
  data_agendada: string | null
  data_realizada: string | null
  duracao_minutos: number | null
  transcricao: string | null
  transcricao_filename: string | null
  csat_enviado: boolean
  csat_respondido: boolean
  csat_nota: number | null
  csat_comentario: string | null
  created_at: string
  produto?: {
    id: string
    produto: string
    cliente_id: string
    num_calls_total: number
    num_calls_realizadas: number
  }
}

export const getCallsByClientId = async (clientId: string) => {
  const { data: products, error: prodError } = await supabase
    .from('produtos_cliente')
    .select('id, produto, cliente_id, num_calls_total, num_calls_realizadas')
    .eq('cliente_id', clientId)

  if (prodError) throw prodError

  if (!products.length) return []

  const productIds = products.map((p) => p.id)

  const { data: calls, error: callsError } = await supabase
    .from('calls')
    .select('*')
    .in('produto_cliente_id', productIds)
    .order('numero_call', { ascending: true })

  if (callsError) throw callsError

  // Merge product info into calls
  return calls.map((call) => ({
    ...call,
    produto: products.find((p) => p.id === call.produto_cliente_id),
  })) as Call[]
}

const updateTag = async (
  clientId: string,
  tag: string,
  active: boolean,
  productId?: string,
) => {
  if (active) {
    // Upsert tag
    const { data: existing } = await supabase
      .from('tags_cliente')
      .select('id')
      .eq('cliente_id', clientId)
      .eq('tipo_tag', tag)
      .single()

    if (!existing) {
      await supabase.from('tags_cliente').insert({
        cliente_id: clientId,
        produto_cliente_id: productId,
        tipo_tag: tag,
        ativo: true,
        created_at: new Date().toISOString(),
      })
    } else {
      await supabase
        .from('tags_cliente')
        .update({ ativo: true, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    }
  } else {
    // Deactivate tag
    await supabase
      .from('tags_cliente')
      .update({ ativo: false, updated_at: new Date().toISOString() })
      .eq('cliente_id', clientId)
      .eq('tipo_tag', tag)
  }
}

export const scheduleCall = async (
  callData: Partial<Call> & { clientId: string },
) => {
  const {
    id,
    produto_cliente_id,
    numero_call,
    data_agendada,
    clientId,
    ...rest
  } = callData

  if (!produto_cliente_id || !numero_call) throw new Error('Dados inválidos')

  // Check duplicate number for same product
  if (!id) {
    const { data: existing } = await supabase
      .from('calls')
      .select('id')
      .eq('produto_cliente_id', produto_cliente_id)
      .eq('numero_call', numero_call)
      .single()

    if (existing) throw new Error('Já existe uma call com este número.')
  }

  const payload = {
    produto_cliente_id,
    numero_call,
    data_agendada,
    ...rest,
  }

  let result
  if (id) {
    result = await supabase
      .from('calls')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
  } else {
    result = await supabase.from('calls').insert(payload).select().single()
  }

  if (result.error) throw result.error

  // Sync with produtos_cliente
  const updateObj: any = {}
  updateObj[`data_${numero_call}_call`] = data_agendada
  await supabase
    .from('produtos_cliente')
    .update(updateObj)
    .eq('id', produto_cliente_id)

  // Tag: agendamento_proximo
  if (data_agendada) {
    const date = new Date(data_agendada)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays >= 0 && diffDays <= 3) {
      await updateTag(clientId, 'agendamento_proximo', true, produto_cliente_id)
    }
  }

  return result.data
}

export const realizeCall = async (
  callId: string,
  dataRealizada: string,
  duracao: number,
  clientId: string,
  productId: string,
) => {
  const { data, error } = await supabase
    .from('calls')
    .update({
      data_realizada: dataRealizada,
      duracao_minutos: duracao,
    })
    .eq('id', callId)
    .select()
    .single()

  if (error) throw error

  // Sync num_calls_realizadas
  // We need to recount explicitly to be safe or just increment
  // Let's recount
  const { count } = await supabase
    .from('calls')
    .select('id', { count: 'exact', head: true })
    .eq('produto_cliente_id', productId)
    .not('data_realizada', 'is', null)

  await supabase
    .from('produtos_cliente')
    .update({ num_calls_realizadas: count || 0 })
    .eq('id', productId)

  // Tags
  await updateTag(clientId, 'agendamento_proximo', false, productId)
  await updateTag(clientId, 'csat_pendente', true, productId)
  await updateTag(clientId, 'pendente_transcricao', true, productId)

  return data
}

export const saveTranscription = async (
  callId: string,
  text: string,
  filename: string | null,
  clientId: string,
  productId: string,
) => {
  const { data, error } = await supabase
    .from('calls')
    .update({
      transcricao: text,
      transcricao_filename: filename,
    })
    .eq('id', callId)
    .select()
    .single()

  if (error) throw error

  // Tags
  await updateTag(clientId, 'pendente_transcricao', false, productId)

  return data
}

export const sendCsat = async (
  callId: string,
  phone: string,
  message: string,
  clientId: string,
  productId: string,
) => {
  // First, find conversation or just send to phone
  // We assume conversation exists or we can send via phone
  // We need a conversation_id for the internal chat system, but whatsapp service sends via API
  // Let's check if conversation exists
  const { data: conversation } = await supabase
    .from('conversas_whatsapp')
    .select('id')
    .eq('numero_whatsapp', phone)
    .single()

  let convId = conversation?.id
  if (!convId) {
    // Create conversation if not exists (simplified logic)
    const { data: newConv } = await supabase
      .from('conversas_whatsapp')
      .insert({ numero_whatsapp: phone, cliente_id: clientId })
      .select()
      .single()
    convId = newConv?.id
  }

  if (!convId) throw new Error('Falha ao identificar conversa')

  await sendWhatsAppMessage(convId, phone, message)

  const { data, error } = await supabase
    .from('calls')
    .update({ csat_enviado: true })
    .eq('id', callId)
    .select()
    .single()

  if (error) throw error

  // Tags - assuming we keep csat_pendente until answered? Or remove sent?
  // Requirement says "Create csat_pendente when call is marked realized but CSAT is not yet sent."
  // So we remove it now.
  await updateTag(clientId, 'csat_pendente', false, productId)

  return data
}

export const deleteCall = async (
  callId: string,
  productId: string,
  callNumber: number,
) => {
  const { error } = await supabase.from('calls').delete().eq('id', callId)

  if (error) throw error

  // Update produtos_cliente
  const updateObj: any = {}
  updateObj[`data_${callNumber}_call`] = null
  await supabase.from('produtos_cliente').update(updateObj).eq('id', productId)
}
