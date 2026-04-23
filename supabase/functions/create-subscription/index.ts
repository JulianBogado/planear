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
  }
}

function getSiteUrl(req: Request): string {
  const origin = req.headers.get('Origin') ?? ''
  return ALLOWED_ORIGINS.includes(origin) ? origin : 'https://plane.ar'
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

    const siteUrl = getSiteUrl(req)
    const tierInfo = TIER_PRICES[tier]
    // MP requires start_date to be at least a few minutes in the future
    const startDate = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const subRes = await fetch(`${MP_API}/preapproval`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: tierInfo.label,
        external_reference: `${tier}:${userId}`,
        payer_email: userEmail,
        back_url: `https://plane.ar/configuracion`,
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
      console.error('MP preapproval error:', subRes.status)
      return json(req, { error: 'mp_error' }, 500)
    }

    const subData = await subRes.json()
    return json(req, { init_point: subData.init_point })

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
