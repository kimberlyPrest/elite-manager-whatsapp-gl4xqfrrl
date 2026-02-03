import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase Client with Service Role Key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Get Active Automations ready to send
    // We limit concurrency to 5 automations per execution to avoid rate limits
    const { data: automations, error: autoError } = await supabase
      .from('automacoes_massa')
      .select('*')
      .eq('status_automacao', 'ativa')
      .lte('proximo_envio_timestamp', new Date().toISOString())
      .limit(5)

    if (autoError) throw autoError
    if (!automations || automations.length === 0) {
      return new Response(
        JSON.stringify({
          processed: 0,
          message: 'No active automations ready',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    let processedCount = 0

    // 2. Fetch Config for Evolution API (Just once)
    const { data: configData } = await supabase
      .from('configuracoes')
      .select('chave, valor')
      .in('chave', ['evolution_url', 'evolution_apikey', 'evolution_instance'])

    const config: Record<string, string> = {}
    configData?.forEach((c: any) => (config[c.chave] = c.valor))

    if (
      !config.evolution_url ||
      !config.evolution_apikey ||
      !config.evolution_instance
    ) {
      console.error('Missing Evolution API Config')
      return new Response(JSON.stringify({ error: 'Config missing' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Process each automation
    for (const automation of automations) {
      // 2.1 Check Business Hours
      const configEnvio = automation.configuracao_envio || {}
      if (configEnvio.business_hours_enabled) {
        const now = new Date()
        // Adjust to Brazil time roughly or use UTC if config expects UTC.
        // Assuming simpel HH:mm comparison for now.
        // Getting current hours in UTC-3 (Brazil) for safety or use formatting
        const brazilTime = new Date(
          now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }),
        )
        const currentHour = brazilTime.getHours()
        const currentMinute = brazilTime.getMinutes()
        const currentTimeVal = currentHour * 60 + currentMinute

        const [startH, startM] = (configEnvio.start_time || '09:00')
          .split(':')
          .map(Number)
        const [endH, endM] = (configEnvio.end_time || '18:00')
          .split(':')
          .map(Number)
        const startTimeVal = startH * 60 + startM
        const endTimeVal = endH * 60 + endM

        if (currentTimeVal < startTimeVal || currentTimeVal > endTimeVal) {
          console.log(
            `Automation ${automation.id} paused due to business hours.`,
          )
          // Schedule for next start time (tomorrow or today later if before start)
          // Simple approach: set to next check in 1 hour
          // ideally we calculate exact next start date
          continue
        }
      }
      // 3. Get ONE pending recipient
      // Using maybeSingle() to handle case where no recipients are left without throwing
      const { data: recipient, error: recipientError } = await supabase
        .from('automacoes_massa_destinatarios')
        .select('*')
        .eq('automacao_id', automation.id)
        .eq('status_envio', 'aguardando')
        .limit(1)
        .maybeSingle()

      if (recipientError) {
        console.error(
          `Error fetching recipient for automation ${automation.id}:`,
          recipientError,
        )
        continue
      }

      if (!recipient) {
        // No more recipients, mark automation as complete
        await supabase
          .from('automacoes_massa')
          .update({ status_automacao: 'concluida' })
          .eq('id', automation.id)
        continue
      }

      // 4. Send Message via Evolution API
      let success = false
      let apiError = null

      try {
        const response = await fetch(
          `${config.evolution_url}/message/sendText/${config.evolution_instance}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: config.evolution_apikey,
            },
            body: JSON.stringify({
              number: recipient.numero_whatsapp,
              options: { delay: 0, presence: 'composing' },
              textMessage: { text: recipient.mensagem_personalizada || '' },
            }),
          },
        )

        if (response.ok) {
          success = true
        } else {
          const text = await response.text()
          apiError = `API Error: ${response.status} - ${text}`
          console.error(`Evolution API Error: ${apiError}`)
        }
      } catch (e: any) {
        apiError = `Network/System Error: ${e.message}`
        console.error(`Fetch Error: ${apiError}`)
      }

      // 5. Update Recipient Status
      await supabase
        .from('automacoes_massa_destinatarios')
        .update({
          status_envio: success ? 'enviado' : 'falhou',
          data_envio: new Date().toISOString(),
          erro_mensagem: apiError,
        })
        .eq('id', recipient.id)

      // 6. Handle Conversation History & Metadata
      // Wrapped in try-catch to ensure automation continues even if logging fails
      if (success) {
        try {
          // Normalize Phone Number (Remove non-digits)
          const normalizedPhone = recipient.numero_whatsapp.replace(/\D/g, '')
          const now = new Date().toISOString()

          // A. Find Existing Conversation
          let conversationId = null
          const { data: existingConv } = await supabase
            .from('conversas_whatsapp')
            .select('id')
            .eq('numero_whatsapp', normalizedPhone)
            .maybeSingle()

          if (existingConv) {
            conversationId = existingConv.id
          } else {
            // B. Conversation not found, check for Client
            let clientId = null
            const { data: existingClient } = await supabase
              .from('clientes')
              .select('id')
              .or(
                `telefone.eq.${normalizedPhone},whatsapp_number.eq.${normalizedPhone}`,
              )
              .limit(1)
              .maybeSingle()

            if (existingClient) {
              clientId = existingClient.id
            } else {
              // C. Client not found, create new Client
              const { data: newClient } = await supabase
                .from('clientes')
                .insert({
                  nome_completo: 'Contato Automação',
                  telefone: normalizedPhone,
                  whatsapp_number: normalizedPhone,
                  pendente_classificacao: true,
                })
                .select('id')
                .single()

              if (newClient) clientId = newClient.id
            }

            // D. Create New Conversation linked to Client
            if (clientId) {
              const { data: newConv } = await supabase
                .from('conversas_whatsapp')
                .insert({
                  cliente_id: clientId,
                  numero_whatsapp: normalizedPhone,
                  prioridade: 'Baixo',
                  mensagens_nao_lidas: 0,
                  ultima_interacao: now,
                })
                .select('id')
                .single()

              if (newConv) conversationId = newConv.id
            }
          }

          // E. Insert Message and Update Conversation Metadata
          if (conversationId) {
            await supabase.from('mensagens').insert({
              conversa_id: conversationId,
              tipo: 'text', // Using 'text' to maintain consistency with frontend rendering
              conteudo: recipient.mensagem_personalizada || '',
              timestamp: now,
              status_leitura: false,
              origem: 'me',
              enviado_via: 'sistema', // Marking as sent by system automation
            })

            // Update Conversation Metadata
            await supabase
              .from('conversas_whatsapp')
              .update({
                ultima_mensagem: recipient.mensagem_personalizada || '',
                ultima_mensagem_timestamp: now,
                ultima_interacao: now,
              })
              .eq('id', conversationId)
          }
        } catch (historyError) {
          // Log error but do not fail the automation process
          console.error('Failed to record conversation history:', historyError)
        }
      }

      // 7. Update Automation Counters & Next Schedule
      const min = automation.intervalo_min_segundos || 30
      const max = automation.intervalo_max_segundos || 300
      let delaySeconds = Math.floor(Math.random() * (max - min + 1) + min)

      // Batch Pause Logic
      const completedNow = success
        ? automation.total_envios_concluidos + 1
        : automation.total_envios_concluidos
      const batchSize = automation.configuracao_envio?.pause_after || 0
      const pauseDuration = automation.configuracao_envio?.pause_duration || 0

      if (
        batchSize > 0 &&
        pauseDuration > 0 &&
        completedNow > 0 &&
        completedNow % batchSize === 0
      ) {
        console.log(
          `Batch pause trigger for automation ${automation.id}. Pausing for ${pauseDuration} minutes.`,
        )
        delaySeconds += pauseDuration * 60
      }

      const nextTime = new Date(Date.now() + delaySeconds * 1000).toISOString()

      await supabase
        .from('automacoes_massa')
        .update({
          total_envios_concluidos: completedNow,
          total_envios_falhados: success
            ? automation.total_envios_falhados
            : automation.total_envios_falhados + 1,
          proximo_envio_timestamp: nextTime,
        })
        .eq('id', automation.id)

      processedCount++
    }

    return new Response(JSON.stringify({ processed: processedCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
