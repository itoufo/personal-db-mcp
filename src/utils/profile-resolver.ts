import { getClient } from "../db/client.js";
import { validateApiKey } from "../auth/api-key.js";
import { getRequestAuth } from "../auth/request-context.js";

let cachedProfileId: string | null = null;
let cachedPlan: string | null = null;
let initialized = false;

/**
 * Initialize profile resolution.
 * If PERSONAL_DB_API_KEY is set, validates it and caches the profile_id.
 * Otherwise falls back to single-profile mode (backward compatible).
 */
async function ensureInitialized(): Promise<void> {
  if (initialized) return;

  const apiKey = process.env.PERSONAL_DB_API_KEY;
  if (apiKey) {
    const user = await validateApiKey(apiKey);
    cachedProfileId = user.profileId;
    cachedPlan = user.plan;
    initialized = true;
    return;
  }

  // Legacy single-profile mode
  const { data, error } = await getClient()
    .from("profiles")
    .select("id")
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error("No profile found. Create a profile first using create_profile.");
  }

  cachedProfileId = data.id as string;
  cachedPlan = "pro"; // legacy mode = unlimited
  initialized = true;
}

/** Resolve the profile ID for the current session */
export async function getProfileId(): Promise<string> {
  const reqAuth = getRequestAuth();
  if (reqAuth) return reqAuth.profileId;
  await ensureInitialized();
  return cachedProfileId!;
}

/** Get the current user's plan */
export async function getPlan(): Promise<string> {
  const reqAuth = getRequestAuth();
  if (reqAuth) return reqAuth.plan;
  await ensureInitialized();
  return cachedPlan!;
}

/** Clear cached profile ID (used after profile creation) */
export function clearProfileCache(): void {
  cachedProfileId = null;
  cachedPlan = null;
  initialized = false;
}
