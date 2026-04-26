import { getClient } from "../db/client.js";
import { validateApiKey } from "../auth/api-key.js";
import { getRequestAuth } from "../auth/request-context.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";

let cachedProfileId: string | null = null;
let cachedPlan: string | null = null;
let cachedAllProfileIds: string[] = [];
let cachedAccountScoped = false;
let initialized = false;

/**
 * Initialize profile resolution.
 * If PERSONAL_DB_API_KEY is set, validates it and caches the bound profile_id
 * (or marks account-scoped). Otherwise falls back to single-profile mode.
 */
async function ensureInitialized(): Promise<void> {
  if (initialized) return;

  const apiKey = process.env.PERSONAL_DB_API_KEY;
  if (apiKey) {
    const user = await validateApiKey(apiKey);
    cachedProfileId = user.profileId ?? null;
    cachedPlan = user.plan;
    cachedAllProfileIds = user.allProfileIds;
    cachedAccountScoped = user.accountScoped;
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
  cachedPlan = "pro";
  cachedAllProfileIds = [data.id as string];
  cachedAccountScoped = false;
  initialized = true;
}

interface AuthExtras {
  profileId?: string;
  headerProfileId?: string;
  allProfileIds?: string[];
  accountScoped?: boolean;
  plan?: string;
}

function fromAuthInfo(authInfo?: AuthInfo): AuthExtras | undefined {
  const extra = authInfo?.extra as Record<string, unknown> | undefined;
  if (!extra) return undefined;
  return {
    profileId:
      typeof extra.profileId === "string" ? extra.profileId : undefined,
    headerProfileId:
      typeof extra.headerProfileId === "string" ? extra.headerProfileId : undefined,
    allProfileIds: Array.isArray(extra.allProfileIds)
      ? (extra.allProfileIds as string[])
      : undefined,
    accountScoped:
      typeof extra.accountScoped === "boolean" ? extra.accountScoped : undefined,
    plan: typeof extra.plan === "string" ? extra.plan : undefined,
  };
}

function activeContext(authInfo?: AuthInfo): AuthExtras {
  const fromAuth = fromAuthInfo(authInfo);
  if (fromAuth) return fromAuth;

  const reqAuth = getRequestAuth();
  if (reqAuth) {
    return {
      profileId: reqAuth.profileId,
      headerProfileId: reqAuth.headerProfileId,
      allProfileIds: reqAuth.allProfileIds,
      accountScoped: reqAuth.accountScoped,
      plan: reqAuth.plan,
    };
  }

  return {
    profileId: cachedProfileId ?? undefined,
    headerProfileId: undefined,
    allProfileIds: cachedAllProfileIds,
    accountScoped: cachedAccountScoped,
    plan: cachedPlan ?? "free",
  };
}

/**
 * Resolve the profile ID for the current operation.
 *
 * Priority:
 *   1. explicit override (per-tool-call profile_id argument)
 *   2. bound profile (profile-scoped key)
 *   3. header profile id (X-Personal-DB-Profile-Id, account-scoped key)
 *   4. cached default (CLI / env mode)
 *
 * For account-scoped keys, an override or header is REQUIRED unless the
 * tool can fall back to "all profiles".
 *
 * Throws when no profile can be resolved or when the override is not owned.
 */
export async function getProfileId(
  authInfo?: AuthInfo,
  override?: string,
): Promise<string> {
  // CLI/env init must run before we look at the cache fallback.
  if (!getRequestAuth() && !fromAuthInfo(authInfo)) {
    await ensureInitialized();
  }

  const ctx = activeContext(authInfo);

  if (override) {
    if (
      ctx.allProfileIds &&
      ctx.allProfileIds.length > 0 &&
      !ctx.allProfileIds.includes(override)
    ) {
      throw new Error(
        `profile_id "${override}" is not owned by the authenticated user.`,
      );
    }
    return override;
  }

  if (ctx.profileId) return ctx.profileId;

  if (ctx.headerProfileId) {
    if (
      ctx.allProfileIds &&
      ctx.allProfileIds.length > 0 &&
      !ctx.allProfileIds.includes(ctx.headerProfileId)
    ) {
      throw new Error(
        `Header profile_id "${ctx.headerProfileId}" is not owned by the authenticated user.`,
      );
    }
    return ctx.headerProfileId;
  }

  if (ctx.accountScoped) {
    throw new Error(
      "This API key is account-scoped. Specify profile_id per tool call or send X-Personal-DB-Profile-Id header. Use list_profiles to see available profiles.",
    );
  }

  throw new Error("No profile resolved. Create a profile first.");
}

/** Get the current user's plan. */
export async function getPlan(authInfo?: AuthInfo): Promise<string> {
  if (!getRequestAuth() && !fromAuthInfo(authInfo)) {
    await ensureInitialized();
  }
  const ctx = activeContext(authInfo);
  return ctx.plan ?? "free";
}

/** All profiles owned by the authenticated user (used by list_profiles fallback). */
export async function getAllProfileIds(
  authInfo?: AuthInfo,
): Promise<string[]> {
  if (!getRequestAuth() && !fromAuthInfo(authInfo)) {
    await ensureInitialized();
  }
  const ctx = activeContext(authInfo);
  return ctx.allProfileIds ?? [];
}

/** True when the current key is account-scoped (no bound profile). */
export function isAccountScoped(authInfo?: AuthInfo): boolean {
  const ctx = activeContext(authInfo);
  return Boolean(ctx.accountScoped);
}

/** Clear cached profile ID (used after profile creation in CLI mode). */
export function clearProfileCache(): void {
  cachedProfileId = null;
  cachedPlan = null;
  cachedAllProfileIds = [];
  cachedAccountScoped = false;
  initialized = false;
}
