import { randomBytes, createHash } from "node:crypto";
import { getClient } from "../db/client.js";

// --- Auth Codes ---

interface AuthCode {
  code: string;
  api_key_encrypted: string;
  client_id: string;
  redirect_uri: string;
  code_challenge: string | null;
  code_challenge_method: string;
  expires_at: string;
}

/**
 * Generate and store an authorization code.
 * The raw API key is stored temporarily (5-min TTL, service_role only)
 * so it can be returned as the access_token during token exchange.
 */
export async function createAuthCode(params: {
  rawApiKey: string;
  clientId: string;
  redirectUri: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}): Promise<string> {
  const code = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min

  const client = getClient();
  const { error } = await client.from("oauth_codes").insert({
    code,
    api_key_encrypted: params.rawApiKey,
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    code_challenge: params.codeChallenge ?? null,
    code_challenge_method: params.codeChallengeMethod ?? "S256",
    expires_at: expiresAt,
  });

  if (error) {
    throw new Error(`Failed to create auth code: ${error.message}`);
  }

  return code;
}

/**
 * Consume an authorization code. Returns the raw API key and deletes the code.
 * Validates expiration, client_id, redirect_uri, and PKCE code_verifier.
 */
export async function consumeAuthCode(params: {
  code: string;
  clientId: string;
  redirectUri: string;
  codeVerifier?: string;
}): Promise<{ rawApiKey: string }> {
  const client = getClient();

  const { data, error } = await client
    .from("oauth_codes")
    .select("*")
    .eq("code", params.code)
    .single();

  if (error || !data) {
    throw new Error("Invalid authorization code");
  }

  const authCode = data as AuthCode;

  // Delete the code immediately (single-use)
  await client.from("oauth_codes").delete().eq("code", params.code);

  // Check expiration
  if (new Date(authCode.expires_at) < new Date()) {
    throw new Error("Authorization code has expired");
  }

  // Verify client_id
  if (authCode.client_id !== params.clientId) {
    throw new Error("client_id mismatch");
  }

  // Verify redirect_uri
  if (authCode.redirect_uri !== params.redirectUri) {
    throw new Error("redirect_uri mismatch");
  }

  // Verify PKCE
  if (authCode.code_challenge) {
    if (!params.codeVerifier) {
      throw new Error("code_verifier required");
    }

    const computed = createHash("sha256")
      .update(params.codeVerifier)
      .digest("base64url");

    if (computed !== authCode.code_challenge) {
      throw new Error("PKCE verification failed");
    }
  }

  return { rawApiKey: authCode.api_key_encrypted };
}

// --- OAuth Clients ---

interface OAuthClient {
  client_id: string;
  client_secret: string | null;
  redirect_uris: string[];
  client_name: string | null;
}

/**
 * Register a new OAuth client (RFC 7591 Dynamic Client Registration).
 */
export async function registerClient(params: {
  redirectUris: string[];
  clientName?: string;
}): Promise<{ clientId: string; clientSecret: string }> {
  const clientId = randomBytes(16).toString("hex");
  const clientSecret = randomBytes(32).toString("hex");

  const client = getClient();
  const { error } = await client.from("oauth_clients").insert({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uris: params.redirectUris,
    client_name: params.clientName ?? null,
  });

  if (error) {
    throw new Error(`Failed to register client: ${error.message}`);
  }

  return { clientId, clientSecret };
}

/**
 * Get an OAuth client by client_id.
 */
export async function getOAuthClient(
  clientId: string,
): Promise<OAuthClient | null> {
  const client = getClient();
  const { data, error } = await client
    .from("oauth_clients")
    .select("*")
    .eq("client_id", clientId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as OAuthClient;
}

/**
 * Clean up expired authorization codes (housekeeping).
 */
export async function cleanupExpiredCodes(): Promise<void> {
  const client = getClient();
  await client
    .from("oauth_codes")
    .delete()
    .lt("expires_at", new Date().toISOString());
}
