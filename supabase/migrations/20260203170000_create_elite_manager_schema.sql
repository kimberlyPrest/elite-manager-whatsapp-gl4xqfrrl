-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Table: clientes
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_completo TEXT NOT NULL,
    primeiro_nome TEXT,
    sobrenome TEXT,
    email TEXT,
    telefone TEXT NOT NULL,
    whatsapp_number TEXT,
    segmento TEXT,
    dor_principal TEXT,
    nivel_engajamento TEXT,
    potencial_upsell BOOLEAN DEFAULT false,
    observacoes TEXT,
    data_inicio_consultoria TIMESTAMP WITH TIME ZONE,
    pendente_classificacao BOOLEAN DEFAULT false,
    reembolsado BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: produtos_cliente
CREATE TABLE IF NOT EXISTS produtos_cliente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    produto TEXT NOT NULL,
    status TEXT NOT NULL,
    num_calls_total INTEGER DEFAULT 2,
    num_calls_realizadas INTEGER DEFAULT 0,
    data_inicio TIMESTAMP WITH TIME ZONE,
    data_fim_prevista TIMESTAMP WITH TIME ZONE,
    data_1_call TIMESTAMP WITH TIME ZONE,
    data_2_call TIMESTAMP WITH TIME ZONE,
    data_3_call TIMESTAMP WITH TIME ZONE,
    data_4_call TIMESTAMP WITH TIME ZONE,
    data_5_call TIMESTAMP WITH TIME ZONE,
    data_6_call TIMESTAMP WITH TIME ZONE,
    data_7_call TIMESTAMP WITH TIME ZONE,
    data_8_call TIMESTAMP WITH TIME ZONE,
    data_9_call TIMESTAMP WITH TIME ZONE,
    data_10_call TIMESTAMP WITH TIME ZONE,
    data_11_call TIMESTAMP WITH TIME ZONE,
    data_12_call TIMESTAMP WITH TIME ZONE,
    observacoes_produto TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: calls
CREATE TABLE IF NOT EXISTS calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    produto_cliente_id UUID NOT NULL REFERENCES produtos_cliente(id) ON DELETE CASCADE,
    numero_call INTEGER NOT NULL,
    data_agendada TIMESTAMP WITH TIME ZONE,
    data_realizada TIMESTAMP WITH TIME ZONE,
    duracao_minutos INTEGER,
    transcricao TEXT,
    transcricao_filename TEXT,
    csat_enviado BOOLEAN DEFAULT false,
    csat_respondido BOOLEAN DEFAULT false,
    csat_nota INTEGER,
    csat_comentario TEXT,
    csat_data_resposta TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: conversas_whatsapp
CREATE TABLE IF NOT EXISTS conversas_whatsapp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    numero_whatsapp TEXT NOT NULL UNIQUE,
    ultima_mensagem TEXT,
    ultima_mensagem_timestamp TIMESTAMP WITH TIME ZONE,
    ultima_interacao TIMESTAMP WITH TIME ZONE,
    mensagens_nao_lidas INTEGER DEFAULT 0,
    prioridade TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: mensagens
