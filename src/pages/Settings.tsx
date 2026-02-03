import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'

export default function Settings() {
  const handleSave = () => {
    toast({
      title: 'Configurações Salvas',
      description: 'Suas alterações foram aplicadas com sucesso.',
      className: 'border-primary text-foreground bg-background',
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie suas preferências e integrações
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-secondary text-muted-foreground w-full justify-start rounded-md p-1">
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-background data-[state=active]:text-primary"
          >
            Perfil
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-background data-[state=active]:text-primary"
          >
            Segurança
          </TabsTrigger>
          <TabsTrigger
            value="integrations"
            className="data-[state=active]:bg-background data-[state=active]:text-primary"
          >
            Integrações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6 space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Informações do Consultor</CardTitle>
              <CardDescription>
                Atualize seus dados de exibição.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    defaultValue="Consultor Elite"
                    className="bg-input border-input focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    defaultValue="contato@elite.com"
                    className="bg-input border-input focus:border-primary"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio Profissional</Label>
                <Input
                  id="bio"
                  defaultValue="Especialista em Gestão Empresarial e Vendas"
                  className="bg-input border-input focus:border-primary"
                />
              </div>
              <Button
                onClick={handleSave}
                className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
              >
                Salvar Alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6 space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Segurança da Conta</CardTitle>
              <CardDescription>Gerencie sua senha e acesso.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Senha Atual</Label>
                <Input
                  id="current-password"
                  type="password"
                  className="bg-input border-input focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova Senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  className="bg-input border-input focus:border-primary"
                />
              </div>
              <Button
                onClick={handleSave}
                className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
              >
                Atualizar Senha
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6 space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Chaves de API</CardTitle>
              <CardDescription>Conecte serviços externos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="openai-key">OpenAI API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="openai-key"
                    type="password"
                    value="sk-........................"
                    readOnly
                    className="bg-input border-input font-mono"
                  />
                  <Button
                    variant="outline"
                    className="border-primary text-primary hover:bg-primary/10"
                  >
                    Revelar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Utilizada para gerar respostas inteligentes.
                </p>
              </div>
              <Separator className="bg-border" />
              <div className="space-y-2">
                <Label htmlFor="whatsapp-key">WhatsApp Business API</Label>
                <Input
                  id="whatsapp-key"
                  placeholder="Cole sua chave aqui"
                  className="bg-input border-input focus:border-primary"
                />
              </div>
              <Button
                onClick={handleSave}
                className="bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
              >
                Salvar Integrações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
