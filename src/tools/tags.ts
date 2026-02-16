import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getClient } from "../db/client.js";
import { ENTRY_TYPES } from "../db/types.js";
import { formatSuccess, formatErrorResponse, formatError } from "../utils/errors.js";

export function registerTagTools(server: McpServer): void {
  // List all tags
  server.tool(
    "list_tags",
    "タグ一覧を取得",
    {
      category: z.string().optional().describe("カテゴリでフィルタ"),
    },
    async ({ category }) => {
      try {
        let query = getClient().from("tags").select("*").order("name");
        if (category) query = query.eq("category", category);
        const { data, error } = await query;
        if (error) return formatErrorResponse(error.message);
        return formatSuccess(data);
      } catch (e) {
        return formatErrorResponse(formatError(e));
      }
    }
  );

  // Create tag
  server.tool(
    "create_tag",
    "タグを作成",
    {
      name: z.string().describe("タグ名"),
      category: z.string().optional().describe("カテゴリ"),
    },
    async ({ name, category }) => {
      try {
        const { data, error } = await getClient()
          .from("tags")
          .upsert({ name, category }, { onConflict: "name" })
          .select()
          .single();
        if (error) return formatErrorResponse(error.message);
        return formatSuccess(data);
      } catch (e) {
        return formatErrorResponse(formatError(e));
      }
    }
  );

  // Attach tag to entry
  server.tool(
    "tag_entry",
    "エントリにタグを付与",
    {
      tag_name: z.string().describe("タグ名 (存在しなければ自動作成)"),
      entry_type: z.enum(ENTRY_TYPES).describe("エントリのテーブル名"),
      entry_id: z.string().describe("エントリID"),
      tag_category: z.string().optional().describe("タグカテゴリ (新規作成時)"),
    },
    async ({ tag_name, entry_type, entry_id, tag_category }) => {
      try {
        // Upsert tag
        const { data: tag, error: tagErr } = await getClient()
          .from("tags")
          .upsert({ name: tag_name, category: tag_category }, { onConflict: "name" })
          .select()
          .single();
        if (tagErr || !tag) return formatErrorResponse(`タグ作成失敗: ${tagErr?.message}`);

        // Create entry_tag
        const { data, error } = await getClient()
          .from("entry_tags")
          .upsert(
            { tag_id: tag.id, entry_type, entry_id },
            { onConflict: "tag_id,entry_type,entry_id" }
          )
          .select()
          .single();
        if (error) return formatErrorResponse(error.message);
        return formatSuccess({ tag, entry_tag: data });
      } catch (e) {
        return formatErrorResponse(formatError(e));
      }
    }
  );

  // Remove tag from entry
  server.tool(
    "untag_entry",
    "エントリからタグを解除",
    {
      tag_name: z.string().describe("タグ名"),
      entry_type: z.enum(ENTRY_TYPES).describe("エントリのテーブル名"),
      entry_id: z.string().describe("エントリID"),
    },
    async ({ tag_name, entry_type, entry_id }) => {
      try {
        // Find tag
        const { data: tag } = await getClient()
          .from("tags")
          .select("id")
          .eq("name", tag_name)
          .single();
        if (!tag) return formatErrorResponse(`タグ "${tag_name}" が見つかりません`);

        const { error } = await getClient()
          .from("entry_tags")
          .delete()
          .eq("tag_id", tag.id)
          .eq("entry_type", entry_type)
          .eq("entry_id", entry_id);
        if (error) return formatErrorResponse(error.message);
        return formatSuccess({ removed: true });
      } catch (e) {
        return formatErrorResponse(formatError(e));
      }
    }
  );

  // Get tags for an entry
  server.tool(
    "get_entry_tags",
    "エントリに付与されたタグを取得",
    {
      entry_type: z.enum(ENTRY_TYPES).describe("エントリのテーブル名"),
      entry_id: z.string().describe("エントリID"),
    },
    async ({ entry_type, entry_id }) => {
      try {
        const { data, error } = await getClient()
          .from("entry_tags")
          .select("*, tags(*)")
          .eq("entry_type", entry_type)
          .eq("entry_id", entry_id);
        if (error) return formatErrorResponse(error.message);
        return formatSuccess(data);
      } catch (e) {
        return formatErrorResponse(formatError(e));
      }
    }
  );
}
