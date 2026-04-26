import { createHash } from "node:crypto";
import { getClient } from "../db/client.js";

export interface ApiKeyUser {
  userId: string;
  /** Bound profile when the key is profile-scoped. Undefined for account-scoped keys. */
  profileId?: string;
  /** All profile IDs owned by the user. Used to validate per-request profile_id selection. */
  allProfileIds: string[];
  /** True when the key is account-scoped (no profile_id binding). */
  accountScoped: boolean;
  plan: string;
}

/**
 * Validate an API key and return the associated user/profile info.
 *
 * - If api_keys.profile_id IS NOT NULL → profile-scoped key. profileId is the
 *   bound profile; allProfileIds still lists every owned profile so the
 *   caller can advertise switch options if it wants.
 * - If api_keys.profile_id IS NULL → account-scoped key. profileId is
 *   undefined and the caller MUST specify a profile per request (header or
 *   tool argument). allProfileIds enumerates the legal targets.
 */
export async function validateApiKey(rawKey: string): Promise<ApiKeyUser> {
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const client = getClient();

  const { data: keyRow, error: keyError } = await client
    .from("api_keys")
    .select("id, user_id, profile_id, revoked_at, expires_at")
    .eq("key_hash", keyHash)
    .single();

  if (keyError || !keyRow) {
    throw new Error("Invalid API key");
  }

  if (keyRow.revoked_at) {
    throw new Error("API key has been revoked");
  }

  if (keyRow.expires_at && new Date(keyRow.expires_at) < new Date()) {
    throw new Error("API key has expired");
  }

  // Update last_used_at (fire-and-forget)
  client
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRow.id)
    .then(() => {});

  const { data: user, error: userError } = await client
    .from("users")
    .select("id, profile_id, plan")
    .eq("id", keyRow.user_id)
    .single();

  if (userError || !user) {
    throw new Error("User not found for API key");
  }

  // Owned profiles (multi-profile junction)
  const { data: ownedProfiles } = await client
    .from("user_profiles")
    .select("profile_id")
    .eq("user_id", user.id);

  let allProfileIds = (ownedProfiles ?? [])
    .map((p) => p.profile_id as string)
    .filter(Boolean);

  // Legacy fallback: if user_profiles is empty but users.profile_id exists
  if (allProfileIds.length === 0 && user.profile_id) {
    allProfileIds = [user.profile_id];
  }

  if (keyRow.profile_id) {
    // Profile-scoped key
    return {
      userId: user.id,
      profileId: keyRow.profile_id,
      allProfileIds,
      accountScoped: false,
      plan: user.plan,
    };
  }

  // Account-scoped key (profile_id IS NULL)
  if (allProfileIds.length === 0) {
    throw new Error(
      "Account-scoped API key has no associated profiles. " +
        "Create a profile in the web app first.",
    );
  }

  return {
    userId: user.id,
    profileId: undefined,
    allProfileIds,
    accountScoped: true,
    plan: user.plan,
  };
}
