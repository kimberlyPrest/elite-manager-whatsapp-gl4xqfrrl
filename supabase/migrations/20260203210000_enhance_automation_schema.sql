-- Enhance modelos_automacao table with requested columns
ALTER TABLE public.modelos_automacao
ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'Geral',
ADD COLUMN IF NOT EXISTS tipo_selecao TEXT DEFAULT 'Filtros',
ADD COLUMN IF NOT EXISTS variacoes JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS intervalo_min_segundos INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS intervalo_max_segundos INTEGER DEFAULT 300,
ADD COLUMN IF NOT EXISTS horario_comercial BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS horario_inicio TIME DEFAULT '09:00:00',
ADD COLUMN IF NOT EXISTS horario_fim TIME DEFAULT '18:00:00',
ADD COLUMN IF NOT EXISTS dias_semana JSONB DEFAULT '["Mon", "Tue", "Wed", "Thu", "Fri"]'::jsonb,
ADD COLUMN IF NOT EXISTS vezes_usado INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ultima_utilizacao TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS taxa_resposta_media DECIMAL DEFAULT 0;

-- Enhance automacoes_massa_destinatarios for A/B testing and analytics
ALTER TABLE public.automacoes_massa_destinatarios
ADD COLUMN IF NOT EXISTS variacao_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS data_resposta TIMESTAMP WITH TIME ZONE;

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_modelos_categoria ON public.modelos_automacao(categoria);
CREATE INDEX IF NOT EXISTS idx_destinatarios_resposta ON public.automacoes_massa_destinatarios(automacao_id, data_resposta) WHERE data_resposta IS NOT NULL;
