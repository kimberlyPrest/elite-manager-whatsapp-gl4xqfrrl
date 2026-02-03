import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Upload,
  AlertTriangle,
  FileJson,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { importContextData } from '@/services/context'
import { useToast } from '@/hooks/use-toast'

interface ImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ImportModal({
  open,
  onOpenChange,
  onSuccess,
}: ImportModalProps) {
  const [fileData, setFileData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string)
        if (!json.contexto_geral || !json.templates_resposta) {
          throw new Error('Formato inválido')
        }
        setFileData(json)
      } catch (error) {
        toast({
          title: 'Erro na leitura do arquivo',
          description:
            'O arquivo selecionado não é um backup de contexto válido.',
          variant: 'destructive',
        })
        setFileData(null)
      }
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!fileData) return

    setLoading(true)
    try {
      await importContextData(fileData)
      toast({
        title: 'Importação concluída',
        description: 'O contexto foi atualizado com sucesso.',
        className: 'bg-green-900 border-green-800 text-white',
      })
      onSuccess()
      onOpenChange(false)
      setFileData(null)
    } catch (error) {
      toast({
        title: 'Erro na importação',
        description: 'Falha ao salvar os dados no banco.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[#1a1a1a] border-[#2a2a2a] text-white">
        <DialogHeader>
          <DialogTitle>Importar Contexto</DialogTitle>
          <DialogDescription className="text-gray-400">
            Selecione um arquivo JSON de backup para restaurar configurações.
          </DialogDescription>
        </DialogHeader>

        {!fileData ? (
          <div
            className="border-2 border-dashed border-[#3a3a3a] rounded-lg p-10 text-center cursor-pointer hover:border-yellow-500/50 hover:bg-[#2a2a2a]/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-[#2a2a2a] flex items-center justify-center">
                <Upload className="h-6 w-6 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">
                  Selecionar Arquivo
                </h3>
                <p className="text-sm text-gray-500 mt-1">Formato .json</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".json"
                onChange={handleFileChange}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-[#2a2a2a] p-4 rounded-lg border border-[#3a3a3a]">
              <div className="flex items-center gap-3 mb-3">
                <FileJson className="w-8 h-8 text-yellow-500" />
                <div>
                  <h4 className="font-semibold text-white">
                    Backup encontrado
                  </h4>
                  <p className="text-xs text-gray-400">
                    Versão: {fileData.metadata?.version || 'Desconhecida'} •
                    Data:{' '}
                    {new Date(
                      fileData.metadata?.exported_at || Date.now(),
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  {fileData.contexto_geral?.length || 0} Seções de Contexto
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  {fileData.templates_resposta?.length || 0} Templates
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-yellow-900/20 border border-yellow-900/50 rounded text-yellow-200 text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p>
                Atenção: Esta ação irá sobrescrever ou atualizar os registros
                existentes no banco de dados. Certifique-se de que é isso que
                deseja fazer.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {fileData && (
            <>
              <Button
                variant="ghost"
                onClick={() => setFileData(null)}
                className="text-gray-400 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleImport}
                disabled={loading}
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Confirmar Importação
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
