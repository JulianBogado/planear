import { createClient } from 'jsr:@supabase/supabase-js@2'

const MP_API = 'https://api.mercadopago.com'

const TIER_PRICES: Record<string, { amount: number; label: string }> = {
  starter: { amount: 16900, label: 'PLANE.AR Starter' },
  pro:     { amount: 22900, label: 'PLANE.AR Pro' },
}

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://plane.ar',
  'https://www.plane.ar',
]

function corsHeaders(req: Request) {
  const origin = req.headers.get('Origin') ?? ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

function getWebhookUrl() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')?.replace(/\/$/, '')
  if (!supabaseUrl) return null
  return `${supabaseUrl}/functions/v1/mp-webhook`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json(req, { error: 'Unauthorized' }, 401)

    const token = authHeader.replace('Bearer ', '')

    // Validate token via Supabase Auth — works regardless of JWT algorithm (HS256 or RS256)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user || !user.email) {
      return json(req, { error: 'Unauthorized' }, 401)
    }

    const userId = user.id
    const userEmail = user.email

    const { tier } = await req.json()
    if (!TIER_PRICES[tier]) return json(req, { error: 'Invalid tier' }, 400)

    const mpToken = Deno.env.get('MP_ACCESS_TOKEN')
    if (!mpToken) {
      console.error('MP_ACCESS_TOKEN not configured')
      return json(req, { error: 'Server misconfiguration' }, 500)
    }

    const webhookUrl = getWebhookUrl()
    if (!webhookUrl) {
      console.error('SUPABASE_URL not configured')
      return json(req, { error: 'Server misconfiguration' }, 500)
    }

    const tierInfo = TIER_PRICES[tier]
    // MP requires start_date to be at least a few minutes in the future
    const startDate = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const payload = {
      reason: tierInfo.label,
      external_reference: `${tier}:${userId}`,
      payer_email: userEmail,
      back_url: 'https://plane.ar/configuracion',
      notification_url: webhookUrl,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: tierInfo.amount,
        currency_id: 'ARS',
        start_date: startDate,
      },
      status: 'pending',
    }

    const subRes = await fetch(`${MP_API}/preapproval`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!subRes.ok) {
      const errorText = await subRes.text()
      console.error('MP preapproval error:', {
        status: subRes.status,
        tier,
        userId,
        errorText,
      })
      return json(req, {
        error: 'mp_error',
        mp_status: subRes.status,
        mp_detail: errorText,
      }, 500)
    }

    const subData = await subRes.json()
    const initPoint = subData.init_point ?? subData.sandbox_init_point
    if (!initPoint) {
      console.error('MP preapproval missing init_point', { tier, userId, subData })
      return json(req, { error: 'mp_error', mp_detail: 'missing_init_point' }, 500)
    }

    const mpSubscriptionId = subData.id ? String(subData.id) : null
    const mpStatus = subData.status ? String(subData.status) : 'pending'

    if (mpSubscriptionId) {
      const { error: updateError } = await supabase
        .from('businesses')
        .update({
          mp_subscription_id: mpSubscriptionId,
          mp_status: mpStatus,
        })
        .eq('user_id', userId)

      if (updateError) {
        console.error('Failed to persist preapproval reference', {
          userId,
          mpSubscriptionId,
          mpStatus,
          code: updateError.code,
        })
      }
    }

    return json(req, {
      init_point: initPoint,
      preapproval_id: mpSubscriptionId,
      mp_status: mpStatus,
    })

  } catch (e) {
    console.error('Unexpected error in create-subscription:', e)
    return json(req, { error: 'Internal server error' }, 500)
  }
})

function json(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(req),
    },
  })
}
