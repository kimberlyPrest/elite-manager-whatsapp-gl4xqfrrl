-- Create enum for automation status
CREATE TYPE automation_status AS ENUM ('aguardando', 'ativa', 'pausada', 'concluida', 'cancelada');

-- Create enum for recipient status
CREATE TYPE recipient_status AS ENUM ('aguardando', 'enviando', 'enviado', 'falhou');

-- Main Automation Campaign Table
CREATE TABLE IF NOT EXISTS automacoes_massa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    objetivo TEXT,
    status automation_status DEFAULT 'aguardando',
    tipo_selecao TEXT CHECK (tipo_selecao IN ('filtros', 'manual')),
    
    -- Message Config
    mensagem_base TEXT NOT NULL,
    variacoes_mensagem JSONB DEFAULT '[]'::jsonb, -- Array of strings
    
    -- Timing Config
    intervalo_min_segundos INTEGER DEFAULT 30,
    intervalo_max_segundos INTEGER DEFAULT 60,
    enviar_apenas_horario_comercial BOOLEAN DEFAULT false,
    horario_inicio TIME DEFAULT '09:00',
    horario_fim TIME DEFAULT '18:00',
    dias_semana JSONB DEFAULT '["Mon", "Tue", "Wed", "Thu", "Fri"]'::jsonb,
    
    -- Batch Config
    pausa_em_lotes BOOLEAN DEFAULT false,
    tamanho_lote INTEGER DEFAULT 50,
    intervalo_pausa_minutos INTEGER DEFAULT 10,
    
    -- Metrics (Counters for quick access)
    total_destinatarios INTEGER DEFAULT 0,
    total_enviados INTEGER DEFAULT 0,
    total_falhas INTEGER DEFAULT 0,
    
    data_inicio TIMESTAMPTZ,
    data_conclusao TIMESTAMPTZ,
    data_criacao TIMESTAMPTZ DEFAULT NOW(),
    
    user_id UUID REFERENCES auth.users(id) -- Optional owner
);

-- Turn on RLS
ALTER TABLE automacoes_massa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON automacoes_massa FOR ALL USING (true);


-- Recipients Table (The Queue)
CREATE TABLE IF NOT EXISTS automacoes_massa_destinatarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automacao_id UUID REFERENCES automacoes_massa(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL, -- Link to existing client if any
    
    nome TEXT, -- Snapshot of name
    telefone TEXT NOT NULL,
    
    mensagem_personalizada TEXT NOT NULL,
    variacao_usada INTEGER DEFAULT 0, -- Index of variation used
    
    status recipient_status DEFAULT 'aguardando',
    erro_mensagem TEXT,
    
    tempo_espera_segundos INTEGER DEFAULT 0, -- Random delay assigned
    data_envio TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_queue_automation_status ON automacoes_massa_destinatarios(automacao_id, status);
ALTER TABLE automacoes_massa_destinatarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON automacoes_massa_destinatarios FOR ALL USING (true);


-- Automation Templates (Models)
CREATE TABLE IF NOT EXISTS modelos_automacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT,
    
    -- JSON blobs to store config
    configuracao_filtro JSONB,
    configuracao_mensagem JSONB,
    configuracao_envio JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE modelos_automacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON modelos_automacao FOR ALL USING (true);

-- Analytics (History)
CREATE TABLE IF NOT EXISTS analytics_automacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automacao_id UUID REFERENCES automacoes_massa(id) ON DELETE CASCADE,
    
    total_enviados INTEGER DEFAULT 0,
    total_falhas INTEGER DEFAULT 0,
    total_respostas INTEGER DEFAULT 0,
    taxa_sucesso NUMERIC,
    custo_estimado NUMERIC,
    
    data_registro TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE analytics_automacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON analytics_automacoes FOR ALL USING (true);
