-- Create table for Saved Models (Templates)
CREATE TABLE IF NOT EXISTS public.modelos_automacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT,
    filtros JSONB NOT NULL DEFAULT '{}'::jsonb,
    mensagens JSONB NOT NULL DEFAULT '[]'::jsonb,
    configuracao JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Update automacoes_massa with new fields for the advanced wizard
ALTER TABLE public.automacoes_massa 
ADD COLUMN IF NOT EXISTS variacoes_mensagem JSONB DEFAULT '[]'::jsonb,
ALTER COLUMN mensagem_template DROP NOT NULL, -- Make optional as we use variacoes_mensagem now
ADD COLUMN IF NOT EXISTS configuracao_envio JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS filtros_aplicados JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS proximo_envio_timestamp TIMESTAMP WITH TIME ZONE;

-- Create Analytics table for detailed reporting
CREATE TABLE IF NOT EXISTS public.analytics_automacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automacao_id UUID NOT NULL REFERENCES public.automacoes_massa(id),
    total_enviados INTEGER DEFAULT 0,
    total_falhas INTEGER DEFAULT 0,
    total_respostas INTEGER DEFAULT 0,
    taxa_abertura FLOAT DEFAULT 0,
    taxa_resposta FLOAT DEFAULT 0,
    tempo_medio_envio_segundos FLOAT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add index for efficient polling
CREATE INDEX IF NOT EXISTS idx_automacoes_status_proximo 
ON public.automacoes_massa(status_automacao, proximo_envio_timestamp);

-- Add index for recipients queue
CREATE INDEX IF NOT EXISTS idx_destinatarios_fila 
ON public.automacoes_massa_destinatarios(automacao_id, status_envio);
