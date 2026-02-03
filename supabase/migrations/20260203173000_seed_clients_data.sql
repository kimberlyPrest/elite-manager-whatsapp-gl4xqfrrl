-- Insert Seed Data for Clients
INSERT INTO clientes (id, nome_completo, email, telefone, pendente_classificacao, created_at)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Carlos Mendes', 'carlos.mendes@email.com', '+55 (11) 99999-1001', false, NOW() - INTERVAL '2 days'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Ana Clara Souza', 'ana.souza@email.com', '+55 (21) 98888-2002', true, NOW() - INTERVAL '5 days'),
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Roberto Firmino', 'roberto.firmino@email.com', '+55 (31) 97777-3003', false, NOW() - INTERVAL '10 days'),
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Julia Roberts', NULL, '+55 (41) 96666-4004', false, NOW() - INTERVAL '1 day'),
  ('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Marcos Paulo', 'marcos.p@email.com', '+55 (51) 95555-5005', false, NOW() - INTERVAL '20 days'),
  ('f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'Fernanda Lima', 'fernanda.lima@email.com', '+55 (61) 94444-6006', false, NOW() - INTERVAL '1 hour');

-- Insert Products for Clients
INSERT INTO produtos_cliente (cliente_id, produto, status)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Elite', 'Em Consultoria Ativa'),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Scale', 'Onboarding Iniciado'),
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Labs', 'Aguardando Pagamento'),
  ('d3eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Venda', 'Negociação'),
  ('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Elite', 'Renovação Pendente'),
  ('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Labs', 'Em andamento'),
  ('f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a16', 'Scale', 'Ativo');

-- Insert Tags for Clients
INSERT INTO tags_cliente (cliente_id, tipo_tag, ativo)
VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'csat_pendente', true),
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'sem_resposta_7_dias', true),
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'tempo_esgotado', true),
  ('c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'ultima_call_mais_20_dias', true),
  ('e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'vip', true);
