import { createMcpHandler, withMcpAuth } from "mcp-handler";
import { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { registerTools } from "../src/tools/index.js";
import { registerResources } from "../src/resources/index.js";
import { registerPrompts } from "../src/prompts/index.js";
import { validateApiKey } from "../src/auth/api-key.js";
import { withRequestAuth } from "../src/auth/request-context.js";

const PROFILE_HEADER = "x-personal-db-profile-id";

const handler = createMcpHandler(
  (server) => {
    registerTools(server);
    registerResources(server);
    registerPrompts(server);
  },
  {
    serverInfo: {
      name: "personal-db",
      version: "0.1.0",
    },
  },
  {
    basePath: "/api",
    maxDuration: 60,
  },
);

const verifyToken = async (
  req: Request,
  bearerToken?: string,
): Promise<AuthInfo | undefined> => {
  if (!bearerToken) return undefined;

  const user = await validateApiKey(bearerToken);
  const headerProfileId = req.headers.get(PROFILE_HEADER) ?? undefined;

  return {
    token: bearerToken,
    clientId: user.userId,
    scopes: [user.plan],
    extra: {
      profileId: user.profileId,
      headerProfileId,
      allProfileIds: user.allProfileIds,
      accountScoped: user.accountScoped,
      plan: user.plan,
    },
  };
};

const authedHandler = withMcpAuth(handler, verifyToken, { required: true });

async function handleRequest(req: Request): Promise<Response> {
  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : undefined;

  if (bearerToken) {
    const user = await validateApiKey(bearerToken);
    const headerProfileId = req.headers.get(PROFILE_HEADER) ?? undefined;
    return withRequestAuth(
      {
        profileId: user.profileId,
        headerProfileId,
        allProfileIds: user.allProfileIds,
        accountScoped: user.accountScoped,
        plan: user.plan,
      },
      () => authedHandler(req),
    );
  }

  return authedHandler(req);
}

export { handleRequest as GET, handleRequest as POST, handleRequest as DELETE };
