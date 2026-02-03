-- Ensure configuration keys exist for Evolution API
INSERT INTO configuracoes (chave, valor, tipo, updated_at)
VALUES 
  ('evolution_api_url', '', 'string', NOW()),
  ('evolution_api_key', '', 'string', NOW()),
  ('evolution_instance_name', 'org-prestes', 'string', NOW())
ON CONFLICT (chave) DO NOTHING;
