import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MP_API = 'https://api.mercadopago.com'

// Mapa de plan_id de MP → tier interno
// Se llena desde env vars: MP_PLAN_STARTER_ID, MP_PLAN_PRO_ID
function buildPlanMap(): Record<string, string> {
  const map: Record<string, string> = {}
  const starterId = Deno.env.get('MP_PLAN_STARTER_ID')
  const proId = Deno.env.get('MP_PLAN_PRO_ID')
  if (starterId) map[starterId] = 'starter'
  if (proId)     map[proId]     = 'pro'
  return map
}

// Verifica la firma HMAC-SHA256 del webhook de MercadoPago
// Docs: https://developers.mercadopago.com/en/docs/webhooks/event-handling/configure-webhooks/verify-webhook-origin
async function verifyMPSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string,
  secret: string
): Promise<boolean> {
  // X-Signature tiene formato: "ts=TIMESTAMP,v1=HASH"
  const parts: Record<string, string> = {}
  for (const part of xSignature.split(',')) {
    const [k, v] = part.split('=')
    if (k && v) parts[k.trim()] = v.trim()
  }
  const ts = parts['ts']
  const v1 = parts['v1']
  if (!ts || !v1) return false

  const template = `id:${dataId};request-id:${xRequestId};ts:${ts}`

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(template))
  const computed = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  return computed === v1
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': Deno.env.get('SITE_URL') ?? 'http://localhost:5173',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const body = await req.json()
    const { type, data } = body

    // Solo procesamos eventos de preapproval (suscripciones)
    if (type !== 'subscription_preapproval') {
      return new Response('ok', { status: 200 })
    }

    // Verificar firma del webhook antes de procesar
    const webhookSecret = Deno.env.get('MP_WEBHOOK_SECRET')
    if (webhookSecret) {
      const xSignature = req.headers.get('x-signature') ?? ''
      const xRequestId = req.headers.get('x-request-id') ?? ''
      const isValid = await verifyMPSignature(xSignature, xRequestId, data.id, webhookSecret)
      if (!isValid) {
        console.error('Invalid MP webhook signature')
        return new Response('Unauthorized', { status: 401 })
      }
    }

    const mpToken = Deno.env.get('MP_ACCESS_TOKEN')!

    // 1. Consultar MP para obtener el estado actual del preapproval
    const preapprovalRes = await fetch(`${MP_API}/preapproval/${data.id}`, {
      headers: { 'Authorization': `Bearer ${mpToken}` },
    })

    if (!preapprovalRes.ok) {
      console.error('Error fetching preapproval from MP:', preapprovalRes.status)
      return new Response('Error fetching preapproval', { status: 500 })
    }

    const preapproval = await preapprovalRes.json()

    // 2. Determinar tier: external_reference puede ser "starter:userId" o legacy "starter"/"pro"
    const planMap = buildPlanMap()
    const extRef: string = preapproval.external_reference ?? ''
    let tier: string | null = null
    let userIdFromRef: string | null = null

    if (extRef === 'starter' || extRef === 'pro') {
      tier = extRef
    } else if (extRef.includes(':')) {
      const [tierPart, uidPart] = extRef.split(':')
      if (tierPart === 'starter' || tierPart === 'pro') tier = tierPart
      if (uidPart) userIdFromRef = uidPart
    } else {
      tier = planMap[preapproval.preapproval_plan_id] ?? null
    }

    // 3. Determinar nuevo estado
    const mpStatus: string = preapproval.status
    const newTier = (mpStatus === 'authorized' && tier) ? tier : 'free'

    // 4. Calcular subscription_ends_at (próxima fecha de cobro + 1 día de gracia)
    let subscriptionEndsAt: string | null = null
    if (mpStatus === 'authorized' && preapproval.next_payment_date) {
      const d = new Date(preapproval.next_payment_date)
      d.setDate(d.getDate() + 1)
      subscriptionEndsAt = d.toISOString()
    }

    // 5. Actualizar en Supabase usando service role key (sin restricciones de RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Buscar business: 1) por mp_subscription_id, 2) por user_id del external_reference, 3) por email
    const payerEmail: string = preapproval.payer_email

    let businessId: string | null = null

    const { data: bySubId } = await supabase
      .from('businesses')
      .select('id')
      .eq('mp_subscription_id', preapproval.id)
      .maybeSingle()

    if (bySubId) {
      businessId = bySubId.id
    } else if (userIdFromRef) {
      const { data: bizByUserId } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', userIdFromRef)
        .maybeSingle()

      if (bizByUserId) businessId = bizByUserId.id
    } else {
      // Fallback: buscar a través de auth.users por email
      const { data: authUser } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', payerEmail)
        .maybeSingle()

      if (authUser) {
        const { data: bizByUser } = await supabase
          .from('businesses')
          .select('id')
          .eq('user_id', authUser.id)
          .maybeSingle()

        if (bizByUser) businessId = bizByUser.id
      }
    }

    if (!businessId) {
      console.error('Business not found for preapproval:', preapproval.id)
      return new Response('Business not found', { status: 200 })
    }

    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        tier: newTier,
        mp_subscription_id: preapproval.id,
        mp_status: mpStatus,
        subscription_ends_at: subscriptionEndsAt,
      })
      .eq('id', businessId)

    if (updateError) {
      console.error('Error updating business:', updateError.code)
      return new Response('DB update error', { status: 500 })
    }

    console.log(`Updated business tier=${newTier}, mp_status=${mpStatus}`)
    return new Response('ok', { status: 200 })

  } catch (e) {
    console.error('Unexpected error in mp-webhook')
    return new Response('Internal server error', { status: 500 })
  }
})
