import { supabase } from '@/lib/supabase/client'
import { createTimelineEvent } from './timeline'

export interface Product {
  id: string
  cliente_id: string
  produto: string
  status: string
  num_calls_total: number | null
  num_calls_realizadas: number | null
  data_inicio: string | null
  data_fim_prevista: string | null
  data_1_call: string | null
  data_2_call: string | null
  data_3_call: string | null
  data_4_call: string | null
  data_5_call: string | null
  data_6_call: string | null
  data_7_call: string | null
  data_8_call: string | null
  data_9_call: string | null
  data_10_call: string | null
  data_11_call: string | null
  data_12_call: string | null
  observacoes_produto: string | null
  created_at: string
  updated_at: string
  calls_count?: number
}

export const getClientProducts = async (
  clientId: string,
): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('produtos_cliente')
    .select('*, calls(count)')
    .eq('cliente_id', clientId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching client products:', error)
    throw error
  }

  return data.map((item: any) => ({
    ...item,
    calls_count: item.calls?.[0]?.count || 0,
  }))
}

export const createProduct = async (clientId: string, productData: any) => {
  // Insert product
  const { data, error } = await supabase
    .from('produtos_cliente')
    .insert({
      cliente_id: clientId,
      ...productData,
    })
    .select()
    .single()

  if (error) throw error

  // Timeline Event
  await createTimelineEvent(
    clientId,
    'sistema',
    `Produto contratado: ${productData.produto}`,
    data.id,
  )

  // If Venda, insert into vendas
  if (productData.produto === 'Venda') {
    await supabase.from('vendas').insert({
      cliente_id: clientId,
      status_venda: productData.status,
      produto_interesse: 'Venda',
      data_criacao: new Date().toISOString(),
    })
  }

  // Update client classification pending status
  await supabase
    .from('clientes')
    .update({ pendente_classificacao: false })
    .eq('id', clientId)

  return data
}

export const updateProduct = async (
  productId: string,
  updates: any,
  createTimeline: boolean = false,
  clientId?: string,
  productName?: string,
) => {
  const { data: previousData } = await supabase
    .from('produtos_cliente')
    .select('status')
    .eq('id', productId)
    .single()

  const { data, error } = await supabase
    .from('produtos_cliente')
    .update(updates)
    .eq('id', productId)
    .select()
    .single()

  if (error) throw error

  if (createTimeline && clientId && productName && previousData) {
    if (previousData.status !== updates.status) {
      await createTimelineEvent(
        clientId,
        'mudanca_status',
        `${previousData.status} → ${updates.status}`,
        productId,
      )
    } else {
      await createTimelineEvent(
        clientId,
        'sistema',
        `Produto ${productName} atualizado`,
        productId,
      )
    }
  }

  return data
}

export const deleteProduct = async (
  productId: string,
  clientId: string,
  productType: string,
) => {
  const { error } = await supabase
    .from('produtos_cliente')
    .delete()
    .eq('id', productId)

  if (error) throw error

  // Check if client has any products left
  const { count } = await supabase
    .from('produtos_cliente')
    .select('*', { count: 'exact', head: true })
    .eq('cliente_id', clientId)

  if (count === 0) {
    await supabase
      .from('clientes')
      .update({ pendente_classificacao: true })
      .eq('id', clientId)
  }

  // Attempt to delete from vendas if applicable - best effort since we don't have exact ID link
  if (productType === 'Venda') {
    // We avoid deleting blindly from vendas to prevent data loss of other records
    // Logic restricted to produtos_cliente deletion for safety unless specific ID is known
  }
}
