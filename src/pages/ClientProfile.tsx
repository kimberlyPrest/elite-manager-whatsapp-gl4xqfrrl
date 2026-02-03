import { useParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ClientProfile() {
  const { id } = useParams()

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link to="/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Perfil do Cliente
          </h1>
          <p className="text-muted-foreground">
            Visualizando detalhes do cliente ID: {id}
          </p>
        </div>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Informações Detalhadas
          </CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex flex-col items-center justify-center text-muted-foreground bg-secondary/10 rounded-lg m-6 mt-0 border border-dashed border-border">
          <p>Esta é uma página de detalhes placeholder.</p>
          <p className="text-sm mt-2">
            Implemente a visão 360º do cliente aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
