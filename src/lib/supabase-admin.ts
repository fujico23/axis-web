import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

export function getSupabaseAdminClient(): SupabaseClient {
  if (cachedClient) {
    return cachedClient;
  }

  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "http://127.0.0.1:54351";
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. このAPIを利用するにはサービスロールキーが必要です。",
    );
  }

  cachedClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
    },
  });

  return cachedClient;
}

