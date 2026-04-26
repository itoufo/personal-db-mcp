import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getClient } from "../db/client.js";
import { getProfileId } from "../utils/profile-resolver.js";
import { getRequestAuth } from "../auth/request-context.js";
import { generateContext } from "../context/generator.js";
import { formatErrorResponse, formatError } from "../utils/errors.js";

/**
 * Register NFT-related MCP tools.
 */
export function registerNftTools(server: McpServer): void {
  // ---- generate_nft_snapshot ----
  server.tool(
    "generate_nft_snapshot",
    "NFTスナップショット生成 — プライバシーフィルタ済みのプロフィールデータスナップショットを生成（NFT Mint前のデータ確認用）",
    {
      persona: z
        .string()
        .optional()
        .describe("使用するペルソナ名 (default/professional/creative)"),
      max_tokens_hint: z.coerce
        .number()
        .int()
        .optional()
        .describe("最大トークン数ヒント (デフォルト: 4000)"),
    },
    async (args, extra) => {
      try {
        // Generate context with forced privacy settings
        const context = await generateContext({
          persona: args.persona,
          max_tokens_hint: args.max_tokens_hint,
          authInfo: extra.authInfo,
        });

        // Get profile info
        const profileId = await getProfileId(extra.authInfo);
        const { data: profile } = await getClient()
          .from("profiles")
          .select("name")
          .eq("id", profileId)
          .single();

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  profileName: profile?.name || "Unknown",
                  personaUsed: args.persona || "default",
                  contextLength: context.length,
                  privacyNote:
                    "Health entries excluded. Private relationships excluded. Real names removed. Low confidence entries excluded.",
                  contextMarkdown: context,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err) {
        return formatErrorResponse(formatError(err));
      }
    }
  );

  // ---- preview_nft_data ----
  server.tool(
    "preview_nft_data",
    "NFTデータプレビュー — Mintに含まれるデータの概要を表示（コンテキスト本文なし、エンティティ数のみ）",
    {
      persona: z
        .string()
        .optional()
        .describe("使用するペルソナ名"),
    },
    async (args, extra) => {
      try {
        const profileId = await getProfileId(extra.authInfo);

        // Count entries per entity type that would be included
        const entities = [
          "career_entries",
          "skills",
          "projects",
          "achievements",
          "episodes",
          "education",
          "hobbies",
          "values_philosophy",
          "life_events",
          "goals",
          "favorite_books",
          "favorite_quotes",
          "influences",
          "daily_routines",
          "favorite_tools",
          "faq",
          "custom_entries",
        ];

        const counts: Record<string, number> = {};
        for (const entity of entities) {
          const { count } = await getClient()
            .from(entity)
            .select("*", { count: "exact", head: true })
            .eq("profile_id", profileId)
            .gte("confidence", 5); // NFT minimum confidence

          counts[entity] = count || 0;
        }

        const totalEntries = Object.values(counts).reduce((a, b) => a + b, 0);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  profileId,
                  persona: args.persona || "default",
                  totalEntries,
                  entityCounts: counts,
                  excludedFromNft: [
                    "health_entries (always excluded)",
                    "private relationships",
                    "real names",
                    "low confidence entries (< 5)",
                    "profile fields: birthday, blood_type, family_structure, birthplace",
                  ],
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err) {
        return formatErrorResponse(formatError(err));
      }
    }
  );

  // ---- list_nft_listings ----
  server.tool(
    "list_nft_listings",
    "NFT出品一覧 — マーケットプレイスの出品を一覧表示",
    {
      status: z
        .string()
        .optional()
        .describe("ステータスフィルタ (listed/sold/draft/minting)"),
      my_only: z
        .boolean()
        .optional()
        .describe("自分の出品のみ表示"),
      limit: z.coerce.number().int().optional().describe("最大取得数 (デフォルト: 20)"),
    },
    async (args, extra) => {
      try {
        let query = getClient()
          .from("nft_listings")
          .select(
            "id, title, description, price_wei, royalty_bps, creator_wallet, token_id, status, listed_at, sold_at, created_at"
          )
          .order("created_at", { ascending: false })
          .limit(args.limit || 20);

        if (args.status) {
          query = query.eq("status", args.status);
        }

        if (args.my_only) {
          const profileId = await getProfileId(extra.authInfo);
          // Get user_id from profile
          const { data: user } = await getClient()
            .from("users")
            .select("id")
            .eq("profile_id", profileId)
            .single();

          if (user) {
            query = query.eq("creator_user_id", user.id);
          }
        }

        const { data, error } = await query;
        if (error) throw error;

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      } catch (err) {
        return formatErrorResponse(formatError(err));
      }
    }
  );

  // ---- get_nft_listing ----
  server.tool(
    "get_nft_listing",
    "NFT出品詳細 — 特定のNFT出品の詳細情報を取得",
    {
      listing_id: z.string().describe("出品ID"),
    },
    async (args) => {
      try {
        const { data, error } = await getClient()
          .from("nft_listings")
          .select(
            "id, title, description, price_wei, royalty_bps, creator_wallet, token_id, tx_hash, status, listed_at, sold_at, created_at, nft_snapshots(persona_name, persona_config, metadata_json)"
          )
          .eq("id", args.listing_id)
          .single();

        if (error) throw error;

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      } catch (err) {
        return formatErrorResponse(formatError(err));
      }
    }
  );
}
