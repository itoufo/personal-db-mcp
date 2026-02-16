import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerPrompts(server: McpServer): void {
  // Generate resume
  server.prompt(
    "generate_resume",
    "対象ロール/会社に合わせた職務経歴書を生成",
    {
      target_role: z.string().describe("応募するロール"),
      company: z.string().optional().describe("応募先企業"),
      format: z.enum(["japanese", "english", "both"]).optional().describe("言語"),
      emphasis: z.string().optional().describe("特に強調したい点"),
    },
    ({ target_role, company, format = "japanese", emphasis }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `以下の条件で職務経歴書を生成してください。

**対象ロール**: ${target_role}
${company ? `**応募先企業**: ${company}` : ""}
**言語**: ${format}
${emphasis ? `**強調点**: ${emphasis}` : ""}

まず personaldb://resume/data リソースからデータを取得し、対象ロールに最も関連性の高い経歴・スキル・実績を選別して、説得力のある職務経歴書を作成してください。

構成:
1. プロフィールサマリー（3-4行）
2. スキルハイライト（ロールに関連するもの）
3. 職務経歴（関連度の高い順）
4. 主要実績・プロジェクト
5. 学歴・資格`,
          },
        },
      ],
    })
  );

  // Self introduction
  server.prompt(
    "self_introduction",
    "文脈に応じた自己紹介を生成",
    {
      context: z.enum(["interview", "networking", "casual", "conference", "written_bio"]).describe("場面"),
      duration: z.enum(["30sec", "1min", "3min", "5min"]).optional().describe("持ち時間"),
      audience: z.string().optional().describe("聞き手の属性"),
    },
    ({ context, duration = "1min", audience }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `以下の条件で自己紹介を生成してください。

**場面**: ${context}
**持ち時間**: ${duration}
${audience ? `**聞き手**: ${audience}` : ""}

personaldb://profile/summary リソースからプロフィールデータを取得し、場面に合ったトーンと内容量で自己紹介を作成してください。

重要:
- プロフィールの speech_style と tone を反映
- 場面に応じた情報の取捨選択
- catchphrases は自然に使用可能な場面でのみ
- stance を体現する語り口`,
          },
        },
      ],
    })
  );

  // Skill assessment
  server.prompt(
    "skill_assessment",
    "JDに対するスキルマッチ分析",
    {
      job_description: z.string().describe("求人票の内容 (JD)"),
    },
    ({ job_description }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `以下のJDに対して、スキルマッチ分析を行ってください。

**JD内容**:
${job_description}

personaldb://skills/matrix リソースと personaldb://career/timeline からデータを取得し、以下を分析:

1. **マッチするスキル**: JD要件と一致するスキル（根拠付き）
2. **関連経験**: JD要件を実証する経歴・プロジェクト
3. **ギャップ**: 不足しているスキル・経験
4. **隠れた強み**: JDに明記されていないが価値となる経験
5. **総合マッチ度**: パーセンテージと判定理由`,
          },
        },
      ],
    })
  );

  // Interview prep
  server.prompt(
    "interview_prep",
    "エピソードから想定質問＋回答案を生成",
    {
      role: z.string().describe("面接対象のロール"),
      focus_areas: z.string().optional().describe("重点分野 (カンマ区切り)"),
    },
    ({ role, focus_areas }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `${role}の面接準備を行います。

${focus_areas ? `**重点分野**: ${focus_areas}` : ""}

personaldb://episodes/highlights と personaldb://career/timeline からデータを取得し、以下を生成:

1. **想定質問10問** — 一般的な質問 + ロール固有の質問
2. **各質問への回答案** — STAR形式で、実際のエピソード・経歴を引用
3. **逆質問案5つ** — 知的好奇心と理解度を示す質問
4. **注意点** — 話すべきでない内容、避けるべきトーン

回答は mention_tone を尊重し、insights を自然に織り込んでください。`,
          },
        },
      ],
    })
  );

  // Gap analysis
  server.prompt(
    "gap_analysis",
    "目標ロールとの差分を分析",
    {
      target_role: z.string().describe("目標ロール"),
      timeline: z.string().optional().describe("目標期間"),
    },
    ({ target_role, timeline }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `現在のスキル・経験と「${target_role}」に必要な要件のギャップ分析を行ってください。

${timeline ? `**目標期間**: ${timeline}` : ""}

personaldb://skills/matrix、personaldb://career/timeline、personaldb://goals/active からデータを取得し:

1. **現在の強み** — 既に十分な領域
2. **ギャップ一覧** — 不足スキル・経験（優先度付き）
3. **既存ゴールとの整合性** — 設定済みの目標とのアライメント
4. **学習ロードマップ** — ギャップを埋めるための具体的アクションプラン
5. **クイックウィン** — すぐに始められる3つのアクション`,
          },
        },
      ],
    })
  );

  // Story finder
  server.prompt(
    "story_finder",
    "テーマ/コンピテンシーに合うエピソードを検索",
    {
      theme: z.string().describe("テーマ or コンピテンシー (例: リーダーシップ, 困難の克服, 技術的チャレンジ)"),
      count: z.number().int().min(1).max(10).optional().describe("候補数 (デフォルト: 5)"),
    },
    ({ theme, count = 5 }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `「${theme}」に関連するエピソード・経験を${count}件探してください。

search ツールで「${theme}」を検索し、episodes, career_entries, projects テーブルから候補を収集:

各候補について:
1. **エピソード名/概要**
2. **関連度** (高/中/低)
3. **STAR形式での要約** (データがあれば)
4. **使える場面** (面接、自己PR、ブログ等)
5. **語り口のトーン** (mention_tone 参照)

mentionable: false のエピソードは除外してください。`,
          },
        },
      ],
    })
  );

  // Data collection (interview questions to fill gaps)
  server.prompt(
    "data_collection",
    "DBの空白を埋めるためのインタビュー質問を生成",
    {
      focus: z.string().optional().describe("重点カテゴリ (省略時は全体を分析)"),
    },
    ({ focus }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Personal DBの空白箇所を特定し、埋めるためのインタビュー質問を生成してください。

${focus ? `**重点カテゴリ**: ${focus}` : "**全カテゴリ**を確認"}

get_stats ツールでデータの充実度を確認し、bulk_export でデータ内容を確認:

1. **空のテーブル** — データ未入力のカテゴリ
2. **不完全なエントリ** — 重要フィールドが空のエントリ
3. **薄い領域** — エントリ数が少ないカテゴリ
4. **深掘り候補** — 既存エントリで詳細を追加すべきもの

各ギャップに対して、回答しやすい具体的な質問を3-5個生成してください。
回答はJSON形式で返すことを想定し、質問文にフィールド名のヒントを含めてください。`,
          },
        },
      ],
    })
  );
}
