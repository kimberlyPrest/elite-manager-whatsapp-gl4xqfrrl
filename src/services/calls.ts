import { supabase } from '@/lib/supabase/client'
import { sendWhatsAppMessage } from './whatsapp'
import { createTimelineEvent } from './timeline'
import { format } from 'date-fns'

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

      // Create Timeline Event for new tag
      await createTimelineEvent(
        clientId,
        'tag',
        `Tag crítica adicionada: ${tag}`,
        productId,
      )
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

  // Timeline Event
  if (data_agendada) {
    const formattedDate = format(new Date(data_agendada), "dd/MM 'às' HH:mm")
    await createTimelineEvent(
      clientId,
      'call',
      `Call ${numero_call} agendada para ${formattedDate}`,
      produto_cliente_id,
      new Date().toISOString(),
    )
  }

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
  callNumber?: number,
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

  // Sync num_calls_realizadas safely
  const { count } = await supabase
    .from('calls')
    .select('id', { count: 'exact' })
    .eq('produto_cliente_id', productId)
    .not('data_realizada', 'is', null)
    .limit(1)

  await supabase
    .from('produtos_cliente')
    .update({ num_calls_realizadas: count || 0 })
    .eq('id', productId)

  // Timeline Event
  await createTimelineEvent(
    clientId,
    'call',
    `Call ${callNumber || ''} realizada. Duração: ${duracao} min`,
    productId,
    dataRealizada,
  )

  // Tags
  await updateTag(clientId, 'agendamento_proximo', false, productId)
  await updateTag(clientId, 'csat_pendente', true, productId)
  await updateTag(clientId, 'pendente_transcricao', true, productId)

  // Follow-up for CSAT
  await createTimelineEvent(
    clientId,
    'fup_csat',
    'Enviar pesquisa de satisfação (CSAT)',
    productId,
    new Date().toISOString(),
  )

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

  // Timeline Event
  await createTimelineEvent(
    clientId,
    'sistema',
    'Transcrição da call adicionada',
    productId,
  )

  return data
}

export const sendCsat = async (
  callId: string,
  phone: string,
  message: string,
  clientId: string,
  productId: string,
) => {
  const { data: conversation } = await supabase
    .from('conversas_whatsapp')
    .select('id')
    .eq('numero_whatsapp', phone)
    .single()

  let convId = conversation?.id
  if (!convId) {
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

  await updateTag(clientId, 'csat_pendente', false, productId)

  // Timeline Event
  await createTimelineEvent(
    clientId,
    'fup_csat',
    'Pesquisa CSAT enviada ao cliente',
    productId,
  )

  return data
}

export const deleteCall = async (
  callId: string,
  productId: string,
  callNumber: number,
) => {
  const { error } = await supabase.from('calls').delete().eq('id', callId)

  if (error) throw error

  const updateObj: any = {}
  updateObj[`data_${callNumber}_call`] = null
  await supabase.from('produtos_cliente').update(updateObj).eq('id', productId)
}
