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

    const body = await req.json()
    const { type, data } = body

    // Only process messages.upsert for now
    if (type === 'messages.upsert') {
      const messageData = data
      const key = messageData.key
      const remoteJid = key.remoteJid

      // Ignore status updates
      if (remoteJid === 'status@broadcast') {
        return new Response(JSON.stringify({ status: 'ignored' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const phoneNumber = remoteJid.split('@')[0]
      const pushName = messageData.pushName || phoneNumber
      const fromMe = key.fromMe

      // Extract content (simplify for text)
      let content = ''
      if (messageData.message?.conversation) {
        content = messageData.message.conversation
      } else if (messageData.message?.extendedTextMessage?.text) {
        content = messageData.message.extendedTextMessage.text
      } else {
        content = '[Mídia/Outro Formato]'
      }

      // 1. Find or Create Client
      const { data: clientId, error: clientError } = await supabase.rpc(
        'upsert_client_by_phone',
        {
          p_phone: phoneNumber,
          p_name: pushName,
        },
      )

      if (clientError) throw clientError

      // 2. Upsert Conversation
      const now = new Date().toISOString()
      let conversationId

      const { data: existingConv } = await supabase
        .from('conversas_whatsapp')
        .select('id, mensagens_nao_lidas')
        .eq('numero_whatsapp', phoneNumber)
        .single()

      if (existingConv) {
        conversationId = existingConv.id
        const newUnread = fromMe
          ? 0
          : (existingConv.mensagens_nao_lidas || 0) + 1

        await supabase
          .from('conversas_whatsapp')
          .update({
            ultima_mensagem: content,
            ultima_mensagem_timestamp: now,
            ultima_interacao: now,
            mensagens_nao_lidas: newUnread,
            updated_at: now,
          })
          .eq('id', conversationId)
      } else {
        const { data: newConv, error: convError } = await supabase
          .from('conversas_whatsapp')
          .insert({
            cliente_id: clientId,
            numero_whatsapp: phoneNumber,
            ultima_mensagem: content,
            ultima_mensagem_timestamp: now,
            ultima_interacao: now,
            mensagens_nao_lidas: fromMe ? 0 : 1,
            prioridade: 'Médio',
            score_prioridade: 0,
          })
          .select('id')
          .single()

        if (convError) throw convError
        conversationId = newConv.id
      }

      // 3. Insert Message
      await supabase.from('mensagens').insert({
        conversa_id: conversationId,
        tipo: 'text',
        conteudo: content,
        timestamp: now,
        status_leitura: fromMe ? true : false,
        origem: fromMe ? 'me' : 'contact',
        message_id: key.id,
      })

      // 4. Trigger Priority Recalculation
      // We don't await this to avoid blocking the webhook response
      fetch(`${supabaseUrl}/functions/v1/calcular-prioridade-conversas`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversa_id: conversationId }),
      }).catch((err) => console.error('Failed to trigger priority calc', err))

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ status: 'ignored_type' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Webhook Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
