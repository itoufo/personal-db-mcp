/**
 * Seed script: サンプルプロフィールデータをインポート
 * Usage: npx tsx scripts/seed.ts
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const client = createClient(url, key, {
  db: { schema: "personal_db" },
  auth: { persistSession: false },
});

async function seed() {
  console.log("Seeding personal_db...");

  // 1. Profile
  const { data: profile, error: profileErr } = await client
    .from("profiles")
    .upsert(
      {
        name: "伊東雄歩",
        name_en: "Yuho Ito",
        title: "代表取締役 / AIプロフェッショナル",
        title_full: "AIプロフェッショナル | 天才 | 哲学家",
        organization: "株式会社ウォーカー",
        tagline: "令和のエジソン",
        bio: "IQ130超・MENSA会員。2015年に株式会社ウォーカーを創業し、AI開発・セキュリティ・教育事業を展開。10年以上の起業経験と、セキュリティからAI製品開発まで全領域をカバーするフルスタックエンジニア。何億円規模のシステム構築実績。",
        personality_type: "ENTP/INTP",
        personality_traits: ["論理的", "天才肌", "熱血", "幅広い学問知識"],
        career_years: 12,
        urls: {
          company: "https://walker.co.jp/",
          portfolio: "https://www.walker.co.jp/works/",
          profile: "https://yuhoito.netlify.app/profile",
          taolis: "https://www.taolis.net/",
          miraipost: "https://miraipost.jp/",
        },
        mission: "AIと共に、自分で考える力を取り戻す人を増やす",
        vision: "「自分で考え、決めて、形にできる力」を持つ人を増やす。技術に振り回されるのではなく、技術を使って自分のアイデアを実現できる「新人類」が当たり前に存在する社会。",
        core_values: [
          "試行錯誤こそが価値 — 完璧な答えより手を動かすプロセスを重視",
          "AIは相棒、自分が主導 — 「何を作るか」「なぜ作るか」は必ず自分で決める",
          "表面的な成功ではなく、納得感のある成長",
          "一人で止まらない仕組みを作る — 学びや挑戦を続けるための環境づくり",
        ],
        speech_style: "casual",
        tone: "率直で等身大、でも芯は熱い。技術論は論理的に、体験談は感情込めて熱く語る",
        catchphrases: ["ホントに", "ｸｯｯｯｯｯｯｿ", "ガチで", "スゲェ"],
        stance: "「すごい人」ではなく「諦めない人」として発信。上から目線ではなく共感ベース",
        social_proof: {
          systems_built: "50+",
          ai_improvement_projects: "30+",
          seminars_workshops: "200+",
          total_students: "3000+",
          consulting_monthly: "5-8社",
          system_scale: "何億円規模",
          student_outcome_rate: "90%が3ヶ月以内にAI成果物作成",
        },
        products: [
          { name: "タオリス（人機和総研）", type: "media", description: "AIシンクタンクメディア" },
          { name: "MiraiPost", type: "platform", description: "AI活用プラットフォーム" },
          { name: "AI化マーケティングシステム", type: "system", description: "AI活用マーケティング自動化" },
          { name: "StoQ", type: "edtech", description: "AI教材（2016年、Edix出展）" },
          { name: "新人類育成計画", type: "education", description: "2日間AI集中育成プログラム。毎月開催、継続参加率85%" },
          { name: "DigiTech Quest", type: "education", description: "全国展開ワークショップ。満足度4.8/5" },
        ],
        credentials: [
          { type: "membership", name: "MENSA会員", detail: "IQ130超" },
          { type: "certification", name: "JDLA認定講座講師", detail: "DeepLearning協会認定。E検定向け講座を担当", year: 2017 },
          { type: "board_member", name: "健全AI教育協会（HAIIA）理事", detail: "AI教育の健全化に向けた団体の理事" },
        ],
        tech_stack: {
          languages: ["Python", "PHP", "Ruby", "JavaScript", "TypeScript", "C#"],
          frameworks: ["Laravel", "Django", "Rails", "React", "Vue.js", "Next.js", "Unity"],
          ai_ml: ["TensorFlow", "scikit-learn", "OpenCV", "Pandas", "LLM API", "プロンプトエンジニアリング"],
          security: ["WAF", "SIEM", "脆弱性診断", "ペネトレーションテスト", "インシデントレスポンス"],
          infra: ["AWS", "Docker", "CI/CD", "Supabase"],
        },
        importance: 10,
        confidence: 10,
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (profileErr) {
    console.error("Profile error:", profileErr);
    return;
  }
  console.log("Profile created:", profile.id);
  const profileId = profile.id;

  // 2. Career entries (from experiences data)
  const careerEntries = [
    {
      profile_id: profileId,
      role: "技術主任",
      org_type: "enterprise",
      domain: "cybersecurity",
      summary: "全国規模WAFサービスの技術主任。無停止での機器リプレースを実現",
      insights: [
        "全国規模のセキュリティサービスでは、止められないという制約が技術的判断の全てを支配する",
        "機器リプレースは技術の問題ではなく、手順書の精度とチームの練度の問題",
      ],
      mention_tone: "lesson",
      mentionable: true,
      tags: ["waf", "security-operations", "infrastructure", "zero-downtime", "large-scale"],
      importance: 8,
      confidence: 9,
    },
    {
      profile_id: profileId,
      role: "フルスタックエンジニア / 代表取締役",
      organization: "株式会社ウォーカー",
      org_type: "startup",
      domain: "software-development",
      summary: "業務システム・Webサービス50件以上を構築。Web、モバイル、ゲーム、IoT、AIまで全領域。何億円規模のシステム開発実績",
      insights: [
        "あらゆる技術を横断してきたからこそ、技術選定でバイアスなく最適解を選べる",
        "フルスタックの本質は全部できることではなく、どの層の問題かを即座に特定できること",
      ],
      mention_tone: "lesson",
      mentionable: true,
      tags: ["full-stack", "web", "mobile", "game", "diverse-projects"],
      importance: 9,
      confidence: 10,
    },
    {
      profile_id: profileId,
      role: "技術リード",
      org_type: "enterprise",
      domain: "software-development",
      period_year: 2019,
      summary: "アパレル大規模基幹システム完遂（150人月規模）",
      insights: ["150人月規模のプロジェクトでは、コードの品質よりコミュニケーション設計が成否を分ける"],
      mention_tone: "lesson",
      mentionable: true,
      tags: ["large-scale", "enterprise", "apparel", "system-integration"],
      importance: 8,
      confidence: 9,
    },
    {
      profile_id: profileId,
      role: "技術リード",
      org_type: "startup",
      domain: "software-development",
      period_year: 2020,
      summary: "オンライン展示会サービス開発。2000人同時接続を実現",
      insights: ["2000人同時接続の壁は、アーキテクチャの問題であって個別の最適化では超えられない"],
      mention_tone: "lesson",
      mentionable: true,
      tags: ["real-time", "high-concurrency", "online-event", "covid"],
      importance: 7,
      confidence: 9,
    },
    {
      profile_id: profileId,
      role: "代表取締役",
      organization: "株式会社ウォーカー",
      org_type: "startup",
      domain: "business",
      period_start: "2015-01-01",
      summary: "株式会社ウォーカー創業。10年以上経営を継続",
      insights: ["10年会社を続けられたのは、技術力ではなく「撤退判断の速さ」のおかげ"],
      mention_tone: "lesson",
      mentionable: true,
      tags: ["entrepreneurship", "startup", "founding", "10-years"],
      importance: 10,
      confidence: 10,
    },
    {
      profile_id: profileId,
      role: "認定講師",
      org_type: "education",
      domain: "ai-ml",
      period_start: "2017-01-01",
      summary: "JDLA認定講座の講師。E検定対策講座を担当",
      insights: ["AIを教えるとき、数学の壁は理論ではなく「なぜそれが必要か」の動機付けで超えられる"],
      mention_tone: "lesson",
      mentionable: true,
      tags: ["education", "deep-learning", "e-certification", "jdla", "instructor"],
      importance: 7,
      confidence: 9,
    },
    {
      profile_id: profileId,
      role: "講師 / 代表",
      org_type: "education",
      domain: "ai-ml",
      summary: "「新人類育成計画」── たった2日でAIエンジニアを育成する超集中プログラム。毎月開催、継続参加率85%、受講者の90%が3ヶ月以内にAI成果物を作成",
      insights: [
        "2日間でAIエンジニアとして動けるレベルまで引き上げるには、理論の取捨選択が全て",
        "「全部教える」より「何を捨てるか」の判断こそが教育設計の本質",
      ],
      mention_tone: "lesson",
      mentionable: true,
      tags: ["education", "generative-ai", "training", "bootcamp", "intensive"],
      importance: 9,
      confidence: 10,
    },
  ];

  const { error: careerErr } = await client.from("career_entries").insert(careerEntries);
  if (careerErr) console.error("Career error:", careerErr);
  else console.log(`Inserted ${careerEntries.length} career entries`);

  // 3. Achievements
  const achievements = [
    { profile_id: profileId, type: "membership", name: "MENSA会員", detail: "IQ130超", importance: 9, confidence: 10 },
    { profile_id: profileId, type: "certification", name: "JDLA認定講座講師", detail: "DeepLearning協会認定。E検定向け講座を担当", year: 2017, importance: 8, confidence: 10 },
    { profile_id: profileId, type: "board_member", name: "健全AI教育協会（HAIIA）理事", detail: "AI教育の健全化に向けた団体の理事", importance: 7, confidence: 10 },
  ];

  const { error: achErr } = await client.from("achievements").insert(achievements);
  if (achErr) console.error("Achievements error:", achErr);
  else console.log(`Inserted ${achievements.length} achievements`);

  // 4. Episodes
  const episodes = [
    {
      profile_id: profileId,
      title: "2000万円損失からの教訓",
      type: "failure",
      domain: "business",
      situation: "受託開発で上位企業と契約し大規模システム開発を進行中",
      task: "大規模システム開発の遂行と納品",
      action: "開発を進めるも、上位企業が途中で連絡不能に。その後訴訟に発展",
      result: "2000万円の損失。訴訟歴5戦4勝1分。契約リスク管理の重要性を体得",
      insights: [
        "受託開発の最大リスクは技術ではなく、契約と信用。書面に残さない合意は合意ではない",
        "訴訟は勝っても消耗する。契約段階でリスクを潰す方が100倍コスパがいい",
        "2000万トリッパグレた経験から、前払い・マイルストーン払いの重要性を痛感した",
      ],
      emotions: ["怒り", "無力感", "決意"],
      mention_tone: "lesson",
      mentionable: true,
      tags: ["contract-dispute", "lawsuit", "risk-management", "subcontracting"],
      importance: 9,
      confidence: 10,
    },
    {
      profile_id: profileId,
      title: "AIへの恐怖から最強の相棒へ",
      type: "turning_point",
      domain: "ai-ml",
      situation: "AI登場でエンジニア10年の経験が一瞬で古くなる恐怖を経験",
      task: "AIとの向き合い方を見つけること",
      action: "徹底的にAIを使い込み、特性と限界を理解",
      result: "「思考を加速させる最強の相棒」という確信を得た。教育事業の方向性も確立",
      insights: [
        "AIは脅威ではなく思考加速装置。問題はAIに「答え」を求めてしまうこと",
        "本当に必要なのはAIの使い方ではなく「何を作るべきか」を自分で決める力",
        "AIが二極化を加速させている。答えを求めて思考停止する人と、試行錯誤を加速させる人",
      ],
      emotions: ["恐怖", "好奇心", "確信"],
      mention_tone: "lesson",
      mentionable: true,
      tags: ["ai-fear", "career-crisis", "mindset-shift", "turning-point"],
      importance: 10,
      confidence: 10,
    },
    {
      profile_id: profileId,
      title: "AIコミュニティ事業での多額の借金",
      type: "failure",
      domain: "business",
      situation: "AIコミュニティ事業を運営",
      task: "事業を持続可能にすること",
      action: "善意主導で運営を続けたが、収益化設計が後手に",
      result: "多額の借金を背負い、停滞期を3度乗り越えた",
      insights: [
        "コミュニティ事業は収益化の設計を先にしないと、善意だけでは持続できない",
        "借金を背負っても諦めなかった経験が、今の「まだ諦めたくない人」への共感の原点になっている",
        "停滞期を乗り越える鍵は、技術力でも運でもなく「撤退と再起の判断速度」",
      ],
      emotions: ["焦り", "孤独", "粘り"],
      mention_tone: "lesson",
      mentionable: true,
      tags: ["community-business", "debt", "failure", "ai-community"],
      importance: 9,
      confidence: 10,
    },
  ];

  const { error: epErr } = await client.from("episodes").insert(episodes);
  if (epErr) console.error("Episodes error:", epErr);
  else console.log(`Inserted ${episodes.length} episodes`);

  console.log("Seed complete!");
}

seed().catch(console.error);
