import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    '⚠️ Supabase Configuration Warning: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY is not defined in environment variables.'
  );
}

let supabaseClient;

try {
  supabaseClient = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder_key',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
} catch (error) {
  console.error('❌ Failed to initialize Supabase Client SDK:', error.message);
  throw error;
}

export const supabase = supabaseClient;
export default supabase;
