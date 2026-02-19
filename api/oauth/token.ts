import type { VercelRequest, VercelResponse } from "@vercel/node";
import { consumeAuthCode } from "../../src/auth/oauth-store.js";

/**
 * OAuth Token Endpoint
 * POST /oauth/token
 *
 * Exchanges an authorization code for an access token.
 * The access_token is the user's raw API key.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  try {
    const body = req.body;
    const grantType = body?.grant_type;

    if (grantType !== "authorization_code") {
      return res.status(400).json({
        error: "unsupported_grant_type",
        error_description: "Only authorization_code grant is supported",
      });
    }

    const code = body?.code;
    const clientId = body?.client_id;
    const redirectUri = body?.redirect_uri;
    const codeVerifier = body?.code_verifier;

    if (!code || !clientId || !redirectUri) {
      return res.status(400).json({
        error: "invalid_request",
        error_description: "code, client_id, and redirect_uri are required",
      });
    }

    const result = await consumeAuthCode({
      code: String(code),
      clientId: String(clientId),
      redirectUri: String(redirectUri),
      codeVerifier: codeVerifier ? String(codeVerifier) : undefined,
    });

    // Return the raw API key as the access_token
    // This way the existing verifyToken middleware works unchanged
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({
      access_token: result.rawApiKey,
      token_type: "Bearer",
    });
  } catch (err) {
    console.error("Token exchange error:", err);
    const message = err instanceof Error ? err.message : "Token exchange failed";
    return res.status(400).json({
      error: "invalid_grant",
      error_description: message,
    });
  }
}
