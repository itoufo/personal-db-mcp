import type { VercelRequest, VercelResponse } from "@vercel/node";
import { registerClient } from "../../src/auth/oauth-store.js";

/**
 * Dynamic Client Registration (RFC 7591)
 * POST /oauth/register
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body;
    const redirectUris = body?.redirect_uris;

    if (!Array.isArray(redirectUris) || redirectUris.length === 0) {
      return res.status(400).json({
        error: "invalid_client_metadata",
        error_description: "redirect_uris is required and must be a non-empty array",
      });
    }

    const result = await registerClient({
      redirectUris,
      clientName: body?.client_name,
    });

    return res.status(201).json({
      client_id: result.clientId,
      client_secret: result.clientSecret,
      redirect_uris: redirectUris,
      client_name: body?.client_name || null,
      token_endpoint_auth_method: "client_secret_post",
    });
  } catch (err) {
    console.error("Client registration error:", err);
    return res.status(500).json({
      error: "server_error",
      error_description: "Failed to register client",
    });
  }
}
