import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Log de diagnóstico (no imprime secretos)
if (process.env.JEST_WORKER_ID !== undefined) {
  console.log('[Supabase] Diagnóstico en tests:');
  console.log(' - URL configurada:', !!supabaseUrl);
  console.log(' - Anon key configurada:', !!supabaseKey);
  console.log(' - Service role key configurada:', !!supabaseServiceRoleKey);
}

if (!supabaseUrl || !supabaseKey || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables');
}

// Cliente para operaciones públicas (con RLS)
export const supabase = createClient(supabaseUrl, supabaseKey);

// Cliente con service role para operaciones administrativas (bypass RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export default supabase;
