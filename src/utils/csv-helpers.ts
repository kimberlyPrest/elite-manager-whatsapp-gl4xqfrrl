export const parseCSV = async (
  file: File,
): Promise<Record<string, string>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split(/\r\n|\n/).filter((line) => line.trim())
        if (lines.length < 2) throw new Error('CSV deve ter cabeçalho e dados.')

        const separator = text.includes(';') ? ';' : ','
        const headers = lines[0]
          .split(separator)
          .map((h) => h.trim().replace(/^"|"$/g, ''))

        const result = []
        for (let i = 1; i < lines.length; i++) {
          if (i > 500) break
          const values = lines[i]
            .split(separator)
            .map((v) => v.trim().replace(/^"|"$/g, ''))
          if (values.length === headers.length) {
            const obj: Record<string, string> = {}
            headers.forEach((h, idx) => (obj[h] = values[idx]))
            result.push(obj)
          }
        }
        resolve(result)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Erro ao ler arquivo.'))
    reader.readAsText(file)
  })
}

export const downloadTemplate = (
  type: 'clients' | 'products' | 'schedules',
) => {
  let headers: string[] = []
  let rows: string[] = []

  if (type === 'clients') {
    headers = [
      'nome_completo',
      'telefone',
      'email',
      'segmento',
      'dor_principal',
      'nivel_engajamento',
      'potencial_upsell',
      'observacoes',
    ]
    rows = [
      'João Silva,11999998888,joao@mail.com,Marketing,Vendas,Alto,true,Obs',
      'Maria Souza,21988887777,maria@mail.com,Saúde,Tempo,Médio,false,Obs',
    ]
  } else if (type === 'products') {
    headers = [
      'telefone_cliente',
      'tipo_produto',
      'status',
      'data_inicio',
      'data_fim_prevista',
      'num_calls',
      'observacoes',
    ]
    rows = [
      '11999998888,Scale,Ativo,2024-01-01,2024-03-01,8,Obs',
      '21988887777,Elite,Novo,2024-02-01,2024-04-01,,Obs',
    ]
  } else {
    headers = [
      'telefone_cliente',
      'tipo_produto',
      'numero_call',
      'data_agendada',
      'hora_agendada',
    ]
    rows = ['11999998888,Scale,1,2024-02-15,14:00']
  }

  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `template_${type}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
