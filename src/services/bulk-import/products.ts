import { supabase } from '@/lib/supabase/client'
import { ImportRowData, normalizePhone } from './types'

export const validateProducts = async (
  rows: Record<string, string>[],
): Promise<ImportRowData[]> => {
  const phones = rows.map((r) => normalizePhone(r.telefone_cliente || ''))
  const clientMap = new Map<string, string>()

  if (phones.length) {
    const { data } = await supabase
      .from('clientes')
      .select('id, telefone')
      .in('telefone', phones)
    data?.forEach((c) => clientMap.set(c.telefone, c.id))
  }

  return rows.map((row) => {
    const errors: string[] = []
    const phone = normalizePhone(row.telefone_cliente || '')
    const type = row.tipo_produto?.toLowerCase()

    if (!clientMap.has(phone)) errors.push('Cliente não encontrado')
    if (!['elite', 'scale', 'labs', 'venda'].includes(type || ''))
      errors.push('Tipo inválido')
    if (type === 'scale' && !['6', '8'].includes(row.num_calls || ''))
      errors.push('Scale deve ter 6 ou 8 calls')

    return {
      original: row,
      status: errors.length ? 'error' : 'ready',
      errors,
      parsed:
        errors.length === 0
          ? {
              cliente_id: clientMap.get(phone),
              produto: row.tipo_produto,
              status: row.status,
              data_inicio: row.data_inicio,
              data_fim_prevista: row.data_fim_prevista,
              num_calls: row.num_calls,
              type,
              observacoes: row.observacoes,
            }
          : undefined,
    }
  })
}

export const importProducts = async (data: ImportRowData[]) => {
  let count = 0
  const errors: any[] = []

  for (const item of data) {
    if (item.status !== 'ready') continue
    try {
      const { parsed } = item
      const calls =
        parsed.type === 'elite'
          ? 2
          : parsed.type === 'labs'
            ? 12
            : parsed.type === 'scale'
              ? parseInt(parsed.num_calls)
              : null

      await supabase.from('produtos_cliente').insert({
        cliente_id: parsed.cliente_id,
        produto: parsed.produto,
        status: parsed.status,
        num_calls_total: calls,
        data_inicio: parsed.data_inicio
          ? new Date(parsed.data_inicio).toISOString()
          : null,
        data_fim_prevista: parsed.data_fim_prevista
          ? new Date(parsed.data_fim_prevista).toISOString()
          : null,
        observacoes_produto: parsed.observacoes,
      })

      if (parsed.type === 'venda') {
        await supabase.from('vendas').insert({
          cliente_id: parsed.cliente_id,
          status_venda: parsed.status,
          produto_interesse: 'Venda',
          data_criacao: new Date().toISOString(),
        })
      }

      await supabase
        .from('clientes')
        .update({ pendente_classificacao: false })
        .eq('id', parsed.cliente_id)
      count++
    } catch (e: any) {
      errors.push({ row: item.original.telefone_cliente, message: e.message })
    }
  }
  return { count, errors }
}
