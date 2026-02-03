import { supabase } from '@/lib/supabase/client'
import { ImportRowData, normalizePhone } from './types'
import { isPast, differenceInDays } from 'date-fns'

export const validateSchedules = async (
  rows: Record<string, string>[],
): Promise<ImportRowData[]> => {
  const phones = rows.map((r) => normalizePhone(r.telefone_cliente || ''))
  const clients = new Map<string, { id: string; products: any[] }>()

  if (phones.length) {
    const { data } = await supabase
      .from('clientes')
      .select('id, telefone, produtos_cliente(id, produto, num_calls_total)')
      .in('telefone', phones)
    data?.forEach((c) =>
      clients.set(c.telefone, { id: c.id, products: c.produtos_cliente }),
    )
  }

  return rows.map((row) => {
    const errors: string[] = []
    const phone = normalizePhone(row.telefone_cliente || '')
    const client = clients.get(phone)
    const product = client?.products.find(
      (p) => p.produto.toLowerCase() === row.tipo_produto?.toLowerCase(),
    )

    if (!client) errors.push('Cliente não encontrado')
    if (client && !product) errors.push('Produto não encontrado')

    const callNum = parseInt(row.numero_call)
    if (
      product &&
      (isNaN(callNum) || callNum > (product.num_calls_total || 99))
    )
      errors.push('Número call inválido')

    if (row.data_agendada) {
      const dt = new Date(
        `${row.data_agendada}T${row.hora_agendada || '00:00'}`,
      )
      if (isPast(dt) && differenceInDays(new Date(), dt) > 1)
        errors.push('Data passada')
    } else errors.push('Data obrigatória')

    return {
      original: row,
      status: errors.length ? 'error' : 'ready',
      errors,
      parsed:
        errors.length === 0
          ? {
              produto_id: product!.id,
              cliente_id: client!.id,
              numero_call: callNum,
              date: `${row.data_agendada}T${row.hora_agendada || '00:00'}:00`,
            }
          : undefined,
    }
  })
}

export const importSchedules = async (data: ImportRowData[]) => {
  let count = 0
  const errors: any[] = []

  for (const item of data) {
    if (item.status !== 'ready') continue
    try {
      const { parsed } = item
      await supabase
        .from('produtos_cliente')
        .update({ [`data_${parsed.numero_call}_call`]: parsed.date })
        .eq('id', parsed.produto_id)

      await supabase.from('calls').insert({
        produto_cliente_id: parsed.produto_id,
        numero_call: parsed.numero_call,
        data_agendada: parsed.date,
      })

      if (differenceInDays(new Date(parsed.date), new Date()) <= 3) {
        await supabase.from('tags_cliente').insert({
          cliente_id: parsed.cliente_id,
          tipo_tag: 'agendamento_proximo',
          ativo: true,
        })
      }
      count++
    } catch (e: any) {
      errors.push({ row: item.original.telefone_cliente, message: e.message })
    }
  }
  return { count, errors }
}
