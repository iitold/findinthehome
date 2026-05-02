import { createBrowserClient } from '@supabase/ssr';

// Singleton browser client — dùng cho tất cả client components
// Returns null during SSG/build if env vars are missing
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // During build/SSG, env vars may not be available — return a safe stub
    return null;
  }

  return createBrowserClient(url, key);
}
