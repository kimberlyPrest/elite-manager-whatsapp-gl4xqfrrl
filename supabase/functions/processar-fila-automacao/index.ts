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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Get Active Automations ready to send
    const { data: automations, error: autoError } = await supabase
      .from('automacoes_massa')
      .select('*')
      .eq('status_automacao', 'ativa')
      .lte('proximo_envio_timestamp', new Date().toISOString())
      .limit(5) // Process max 5 automations concurrently

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
      // Log error but don't crash
      console.error('Missing Evolution API Config')
      return new Response(JSON.stringify({ error: 'Config missing' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    for (const automation of automations) {
      // 3. Get ONE pending recipient
      const { data: recipient } = await supabase
        .from('automacoes_massa_destinatarios')
        .select('*')
        .eq('automacao_id', automation.id)
        .eq('status_envio', 'aguardando')
        .limit(1)
        .single()

      if (!recipient) {
        // No more recipients, mark as complete
        await supabase
          .from('automacoes_massa')
          .update({ status_automacao: 'concluida' })
          .eq('id', automation.id)
        continue
      }

      // 4. Send Message via Evolution
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
            textMessage: { text: recipient.mensagem_personalizada },
          }),
        },
      )

      const success = response.ok

      // 5. Update Recipient Status
      await supabase
        .from('automacoes_massa_destinatarios')
        .update({
          status_envio: success ? 'enviado' : 'falhou',
          data_envio: new Date().toISOString(),
          erro_mensagem: success ? null : `API Error: ${response.status}`,
        })
        .eq('id', recipient.id)

      // 6. Insert into Messages table for history
      if (success) {
        await supabase.from('mensagens').insert({
          conversa_id: '00000000-0000-0000-0000-000000000000', // Placeholder or need logic to find conversation
          tipo: 'text',
          conteudo: recipient.mensagem_personalizada || '',
          timestamp: new Date().toISOString(),
          status_leitura: true,
          origem: 'me',
          enviado_via: 'automation',
        })
      }

      // 7. Update Automation Counters & Next Schedule
      const min = automation.intervalo_min_segundos || 30
      const max = automation.intervalo_max_segundos || 300
      const randomDelayMs =
        Math.floor(Math.random() * (max - min + 1) + min) * 1000
      const nextTime = new Date(Date.now() + randomDelayMs).toISOString()

      await supabase
        .from('automacoes_massa')
        .update({
          total_envios_concluidos: success
            ? automation.total_envios_concluidos + 1
            : automation.total_envios_concluidos,
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
