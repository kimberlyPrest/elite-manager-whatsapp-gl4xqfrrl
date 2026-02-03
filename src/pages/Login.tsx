import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Loader2, Lock, Mail } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()

  const from = location.state?.from?.pathname || '/'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await signIn(email, password)

      if (error) {
        throw error
      }

      toast({
        title: 'Login realizado com sucesso',
        description: 'Bem-vindo ao Elite Manager.',
        className: 'border-green-500 bg-green-500/10 text-green-500',
      })

      navigate(from, { replace: true })
    } catch (error: any) {
      console.error(error)
      toast({
        title: 'Falha no login',
        description:
          error.message === 'Invalid login credentials'
            ? 'Email ou senha incorretos.'
            : 'Ocorreu um erro ao tentar entrar. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in-up">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-[#FFD700] mb-2">
            Elite Manager
          </h1>
          <p className="text-gray-400">Gestão de Consultoria via WhatsApp</p>
        </div>

        <Card className="bg-[#1a1a1a] border-[#2a2a2a] shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-white">
              Acesso Restrito
            </CardTitle>
            <CardDescription className="text-gray-400">
              Entre com suas credenciais para acessar o sistema
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@elitemanager.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 bg-[#0a0a0a] border-[#3a3a3a] text-white focus:border-[#FFD700] focus:ring-[#FFD700]/20"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 bg-[#0a0a0a] border-[#3a3a3a] text-white focus:border-[#FFD700] focus:ring-[#FFD700]/20"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                className="w-full bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-semibold h-11 transition-all"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-sm text-gray-500">
          Problemas com acesso? Contate o administrador do sistema.
        </p>
      </div>
    </div>
  )
}
