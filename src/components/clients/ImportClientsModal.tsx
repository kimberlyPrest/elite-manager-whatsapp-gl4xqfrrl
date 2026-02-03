import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Upload } from 'lucide-react'
import { ImportTabContent } from './import/ImportTabContent'
import { useState } from 'react'

interface Props {
  trigger?: React.ReactNode
  onSuccess: () => void
}

export function ImportClientsModal({ trigger, onSuccess }: Props) {
  const [open, setOpen] = useState(false)

  const handleSuccess = () => {
    onSuccess()
    // Don't close immediately to let user see result summary
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            className="border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700]/10"
          >
            <Upload className="mr-2 h-4 w-4" /> Importar CSV
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[900px] w-[95vw] max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border-[#2a2a2a] text-white p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-2xl font-bold">
            Importação em Massa
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="clients" className="w-full">
          <TabsList className="bg-[#2a2a2a] w-full justify-start p-1 mb-6">
            <TabsTrigger
              value="clients"
              className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-black"
            >
              Clientes
            </TabsTrigger>
            <TabsTrigger
              value="products"
              className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-black"
            >
              Produtos
            </TabsTrigger>
            <TabsTrigger
              value="schedules"
              className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-black"
            >
              Agendamentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="mt-0">
            <ImportTabContent type="clients" onSuccess={handleSuccess} />
          </TabsContent>
          <TabsContent value="products" className="mt-0">
            <ImportTabContent type="products" onSuccess={handleSuccess} />
          </TabsContent>
          <TabsContent value="schedules" className="mt-0">
            <ImportTabContent type="schedules" onSuccess={handleSuccess} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
