import { createClient } from 'jsr:@supabase/supabase-js@2'
import { buildCorsHeaders } from '../_shared/env.ts'

const MP_API = 'https://api.mercadopago.com'
const RESEND_API = 'https://api.resend.com/emails'

const TIER_LIMITS: Record<string, { maxSubscribers: number; maxPlans: number }> = {
  starter: { maxSubscribers: 15, maxPlans: 3 },
  free: { maxSubscribers: 5, maxPlans: 2 },
}

const TIER_PRICES: Record<string, { amount: number; label: string }> = {
  starter: { amount: 16900, label: 'PLANE.AR Starter' },
}

function getWebhookUrl() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')?.replace(/\/$/, '')
  if (!supabaseUrl) return null
  return `${supabaseUrl}/functions/v1/mp-webhook`
}

function corsHeaders(req: Request) {
  return buildCorsHeaders(req)
}

function json(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(req) },
  })
}

function escapeHtml(text: string) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function formatDateLabel(dateLike: string | null) {
  if (!dateLike) return null

  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Buenos_Aires',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).format(new Date(dateLike))
}

async function sendSubscriptionChangeEmail({
  to,
  businessName,
  targetTier,
  scheduledFor,
}: {
  to: string
  businessName: string
  targetTier: 'free' | 'starter'
  scheduledFor: string | null
}) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  const from = Deno.env.get('CONTACT_FROM_EMAIL')

  if (!resendApiKey || !from || !to) {
    console.error('Subscription email misconfiguration')
    return false
  }

  const formattedDate = formatDateLabel(scheduledFor)
  const safeBusinessName = escapeHtml(businessName)
  const targetTierLabel = targetTier === 'starter' ? 'Starter' : 'Free'
  const subject =
    targetTier === 'starter'
      ? 'Tu cambio a Starter ya quedo programado'
      : 'Tu baja de PLANE.AR ya quedo procesada'
  const eyebrow = targetTier === 'starter' ? 'Cambio de plan confirmado' : 'Baja confirmada'
  const intro =
    targetTier === 'starter'
      ? 'Gracias por seguir con nosotros. Ya dejamos programado tu cambio al plan Starter.'
      : 'Lamentamos verte ir. Tu baja ya fue procesada y dejamos todo ordenado para que no tengas sorpresas.'
  const detail = formattedDate
    ? `Vas a mantener tu plan actual hasta el ${formattedDate}. A partir de ese dia, tu cuenta quedara en ${targetTierLabel}.`
    : `El cambio ya quedo aplicado y tu cuenta ahora esta en ${targetTierLabel}.`
  const closing =
    targetTier === 'starter'
      ? 'Si mas adelante queres volver a Pro, lo podes hacer desde tu panel en cualquier momento.'
      : 'Si en algun momento queres volver, vas a poder reactivar o mejorar tu plan desde tu panel.'

  const response = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text: [
        `Hola ${businessName},`,
        '',
        eyebrow,
        '',
        intro,
        '',
        detail,
        '',
        closing,
        '',
        'Gracias por haber confiado en PLANE.AR.',
        '',
        'Equipo PLANE.AR',
      ].join('\n'),
      html: `
        <div style="margin:0;padding:24px;background:#f7f1e7;font-family:Arial,sans-serif;color:#2b2116;line-height:1.6;">
          <div style="max-width:560px;margin:0 auto;background:#fffaf2;border:1px solid #eadfce;border-radius:24px;overflow:hidden;box-shadow:0 10px 30px rgba(90,62,29,0.08);">
            <div style="padding:24px 28px;background:linear-gradient(135deg,#f0d9ad 0%,#d7b676 100%);color:#4b3518;">
              <div style="font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;opacity:0.8;">PLANE.AR</div>
              <h2 style="margin:12px 0 0;font-size:28px;line-height:1.2;">${escapeHtml(subject)}</h2>
            </div>
            <div style="padding:28px;">
              <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#a1742f;">${escapeHtml(eyebrow)}</p>
              <p style="margin:0 0 14px;font-size:16px;">Hola <strong>${safeBusinessName}</strong>,</p>
              <p style="margin:0 0 14px;font-size:15px;color:#4f463d;">${escapeHtml(intro)}</p>
              <div style="margin:0 0 18px;border:1px solid #eadfce;border-radius:18px;padding:16px 18px;background:#fff;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#7b5a2b;">Resumen</p>
                <p style="margin:0;font-size:15px;color:#3f372f;">${escapeHtml(detail)}</p>
              </div>
              <p style="margin:0 0 16px;font-size:15px;color:#4f463d;">${escapeHtml(closing)}</p>
              <p style="margin:0;font-size:15px;color:#4f463d;">Gracias por haber confiado en PLANE.AR.</p>
              <p style="margin:18px 0 0;font-size:14px;font-weight:700;color:#2b2116;">Equipo PLANE.AR</p>
            </div>
          </div>
        </div>
      `,
    }),
  })

  if (!response.ok) {
    console.error('Subscription email failed:', response.status, await response.text().catch(() => ''))
    return false
  }

  return true
}

