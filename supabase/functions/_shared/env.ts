const DEFAULT_LOCAL_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]

export function getAppSiteUrl() {
  const siteUrl = firstDefinedEnv('APP_SITE_URL', 'SITE_URL')
  if (siteUrl) return stripTrailingSlash(siteUrl)
  return DEFAULT_LOCAL_ORIGINS[0]
}

export function getAllowedOrigins() {
  const configuredOrigins = readCsvEnv('ALLOWED_ORIGINS')
  const origins = new Set<string>(DEFAULT_LOCAL_ORIGINS)

  if (configuredOrigins.length > 0) {
    for (const origin of configuredOrigins) {
      origins.add(normalizeOrigin(origin))
    }
  }

  origins.add(normalizeOrigin(getAppSiteUrl()))

  return Array.from(origins)
}

export function buildCorsHeaders(req: Request, methods = 'POST, OPTIONS') {
  const allowedOrigins = getAllowedOrigins()
  const requestOrigin = req.headers.get('Origin') ?? ''
  const allowedOrigin = allowedOrigins.includes(requestOrigin)
    ? requestOrigin
    : allowedOrigins[0]

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': methods,
  }
}

function firstDefinedEnv(...names: string[]) {
  for (const name of names) {
    const value = Deno.env.get(name)?.trim()
    if (value) return value
  }

  return null
}

function readCsvEnv(name: string) {
  const raw = Deno.env.get(name)?.trim()
  if (!raw) return []

  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
}

function normalizeOrigin(value: string) {
  const trimmed = stripTrailingSlash(value)

  try {
    return new URL(trimmed).origin
  } catch {
    return trimmed
  }
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}
