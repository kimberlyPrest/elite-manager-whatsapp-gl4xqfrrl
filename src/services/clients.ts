import { supabase } from '@/lib/supabase/client'

export interface ClientProduct {
  id: string
  produto: string
  status: string
}

export interface ClientTag {
  id: string
  tipo_tag: string
  ativo: boolean
}

export interface Client {
  id: string
  nome_completo: string
  email: string | null
  telefone: string
  pendente_classificacao: boolean
  created_at: string
  produtos_cliente: ClientProduct[]
  tags_cliente: ClientTag[]
}

export type ClientFilter =
  | 'Todos'
  | 'Elite'
  | 'Scale'
  | 'Labs'
  | 'Venda'
  | 'Pendente'

export interface NewClientPayload {
  nome_completo: string
  primeiro_nome: string
  sobrenome: string
  telefone: string
  whatsapp_number: string
  email: string
  segmento: string
  nivel_engajamento: string
  dor_principal: string
  observacoes: string
  potencial_upsell: boolean
  pendente_classificacao: boolean
}

export interface NewProductPayload {
  produto: string
  status: string
  num_calls_total: number | null
  data_inicio: string
  data_fim_prevista: string
  observacoes_produto: string
}

export const getClients = async (
  search: string = '',
  filter: ClientFilter = 'Todos',
): Promise<Client[]> => {
  let query = supabase
    .from('clientes')
    .select(
      `
      id,
      nome_completo,
      email,
      telefone,
      pendente_classificacao,
      created_at,
      produtos_cliente (id, produto, status),
      tags_cliente (id, tipo_tag, ativo)
    `,
    )
    .order('created_at', { ascending: false })

  // Apply Search
  if (search) {
    query = query.or(
      `nome_completo.ilike.%${search}%,telefone.ilike.%${search}%,email.ilike.%${search}%`,
    )
  }

  // Apply Filter
  if (filter === 'Pendente') {
    query = query.eq('pendente_classificacao', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching clients:', error)
    throw error
  }

  let filteredData = data as unknown as Client[]

  // In-memory filter for products to ensure we display clients correctly
  if (filter !== 'Todos' && filter !== 'Pendente') {
    filteredData = filteredData.filter((client) =>
      client.produtos_cliente.some(
        (p) => p.produto.toLowerCase() === filter.toLowerCase(),
      ),
    )
  }

  return filteredData
}

export const getClientCounts = async () => {
  const getProductCount = async (product: string) => {
    const { count } = await supabase
      .from('produtos_cliente')
      .select('id', { count: 'exact', head: true })
      .eq('produto', product)
    return count || 0
  }

  const [all, pendente, elite, scale, labs, venda] = await Promise.all([
    supabase
      .from('clientes')
      .select('id', { count: 'exact', head: true })
      .then((r) => r.count || 0),
    supabase
      .from('clientes')
      .select('id', { count: 'exact', head: true })
      .eq('pendente_classificacao', true)
      .then((r) => r.count || 0),
    getProductCount('Elite'),
    getProductCount('Scale'),
    getProductCount('Labs'),
    getProductCount('Venda'),
  ])

  return {
    Todos: all,
    Pendente: pendente,
    Elite: elite,
    Scale: scale,
    Labs: labs,
    Venda: venda,
  }
}

export const createClient = async (
  clientData: NewClientPayload,
  productsData: NewProductPayload[],
) => {
  const { data, error } = await supabase.rpc('create_new_client', {
    p_client_data: clientData as any, // Cast to any to avoid strict JSONB type mismatch with client
    p_products_data: productsData as any,
  })

  if (error) throw error
  return data
}