async function cancelMpSubscription(mpToken: string, mpSubscriptionId: string): Promise<boolean> {
  try {
    const res = await fetch(`${MP_API}/preapproval/${mpSubscriptionId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${mpToken}`, 'Content-Type': 'application/json' },
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

async function updateMpSubscriptionToStarter(
  mpToken: string,
  mpSubscriptionId: string,
  userId: string,
): Promise<boolean> {
  const tierInfo = TIER_PRICES.starter
  const webhookUrl = getWebhookUrl()
  try {
    const res = await fetch(`${MP_API}/preapproval/${mpSubscriptionId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${mpToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reason: tierInfo.label,
        external_reference: `starter:${userId}`,
        ...(webhookUrl ? { notification_url: webhookUrl } : {}),
        auto_recurring: {
          transaction_amount: tierInfo.amount,
        },
      }),
    })
    if (!res.ok) {
      console.error('MP update error (to_starter):', res.status, await res.text().catch(() => ''))
      return false
    }
    return true
  } catch (e) {
    console.error('MP update exception (to_starter):', e)
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

  const sortedPlans = [
    ...allPlans.filter((p: { id: string }) => !usedPlanIds.has(p.id)),
    ...allPlans.filter((p: { id: string }) => usedPlanIds.has(p.id)),
  ]

  const toDelete = sortedPlans.slice(0, excess)
  const ids = toDelete.map((p: { id: string }) => p.id)

  await supabase.from('subscribers').update({ plan_id: null }).in('plan_id', ids)
  await supabase.from('plans').delete().in('id', ids)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders(req) })
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

    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('id, name, mp_subscription_id, is_promo, tier, subscription_ends_at')
      .eq('user_id', user.id)
      .single()

    if (bizError || !business) return json(req, { error: 'Business not found' }, 404)
    if (business.is_promo) return json(req, { error: 'Promo accounts cannot self-cancel' }, 403)

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

    if (force) {
      if (overSubs) await deleteExcessSubscribers(supabase, business.id, subCount, limits.maxSubscribers)
      if (overPlans) await deleteExcessPlans(supabase, business.id, plCount, limits.maxPlans)
    }

    const mpToken = Deno.env.get('MP_ACCESS_TOKEN')

    if (!business.mp_subscription_id) {
      const newTier = action === 'to_starter' ? 'starter' : 'free'
      const { error: updateError } = await supabase
        .from('businesses')
        .update({ tier: newTier, pending_tier: null })
        .eq('id', business.id)

      if (updateError) {
        console.error('DB update error (manual tier):', updateError.code)
        return json(req, { error: 'DB update failed' }, 500)
      }

      await sendSubscriptionChangeEmail({
        to: user.email ?? '',
        businessName: business.name ?? 'tu negocio',
        targetTier: newTier as 'free' | 'starter',
        scheduledFor: null,
      })

      return json(req, { ok: true, scheduledFor: null })
    }

    if (action === 'to_starter') {
      if (!mpToken) return json(req, { error: 'Server misconfiguration' }, 500)

      const updated = await updateMpSubscriptionToStarter(mpToken, business.mp_subscription_id, user.id)
      if (!updated) return json(req, { error: 'mp_error' }, 500)

      const { error: updateError } = await supabase
        .from('businesses')
        .update({ pending_tier: 'starter' })
        .eq('id', business.id)

      if (updateError) {
        console.error('DB update error (pending starter):', updateError.code)
        return json(req, { error: 'DB update failed' }, 500)
      }

      await sendSubscriptionChangeEmail({
        to: user.email ?? '',
        businessName: business.name ?? 'tu negocio',
        targetTier: 'starter',
        scheduledFor: business.subscription_ends_at,
      })

      return json(req, { ok: true, scheduledFor: business.subscription_ends_at })
    }

    if (mpToken) {
      await cancelMpSubscription(mpToken, business.mp_subscription_id)
    }

    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        mp_status: 'cancelled',
        mp_subscription_id: null,
        pending_tier: 'free',
      })
      .eq('id', business.id)

    if (updateError) {
      console.error('DB update error (to_free):', updateError.code)
      return json(req, { error: 'DB update failed' }, 500)
    }

    await sendSubscriptionChangeEmail({
      to: user.email ?? '',
      businessName: business.name ?? 'tu negocio',
      targetTier: 'free',
      scheduledFor: business.subscription_ends_at,
    })

    return json(req, { ok: true, scheduledFor: business.subscription_ends_at })
  } catch (e) {
    console.error('Unexpected error in cancel-subscription:', e)
    return json(req, { error: 'Internal server error' }, 500)
  }
})
