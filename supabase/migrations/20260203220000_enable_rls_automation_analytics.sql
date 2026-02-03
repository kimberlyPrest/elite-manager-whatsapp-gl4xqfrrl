-- Enable RLS for modelos_automacao
ALTER TABLE public.modelos_automacao ENABLE ROW LEVEL SECURITY;

-- Create policy for modelos_automacao
CREATE POLICY "Allow all access for authenticated users" ON public.modelos_automacao
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Enable RLS for analytics_sugestoes_ia
ALTER TABLE public.analytics_sugestoes_ia ENABLE ROW LEVEL SECURITY;

-- Create policy for analytics_sugestoes_ia
CREATE POLICY "Allow all access for authenticated users" ON public.analytics_sugestoes_ia
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Enable RLS for analytics_automacoes
ALTER TABLE public.analytics_automacoes ENABLE ROW LEVEL SECURITY;

-- Create policy for analytics_automacoes
CREATE POLICY "Allow all access for authenticated users" ON public.analytics_automacoes
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
