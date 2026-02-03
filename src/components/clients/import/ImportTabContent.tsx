import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Info, Download } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { ImportUploadZone } from './ImportUploadZone'
import { ImportPreviewTable } from './ImportPreviewTable'
import { ImportResult } from './ImportResult'
import { parseCSV, downloadTemplate } from '@/utils/csv-helpers'
import { validateClients, importClients } from '@/services/bulk-import/clients'
import {
  validateProducts,
  importProducts,
} from '@/services/bulk-import/products'
import {
  validateSchedules,
  importSchedules,
} from '@/services/bulk-import/schedules'
import { ImportRowData, ImportSummary } from '@/services/bulk-import/types'

type ImportType = 'clients' | 'products' | 'schedules'

export function ImportTabContent({
  type,
  onSuccess,
}: {
  type: ImportType
  onSuccess: () => void
}) {
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload')
  const [data, setData] = useState<ImportRowData[]>([])
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<ImportSummary | null>(null)

  const handleFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) return alert('Arquivo > 5MB')
    setLoading(true)
    try {
      const raw = await parseCSV(file)
      const validator =
        type === 'clients'
          ? validateClients
          : type === 'products'
            ? validateProducts
            : validateSchedules
      const processed = await validator(raw)
      setData(processed)
      setStep('preview')
    } catch (e: any) {
      alert(e.message)
    }
    setLoading(false)
  }

  const handleImport = async () => {
    setLoading(true)
    const importer =
      type === 'clients'
        ? importClients
        : type === 'products'
          ? importProducts
          : importSchedules
    const res = await importer(data)
    setSummary({
      total: data.length,
      success: res.count,
      failed: data.length - res.count,
      errors: res.errors.map((e: any) => ({
        row: 0,
        message: e.message || 'Erro',
      })),
    })
    setStep('result')
    setLoading(false)
    if (res.count > 0) onSuccess()
  }

  if (step === 'result' && summary)
    return <ImportResult summary={summary} onClose={() => setStep('upload')} />

  return (
    <div className="space-y-6">
      <Card className="bg-[#2a2a2a] border-none p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-[#FFD700] shrink-0 mt-0.5" />
        <div className="space-y-2 flex-1">
          <h4 className="font-semibold text-white">Instruções</h4>
          <p className="text-sm text-gray-400">
            Baixe o modelo CSV e preencha os dados. Respeite os limites e
            formatos.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadTemplate(type)}
          className="border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700]/10"
        >
          <Download className="mr-2 h-4 w-4" /> Modelo CSV
        </Button>
      </Card>

      {step === 'upload' ? (
        <ImportUploadZone onFileSelect={handleFile} isProcessing={loading} />
      ) : (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">
              Pré-visualização ({data.length})
            </h3>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setStep('upload')}>
                Cancelar
              </Button>
              <Button
                onClick={handleImport}
                disabled={loading}
                className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90"
              >
                {loading ? 'Importando...' : 'Confirmar Importação'}
              </Button>
            </div>
          </div>
          <ImportPreviewTable data={data} type={type} />
        </div>
      )}
    </div>
  )
}
