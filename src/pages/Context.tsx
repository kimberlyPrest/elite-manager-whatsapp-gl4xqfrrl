import { useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText, Upload, Trash2, Eye, File } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

type Document = {
  id: string
  name: string
  size: string
  uploadDate: string
  type: 'pdf' | 'txt'
}

export default function Context() {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      name: 'Manual_de_Vendas.pdf',
      size: '2.4 MB',
      uploadDate: '12/05/2024',
      type: 'pdf',
    },
    {
      id: '2',
      name: 'Scripts_Atendimento.txt',
      size: '156 KB',
      uploadDate: '10/05/2024',
      type: 'txt',
    },
  ])
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    toast({
      title: 'Arquivo Recebido',
      description: 'Processando upload do arquivo...',
      className: 'border-primary text-foreground bg-background',
    })
    // Mock upload logic would go here
  }

  const handleDelete = (id: string) => {
    setDocuments(documents.filter((doc) => doc.id !== id))
    toast({
      title: 'Arquivo Removido',
      description: 'O documento foi removido da base de conhecimento.',
      variant: 'destructive',
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Contexto da IA</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie a base de conhecimento utilizada pela IA para respostas
        </p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Upload de Arquivos</CardTitle>
          <CardDescription>
            Adicione arquivos PDF ou TXT para enriquecer o contexto da
            consultoria.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-foreground">
                  Arraste e solte arquivos aqui
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  ou clique para selecionar do computador
                </p>
              </div>
              <Input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".pdf,.txt"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">
          Documentos Ativos
        </h2>
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="bg-card border-border shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded bg-secondary flex items-center justify-center">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{doc.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {doc.size} • {doc.uploadDate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
