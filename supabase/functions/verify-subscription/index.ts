import { createClient } from 'jsr:@supabase/supabase-js@2'
import { buildCorsHeaders } from '../_shared/env.ts'

const MP_API = 'https://api.mercadopago.com'

function json(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...buildCorsHeaders(req),
    },
  })
}

async function fetchPreapproval(mpToken: string, preapprovalId: string) {
  const res = await fetch(`${MP_API}/preapproval/${preapprovalId}`, {
    headers: { Authorization: `Bearer ${mpToken}` },
  })
  if (!res.ok) return null
  return await res.json()
}

async function searchLatestPreapproval(mpToken: string, userId: string, userEmail: string) {
  const params = new URLSearchParams({
    payer_email: userEmail,
  })

  const res = await fetch(`${MP_API}/preapproval/search?${params.toString()}`, {
    headers: { Authorization: `Bearer ${mpToken}` },
  })
  if (!res.ok) return null

  const payload = await res.json()
  const results = Array.isArray(payload.results) ? payload.results : []
  if (!results.length) return null

  const matchingResults = results.filter((item) => {
    const extRef = String(item?.external_reference ?? '')
    return extRef === `pro:${userId}` || extRef === `starter:${userId}` || extRef === 'pro' || extRef === 'starter'
  })
  if (!matchingResults.length) return null

  matchingResults.sort((a, b) => {
    const aDate = new Date(a.date_created ?? 0).getTime()
    const bDate = new Date(b.date_created ?? 0).getTime()
    return bDate - aDate
  })

  return matchingResults[0]
}

function getPreapprovalTimestamp(preapproval: any) {
  return Math.max(
    new Date(preapproval?.last_modified ?? 0).getTime() || 0,
    new Date(preapproval?.date_modified ?? 0).getTime() || 0,
    new Date(preapproval?.date_created ?? 0).getTime() || 0,
  )
}

function chooseBestPreapproval(currentPreapproval: any, latestPreapproval: any) {
  if (!currentPreapproval) return latestPreapproval
  if (!latestPreapproval) return currentPreapproval

  const currentStatus = String(currentPreapproval.status ?? '')
  const latestStatus = String(latestPreapproval.status ?? '')

  if (currentStatus === 'cancelled' && latestStatus !== 'cancelled') return latestPreapproval
  if (currentStatus !== 'authorized' && latestStatus === 'authorized') return latestPreapproval

  const currentTs = getPreapprovalTimestamp(currentPreapproval)
  const latestTs = getPreapprovalTimestamp(latestPreapproval)
  return latestTs > currentTs ? latestPreapproval : currentPreapproval
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return json(req, { ok: true })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json(req, { error: 'Unauthorized' }, 401)

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user?.email) return json(req, { error: 'Unauthorized' }, 401)

    const mpToken = Deno.env.get('MP_ACCESS_TOKEN')
    if (!mpToken) return json(req, { error: 'Server misconfiguration' }, 500)

    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('id, tier, mp_subscription_id, is_promo')
      .eq('user_id', user.id)
      .single()

    if (bizError || !business) return json(req, { error: 'Business not found' }, 404)

    let preapproval = null
    if (business.mp_subscription_id) {
      preapproval = await fetchPreapproval(mpToken, business.mp_subscription_id)
    }
    const latestPreapproval = await searchLatestPreapproval(mpToken, user.id, user.email)
    preapproval = chooseBestPreapproval(preapproval, latestPreapproval)
    if (!preapproval) {
      return json(req, { ok: true, changed: false, reason: 'not_found' })
    }

    const extRef = String(preapproval.external_reference ?? '')
    let tier = null
    if (extRef.includes(':')) {
      const [tierPart] = extRef.split(':')
      if (tierPart === 'starter' || tierPart === 'pro') tier = tierPart
    } else if (extRef === 'starter' || extRef === 'pro') {
      tier = extRef
    }

    const mpStatus = String(preapproval.status ?? '')
    const nextTier = mpStatus === 'authorized' && tier ? tier : business.tier
    let subscriptionEndsAt = null
    if (mpStatus === 'authorized' && preapproval.next_payment_date) {
      const d = new Date(preapproval.next_payment_date)
      d.setDate(d.getDate() + 1)
      subscriptionEndsAt = d.toISOString()
    }

    const updatePayload: Record<string, unknown> = {
      mp_subscription_id: preapproval.id,
      mp_status: mpStatus,
    }
    if (!business.is_promo && mpStatus === 'authorized' && nextTier) {
      updatePayload.tier = nextTier
      updatePayload.subscription_ends_at = subscriptionEndsAt
      updatePayload.pending_tier = null
    }

    const { data: updatedBusiness, error: updateError } = await supabase
      .from('businesses')
      .update(updatePayload)
      .eq('id', business.id)
      .select('*')
      .single()

    if (updateError) return json(req, { error: 'DB update error' }, 500)

    return json(req, {
      ok: true,
      changed: true,
      mp_status: mpStatus,
      business: updatedBusiness,
    })
  } catch (error) {
    console.error('Unexpected error in verify-subscription:', error)
    return json(req, { error: 'Internal server error' }, 500)
  }
})
