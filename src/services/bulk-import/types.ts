export interface ImportRowData {
  original: Record<string, string>
  status: 'ready' | 'duplicate' | 'error'
  errors: string[]
  parsed?: any
}

export interface ImportSummary {
  total: number
  success: number
  failed: number
  errors: { row: number; message: string }[]
}

export const normalizePhone = (phone: string): string => {
  const nums = phone.replace(/\D/g, '')
  if (nums.length === 11)
    return `+55 (${nums.substring(0, 2)}) ${nums.substring(2, 7)}-${nums.substring(7)}`
  if (nums.length === 10)
    return `+55 (${nums.substring(0, 2)}) ${nums.substring(2, 6)}-${nums.substring(6)}`
  return phone
}

export const cleanPhone = (phone: string) => phone.replace(/\D/g, '')
