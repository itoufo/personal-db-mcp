import { createHash } from "node:crypto";
import { getClient } from "../db/client.js";

interface ApiKeyUser {
  userId: string;
  profileId: string;
  plan: string;
}

/**
 * Validate an API key and return the associated user info.
 * Key is hashed with SHA-256 and looked up in api_keys table.
 * profile_id is read directly from api_keys (set when key is created).
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

  // Use profile_id directly from api_keys (preferred, set since multi-profile)
  if (keyRow.profile_id) {
    // Still need user plan
    const { data: user, error: userError } = await client
      .from("users")
      .select("id, plan")
      .eq("id", keyRow.user_id)
      .single();

    if (userError || !user) {
      throw new Error("User not found for API key");
    }

    return {
      userId: user.id,
      profileId: keyRow.profile_id,
      plan: user.plan,
    };
  }

  // Fallback for legacy keys without profile_id: resolve from users.profile_id
  const { data: user, error: userError } = await client
    .from("users")
    .select("id, profile_id, plan")
    .eq("id", keyRow.user_id)
    .single();

  if (userError || !user) {
    throw new Error("User not found for API key");
  }

  if (!user.profile_id) {
    throw new Error(
      "No profile linked to this API key. The profile may have been deleted. " +
      "Please create a new API key from the web app."
    );
  }

  return {
    userId: user.id,
    profileId: user.profile_id,
    plan: user.plan,
  };
}
