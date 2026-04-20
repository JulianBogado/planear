import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MP_API = 'https://api.mercadopago.com'

const TIER_PRICES: Record<string, { amount: number; label: string }> = {
  starter: { amount: 16900, label: 'PLANE.AR Starter' },
  pro:     { amount: 22900, label: 'PLANE.AR Pro' },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    // 1. Verificar JWT de Supabase
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !user) return json({ error: 'Unauthorized' }, 401)

    // 2. Leer tier del body
    const { tier } = await req.json()
    if (!TIER_PRICES[tier]) return json({ error: 'Invalid tier' }, 400)

    const mpToken = Deno.env.get('MP_ACCESS_TOKEN')!
    const siteUrl = Deno.env.get('SITE_URL') ?? 'http://localhost:5173'
    const tierInfo = TIER_PRICES[tier]

    // 3. Crear preapproval directamente (sin necesidad de preapproval_plan)
    const startDate = new Date(Date.now() + 60 * 1000).toISOString()

    const subRes = await fetch(`${MP_API}/preapproval`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: tierInfo.label,
        external_reference: tier,
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
      const err = await subRes.text()
      console.error('Error creating MP preapproval:', err)
      return json({ error: 'mp_error', detail: err }, 500)
    }

    const subData = await subRes.json()
    return json({ init_point: subData.init_point })

  } catch (e) {
    console.error('Unexpected error:', e)
    return json({ error: 'Internal server error' }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