CREATE TABLE IF NOT EXISTS mensagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversa_id UUID NOT NULL REFERENCES conversas_whatsapp(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE,
    status_leitura BOOLEAN DEFAULT false,
    enviado_via TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: tags_cliente
CREATE TABLE IF NOT EXISTS tags_cliente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    produto_cliente_id UUID REFERENCES produtos_cliente(id) ON DELETE CASCADE,
    tipo_tag TEXT NOT NULL,
    dias_contagem INTEGER,
    data_referencia TIMESTAMP WITH TIME ZONE,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: vendas
CREATE TABLE IF NOT EXISTS vendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    produto_interesse TEXT,
    produto_customizado TEXT,
    status_venda TEXT NOT NULL,
    data_fup_agendado TIMESTAMP WITH TIME ZONE,
    valor_estimado DECIMAL,
    valor_fechado DECIMAL,
    origem_lead TEXT,
    probabilidade_fechamento INTEGER,
    observacoes_venda TEXT,
    data_criacao TIMESTAMP WITH TIME ZONE,
    data_fechamento TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: timeline_eventos
CREATE TABLE IF NOT EXISTS timeline_eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    produto_cliente_id UUID,
    tipo_evento TEXT NOT NULL,
    descricao TEXT NOT NULL,
    data_evento TIMESTAMP WITH TIME ZONE,
    resolvido BOOLEAN DEFAULT false,
    data_resolucao TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: contexto_geral
CREATE TABLE IF NOT EXISTS contexto_geral (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    secao TEXT NOT NULL UNIQUE,
    conteudo TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: templates_resposta
CREATE TABLE IF NOT EXISTS templates_resposta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    conteudo TEXT NOT NULL,
    atalho TEXT,
    categoria TEXT,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: automacoes_massa
CREATE TABLE IF NOT EXISTS automacoes_massa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status_automacao TEXT NOT NULL,
    tipo_selecao TEXT NOT NULL,
    mensagem_template TEXT NOT NULL,
    intervalo_min_segundos INTEGER DEFAULT 30,
    intervalo_max_segundos INTEGER DEFAULT 60,
    total_envios_planejados INTEGER,
    total_envios_concluidos INTEGER DEFAULT 0,
    total_envios_falhados INTEGER DEFAULT 0,
    tempo_estimado_segundos INTEGER,
    data_inicio TIMESTAMP WITH TIME ZONE,
    data_conclusao TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: automacoes_massa_destinatarios
CREATE TABLE IF NOT EXISTS automacoes_massa_destinatarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automacao_id UUID NOT NULL REFERENCES automacoes_massa(id) ON DELETE CASCADE,
    cliente_id UUID,
    numero_whatsapp TEXT NOT NULL,
    nome_destinatario TEXT,
    mensagem_personalizada TEXT,
    status_envio TEXT DEFAULT 'aguardando',
    tempo_espera_segundos INTEGER,
    data_envio TIMESTAMP WITH TIME ZONE,
    erro_mensagem TEXT,
    enviar BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: configuracoes
CREATE TABLE IF NOT EXISTS configuracoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chave TEXT NOT NULL UNIQUE,
    valor TEXT,
    tipo TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON clientes(telefone);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);
CREATE INDEX IF NOT EXISTS idx_conversas_whatsapp_numero ON conversas_whatsapp(numero_whatsapp);
CREATE INDEX IF NOT EXISTS idx_conversas_whatsapp_prioridade ON conversas_whatsapp(prioridade);
CREATE INDEX IF NOT EXISTS idx_mensagens_conversa_timestamp ON mensagens(conversa_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_tags_cliente_ativo ON tags_cliente(cliente_id, ativo);
CREATE INDEX IF NOT EXISTS idx_produtos_cliente_cliente ON produtos_cliente(cliente_id);
CREATE INDEX IF NOT EXISTS idx_automacoes_destinatarios_status ON automacoes_massa_destinatarios(automacao_id, status_envio);

-- Enable RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversas_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contexto_geral ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates_resposta ENABLE ROW LEVEL SECURITY;
ALTER TABLE automacoes_massa ENABLE ROW LEVEL SECURITY;
ALTER TABLE automacoes_massa_destinatarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- Create Policies (Allow all for authenticated users)
CREATE POLICY "Allow all access for authenticated users" ON clientes FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all access for authenticated users" ON produtos_cliente FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all access for authenticated users" ON calls FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all access for authenticated users" ON conversas_whatsapp FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all access for authenticated users" ON mensagens FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all access for authenticated users" ON tags_cliente FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all access for authenticated users" ON vendas FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all access for authenticated users" ON timeline_eventos FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all access for authenticated users" ON contexto_geral FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all access for authenticated users" ON templates_resposta FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all access for authenticated users" ON automacoes_massa FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all access for authenticated users" ON automacoes_massa_destinatarios FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all access for authenticated users" ON configuracoes FOR ALL TO authenticated USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_clientes_modtime BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_produtos_cliente_modtime BEFORE UPDATE ON produtos_cliente FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calls_modtime BEFORE UPDATE ON calls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversas_whatsapp_modtime BEFORE UPDATE ON conversas_whatsapp FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tags_cliente_modtime BEFORE UPDATE ON tags_cliente FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendas_modtime BEFORE UPDATE ON vendas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contexto_geral_modtime BEFORE UPDATE ON contexto_geral FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_templates_resposta_modtime BEFORE UPDATE ON templates_resposta FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_automacoes_massa_modtime BEFORE UPDATE ON automacoes_massa FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configuracoes_modtime BEFORE UPDATE ON configuracoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
