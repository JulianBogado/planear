import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { buildCorsHeaders } from '../_shared/env.ts'

const MP_API = 'https://api.mercadopago.com'

function buildPlanMap(): Record<string, string> {
  const map: Record<string, string> = {}
  const starterId = Deno.env.get('MP_PLAN_STARTER_ID')
  const proId = Deno.env.get('MP_PLAN_PRO_ID')
  if (starterId) map[starterId] = 'starter'
  if (proId) map[proId] = 'pro'
  return map
}

async function verifyMPSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string,
  secret: string,
): Promise<boolean> {
  const parts: Record<string, string> = {}
  for (const part of xSignature.split(',')) {
    const [k, v] = part.split('=')
    if (k && v) parts[k.trim()] = v.trim()
  }

  const ts = parts.ts
  const v1 = parts.v1
  if (!ts || !v1) return false

  const template = `id:${dataId};request-id:${xRequestId};ts:${ts}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(template))
  const computed = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

  return computed === v1
}

async function fetchPreapproval(mpToken: string, preapprovalId: string) {
  const res = await fetch(`${MP_API}/preapproval/${preapprovalId}`, {
    headers: { Authorization: `Bearer ${mpToken}` },
  })

  if (!res.ok) {
    console.error('Error fetching preapproval from MP:', res.status, preapprovalId)
    return null
  }

  return await res.json()
}

async function fetchPreapprovalFromAuthorizedPayment(mpToken: string, authorizedPaymentId: string) {
  const authRes = await fetch(`${MP_API}/authorized_payments/${authorizedPaymentId}`, {
    headers: { Authorization: `Bearer ${mpToken}` },
  })

  if (!authRes.ok) {
    console.error('Error fetching authorized payment from MP:', authRes.status, authorizedPaymentId)
    return null
  }

  const authorizedPayment = await authRes.json()
  const preapprovalId = authorizedPayment.preapproval_id ?? authorizedPayment.subscription_id ?? null
  if (!preapprovalId) {
    console.error('Authorized payment missing preapproval reference:', authorizedPaymentId)
    return null
  }

  return await fetchPreapproval(mpToken, String(preapprovalId))
}

function getPreapprovalTimestamp(preapproval: any) {
  return Math.max(
    new Date(preapproval?.last_modified ?? 0).getTime() || 0,
    new Date(preapproval?.date_modified ?? 0).getTime() || 0,
    new Date(preapproval?.date_created ?? 0).getTime() || 0,
  )
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: buildCorsHeaders(req),
    })
  }

  try {
    const body = await req.json()
    const bodyType = body?.type ?? null
    const dataId = body?.data?.id ? String(body.data.id) : null
    const url = new URL(req.url)
    const topic =
      bodyType ??
      url.searchParams.get('topic') ??
      url.searchParams.get('type') ??
      url.searchParams.get('resource') ??
      null

    if (topic !== 'subscription_preapproval' && topic !== 'subscription_authorized_payment') {
      return new Response('ok', { status: 200 })
    }

    const webhookSecret = Deno.env.get('MP_WEBHOOK_SECRET')
    if (webhookSecret) {
      const xSignature = req.headers.get('x-signature') ?? ''
      const xRequestId = req.headers.get('x-request-id') ?? ''
      const signedDataId = url.searchParams.get('data.id') ?? dataId ?? ''
      const isValid = await verifyMPSignature(xSignature, xRequestId, signedDataId, webhookSecret)
      if (!isValid) {
        console.error('Invalid MP webhook signature', { topic, dataId: signedDataId, xRequestId })
        return new Response('Unauthorized', { status: 401 })
      }
    }

    const mpToken = Deno.env.get('MP_ACCESS_TOKEN')!
    const resourceId = url.searchParams.get('data.id') ?? dataId
    if (!resourceId) {
      console.error('Webhook missing resource id', { topic, body })
      return new Response('Missing resource id', { status: 400 })
    }

    const preapproval =
      topic === 'subscription_authorized_payment'
        ? await fetchPreapprovalFromAuthorizedPayment(mpToken, resourceId)
        : await fetchPreapproval(mpToken, resourceId)

    if (!preapproval) {
      return new Response('Error fetching preapproval', { status: 500 })
    }

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

    const mpStatus: string = preapproval.status
    const newTier = mpStatus === 'authorized' && tier ? tier : 'free'

    let subscriptionEndsAt: string | null = null
    if (mpStatus === 'authorized' && preapproval.next_payment_date) {
      const d = new Date(preapproval.next_payment_date)
      d.setDate(d.getDate() + 1)
      subscriptionEndsAt = d.toISOString()
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

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

    const { data: bizCheck } = await supabase
      .from('businesses')
      .select('is_promo, mp_subscription_id')
      .eq('id', businessId)
      .single()

    if (bizCheck?.mp_subscription_id && bizCheck.mp_subscription_id !== preapproval.id) {
      const currentPreapproval = await fetchPreapproval(mpToken, bizCheck.mp_subscription_id)
      if (currentPreapproval) {
        const currentTs = getPreapprovalTimestamp(currentPreapproval)
        const incomingTs = getPreapprovalTimestamp(preapproval)
        const currentStatus = String(currentPreapproval.status ?? '')
        const incomingStatus = String(preapproval.status ?? '')

        const currentLooksNewer = currentTs > incomingTs
        const currentLooksBetter = currentStatus === 'authorized' && incomingStatus !== 'authorized'

        if (currentLooksNewer || currentLooksBetter) {
          return new Response('ok', { status: 200 })
        }
      }
    }

    const updatePayload: Record<string, unknown> = {
      mp_subscription_id: preapproval.id,
      mp_status: mpStatus,
    }

    if (!bizCheck?.is_promo) {
      updatePayload.tier = newTier
      updatePayload.subscription_ends_at = subscriptionEndsAt
      updatePayload.pending_tier = null
    }

    const { error: updateError } = await supabase
      .from('businesses')
      .update(updatePayload)
      .eq('id', businessId)

    if (updateError) {
      console.error('Error updating business:', updateError.code)
      return new Response('DB update error', { status: 500 })
    }

    return new Response('ok', { status: 200 })
  } catch (e) {
    console.error('Unexpected error in mp-webhook:', e)
    return new Response('Internal server error', { status: 500 })
  }
})
