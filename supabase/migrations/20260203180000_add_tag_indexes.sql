-- Add performance indexes for tagging system
CREATE INDEX IF NOT EXISTS idx_conversas_whatsapp_cliente_interacao ON conversas_whatsapp(cliente_id, ultima_interacao);
CREATE INDEX IF NOT EXISTS idx_calls_produto_data_realizada ON calls(produto_cliente_id, data_realizada);
CREATE INDEX IF NOT EXISTS idx_calls_produto_data_agendada ON calls(produto_cliente_id, data_agendada);
CREATE INDEX IF NOT EXISTS idx_tags_cliente_cliente_ativo ON tags_cliente(cliente_id, ativo);

-- Attempt to enable pg_cron if available (requires superuser or specific permissions usually available in Supabase)
-- Note: Scheduling the job is best done via Dashboard to securely manage URL and Keys
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
