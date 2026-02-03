import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, QrCode } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QRCodeDisplayProps {
  qrCode: string
  onRefresh: () => void
  loading: boolean
}

export function QRCodeDisplay({
  qrCode,
  onRefresh,
  loading,
}: QRCodeDisplayProps) {
  const [timeLeft, setTimeLeft] = useState(45)
  const isExpired = timeLeft <= 0

  useEffect(() => {
    // Reset timer when a new QR code (string) is provided
    setTimeLeft(45)
  }, [qrCode])

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft])

  return (
    <div className="mt-6 rounded-xl bg-[#2a2a2a] p-8 text-center animate-in fade-in zoom-in duration-300 border border-[#333] relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FFD700] to-transparent animate-pulse" />

      <h3 className="text-lg font-medium text-white mb-4 flex items-center justify-center gap-2">
        <QrCode className="h-5 w-5 text-[#FFD700]" />
        Escaneie o QR Code
      </h3>

      <div className="relative inline-block mx-auto mb-4">
        {/* Container for the QR Code */}
        <div
          className={cn(
            'bg-white p-2 rounded-lg shadow-xl transition-all duration-500',
            (isExpired || loading) && 'blur-sm opacity-50 grayscale',
          )}
        >
          <img
            src={qrCode}
            alt="QR Code WhatsApp"
            className="w-64 h-64 object-contain"
          />
        </div>

        {/* Overlay for Expired or Loading State */}
        {(isExpired || loading) && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            {loading ? (
              <div className="bg-black/80 p-4 rounded-full shadow-lg border border-[#333]">
                <Loader2 className="h-8 w-8 text-[#FFD700] animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-black/80 px-4 py-2 rounded-lg border border-red-900/50 shadow-lg mb-2">
                  <p className="text-red-400 font-bold text-sm">
                    QR Code Expirado
                  </p>
                </div>
                <Button
                  onClick={onRefresh}
                  variant="secondary"
                  className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90 font-semibold shadow-lg hover:scale-105 transition-transform"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Gerar Novo Código
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="max-w-xs mx-auto text-sm text-gray-400 space-y-2 text-left bg-black/40 p-4 rounded-lg border border-[#333]">
        <p className="flex items-center gap-2">
          <span className="bg-[#333] w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white">
            1
          </span>{' '}
          Abra o WhatsApp no celular
        </p>
        <p className="flex items-center gap-2">
          <span className="bg-[#333] w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white">
            2
          </span>{' '}
          Menu &gt; Aparelhos conectados
        </p>
        <p className="flex items-center gap-2">
          <span className="bg-[#333] w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white">
            3
          </span>{' '}
          Toque em <strong>Conectar um aparelho</strong>
        </p>
        <p className="flex items-center gap-2">
          <span className="bg-[#333] w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white">
            4
          </span>{' '}
          Aponte a câmera para esta tela
        </p>
      </div>

      {!isExpired && !loading && (
        <div className="mt-4 flex items-center justify-center gap-2 text-[#FFD700] font-mono text-xs">
          <Loader2 className="h-3 w-3 animate-spin" />
          Aguardando leitura ({timeLeft}s)...
        </div>
      )}
    </div>
  )
}
