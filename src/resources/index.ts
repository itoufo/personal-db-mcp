import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getClient } from "../db/client.js";
import { getProfileId } from "../utils/profile-resolver.js";
import { generateContext } from "../context/generator.js";

function text(content: string) {
  return { contents: [{ uri: "", mimeType: "application/json" as const, text: content }] };
}

export function registerResources(server: McpServer): void {
  // Profile summary
  server.resource(
    "profile-summary",
    "personaldb://profile/summary",
    { description: "プロフィール全体概要" },
    async (uri) => {
      const { data } = await getClient().from("profiles").select("*").limit(1).single();
      return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(data, null, 2) }] };
    }
  );

  // Career timeline
  server.resource(
    "career-timeline",
    "personaldb://career/timeline",
    { description: "時系列の職歴" },
    async (uri) => {
      const profileId = await getProfileId();
      const { data } = await getClient()
        .from("career_entries")
        .select("*")
        .eq("profile_id", profileId)
        .order("period_year", { ascending: false, nullsFirst: false })
        .order("period_start", { ascending: false, nullsFirst: false });
      return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(data, null, 2) }] };
    }
  );

  // Skills matrix
  server.resource(
    "skills-matrix",
    "personaldb://skills/matrix",
    { description: "カテゴリ別スキルマトリクス" },
    async (uri) => {
      const profileId = await getProfileId();
      const { data } = await getClient()
        .from("skills")
        .select("*")
        .eq("profile_id", profileId)
        .order("category")
        .order("proficiency", { ascending: false, nullsFirst: false });

      // Group by category
      const matrix: Record<string, unknown[]> = {};
      for (const skill of data || []) {
        const cat = (skill as Record<string, unknown>).category as string;
        if (!matrix[cat]) matrix[cat] = [];
        matrix[cat].push(skill);
      }

      return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(matrix, null, 2) }] };
    }
  );

  // Portfolio (projects + achievements)
  server.resource(
    "portfolio",
    "personaldb://portfolio",
    { description: "プロジェクト＋実績ポートフォリオ" },
    async (uri) => {
      const profileId = await getProfileId();
      const [projects, achievements] = await Promise.all([
        getClient()
          .from("projects")
          .select("*")
          .eq("profile_id", profileId)
          .order("importance", { ascending: false }),
        getClient()
          .from("achievements")
          .select("*")
          .eq("profile_id", profileId)
          .order("year", { ascending: false, nullsFirst: false }),
      ]);

      return {
        contents: [{
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify({ projects: projects.data, achievements: achievements.data }, null, 2),
        }],
      };
    }
  );

  // Resume data
  server.resource(
    "resume-data",
    "personaldb://resume/data",
    { description: "履歴書用の構造化データ" },
    async (uri) => {
      const profileId = await getProfileId();
      const [profile, career, skills, education, achievements] = await Promise.all([
        getClient().from("profiles").select("*").limit(1).single(),
        getClient().from("career_entries").select("*").eq("profile_id", profileId)
          .eq("mentionable", true)
          .order("period_year", { ascending: false, nullsFirst: false }),
        getClient().from("skills").select("*").eq("profile_id", profileId)
          .order("proficiency", { ascending: false, nullsFirst: false }),
        getClient().from("education").select("*").eq("profile_id", profileId)
          .order("period_start", { ascending: false, nullsFirst: false }),
        getClient().from("achievements").select("*").eq("profile_id", profileId)
          .order("year", { ascending: false, nullsFirst: false }),
      ]);

      return {
        contents: [{
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify({
            profile: profile.data,
            career: career.data,
            skills: skills.data,
            education: education.data,
            achievements: achievements.data,
          }, null, 2),
        }],
      };
    }
  );

  // Episode highlights
  server.resource(
    "episodes-highlights",
    "personaldb://episodes/highlights",
    { description: "重要エピソード集 (importance 7以上)" },
    async (uri) => {
      const profileId = await getProfileId();
      const { data } = await getClient()
        .from("episodes")
        .select("*")
        .eq("profile_id", profileId)
        .eq("mentionable", true)
        .gte("importance", 7)
        .order("importance", { ascending: false });

      return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(data, null, 2) }] };
    }
  );

  // Active goals
  server.resource(
    "goals-active",
    "personaldb://goals/active",
    { description: "アクティブな目標と進捗" },
    async (uri) => {
      const profileId = await getProfileId();
      const { data } = await getClient()
        .from("goals")
        .select("*")
        .eq("profile_id", profileId)
        .eq("status", "active")
        .order("importance", { ascending: false });

      return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(data, null, 2) }] };
    }
  );

  // Weighted context (default persona)
  server.resource(
    "context",
    "personaldb://context",
    { description: "重み付きコンテキスト (デフォルトペルソナ)" },
    async (uri) => {
      const context = await generateContext();
      return { contents: [{ uri: uri.href, mimeType: "text/markdown", text: context }] };
    }
  );
}
