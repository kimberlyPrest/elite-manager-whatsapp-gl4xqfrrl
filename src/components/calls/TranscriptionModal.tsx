import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  FileText,
  Download,
  Copy,
  Upload,
  Link as LinkIcon,
} from 'lucide-react'
import { saveTranscription } from '@/services/calls'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface TranscriptionModalProps {
  callId: string
  initialText: string | null
  initialFilename: string | null
  clientId: string
  productId: string
  onSuccess: () => void
}

export function TranscriptionModal({
  callId,
  initialText,
  initialFilename,
  clientId,
  productId,
  onSuccess,
}: TranscriptionModalProps) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(initialText || '')
  const [filename, setFilename] = useState(initialFilename || '')
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSave = async () => {
    setLoading(true)
    try {
      await saveTranscription(
        callId,
        text,
        filename || null,
        clientId,
        productId,
      )
      toast({
        title: 'Transcrição salva',
        description: 'Os dados foram atualizados com sucesso.',
        className: 'bg-green-600 text-white',
      })
      onSuccess()
      setOpen(false)
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande. Máximo 10MB.',
        variant: 'destructive',
      })
      return
    }

    setFilename(file.name)

    // Attempt to read text files
    if (file.type === 'text/plain') {
      const reader = new FileReader()
      reader.onload = (e) => {
        setText((prev) => prev + '\n\n' + (e.target?.result as string))
      }
      reader.readAsText(file)
    } else {
      // For binary files, just append a note
      setText((prev) => prev + `\n\n[Arquivo anexado: ${file.name}]`)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `transcricao-call-${callId.slice(0, 8)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    toast({ title: 'Texto copiado!' })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 bg-[#1a1a1a] border-[#3a3a3a] text-gray-300 hover:text-white"
        >
          <FileText className="h-3.5 w-3.5" />
          {initialText ? 'Ver Transcrição' : 'Transcrição'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] bg-[#1a1a1a] border-[#2a2a2a] text-white">
        <DialogHeader>
          <DialogTitle>Transcrição da Call</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="bg-[#2a2a2a] border-[#3a3a3a] text-gray-300 hover:text-white hover:bg-[#3a3a3a]"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" /> Upload Arquivo
            </Button>
            <Input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".txt,.pdf,.docx"
              onChange={handleFileUpload}
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 bg-[#2a2a2a] border-[#3a3a3a] text-gray-300 hover:text-white hover:bg-[#3a3a3a]"
                onClick={handleCopy}
                disabled={!text}
              >
                <Copy className="mr-2 h-4 w-4" /> Copiar
              </Button>
              <Button
                variant="outline"
                className="flex-1 bg-[#2a2a2a] border-[#3a3a3a] text-gray-300 hover:text-white hover:bg-[#3a3a3a]"
                onClick={handleDownload}
                disabled={!text}
              >
                <Download className="mr-2 h-4 w-4" /> Baixar
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Conteúdo da Transcrição</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[300px] bg-[#0a0a0a] border-[#3a3a3a] text-gray-300 font-mono text-sm resize-none"
              placeholder="Cole o texto da transcrição aqui ou faça upload de um arquivo..."
              maxLength={50000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {text.length}/50000 caracteres
            </p>
          </div>

          {filename && (
            <div className="flex items-center gap-2 text-sm text-green-500 bg-green-500/10 p-2 rounded">
              <FileText className="h-4 w-4" />
              Arquivo vinculado: {filename}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="text-gray-400"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90"
          >
            {loading ? 'Salvando...' : 'Salvar Transcrição'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
