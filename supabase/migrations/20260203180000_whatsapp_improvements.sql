-- Add origin column to messages to distinguish between sent/received
ALTER TABLE mensagens ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'contact'; -- 'me' or 'contact'
ALTER TABLE mensagens ADD COLUMN IF NOT EXISTS message_id TEXT; -- Evolution API Message ID

-- Ensure conversas_whatsapp has necessary indexes
CREATE INDEX IF NOT EXISTS idx_conversas_whatsapp_updated_at ON conversas_whatsapp(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_mensagens_conversa_id ON mensagens(conversa_id);

-- Add function to upsert client by phone
CREATE OR REPLACE FUNCTION upsert_client_by_phone(
    p_phone TEXT,
    p_name TEXT
)
RETURNS UUID AS $$
DECLARE
    v_client_id UUID;
BEGIN
    -- Try to find existing client
    SELECT id INTO v_client_id FROM clientes WHERE telefone = p_phone OR whatsapp_number = p_phone LIMIT 1;
    
    -- If not found, create new
    IF v_client_id IS NULL THEN
        INSERT INTO clientes (nome_completo, telefone, whatsapp_number, data_inicio_consultoria, pendente_classificacao)
        VALUES (p_name, p_phone, p_phone, now(), true)
        RETURNING id INTO v_client_id;
    END IF;
    
    RETURN v_client_id;
END;
$$ LANGUAGE plpgsql;
