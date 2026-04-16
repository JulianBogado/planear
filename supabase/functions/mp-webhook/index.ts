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
    const body = await req.json()
    const { type, data } = body

    // Solo procesamos eventos de preapproval (suscripciones)
    if (type !== 'subscription_preapproval') {
      return new Response('ok', { status: 200 })
    }

    const mpToken = Deno.env.get('MP_ACCESS_TOKEN')!

    // 1. Consultar MP para obtener el estado actual del preapproval
    const preapprovalRes = await fetch(`${MP_API}/preapproval/${data.id}`, {
      headers: { 'Authorization': `Bearer ${mpToken}` },
    })

    if (!preapprovalRes.ok) {
      console.error('Error fetching preapproval from MP:', await preapprovalRes.text())
      return new Response('Error fetching preapproval', { status: 500 })
    }

    const preapproval = await preapprovalRes.json()

    // 2. Determinar tier desde preapproval_plan_id
    const planMap = buildPlanMap()
    const tier = planMap[preapproval.preapproval_plan_id] ?? null

    // 3. Determinar nuevo estado
    // MP status: authorized | paused | cancelled | pending
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

    // Buscar business por mp_subscription_id (si ya tiene) o por payer email (primera vez)
    const payerEmail: string = preapproval.payer_email

    let businessId: string | null = null

    // Intentar encontrar por subscription ID primero
    const { data: bySubId } = await supabase
      .from('businesses')
      .select('id')
      .eq('mp_subscription_id', preapproval.id)
      .maybeSingle()

    if (bySubId) {
      businessId = bySubId.id
    } else {
      // Primera vez: buscar por email del usuario propietario
      const { data: byEmail } = await supabase
        .from('businesses')
        .select('id, users!inner(email)')
        .eq('users.email', payerEmail)
        .maybeSingle()

      // Si la query anterior falla por el join, buscar a través de auth.users
      if (!byEmail) {
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
      } else {
        businessId = byEmail.id
      }
    }

    if (!businessId) {
      console.error('Business not found for payer:', payerEmail, 'preapproval:', preapproval.id)
      // Responder 200 igual para que MP no reintente indefinidamente
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
      console.error('Error updating business:', updateError)
      return new Response('DB update error', { status: 500 })
    }

    console.log(`Updated business ${businessId}: tier=${newTier}, mp_status=${mpStatus}`)
    return new Response('ok', { status: 200 })

  } catch (e) {
    console.error('Unexpected error:', e)
    return new Response('Internal server error', { status: 500 })
  }
})
