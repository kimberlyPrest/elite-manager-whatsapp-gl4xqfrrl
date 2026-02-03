# Resumo da Refatoração de Automação WhatsApp

## 1. Visão Geral

O sistema de criação de campanhas de automação foi completamente refatorado para oferecer controle total sobre o envio, destinatários e agendamento.

## 2. Novas Funcionalidades Implementadas

### Frontend (Wizard de Campanha)

- **Seleção de Destinatários**:
  - **Filtros Avançados**: Seleção por Tag, Produto, Status e Engajamento.
  - **Lista Manual**: Nova aba permitindo colar números e nomes (formato CSV ou linha a linha) para campanhas rápidas fora da base de clientes.
  - **Preview em Tempo Real**: Contador de destinatários atualizado instantaneamente.

- **Configurações de Envio**:
  - **Horário Comercial Inteligente**: Opção para definir janela de envio (ex: 09:00 às 18:00). A automação pausa automaticamente fora desse horário.
  - **Controle de Lotes (Throttling)**: Opção para enviar X mensagens e pausar por Y minutos (ex: 50 msgs, pausa 10 min) para evitar banimentos do WhatsApp.

### Frontend (Revisão e Aprovação)

- **Modal de Revisão Detalhada**:
  - **Tabela Interativa**: Lista todos os destinatários antes do envio.
  - **Seleção Individual**: Checkboxes para escolher quem realmente deve receber.
  - **Pré-visualização**: Ícone de "olho" para ver exatamente como a mensagem (com variáveis preenchidas) chegará para aquele cliente.
  - **Shuffle de Variações**: Botão para redistribuir aleatoriamente as variações de mensagem.

### Backend (Edge Function `processar-fila-automacao`)

- **Lógica de Horário**: A função agora verifica o horário atual (fuso horário Brasil). Se estiver fora da janela configurada, o envio é adiado.
- **Lógica de Pausa entre Lotes**: Se o limite do lote for atingido, a próxima execução é agendada para `now + pause_minutes`.
- **IDs Temporários**: Suporte para destinatários manuais que não existem na tabela de `clientes` principal.

### Monitoramento

- **Atualização em Tempo Real**: A página de automação faz polling a cada 5 segundos para atualizar o status das campanhas.
- **Trigger Automático**: Enquanto a página de automação estiver aberta, ela atua como um "gatilho" para processar a fila a cada 15 segundos, garantindo rapidez nos envios.

## 3. Próximos Passos (Recomendados)

- **Configurar Cron Job**: Para garantir que as automações rodem mesmo sem nenhum usuário online no dashboard, recomenda-se configurar o pg_cron no Supabase Database para chamar a função `processar-fila-automacao` a cada minuto.
  ```sql
  select cron.schedule(
    'processar-fila-every-minute',
    '* * * * *', -- a cada minuto
    $$
    select
      net.http_post(
          url:='https://PROJECT_REF.supabase.co/functions/v1/processar-fila-automacao',
          headers:='{"Content-Type": "application/json", "Authorization": "Bearer SERVICE_ROLE_KEY"}'
      ) as request_id;
    $$
  );
  ```
