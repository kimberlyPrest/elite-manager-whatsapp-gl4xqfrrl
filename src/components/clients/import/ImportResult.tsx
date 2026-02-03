import { Button } from '@/components/ui/button'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { ImportSummary } from '@/services/bulk-import/types'
import { ScrollArea } from '@/components/ui/scroll-area'

export function ImportResult({
  summary,
  onClose,
}: {
  summary: ImportSummary
  onClose: () => void
}) {
  return (
    <div className="text-center space-y-6 py-4">
      <div className="flex flex-col items-center">
        <div className="h-20 w-20 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="h-10 w-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-white">Concluído</h2>
        <p className="text-muted-foreground">
          {summary.success} importados com sucesso.
        </p>
      </div>

      {summary.failed > 0 && (
        <div className="bg-[#2a1a1a] border border-red-900/50 rounded-lg p-4 text-left max-w-2xl mx-auto">
          <h3 className="flex items-center gap-2 mb-3 text-red-400 font-semibold">
            <AlertCircle className="h-5 w-5" /> {summary.failed} Erros
          </h3>
          <ScrollArea className="h-[150px]">
            <ul className="space-y-2 text-sm text-gray-400">
              {summary.errors.map((e, i) => (
                <li key={i}>
                  <span className="text-red-500 mr-2">Row {e.row}:</span>
                  {e.message}
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      )}
      <Button
        onClick={onClose}
        className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-bold min-w-[200px]"
      >
        Fechar
      </Button>
    </div>
  )
}
