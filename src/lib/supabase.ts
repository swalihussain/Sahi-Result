import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// This client is for general use. For SSR/Middleware, use the specialized helpers in src/lib/supabase/
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
