import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { generateContext } from "./generator.js";
import { listAvailablePersonas } from "./personas.js";
import { formatSuccess, formatErrorResponse, formatError } from "../utils/errors.js";

export function registerContextTools(server: McpServer): void {
  server.tool(
    "get_context",
    "ペルソナベースの重み付きコンテキストを生成。AIがこの人物を理解するための最適化されたMarkdownを返す。",
    {
      persona: z
        .string()
        .optional()
        .describe(
          "ペルソナ名 (default/professional/interview/personal/creative またはカスタム名)"
        ),
      focus: z
        .string()
        .optional()
        .describe("フォーカスキーワード (マッチするエントリを1.5xブースト)"),
      max_tokens_hint: z
        .coerce.number()
        .int()
        .optional()
        .describe("出力目安トークン数 (デフォルト: 4000)"),
    },
    async ({ persona, focus, max_tokens_hint }) => {
      try {
        const context = await generateContext({
          persona,
          focus,
          max_tokens_hint,
        });
        return {
          content: [{ type: "text" as const, text: context }],
        };
      } catch (e) {
        return formatErrorResponse(formatError(e));
      }
    }
  );

  server.tool(
    "list_available_personas",
    "利用可能なペルソナ一覧を取得 (プリセット + カスタム)",
    {},
    async () => {
      try {
        const personas = await listAvailablePersonas();
        return formatSuccess({ personas });
      } catch (e) {
        return formatErrorResponse(formatError(e));
      }
    }
  );
}
