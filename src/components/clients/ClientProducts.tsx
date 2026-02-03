import { useState, useEffect } from 'react'
import { Package } from 'lucide-react'
import { Product, getClientProducts } from '@/services/products'
import { ProductCard } from './ProductCard'
import { AddProductModal } from './AddProductModal'
import { Skeleton } from '@/components/ui/skeleton'

interface ClientProductsProps {
  clientId: string
}

export function ClientProducts({ clientId }: ClientProductsProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProducts = async () => {
    try {
      const data = await getClientProducts(clientId)
      setProducts(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (clientId) {
      fetchProducts()
    }
  }, [clientId])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-64 w-full bg-[#1a1a1a]" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Produtos Contratados
          </h2>
          <p className="text-gray-400">
            Gerencie os produtos e serviços contratados por este cliente
          </p>
        </div>
        <AddProductModal clientId={clientId} onSuccess={fetchProducts} />
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] text-center p-8 animate-fade-in">
          <Package className="h-16 w-16 text-[#4a4a4a] mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Nenhum produto contratado
          </h3>
          <p className="text-gray-500 max-w-sm mb-6">
            Este cliente ainda não possui produtos ou serviços contratados.
            Adicione o primeiro produto para iniciar o acompanhamento.
          </p>
          <AddProductModal clientId={clientId} onSuccess={fetchProducts} />
        </div>
      ) : (
        <div className="space-y-4 animate-fade-in-up">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onUpdate={fetchProducts}
            />
          ))}
        </div>
      )}
    </div>
  )
}
