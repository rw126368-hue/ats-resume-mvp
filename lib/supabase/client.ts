import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const createSupabaseClient = () => {
  if (typeof window !== 'undefined') {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } else {
    // In a server environment, you might want to use a different storage adapter
    // or no storage adapter at all. For now, we'll just create the client without it.
    return createClient(supabaseUrl, supabaseAnonKey);
  }
};

export const supabase = createSupabaseClient();
