import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Loader2 } from 'lucide-react'

export function RequireAuth({ children }: { children: JSX.Element }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#0a0a0a] text-[#FFD700] gap-4">
        <Loader2 className="h-12 w-12 animate-spin" />
        <p className="text-sm text-gray-400 animate-pulse">
          Carregando sistema...
        </p>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
