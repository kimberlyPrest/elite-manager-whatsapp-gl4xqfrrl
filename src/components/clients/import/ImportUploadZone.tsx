import { Upload } from 'lucide-react'
import { useCallback } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  onFileSelect: (file: File) => void
  isProcessing: boolean
}

export function ImportUploadZone({ onFileSelect, isProcessing }: Props) {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!isProcessing && e.dataTransfer.files[0]?.name.endsWith('.csv')) {
        onFileSelect(e.dataTransfer.files[0])
      }
    },
    [onFileSelect, isProcessing],
  )

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={cn(
        'border-2 border-dashed border-[#3a3a3a] rounded-xl p-10 flex flex-col items-center justify-center text-center transition-colors bg-[#1a1a1a]',
        !isProcessing && 'hover:border-[#FFD700]/50 cursor-pointer',
      )}
      onClick={() =>
        !isProcessing && document.getElementById('csv-upload')?.click()
      }
    >
      <input
        id="csv-upload"
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
        disabled={isProcessing}
      />

      <div className="h-16 w-16 bg-[#2a2a2a] rounded-full flex items-center justify-center mb-4">
        {isProcessing ? (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD700]" />
        ) : (
          <Upload className="h-8 w-8 text-[#FFD700]" />
        )}
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">
        {isProcessing ? 'Processando...' : 'Arraste CSV aqui'}
      </h3>
      <p className="text-muted-foreground text-sm">
        Ou clique para selecionar (Max 5MB)
      </p>
    </div>
  )
}
