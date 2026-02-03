import { supabase } from '@/lib/supabase/client'
import { ImportRowData, normalizePhone, cleanPhone } from './types'

export const validateClients = async (
  rows: Record<string, string>[],
): Promise<ImportRowData[]> => {
  const phones = rows
    .map((r) => normalizePhone(r.telefone || ''))
    .filter((p) => p.length > 5)
  let existing = new Set<string>()

  if (phones.length) {
    const { data } = await supabase
      .from('clientes')
      .select('telefone')
      .in('telefone', phones)
    data?.forEach((c) => existing.add(c.telefone))
  }

  return rows.map((row) => {
    const errors: string[] = []
    const clean = cleanPhone(row.telefone || '')
    const formatted = normalizePhone(row.telefone || '')

    if (!row.nome_completo || row.nome_completo.length < 3)
      errors.push('Nome < 3 chars')
    if (clean.length < 10) errors.push('Telefone inválido')
    if (
      row.nivel_engajamento &&
      !['Alto', 'Médio', 'Baixo'].includes(row.nivel_engajamento)
    )
      errors.push('Engajamento inválido')

    let status: ImportRowData['status'] = 'ready'
    if (errors.length) status = 'error'
    else if (existing.has(formatted)) {
      status = 'duplicate'
      errors.push('Já cadastrado')
    }

    return {
      original: row,
      status,
      errors,
      parsed:
        status !== 'error'
          ? {
              ...row,
              telefone: formatted,
              potencial_upsell: row.potencial_upsell === 'true',
            }
          : undefined,
    }
  })
}

export const importClients = async (data: ImportRowData[]) => {
  const valid = data.filter((d) => d.status === 'ready' && d.parsed)
  if (!valid.length) return { count: 0, errors: [] }

  const payload = valid.map((d) => {
    const parts = d.parsed.nome_completo.split(' ')
    return {
      nome_completo: d.parsed.nome_completo,
      primeiro_nome: parts[0],
      sobrenome: parts.slice(1).join(' '),
      telefone: d.parsed.telefone,
      whatsapp_number: d.parsed.telefone,
      email: d.parsed.email,
      segmento: d.parsed.segmento,
      dor_principal: d.parsed.dor_principal,
      nivel_engajamento: d.parsed.nivel_engajamento,
      potencial_upsell: d.parsed.potencial_upsell,
      observacoes: d.parsed.observacoes,
      pendente_classificacao: true,
    }
  })

  const { error } = await supabase.from('clientes').insert(payload)
  return {
    count: error ? 0 : payload.length,
    errors: error ? [{ row: 0, message: error.message }] : [],
  }
}
