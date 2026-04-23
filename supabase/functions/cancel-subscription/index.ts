import { createClient } from 'jsr:@supabase/supabase-js@2'

const MP_API = 'https://api.mercadopago.com'

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://plane.ar',
  'https://www.plane.ar',
]

const TIER_LIMITS: Record<string, { maxSubscribers: number; maxPlans: number }> = {
  starter: { maxSubscribers: 15, maxPlans: 3 },
  free:    { maxSubscribers: 5,  maxPlans: 2 },
}

const TIER_PRICES: Record<string, { amount: number; label: string }> = {
  starter: { amount: 16900, label: 'PLANE.AR Starter' },
}

function corsHeaders(req: Request) {
  const origin = req.headers.get('Origin') ?? ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }
}

function getSiteUrl(req: Request): string {
  const origin = req.headers.get('Origin') ?? ''
  return ALLOWED_ORIGINS.includes(origin) ? origin : 'https://plane.ar'
}

function json(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(req) },
  })
}

async function cancelMpSubscription(mpToken: string, mpSubscriptionId: string): Promise<boolean> {
  try {
    const res = await fetch(`${MP_API}/preapproval/${mpSubscriptionId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${mpToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    })
    if (!res.ok) {
      console.error('MP cancel error:', res.status, await res.text().catch(() => ''))
      return false
    }
    return true
  } catch (e) {
    console.error('MP cancel exception:', e)
    return false
  }
}

async function deleteExcessSubscribers(
  supabase: ReturnType<typeof createClient>,
  businessId: string,
  currentCount: number,
  limit: number,
): Promise<void> {
  const excess = currentCount - limit
  if (excess <= 0) return

  const { data: toDelete } = await supabase
    .from('subscribers')
    .select('id')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(excess)

  if (!toDelete?.length) return
  const ids = toDelete.map((r: { id: string }) => r.id)

  await supabase.from('usage_logs').delete().in('subscriber_id', ids)
  await supabase.from('payments').delete().in('subscriber_id', ids)
  await supabase.from('appointments').delete().in('subscriber_id', ids)
  await supabase.from('subscribers').delete().in('id', ids)
}

async function deleteExcessPlans(
  supabase: ReturnType<typeof createClient>,
  businessId: string,
  currentCount: number,
  limit: number,
): Promise<void> {
  const excess = currentCount - limit
  if (excess <= 0) return

  // Primero intenta borrar planes sin suscriptores asociados
  const { data: allPlans } = await supabase
    .from('plans')
    .select('id')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  if (!allPlans?.length) return

  const { data: plansWithSubs } = await supabase
    .from('subscribers')
    .select('plan_id')
    .eq('business_id', businessId)
    .not('plan_id', 'is', null)

  const usedPlanIds = new Set((plansWithSubs ?? []).map((r: { plan_id: string }) => r.plan_id))

  // Ordenar: planes sin suscriptores primero, luego por newest
  const sortedPlans = [
    ...allPlans.filter((p: { id: string }) => !usedPlanIds.has(p.id)),
    ...allPlans.filter((p: { id: string }) => usedPlanIds.has(p.id)),
  ]

  const toDelete = sortedPlans.slice(0, excess)
  const ids = toDelete.map((p: { id: string }) => p.id)

  // Desvincular suscriptores antes de borrar el plan
  await supabase.from('subscribers').update({ plan_id: null }).in('plan_id', ids)
  await supabase.from('plans').delete().in('id', ids)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json(req, { error: 'Unauthorized' }, 401)

    const token = authHeader.replace('Bearer ', '')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) return json(req, { error: 'Unauthorized' }, 401)

    const { action, force = false } = await req.json()
    if (action !== 'to_free' && action !== 'to_starter') {
      return json(req, { error: 'Invalid action' }, 400)
    }

    // Obtener business del usuario
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('id, mp_subscription_id, is_promo, tier')
      .eq('user_id', user.id)
      .single()

    if (bizError || !business) return json(req, { error: 'Business not found' }, 404)
    if (business.is_promo) return json(req, { error: 'Promo accounts cannot self-cancel' }, 403)

    // Contar suscriptores y planes actuales
    const [{ count: subscriberCount }, { count: planCount }] = await Promise.all([
      supabase.from('subscribers').select('id', { count: 'exact', head: true }).eq('business_id', business.id),
      supabase.from('plans').select('id', { count: 'exact', head: true }).eq('business_id', business.id),
    ])

    const limits = TIER_LIMITS[action === 'to_starter' ? 'starter' : 'free']
    const subCount = subscriberCount ?? 0
    const plCount = planCount ?? 0

    const overSubs = subCount > limits.maxSubscribers
    const overPlans = plCount > limits.maxPlans

    if ((overSubs || overPlans) && !force) {
      return json(req, {
        error: 'over_limit',
        subscriberCount: subCount,
        planCount: plCount,
        subLimit: limits.maxSubscribers,
        planLimit: limits.maxPlans,
      }, 422)
    }

    // Cleanup automático si force=true y hay exceso
    if (force) {
      if (overSubs) {
        await deleteExcessSubscribers(supabase, business.id, subCount, limits.maxSubscribers)
      }
      if (overPlans) {
        await deleteExcessPlans(supabase, business.id, plCount, limits.maxPlans)
      }
    }

    const mpToken = Deno.env.get('MP_ACCESS_TOKEN')

    // Cancelar suscripción MP actual (si existe)
    if (business.mp_subscription_id && mpToken) {
      await cancelMpSubscription(mpToken, business.mp_subscription_id)
      // No cortamos el flujo si MP falla — la DB se actualiza igual
    }

    if (action === 'to_free') {
      const { error: updateError } = await supabase
        .from('businesses')
        .update({
          tier: 'free',
          mp_status: 'cancelled',
          mp_subscription_id: null,
          subscription_ends_at: null,
        })
        .eq('id', business.id)

      if (updateError) {
        console.error('DB update error (to_free):', updateError.code)
        return json(req, { error: 'DB update failed' }, 500)
      }

      return json(req, { ok: true })
    }

    // action === 'to_starter': crear nuevo preapproval en MP
    if (!mpToken) {
      console.error('MP_ACCESS_TOKEN not configured')
      return json(req, { error: 'Server misconfiguration' }, 500)
    }

    const tierInfo = TIER_PRICES['starter']
    const startDate = new Date(Date.now() + 10 * 60 * 1000).toISOString()
    const siteUrl = getSiteUrl(req)

    const subRes = await fetch(`${MP_API}/preapproval`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: tierInfo.label,
        external_reference: `starter:${user.id}`,
        payer_email: user.email,
        back_url: `${siteUrl}/configuracion`,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: tierInfo.amount,
          currency_id: 'ARS',
          start_date: startDate,
        },
        status: 'pending',
      }),
    })

    if (!subRes.ok) {
      console.error('MP preapproval error (to_starter):', subRes.status)
      return json(req, { error: 'mp_error' }, 500)
    }

    const subData = await subRes.json()

    // Limpiar referencia al plan anterior (el webhook seteará el nuevo tier)
    await supabase
      .from('businesses')
      .update({ mp_status: 'cancelled', mp_subscription_id: null })
      .eq('id', business.id)

    return json(req, { init_point: subData.init_point })

  } catch (e) {
    console.error('Unexpected error in cancel-subscription:', e)
    return json(req, { error: 'Internal server error' }, 500)
  }
})
