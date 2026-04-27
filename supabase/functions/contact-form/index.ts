import { createClient } from 'jsr:@supabase/supabase-js@2'
import { buildCorsHeaders } from '../_shared/env.ts'

const RESEND_API = 'https://api.resend.com/emails'

const MIN_FORM_FILL_MS = 3000
const MAX_RECENT_MESSAGES = 3
const RATE_WINDOW_MINUTES = 10

type ContactPayload = {
  name?: string
  email?: string
  message?: string
  website?: string
  form_started_at?: number
}

function corsHeaders(req: Request) {
  return buildCorsHeaders(req)
}

function json(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(req),
    },
  })
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function escapeHtml(text: string) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function getClientIp(req: Request) {
  const forwardedFor = req.headers.get('x-forwarded-for') ?? ''
  const realIp = req.headers.get('x-real-ip') ?? ''
  return forwardedFor.split(',')[0]?.trim() || realIp.trim() || 'unknown'
}

async function sha256(input: string) {
  const data = new TextEncoder().encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function sendEmail({
  resendApiKey,
  from,
  to,
  name,
  email,
  message,
}: {
  resendApiKey: string
  from: string
  to: string
  name: string
  email: string
  message: string
}) {
  const submittedAt = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })
  const safeName = escapeHtml(name)
  const safeEmail = escapeHtml(email)
  const safeMessage = escapeHtml(message)

  const response = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: email,
      subject: `Nuevo mensaje de contacto · ${name}`,
      text: [
        'Nuevo mensaje desde el formulario público de contacto de PLANE.AR.',
        '',
        `Fecha: ${submittedAt}`,
        `Nombre: ${name}`,
        `Email: ${email}`,
        '',
        'Mensaje:',
        message,
      ].join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;color:#1c1917;line-height:1.6;">
          <h2 style="margin:0 0 16px;font-size:22px;">Nuevo mensaje desde Contacto</h2>

          <p style="margin:0 0 8px;"><strong>Fecha:</strong> ${submittedAt}</p>
          <p style="margin:0 0 8px;"><strong>Nombre:</strong> ${safeName}</p>
          <p style="margin:0 0 16px;"><strong>Correo:</strong> ${safeEmail}</p>

          <p style="margin:0 0 8px;"><strong>Mensaje</strong></p>
          <div style="white-space:pre-wrap;border:1px solid #d6d3d1;border-radius:8px;padding:14px;background:#fafaf9;margin-bottom:20px;">
            ${safeMessage}
          </div>

          <a href="mailto:${safeEmail}" style="display:inline-block;padding:10px 16px;border-radius:6px;background:#2785aa;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">
            Responder mensaje
          </a>
        </div>
      `,
    }),
  })

  return response
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) })
  }

  if (req.method !== 'POST') {
    return json(req, { error: 'Method not allowed' }, 405)
  }

  try {
    const payload = (await req.json()) as ContactPayload

    const name = normalizeText(payload.name)
    const email = normalizeText(payload.email).toLowerCase()
    const message = normalizeText(payload.message)
    const website = normalizeText(payload.website)
    const formStartedAt = Number(payload.form_started_at)

    if (website) {
      return json(req, { error: 'Invalid request' }, 400)
    }

    if (!name || name.length < 2 || name.length > 120) {
      return json(req, { error: 'Invalid request' }, 400)
    }

    if (!isValidEmail(email) || email.length > 180) {
      return json(req, { error: 'Invalid request' }, 400)
    }

    if (!message || message.length < 10 || message.length > 3000) {
      return json(req, { error: 'Invalid request' }, 400)
    }

    if (!Number.isFinite(formStartedAt) || Date.now() - formStartedAt < MIN_FORM_FILL_MS) {
      return json(req, { error: 'Invalid request' }, 400)
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const contactToEmail = Deno.env.get('CONTACT_TO_EMAIL')
    const contactFromEmail = Deno.env.get('CONTACT_FROM_EMAIL')

    if (!resendApiKey || !contactToEmail || !contactFromEmail) {
      console.error('Contact form misconfiguration')
      return json(req, { error: 'Server misconfiguration' }, 500)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const clientIp = getClientIp(req)
    const ipHash = await sha256(clientIp)
    const userAgent = (req.headers.get('user-agent') ?? '').slice(0, 500)

    const cutoff = new Date(Date.now() - RATE_WINDOW_MINUTES * 60 * 1000).toISOString()
    const { count, error: rateLimitError } = await supabase
      .from('public_contact_messages')
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', cutoff)

    if (rateLimitError) {
      console.error('Contact form rate limit query failed')
      return json(req, { error: 'Internal server error' }, 500)
    }

    if ((count ?? 0) >= MAX_RECENT_MESSAGES) {
      return json(req, { error: 'Too many requests' }, 429)
    }

    const { data: insertedContact, error: insertError } = await supabase
      .from('public_contact_messages')
      .insert({
        name,
        email,
        message,
        ip_hash: ipHash,
        user_agent: userAgent || null,
      })
      .select('id')
      .single()

    if (insertError || !insertedContact) {
      console.error('Contact form insert failed')
      return json(req, { error: 'Internal server error' }, 500)
    }

    const emailResponse = await sendEmail({
      resendApiKey,
      from: contactFromEmail,
      to: contactToEmail,
      name,
      email,
      message,
    })

    if (!emailResponse.ok) {
      const emailError = (await emailResponse.text()).slice(0, 500)
      await supabase
        .from('public_contact_messages')
        .update({
          status: 'email_failed',
          email_error: emailError,
        })
        .eq('id', insertedContact.id)

      console.error('Contact form email failed:', emailResponse.status)
      return json(req, { error: 'Unable to send message' }, 500)
    }

    await supabase
      .from('public_contact_messages')
      .update({
        status: 'received',
        email_sent_at: new Date().toISOString(),
      })
      .eq('id', insertedContact.id)

    return json(req, { ok: true })
  } catch (error) {
    console.error('Unexpected error in contact-form:', error)
    return json(req, { error: 'Internal server error' }, 500)
  }
})
