import { useEffect, useState } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft, User, Phone, FileText, Activity } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClientProducts } from '@/components/clients/ClientProducts'
import { supabase } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'

export default function ClientProfile() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const [clientName, setClientName] = useState('')
  const [loading, setLoading] = useState(true)

  const tab = searchParams.get('tab') || 'produtos'

  useEffect(() => {
    const fetchClient = async () => {
      if (!id) return
      const { data, error } = await supabase
        .from('clientes')
        .select('nome_completo')
        .eq('id', id)
        .single()
      if (data) setClientName(data.nome_completo)
      setLoading(false)
    }
    fetchClient()
  }, [id])

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value })
  }

  if (loading)
    return (
      <div className="p-8">
        <Skeleton className="h-12 w-64 mb-8 bg-[#1a1a1a]" />
        <Skeleton className="h-96 w-full bg-[#1a1a1a]" />
      </div>
    )
  if (!id) return <div>Cliente não encontrado</div>

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 md:p-8 animate-fade-in pb-20">
      <div className="flex items-center gap-4">
        <Link to="/clients">
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-[#2a2a2a] text-white"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{clientName}</h1>
          <p className="text-muted-foreground text-sm">
            Gerenciamento do Cliente
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="bg-[#1a1a1a] border border-[#2a2a2a] p-1 w-full justify-start overflow-x-auto">
          <TabsTrigger
            value="contexto"
            className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-[#FFD700]"
          >
            Contexto
          </TabsTrigger>
          <TabsTrigger
            value="whatsapp"
            className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-[#FFD700]"
          >
            WhatsApp
          </TabsTrigger>
          <TabsTrigger
            value="produtos"
            className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-[#FFD700]"
          >
            Produtos
          </TabsTrigger>
          <TabsTrigger
            value="timeline"
            className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-[#FFD700]"
          >
            Timeline
          </TabsTrigger>
          <TabsTrigger
            value="calls"
            className="data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-[#FFD700]"
          >
            Calls
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="contexto">
            <div className="p-8 text-center text-gray-500 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Contexto Geral (Em breve)</p>
            </div>
          </TabsContent>

          <TabsContent value="whatsapp">
            <div className="p-8 text-center text-gray-500 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
              <Phone className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Histórico do WhatsApp (Em breve)</p>
            </div>
          </TabsContent>

          <TabsContent value="produtos">
            <ClientProducts clientId={id} />
          </TabsContent>

          <TabsContent value="timeline">
            <div className="p-8 text-center text-gray-500 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Timeline de Eventos (Em breve)</p>
            </div>
          </TabsContent>

          <TabsContent value="calls">
            <div className="p-8 text-center text-gray-500 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
              <Phone className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Gestão de Calls (Em breve)</p>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
