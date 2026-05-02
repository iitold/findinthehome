import { createBrowserClient } from '@supabase/ssr';

// Singleton browser client — dùng cho tất cả client components
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
