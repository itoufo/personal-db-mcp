import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createAuthCode, getOAuthClient } from "../../src/auth/oauth-store.js";
import { validateApiKey } from "../../src/auth/api-key.js";

/**
 * OAuth Authorization Endpoint
 * GET  /oauth/authorize → show login form
 * POST /oauth/authorize → validate API key, redirect with auth code
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    return showLoginForm(req, res);
  }

  if (req.method === "POST") {
    return handleLogin(req, res);
  }

  return res.status(405).json({ error: "Method not allowed" });
}

function showLoginForm(req: VercelRequest, res: VercelResponse) {
  const { client_id, redirect_uri, state, code_challenge, code_challenge_method, response_type } = req.query;

  if (response_type !== "code") {
    return res.status(400).send(errorPage("Invalid request", "response_type must be 'code'"));
  }

  if (!client_id || !redirect_uri) {
    return res.status(400).send(errorPage("Invalid request", "client_id and redirect_uri are required"));
  }

  const html = loginPage({
    clientId: String(client_id),
    redirectUri: String(redirect_uri),
    state: state ? String(state) : "",
    codeChallenge: code_challenge ? String(code_challenge) : "",
    codeChallengeMethod: code_challenge_method ? String(code_challenge_method) : "S256",
  });

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.status(200).send(html);
}

async function handleLogin(req: VercelRequest, res: VercelResponse) {
  const { api_key, client_id, redirect_uri, state, code_challenge, code_challenge_method } = req.body;

  if (!api_key || !client_id || !redirect_uri) {
    return res.status(400).send(
      errorPage("Invalid request", "Missing required fields"),
    );
  }

  // Validate the client
  const oauthClient = await getOAuthClient(String(client_id));
  if (!oauthClient) {
    return res.status(400).send(errorPage("Invalid client", "Unknown client_id"));
  }

  // Validate redirect_uri against registered URIs
  if (!oauthClient.redirect_uris.includes(String(redirect_uri))) {
    return res.status(400).send(
      errorPage("Invalid redirect", "redirect_uri does not match registered URIs"),
    );
  }

  // Validate the API key
  try {
    await validateApiKey(String(api_key));
  } catch {
    return res.status(400).send(
      loginPage({
        clientId: String(client_id),
        redirectUri: String(redirect_uri),
        state: state ? String(state) : "",
        codeChallenge: code_challenge ? String(code_challenge) : "",
        codeChallengeMethod: code_challenge_method ? String(code_challenge_method) : "S256",
        error: "Invalid API key. Please check and try again.",
      }),
    );
  }

  // Create the auth code (stores raw API key temporarily for token exchange)
  const code = await createAuthCode({
    rawApiKey: String(api_key),
    clientId: String(client_id),
    redirectUri: String(redirect_uri),
    codeChallenge: code_challenge ? String(code_challenge) : undefined,
    codeChallengeMethod: code_challenge_method ? String(code_challenge_method) : undefined,
  });

  // Build redirect URL
  const redirectUrl = new URL(String(redirect_uri));
  redirectUrl.searchParams.set("code", code);
  if (state) {
    redirectUrl.searchParams.set("state", String(state));
  }

  return res.redirect(302, redirectUrl.toString());
}

// --- HTML Templates ---

function loginPage(params: {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  error?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authorize - Personal DB</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #e5e5e5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      width: 100%;
      max-width: 400px;
      padding: 2rem;
    }
    .card {
      background: #171717;
      border: 1px solid #262626;
      border-radius: 12px;
      padding: 2rem;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    .subtitle {
      color: #a3a3a3;
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
    }
    .error {
      background: #450a0a;
      border: 1px solid #7f1d1d;
      color: #fca5a5;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }
    label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 0.5rem;
    }
    input[type="password"] {
      width: 100%;
      padding: 0.75rem 1rem;
      background: #0a0a0a;
      border: 1px solid #404040;
      border-radius: 8px;
      color: #e5e5e5;
      font-size: 0.875rem;
      outline: none;
      transition: border-color 0.15s;
    }
    input[type="password"]:focus {
      border-color: #3b82f6;
    }
    button {
      width: 100%;
      padding: 0.75rem 1rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      margin-top: 1rem;
      transition: background-color 0.15s;
    }
    button:hover { background: #2563eb; }
    .info {
      color: #737373;
      font-size: 0.75rem;
      margin-top: 1rem;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>Personal DB</h1>
      <p class="subtitle">Enter your API key to authorize access</p>
      ${params.error ? `<div class="error">${escapeHtml(params.error)}</div>` : ""}
      <form method="POST" action="/oauth/authorize">
        <input type="hidden" name="client_id" value="${escapeAttr(params.clientId)}">
        <input type="hidden" name="redirect_uri" value="${escapeAttr(params.redirectUri)}">
        <input type="hidden" name="state" value="${escapeAttr(params.state)}">
        <input type="hidden" name="code_challenge" value="${escapeAttr(params.codeChallenge)}">
        <input type="hidden" name="code_challenge_method" value="${escapeAttr(params.codeChallengeMethod)}">
        <label for="api_key">API Key</label>
        <input type="password" id="api_key" name="api_key" placeholder="pdb_..." required autofocus>
        <button type="submit">Authorize</button>
      </form>
      <p class="info">Your API key can be found in the Personal DB web app.</p>
    </div>
  </div>
</body>
</html>`;
}

function errorPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error - Personal DB</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #e5e5e5;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      background: #171717;
      border: 1px solid #262626;
      border-radius: 12px;
      padding: 2rem;
      max-width: 400px;
    }
    h1 { color: #f87171; margin-bottom: 0.5rem; }
    p { color: #a3a3a3; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
