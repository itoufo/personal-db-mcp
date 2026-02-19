# Personal DB MCP Server

AIサービス横断で個人データをコンテキストとして提供する MCP サーバー。

## なぜ必要か

AIに文章を書かせると、誰が書いても同じような出力になる。Personal DB は「自分」のデータ（経歴、スキル、価値観、エピソード、思考習慣など）を構造化して保持し、AIが動的に参照できるようにする。これにより、AIの出力に一貫した「自分らしさ」が乗る。

## ユースケース

### AI のコンテキストとして使う（最も重要）

| シーン | 何が起きるか |
|---|---|
| 質問への回答 | 「あなたの強みは？」→ DB のスキル・実績・エピソードから根拠付きで回答 |
| 文章・コンテンツ生成 | ブログ、SNS投稿、提案書などに自分の価値観・トーン・実績が自然に反映される |
| 執筆支援 | 小説・記事の著者としてのパーソナリティ（文体、思想、スタンス）を前提に載せる |
| チャットボット | 自分の分身として応答するボットに、動的な個人データを注入 |
| マルチエージェント | 複数の AI エージェントが同じ「自分」のデータを参照して協調動作 |

### キャリア支援

| プロンプト | 用途 |
|---|---|
| `generate_resume` | 対象ロール・企業に合わせた職務経歴書を生成 |
| `self_introduction` | 面接・カンファレンス・カジュアルなど場面に応じた自己紹介 |
| `skill_assessment` | 求人票 (JD) に対するスキルマッチ分析 |
| `interview_prep` | 想定質問 + STAR形式の回答案 + 逆質問案 |
| `gap_analysis` | 目標ロールとの差分分析 + 学習ロードマップ |
| `story_finder` | テーマ・コンピテンシーに合うエピソード検索 |

### データメンテナンス

| プロンプト | 用途 |
|---|---|
| `data_collection` | DB の空白を特定し、埋めるためのインタビュー質問を生成 |

## セットアップ

### 環境変数

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PERSONAL_DB_API_KEY=          # マルチテナント時のみ
```

### ローカル (stdio)

```bash
npm install && npm run build
node dist/index.js
```

### Claude Code で使う

`.mcp.json` または `~/.claude.json` に追加:

```json
{
  "mcpServers": {
    "personal-db": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/personal-db-mcp/dist/index.js"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

### リモート (Vercel)

```bash
vercel deploy --prod
```

エンドポイント: `https://your-app.vercel.app/mcp`
認証: `Authorization: Bearer <API_KEY>`

## ツール一覧

### CRUD (16 エンティティ × 5 操作 = 80 ツール)

各エンティティに `list_*`, `get_*`, `create_*`, `update_*`, `delete_*` を提供。

| エンティティ | 説明 |
|---|---|
| `profiles` | 基本プロフィール、ミッション、価値観、トーン |
| `career_entries` | 職歴・経歴 |
| `skills` | スキル（カテゴリ・習熟度付き） |
| `projects` | プロジェクト実績 |
| `achievements` | 表彰・受賞・資格 |
| `episodes` | 具体的なエピソード・体験談 |
| `education` | 学歴・教育歴 |
| `hobbies` | 趣味・興味 |
| `values_philosophy` | 価値観・哲学・信条 |
| `health_entries` | 健康・ウェルネス |
| `life_events` | ライフイベント |
| `relationships` | 人間関係 |
| `goals` | 目標・進捗 |
| `custom_categories` | ユーザー定義カテゴリ |
| `custom_entries` | カスタムカテゴリのエントリ |
| `personas` | コンテキスト生成用ペルソナ定義 |

### コンテキスト生成

| ツール | 説明 |
|---|---|
| `get_context` | ペルソナベースの重み付きコンテキストを Markdown で生成。`persona`, `focus`, `max_tokens_hint` で制御可能 |
| `list_available_personas` | 利用可能なペルソナ一覧（プリセット + カスタム） |

プリセットペルソナ: `default`, `professional`, `interview`, `personal`, `creative`

### 検索・分析

| ツール | 説明 |
|---|---|
| `search` | 全テーブル横断のキーワード検索 |
| `get_stats` | テーブルごとのエントリ数・充実度 |

### タグ・リレーション

| ツール | 説明 |
|---|---|
| `tag_entry` / `untag_entry` | エントリへのタグ付け・解除 |
| `create_relation` / `get_relations` / `delete_relation` | エンティティ間の関連付け |

### 一括操作

| ツール | 説明 |
|---|---|
| `bulk_import` | JSON データの一括インポート |
| `bulk_export` | 全データまたは指定テーブルの一括エクスポート |

## リソース (MCP Resources)

| URI | 説明 |
|---|---|
| `personaldb://profile/summary` | プロフィール全体概要 |
| `personaldb://career/timeline` | 時系列の職歴 |
| `personaldb://skills/matrix` | カテゴリ別スキルマトリクス |
| `personaldb://portfolio` | プロジェクト + 実績 |
| `personaldb://resume/data` | 履歴書用の構造化データ |
| `personaldb://episodes/highlights` | 重要エピソード（importance 7以上） |
| `personaldb://goals/active` | アクティブな目標と進捗 |
| `personaldb://context` | 重み付きコンテキスト（デフォルトペルソナ） |

## アーキテクチャ

- **DB**: Supabase (PostgreSQL) - `personal_db` スキーマに全テーブルを分離
- **認証**: API キーベース（マルチテナント対応）
- **RLS**: 全テーブルに Row Level Security 設定済み
- **トランスポート**: stdio (ローカル) / HTTP (Vercel デプロイ)
