import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getClient } from "../db/client.js";
import { getProfileId } from "../utils/profile-resolver.js";
import { schemaRegistry } from "../schemas/index.js";
import { formatSuccess, formatErrorResponse, formatError } from "../utils/errors.js";
import { scoreEntries, extractDate, matchesFocus } from "../context/scoring.js";
import { resolvePersona } from "../context/personas.js";

/** Tables excluded from analysis (not content entities) */
const EXCLUDED_TABLES = ["profiles", "custom_categories", "personas"];

interface CompressionCandidate {
  id: string;
  table: string;
  label: string;
  score: number;
  importance: number;
  confidence: number;
  age_days: number;
  matches_focus: boolean;
}

interface TableAnalysis {
  table: string;
  total_entries: number;
  high_score: number;
  medium_score: number;
  low_score: number;
  compression_candidates: CompressionCandidate[];
}

function getEntryLabel(entry: Record<string, unknown>): string {
  return (
    (entry.name as string) ||
    (entry.title as string) ||
    (entry.role as string) ||
    (entry.alias as string) ||
    (entry.type as string) ||
    (entry.id as string) ||
    "unknown"
  );
}

export function registerAnalyzeTools(server: McpServer): void {
  server.tool(
    "analyze_profile",
    "プロフィール分析。スコアリングで圧縮候補を特定し、batch_operations と組み合わせて整理できる",
    {
      focus: z
        .string()
        .optional()
        .describe("フォーカスキーワード (関連エントリのスコアを1.5倍ブースト)"),
      score_threshold: z
        .number()
        .min(0)
        .max(1)
        .optional()
        .describe("圧縮候補の閾値 (デフォルト: 0.3)"),
      persona: z
        .string()
        .optional()
        .describe("スコアリング用ペルソナ (デフォルト: default)"),
    },
    async ({ focus, score_threshold = 0.3, persona: personaName }, extra) => {
      try {
        const profileId = await getProfileId(extra.authInfo);
        const client = getClient();
        const resolvedPersona = await resolvePersona(personaName, extra.authInfo);

        // Get analyzable tables from schemaRegistry
        const tables = Object.keys(schemaRegistry).filter(
          (t) => !EXCLUDED_TABLES.includes(t)
        );

        // Fetch all entries in parallel
        const tableDataMap = new Map<string, Record<string, unknown>[]>();
        await Promise.all(
          tables.map(async (table) => {
            let query = client.from(table).select("*");
            if (table !== "profiles") {
              query = query.eq("profile_id", profileId);
            }
            const { data } = await query;
            if (data && data.length > 0) {
              tableDataMap.set(table, data as Record<string, unknown>[]);
            }
          })
        );

        // Score and analyze each table
        const tableAnalyses: TableAnalysis[] = [];
        const allCandidates: CompressionCandidate[] = [];
        const allTopEntries: CompressionCandidate[] = [];
        let totalEntries = 0;
        let totalCandidates = 0;

        for (const [table, entries] of tableDataMap) {
          const scored = scoreEntries(entries, table, resolvedPersona, focus);
          totalEntries += scored.length;

          let high = 0;
          let medium = 0;
          let low = 0;
          const candidates: CompressionCandidate[] = [];

          for (const { entry, score } of scored) {
            const now = new Date();
            const entryDate = extractDate(entry, table);
            const ageDays = Math.floor(
              (now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            const candidate: CompressionCandidate = {
              id: entry.id as string,
              table,
              label: getEntryLabel(entry),
              score: Math.round(score * 1000) / 1000,
              importance: (entry.importance as number) || 5,
              confidence: (entry.confidence as number) || 8,
              age_days: ageDays,
              matches_focus: focus ? matchesFocus(entry, focus) : false,
            };

            if (score >= 0.6) {
              high++;
              allTopEntries.push(candidate);
            } else if (score >= 0.3) {
              medium++;
            } else {
              low++;
            }

            if (score < score_threshold) {
              candidates.push(candidate);
              allCandidates.push(candidate);
            }
          }

          totalCandidates += candidates.length;

          tableAnalyses.push({
            table,
            total_entries: scored.length,
            high_score: high,
            medium_score: medium,
            low_score: low,
            compression_candidates: candidates.sort(
              (a, b) => a.score - b.score
            ),
          });
        }

        // Sort top entries by score descending, take top 10
        allTopEntries.sort((a, b) => b.score - a.score);
        const top10 = allTopEntries.slice(0, 10);

        // Sort all candidates by score ascending
        allCandidates.sort((a, b) => a.score - b.score);

        // Generate recommendations
        const recommendations: string[] = [];

        if (totalCandidates > 0) {
          recommendations.push(
            `${totalCandidates}件のエントリがスコア${score_threshold}未満です。削除または統合を検討してください`
          );
        }

        if (focus) {
          const focusMatches = allCandidates.filter((c) => !c.matches_focus);
          if (focusMatches.length > 0) {
            recommendations.push(
              `${focusMatches.length}件の圧縮候補は「${focus}」に関連しないエントリです。優先的に整理できます`
            );
          }
        }

        // Check for tables with many low-score entries
        for (const ta of tableAnalyses) {
          if (ta.low_score > 5) {
            recommendations.push(
              `${ta.table} に低スコアエントリが${ta.low_score}件あります`
            );
          }
        }

        if (totalEntries > 200) {
          recommendations.push(
            `総エントリ数が${totalEntries}件です。定期的な整理を推奨します`
          );
        }

        if (totalCandidates === 0) {
          recommendations.push(
            "圧縮候補はありません。プロフィールは適切なサイズです"
          );
        }

        return formatSuccess({
          persona_used: resolvedPersona.name,
          focus: focus || null,
          score_threshold,
          total_entries: totalEntries,
          total_compression_candidates: totalCandidates,
          tables: tableAnalyses.filter((t) => t.total_entries > 0),
          top_entries: top10,
          compression_candidates: allCandidates,
          recommendations,
        });
      } catch (e) {
        return formatErrorResponse(formatError(e));
      }
    }
  );
}
