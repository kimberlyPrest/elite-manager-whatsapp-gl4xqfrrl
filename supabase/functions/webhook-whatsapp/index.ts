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
    console.log('Webhook received:', JSON.stringify(body))
    const { type, data } = body

    // Support both 'type' (some versions) and 'event' (standard Evolution v2)
    const eventType = type || body.event

    // Only process messages.upsert
    if (eventType === 'messages.upsert') {
      const messageData = data

      // If data contains an array of messages (Standard Evolution v2), process the first one
      // This makes the function compatible with both single-message syncs and real-time arrays
      const msg = Array.isArray(messageData.messages)
        ? messageData.messages[0]
        : messageData

      if (!msg || !msg.key) {
        console.warn('Ignoring message without key/data')
        return new Response(JSON.stringify({ status: 'ignored_no_key' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const key = msg.key
      const remoteJid = key.remoteJid

      // Ignore status updates
      if (remoteJid === 'status@broadcast') {
        return new Response(JSON.stringify({ status: 'ignored' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const phoneNumber = remoteJid.split('@')[0]
      const pushName = msg.pushName || phoneNumber
      const fromMe = key.fromMe

      // Extract original timestamp (Evolution sends in seconds)
      const messageDate = msg.messageTimestamp
        ? new Date(msg.messageTimestamp * 1000).toISOString()
        : new Date().toISOString()

      // Extract content (simplify for text)
      let content = ''
      if (msg.message?.conversation) {
        content = msg.message.conversation
      } else if (msg.message?.extendedTextMessage?.text) {
        content = msg.message.extendedTextMessage.text
      } else if (msg.message?.imageMessage?.caption) {
        content = msg.message.imageMessage.caption
      } else if (msg.message?.videoMessage?.caption) {
        content = msg.message.videoMessage.caption
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
      let conversationId

      const { data: existingConv } = await supabase
        .from('conversas_whatsapp')
        .select('id, mensagens_nao_lidas, ultima_mensagem_timestamp')
        .eq('numero_whatsapp', phoneNumber)
        .single()

      if (existingConv) {
        conversationId = existingConv.id

        // Only update 'last_message' fields if this message is newer than the one we have
        const isNewer = !existingConv.ultima_mensagem_timestamp ||
          new Date(messageDate) > new Date(existingConv.ultima_mensagem_timestamp)

        if (isNewer) {
          const newUnread = fromMe
            ? 0
            : (existingConv.mensagens_nao_lidas || 0) + 1

          await supabase
            .from('conversas_whatsapp')
            .update({
              ultima_mensagem: content,
              ultima_mensagem_timestamp: messageDate,
              ultima_interacao: messageDate,
              mensagens_nao_lidas: newUnread,
              updated_at: new Date().toISOString(),
            })
            .eq('id', conversationId)
        }
      } else {
        const { data: newConv, error: convError } = await supabase
          .from('conversas_whatsapp')
          .insert({
            cliente_id: clientId,
            numero_whatsapp: phoneNumber,
            ultima_mensagem: content,
            ultima_mensagem_timestamp: messageDate,
            ultima_interacao: messageDate,
            mensagens_nao_lidas: fromMe ? 0 : 1,
            prioridade: 'Médio',
            score_prioridade: 0,
          })
          .select('id')
          .single()

        if (convError) throw convError
        conversationId = newConv.id
      }

      // 3. Insert Message (Use original timestamp)
      // Use ON CONFLICT to avoid duplicate messages during multiple syncs
      await supabase.from('mensagens').upsert({
        conversa_id: conversationId,
        tipo: 'text',
        conteudo: content,
        timestamp: messageDate,
        status_leitura: fromMe ? true : false,
        origem: fromMe ? 'me' : 'contact',
        message_id: key.id,
      }, {
        onConflict: 'message_id'
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
