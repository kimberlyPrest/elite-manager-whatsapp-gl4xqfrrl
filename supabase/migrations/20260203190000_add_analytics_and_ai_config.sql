-- Create table for AI Analytics
CREATE TABLE IF NOT EXISTS public.analytics_sugestoes_ia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversa_id UUID NOT NULL REFERENCES public.conversas_whatsapp(id),
    cliente_id UUID REFERENCES public.clientes(id),
    sugestao_gerada TEXT NOT NULL,
    foi_usada BOOLEAN DEFAULT false,
    foi_editada BOOLEAN DEFAULT false,
    feedback_positivo BOOLEAN,
    feedback_comentario TEXT,
    tempo_geracao_ms INTEGER,
    tokens_usados INTEGER,
    modelo_used TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_conversa ON public.analytics_sugestoes_ia(conversa_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_sugestoes_ia(created_at);

-- Insert default configurations for AI settings if they don't exist
INSERT INTO public.configuracoes (chave, valor, tipo) VALUES 
('gemini_temperature', '0.7', 'number'),
('gemini_response_length', 'Adaptativa', 'string')
ON CONFLICT (chave) DO NOTHING;
