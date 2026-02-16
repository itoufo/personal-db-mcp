import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Use `any` for database types since we use a custom schema (personal_db)
// without generated types. All validation is handled by Zod schemas.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: SupabaseClient<any, "personal_db"> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getClient(): SupabaseClient<any, "personal_db"> {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
    );
  }

  client = createClient(url, key, {
    db: { schema: "personal_db" },
    auth: { persistSession: false },
  });

  return client;
}
