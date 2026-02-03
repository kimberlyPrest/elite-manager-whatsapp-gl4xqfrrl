-- Add columns for priority scoring and manual override
ALTER TABLE public.conversas_whatsapp ADD COLUMN IF NOT EXISTS prioridade_manual BOOLEAN DEFAULT false;
ALTER TABLE public.conversas_whatsapp ADD COLUMN IF NOT EXISTS score_prioridade INTEGER DEFAULT 0;

-- Create index for performance on sorting by priority and score
CREATE INDEX IF NOT EXISTS idx_conversas_priority_score ON public.conversas_whatsapp(prioridade, score_prioridade DESC, ultima_interacao DESC);

-- Note: Scheduling a cron job requires pg_cron extension and appropriate permissions.
-- The following block is the requested implementation for the daily job.
-- You must replace 'SERVICE_KEY_PLACEHOLDER' with your actual Supabase Service Role Key.

-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- CREATE EXTENSION IF NOT EXISTS pg_net;

-- SELECT cron.schedule(
--   'daily-priority-calc',
--   '0 6 * * *', -- At 06:00 AM
--   $$
--   SELECT
--     net.http_post(
--       url:='https://bqusjlmyvdyqvoydaocb.supabase.co/functions/v1/calcular-prioridade-conversas',
--       headers:='{"Content-Type": "application/json", "Authorization": "Bearer SERVICE_KEY_PLACEHOLDER"}'::jsonb,
--       body:='{}'::jsonb
--     ) as request_id;
--   $$
-- );
