import { createClient } from '@supabase/supabase-js';

// Client-side Supabase client - only created when needed
let clientInstance: ReturnType<typeof createClient> | null = null;

export const getSupabaseClient = () => {
  if (!clientInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    clientInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
    });
  }
  return clientInstance;
};

// Server-side Supabase client (for API routes) - lazy initialization
let serverInstance: ReturnType<typeof createClient> | null = null;

export const createServerClient = () => {
  if (!serverInstance) {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      throw new Error('Missing Supabase environment variables');
    }
    
    serverInstance = createClient(url, key, {
      auth: {
        persistSession: false,
      },
    });
  }
  return serverInstance;
};

// For backward compatibility - proxy that lazily creates client
export const supabase = {
  from: (table: string) => getSupabaseClient().from(table),
  rpc: <T = any>(fn: string, args?: Record<string, unknown>) => 
    getSupabaseClient().rpc(fn, args as any).then((res: any) => res.data as T),
};
