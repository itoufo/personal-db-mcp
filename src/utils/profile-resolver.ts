import { getClient } from "../db/client.js";
import { validateApiKey } from "../auth/api-key.js";
import { getRequestAuth } from "../auth/request-context.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

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

/**
 * Extract profile auth from MCP SDK's authInfo (extra parameter in tool handlers).
 * authInfo.extra contains { profileId, plan } set by verifyToken in api/mcp.ts.
 */
function fromAuthInfo(authInfo?: AuthInfo): { profileId: string; plan: string } | undefined {
  const extra = authInfo?.extra as Record<string, unknown> | undefined;
  if (extra?.profileId && typeof extra.profileId === "string") {
    return {
      profileId: extra.profileId,
      plan: (extra.plan as string) ?? "free",
    };
  }
  return undefined;
}

/**
 * Resolve the profile ID for the current session.
 * Priority: authInfo (MCP SDK) > AsyncLocalStorage > env var > first profile
 */
export async function getProfileId(authInfo?: AuthInfo): Promise<string> {
  // 1. MCP SDK's authInfo (most reliable for HTTP mode)
  const fromAuth = fromAuthInfo(authInfo);
  if (fromAuth) {
    console.log(`[profile-resolver] resolved via authInfo: ${fromAuth.profileId}`);
    return fromAuth.profileId;
  }

  // 2. AsyncLocalStorage (set by withRequestAuth in api/mcp.ts)
  const reqAuth = getRequestAuth();
  if (reqAuth) {
    console.log(`[profile-resolver] resolved via AsyncLocalStorage: ${reqAuth.profileId}`);
    return reqAuth.profileId;
  }

  // 3. Env var or legacy fallback (CLI mode)
  await ensureInitialized();
  console.log(`[profile-resolver] resolved via fallback/cache: ${cachedProfileId} (authInfo was: ${JSON.stringify(authInfo)})`);
  return cachedProfileId!;
}

/**
 * Get the current user's plan.
 * Priority: authInfo (MCP SDK) > AsyncLocalStorage > env var > legacy
 */
export async function getPlan(authInfo?: AuthInfo): Promise<string> {
  const fromAuth = fromAuthInfo(authInfo);
  if (fromAuth) return fromAuth.plan;

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
