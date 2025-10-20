import { supabaseAdmin } from '../config/supabase'

async function main() {
  const tables = ['users', 'courses']
  console.log('[Check] Verificando tablas en Supabase...')
  for (const t of tables) {
    const { error } = await supabaseAdmin.from(t).select('count', { count: 'exact', head: true })
    if (error && error.code === '42P01') {
      console.log(` - ${t}: NO EXISTE`)
    } else if (error) {
      console.log(` - ${t}: error: ${error.message}`)
    } else {
      console.log(` - ${t}: OK`)
    }
  }
}

main().catch((e) => {
  console.error('[Check] Error inesperado:', e)
  process.exit(1)
})
