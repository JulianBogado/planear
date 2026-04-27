import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

const ROOT_DIR = process.cwd()
const SUPABASE_ENV_DIR = path.join(ROOT_DIR, 'supabase', 'env')
const PROJECT_REF_ENV = {
  staging: 'SUPABASE_PROJECT_REF_STAGING',
  prod: 'SUPABASE_PROJECT_REF_PROD',
}

const FUNCTION_NAMES = [
  'create-subscription',
  'cancel-subscription',
  'contact-form',
  'verify-subscription',
  'mp-webhook',
]

const command = process.argv[2]

if (!command) {
  fail('Falta el comando. Usá uno de: start, stop, functions:serve:local, functions:deploy:staging, functions:deploy:prod, secrets:set:staging, secrets:set:prod.')
}

switch (command) {
  case 'start':
    runSupabase(['start'])
    break
  case 'stop':
    runSupabase(['stop'])
    break
  case 'functions:serve:local':
    runSupabase([
      'functions',
      'serve',
      '--env-file',
      resolveEnvFile('local.functions.env', 'local.functions.example'),
    ])
    break
  case 'functions:deploy:staging':
    deployFunctions('staging')
    break
  case 'functions:deploy:prod':
    deployFunctions('prod')
    break
  case 'secrets:set:staging':
    setSecrets('staging')
    break
  case 'secrets:set:prod':
    setSecrets('prod')
    break
  default:
    fail(`Comando no soportado: ${command}`)
}

function deployFunctions(target) {
  const projectRef = resolveProjectRef(target)
  for (const functionName of FUNCTION_NAMES) {
    runSupabase(['functions', 'deploy', functionName, '--project-ref', projectRef])
  }
}

function setSecrets(target) {
  const projectRef = resolveProjectRef(target)
  const envFile = resolveEnvFile(`${target}.functions.env`, `${target}.functions.example`)
  runSupabase(['secrets', 'set', '--env-file', envFile, '--project-ref', projectRef])
}

function resolveProjectRef(target) {
  const envName = PROJECT_REF_ENV[target]
  const value = process.env[envName]
  if (!value) {
    fail(`Falta la variable ${envName}. Definila antes de correr este script.`)
  }

  return value
}

function resolveEnvFile(fileName, exampleName) {
  const fullPath = path.join(SUPABASE_ENV_DIR, fileName)
  if (!existsSync(fullPath)) {
    fail(`No existe ${relativeToRoot(fullPath)}. Copiá ${relativeToRoot(path.join(SUPABASE_ENV_DIR, exampleName))} y completalo con tus valores.`)
  }

  return fullPath
}

function runSupabase(args) {
  const result = spawnSync('npx', ['supabase', ...args], {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    shell: true,
    env: process.env,
  })

  if (result.error) {
    fail(`No se pudo ejecutar npx supabase: ${result.error.message}`)
  }

  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1)
  }
}

function relativeToRoot(fullPath) {
  return path.relative(ROOT_DIR, fullPath).replaceAll('\\', '/')
}

function fail(message) {
  console.error(message)
  process.exit(1)
}
