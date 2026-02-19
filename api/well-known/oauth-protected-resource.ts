import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const origin = process.env.MCP_BASE_URL || "https://mcp-tau-ochre.vercel.app";

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (_req.method === "OPTIONS") {
    return res.status(204).end();
  }

  return res.status(200).json({
    resource: `${origin}/api/mcp`,
    authorization_servers: [origin],
  });
}
