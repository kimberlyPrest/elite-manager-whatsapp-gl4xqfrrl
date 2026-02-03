import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ImportRowData } from '@/services/bulk-import/types'
import { Check, AlertTriangle, X } from 'lucide-react'

interface Props {
  data: ImportRowData[]
  type: 'clients' | 'products' | 'schedules'
}

export function ImportPreviewTable({ data, type }: Props) {
  const cols =
    type === 'clients'
      ? ['nome_completo', 'telefone', 'email']
      : type === 'products'
        ? ['telefone_cliente', 'tipo_produto', 'status']
        : ['telefone_cliente', 'tipo_produto', 'data_agendada']

  return (
    <div className="border border-[#3a3a3a] rounded-lg bg-[#1a1a1a]">
      <ScrollArea className="h-[400px]">
        <Table>
          <TableHeader className="bg-[#2a2a2a] sticky top-0 z-10">
            <TableRow className="border-b-[#3a3a3a] hover:bg-[#2a2a2a]">
              <TableHead className="text-white">Status</TableHead>
              {cols.map((c) => (
                <TableHead key={c} className="text-gray-400 capitalize">
                  {c.replace('_', ' ')}
                </TableHead>
              ))}
              <TableHead className="text-right text-gray-400">Info</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => (
              <TableRow
                key={i}
                className="border-b-[#2a2a2a] hover:bg-[#1f1f1f]"
              >
                <TableCell>
                  {row.status === 'ready' && (
                    <Badge className="bg-[#10b981]">
                      <Check className="h-3 w-3 mr-1" /> Novo
                    </Badge>
                  )}
                  {row.status === 'duplicate' && (
                    <Badge className="bg-[#fbbf24] text-black">
                      <AlertTriangle className="h-3 w-3 mr-1" /> Duplicado
                    </Badge>
                  )}
                  {row.status === 'error' && (
                    <Badge className="bg-[#ef4444]">
                      <X className="h-3 w-3 mr-1" /> Erro
                    </Badge>
                  )}
                </TableCell>
                {cols.map((c) => (
                  <TableCell
                    key={c}
                    className="text-gray-300 text-xs font-mono"
                  >
                    {row.original[c]}
                  </TableCell>
                ))}
                <TableCell className="text-right text-xs text-red-400">
                  {row.errors[0]}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  )
}
