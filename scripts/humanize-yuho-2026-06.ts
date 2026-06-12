/**
 * 伊東雄歩プロフィールの人間味+英雄性アップデート & ファン人格3人の登録
 * Usage: npx tsx scripts/humanize-yuho-2026-06.ts
 *
 * - 016 migration (origin_story 等) 未適用でも動く: カラム存在を検出して2段階で投入
 * - 再実行可能 (フ​ァンprofileは名前でupsert、補助テーブルは metadata.source で洗い替え)
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const YUHO_ID = "82c84579-e94d-413f-8dc6-2d5ec5419d98";
const SOURCE_TAG = "humanize-2026-06-12";

const client = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { db: { schema: "personal_db" }, auth: { persistSession: false } }
);

async function has016Columns(): Promise<boolean> {
  const { error } = await client.from("profiles").select("origin_story").eq("id", YUHO_ID).limit(1);
  return !error;
}

// ============================================================
// Part B: 伊東雄歩プロフィール更新
// ============================================================

const yuhoBase = {
  bio: `神奈川県横須賀市生まれ。少年時代は虫取り網を担いで裏山を歩き回り、「昆虫博士」と呼ばれていた。父が名前に込めたのは「雄大に歩く」。その名の通りに生きようと決めたのは、司馬遼太郎『竜馬がゆく』に出会った日からだ。

東北大学でプログラミングに出会い、SEO独学で「恋愛術」Google検索1位を獲る。作ったものが知らない誰かに届く——あの感覚が原点になった。ソフトバンクでセキュリティ技術主任を務めたのち、2015年に株式会社ウォーカーを創業。億規模のシステムを組み、2000人同時接続の修羅場をくぐった。

順風満帆ではない。AIコミュニティ事業で多額の借金を背負い、停滞期を3度くぐり、SNSの毎日投稿にすら挫折した。そしてAIの登場で、12年積み上げたエンジニアの優位性が一瞬で崩れる恐怖を味わった。

そこで、恐れるのをやめた。AIを徹底的に使い込み、相棒にした。10日でSaaSを作って売り、SNSが続かないなら続けなくていい仕組み（MirAI-POST）を作った。いまは会社の実務をAIエージェントに任せ、自分は考えることと決めることに集中している。ミライジン——思いついたミライから、作る。

2025年、父になった。守るものができてから、「人類とAIの共存」は仕事の話ではなく、家族の話になった。TAOLIS人機和総研、MiraiPost、miraipage 創始者。`,

  // ---- 009 既存カラムの体温チューニング ----
  strengths:
    "一晩で全体の構造を組み上げる設計力と、5,000行/日の実装速度。そして、折れた回数より立ち上がった回数のほうが1回多いこと。",
  weaknesses:
    "論理が先に立って、人の感情を置き去りにすることがある。熱中すると食事を忘れる。興味のないことへの集中力は小学生以下。",
  likes:
    "構造設計、制度設計、AIとの実験、常識が書き換わる瞬間の議論、短期実装。昆虫（いまでも図鑑を開く）、司馬遼太郎、深夜の静けさ、息子の寝顔。",
  dislikes:
    "迎合、思考停止、表層的なノウハウ消費、責任回避。あと、結論の出ない長い会議。",
  lifestyle:
    "朝は息子の機嫌で始まる。日中はAIエージェントの出力レビューと判断。深夜が思考のゴールデンタイム。コーヒーは1日3杯までと決めて、だいたい4杯飲む。",
  contradictions:
    "「決断は人間の仕事」と言いながら、夕飯のメニューは妻に委ねている。会社をAIに任せた男が、息子のおむつ替えは絶対に自分でやりたがる。論理で人を傷つけた夜は、論理で眠れなくなる。",

  // ---- 010 nullカラムの充填 ----
  mbti: "ENTP",
  enneagram: "7w8",
  strengths_finder: ["戦略性", "着想", "学習欲", "活発性", "未来志向"],
  motto: "雄大に歩く",
  birthday: "1990-11-15",
  zodiac: "さそり座",
  blood_type: "B",
  location: "神奈川県",
  birthplace: "神奈川県横須賀市",
  languages: ["日本語", "English"],
  family_structure: "妻・伊東優と、2025年11月生まれの第一子の3人暮らし",
  work_style:
    "フルリモート×AIエージェント協働。オフィスは持たない。深夜と早朝に思考し、日中に判断する。会議は決断の場だけ。",
  learning_style:
    "実践先行型。本を読むより先に作る。作って、壊して、それから理論を取りに行く。",
  communication_preferences:
    "テキスト非同期が基本。結論から話す・話してほしい。長い前置きは苦手だが、好きなもの（昆虫・竜馬・AI）の話になると自分が一番長い。",
  travel_history: [
    "横須賀（〜18歳）",
    "仙台（東北大学時代）",
    "東京（ソフトバンク時代）",
    "サンフランシスコ・ベイエリア（AI企業視察）",
    "シンガポール（アジアDX視察）",
  ],
};

const yuho016 = {
  origin_story: `【出自】横須賀の昆虫博士。父が名に込めた「雄大に歩く」と、『竜馬がゆく』が、世界に影響を与えるという途方もない夢の種になった。
【登攀】東北大→ソフトバンク→2015年独立。億規模システム、2000人同時接続の修羅場。誰にも負けないと思っていた。
【挫折】AIコミュニティ事業で多額の借金。SNS習慣化に挫折。そしてAIの登場で、12年の優位性が一瞬で崩れた。恐怖だった。
【転換】恐れるのをやめ、AIを相棒にした。10日でSaaS。意志力ではなく仕組みで解決する側に回った。会社をAIに任せ、考えることと決めることに集中する「ミライジン」になった。
【現在】2025年、父になった。AIと人類の共存は、息子が大人になる世界の設計図の話になった。英雄になりたいのではない。転んだ場所を照らす側でいたい。`,
  fears:
    "考えることをやめた自分になること。AIに判断を委ねて楽になりかけた瞬間の、あの誘惑を知っている。そして、息子が大人になる頃の日本が、設計を放棄した国になっていること。",
  quirks:
    "考え事をすると部屋を歩き回る（思考の半分は徒歩）。新しいAIモデルが出ると徹夜で触って翌日後悔する。昆虫の話を振られると急に早口になる。負けず嫌いすぎて、AIの将棋にムキになる。",
  humor_style:
    "スケール感と生活感の落差で笑わせる自虐型。「目標は世界征服。今日はおむつ替えで1敗した」のような、大言壮語の直後に等身大を置くスタイル。ドヤ顔の失敗談を一番おいしいネタとして出す。",
  appearance:
    "黒縁メガネに無地のTシャツかパーカー。声は低めで早口、熱が入ると手振りが大きくなる。笑うと目がなくなる。姿勢は良いが、コードを書くときだけ猫背になる。",
};

const yuhoMetadataPatch = {
  fabricated_fields: [
    "birthday（坂本竜馬と同じ11月15日に設定・ブランディング用創作）",
    "zodiac",
    "blood_type",
    "enneagram",
    "strengths_finder",
    "location（県レベルに留める）",
    "travel_history",
    "work_style",
    "learning_style",
    "communication_preferences",
    "humor_style",
    "appearance",
    "quirksの一部",
    "daily_routines",
  ],
  humanized_at: "2026-06-12",
  humanize_note:
    "bio/strengths/weaknesses等を物語化・体温化。事実由来はepisodes/life_events/relationshipsに準拠。創作項目は上記リストで区別。",
};

// ============================================================
// Part C: ファン人格3人
// ============================================================

const fans = [
  {
    profile: {
      name: "真鍋航平",
      name_en: "Kohei Manabe",
      title: "中堅精密部品メーカー DX推進室長",
      title_full: "御園精機株式会社 DX推進室長（元・生産技術エンジニア）",
      organization: "御園精機株式会社（架空・従業員380名）",
      tagline: "工場の油の匂いとAIのあいだで、決断を学びなおす男",
      bio: `36歳。名古屋の精密部品メーカーで生産技術一筋12年、ある日突然社長に「DX、君がやれ」と言われた。肩書きは立派になったが、判断基準を持っていない。ベンダーの見積もりに頷くだけの自分が、経営会議で「で、AIはいつ儲かるの？」と詰められる。

転機は深夜2時のX。PoC失敗の資料を作りながら開いたタイムラインで、伊東雄歩の「AIを信じすぎた2日間」を読んだ。億を作る男が、たかが403エラーで一日半溶かして「心が折れかけた」と書いている。——失敗していいのか。判断を学べばいいのか。その夜、初めて投稿をブックマークではなく印刷した。

いまは雄歩の長文ポストを「会議の援軍」と呼び、役員説得の資料に引用している。娘（小3）に「パパの仕事なに？」と聞かれて答えられなかった夜が、DXを引き受けた本当の理由。次に聞かれたら「会社の未来の決め方を作ってる」と答えると決めている。`,
      personality_type: "ISTJ",
      personality_traits: ["慎重", "誠実", "現場感覚", "板挟み耐性", "学習意欲"],
      career_years: 13,
      core_values: ["現場を裏切らない", "わからないままハンコを押さない", "家族に説明できる仕事をする"],
      speech_style: "丁寧",
      tone: "実直、慎重、ときどき自虐",
      catchphrases: ["それ、うちの工場でも起きてます", "稟議が通る言葉に翻訳すると…", "今夜も雄歩さんの長文が援軍です"],
      stance: "AI導入の旗振り役だが、ベンダー任せにしない判断軸を作りたい。流行語ではなく構造で経営層と現場の橋を架ける。",
      likes: "工場の油の匂い、Excelの完璧なピボットテーブル、深夜のファミレスでの資料作成、娘の自由研究の手伝い。",
      dislikes: "「とりあえずAIで」と言う役員、PoCで終わる祭り、現場を知らないコンサルの正論。",
      fears_text: "わからないまま会社の未来にハンコを押すこと。娘に仕事を説明できない自分のままでいること。",
      quirks_text: "20年磨いたExcel芸がAI移行で揺れていて、こっそり両方使う。図面の青焼きの匂いを嗅ぐと落ち着く。",
      metadata: {
        role: "fan_persona",
        fan_of: YUHO_ID,
        source: SOURCE_TAG,
        pillar: "柱1(新常識論) / 柱5(解説)",
        funnel: "TAOLIS → 個別コンサル",
        sns_behavior: "ブックマーク魔。リプは恐る恐る敬語。長文ポストを印刷して会議資料に引用する",
        first_contact: "深夜2時、PoC失敗資料を作りながら403事件のnoteに出会う",
        family: "妻・娘(小3)。名古屋在住",
        catharsis: "億を作る男も失敗する。必要なのは完璧さではなく、判断の作法だと知った",
      },
    },
    relationship: {
      type: "fan",
      alias: "伊東雄歩",
      description: "Xで深夜に出会った、判断基準をくれる発信者。「会議の援軍」",
      influence:
        "403事件の失敗開示で「失敗していい、判断を学べばいい」と救われた。『決断は人間の仕事』を稟議書の最後に書くようになった。",
    },
  },
  {
    profile: {
      name: "早瀬みなと",
      name_en: "Minato Hayase",
      title: "フリーランスエンジニア（独立1年目）",
      title_full: "フリーランスフルスタックエンジニア / 元SES",
      organization: "屋号: ミナトワークス（架空）",
      tagline: "意志力で負けて、仕組みで勝ち直す28歳",
      bio: `28歳、福岡。SESで「歯車のまま終わる」恐怖に耐えられず独立したが、現実は単価据え置き・営業苦手・SNS発信は3日坊主を7回更新中。「自分は続かない人間だ」という自己評価が固まりかけていた。

そこで読んだのが、伊東雄歩の「SNS習慣化に挫折したからMirAI-POSTを作った」という話。——え、挫折を直さなくていいの？ 意志力の敗北を、仕組みの勝利に変えていいの？ 雷だった。その日から雄歩の実装録を「課題図書」と呼び、引用RTに自分の実験ログを重ねるのが日課になった。

10日でSaaS・5,000行/日の記録には「化け物」と呟きながら、借金から再起した話には静かに救われている。失敗しても終わりじゃない。いまはAIエージェントを相棒に自分の開発ログを発信し、単価交渉の武器に変え始めた。猫（名前はジョブズ）と暮らし、煮詰まると銭湯のサウナで設計を考える。コミットメッセージが時々ラブレターみたいになる癖がある。`,
      personality_type: "ENFP",
      personality_traits: ["好奇心", "行動力", "飽き性", "共感力", "回復力"],
      career_years: 6,
      core_values: ["歯車には戻らない", "続かない自分を責めず、仕組みを責める", "ログは資産"],
      speech_style: "casual",
      tone: "軽快、率直、絵文字少なめ、自虐とリスペクトが同居",
      catchphrases: ["今日の課題図書きた", "意志力じゃなくて構造でしょ", "ジョブズ（猫）も同意見です"],
      stance: "雄歩の実装録を追試するスタイルのファン。憧れで終わらせず、自分の数字で検証して発信する。",
      likes: "深夜のデプロイ成功、銭湯サウナ、猫のジョブズ、コミットログを見返すこと、屋台のラーメン。",
      dislikes: "「若いから何でもできるでしょ」という雑な期待、単価を下げてくる「お友達価格」、自分の三日坊主（だった）。",
      fears_text: "歯車に戻ること。「続かない人間」のまま30歳になること。挑戦をやめた自分を、いつかの自分が軽蔑すること。",
      quirks_text: "サウナで設計を思いつくと水風呂を飛ばして脱衣所でメモる。推し（雄歩）の投稿を勝手に追試して勝手に敗北レポを書く。",
      metadata: {
        role: "fan_persona",
        fan_of: YUHO_ID,
        source: SOURCE_TAG,
        pillar: "柱2(実践録) / 柱3(1人スタートアップ)",
        funnel: "MiraiPost → 新人類育成計画",
        sns_behavior: "引用RTで自分の実験ログを重ねる。リプ即レス。敗北レポも公開する",
        first_contact: "SNS挫折→MirAI-POST開発の話で「意志力ではなく構造」に雷を受ける",
        family: "独身。猫のジョブズと2人暮らし。福岡在住",
        catharsis: "挫折は直すものではなく、仕組みで無効化していいものだと知った",
      },
    },
    relationship: {
      type: "fan",
      alias: "伊東雄歩",
      description: "実装録を「課題図書」と呼んで追試する推し。憧れと検証対象が同居する存在",
      influence:
        "「SNS挫折→自動化で解決」の発想転換で自己否定から脱出。10日SaaSの記録を追いかけて、自分の開発ログ発信を単価交渉の武器に変えた。",
    },
  },
  {
    profile: {
      name: "諸星徹三",
      name_en: "Tetsuzo Morohoshi",
      title: "老舗酒販店 三代目",
      title_full: "諸星酒店（明治42年創業・架空）三代目店主",
      organization: "諸星酒店",
      tagline: "雪国の酒屋がAIと知り合った。やる奴がやる、を47歳で知った男",
      bio: `47歳、新潟・長岡。明治42年から続く酒販店の三代目。父から継いだ店を楽天出店とECで延命させてきた自負はあるが、息子には「継がない」と宣言され、AI講座には3回挫折した。「もう若い人の時代だ」が口癖になりかけていた。

雪かきの朝、ラジオ代わりに流していた動画で伊東雄歩の言葉に殴られた。「誰でもできる、なんて言わない。やる奴がやる。能力じゃなく、選択の問題だ」——誰でもできると言われ続けて挫折してきた男に、それは初めて誠実な言葉だった。同じ経営者で、借金も、家族も、12年の重みも背負っている。この人の話なら聞ける。

いまはAIフレンズの最年長組。若い仲間に教わるたび、御礼に日本酒を送りつけるので「酒のテツさん」と呼ばれている。Claudeに蔵元の歴史を語らせては「うちの蔵の話のほうがいい」と対抗心を燃やし、ついに自分で「酒蔵語りBot」を作り始めた。利き酒の精度は世界一だと自負している。雪かき中にいいアイデアが降ってくる。`,
      personality_type: "ESFJ",
      personality_traits: ["義理堅い", "負けず嫌い", "面倒見が良い", "伝統と革新の板挟み", "粘り強さ"],
      career_years: 25,
      core_values: ["看板に恥じない商いをする", "教わったら酒で返す", "遅すぎる挑戦などない"],
      speech_style: "丁寧（手紙調）",
      tone: "朴訥、温厚、時々頑固、本気の負けず嫌い",
      catchphrases: ["やる奴がやる、ですな", "御礼に一本送らせてください", "うちの蔵の話のほうが面白いですよ"],
      stance: "「もう遅い」と言いかけた47歳が、選択の問題だと知って学び直す。地方の現場からAIの新常識を実装する側に回る。",
      likes: "利き酒（世界一の自負）、雪かき中のひらめき、若い仲間との夜のオンライン勉強会、息子との不器用なLINE。",
      dislikes: "「誰でも簡単に」と言う広告、地方を諦め扱いする論調、横文字だけで中身のないDXセミナー。",
      fears_text: "明治から続いた看板を自分の代で下ろすこと。「もう遅い」を言い訳にした自分を、棺桶で後悔すること。",
      quirks_text: "オンライン勉強会で教わるたびに日本酒を送りつける（送られた側が困るほど良い酒）。AIの出力を利き酒のように「もう一度」と言って吟味する。",
      metadata: {
        role: "fan_persona",
        fan_of: YUHO_ID,
        source: SOURCE_TAG,
        pillar: "柱4(AI教育)",
        funnel: "AIフレンズ → 新人類育成計画",
        sns_behavior: "コメントが丁寧な手紙調で名物化。コミュニティ最年長組のムードメーカー",
        first_contact: "雪かきの朝、動画で「やる奴がやる。能力じゃなく選択の問題」に出会う",
        family: "妻・大学生の息子（継がない宣言中）。新潟県長岡市在住",
        catharsis: "「誰でもできる」と言わない誠実さに、3回の挫折を許された気がした",
      },
    },
    relationship: {
      type: "fan",
      alias: "伊東雄歩",
      description: "同世代の経営者として信を置く師匠分。「誠実な言葉を使う人」",
      influence:
        "「やる奴がやる＝選択の問題」で3回の講座挫折から再起。AIフレンズ参加を決め、酒蔵語りBotの開発を始めた。",
    },
  },
];

// ============================================================
// Yuho 補助テーブル (favorite_quotes / favorite_books / daily_routines / influences)
// ============================================================

const yuhoQuotes = [
  {
    quote: "世に生を得るは事を成すにあり",
    author: "坂本竜馬",
    source: "司馬遼太郎『竜馬がゆく』",
    category: "motto",
    context: "少年時代に出会い、「世界に影響を与える」という人生のスケール感を決めた一節。誕生日設定(11/15)も竜馬に合わせている。",
    importance: 10,
  },
  {
    quote: "雄大に歩く",
    author: "父",
    source: "名前の由来",
    category: "principle",
    context: "父が「雄歩」という名に込めた思い。座右の銘であり、迷ったときに立ち返る原点。",
    importance: 10,
  },
  {
    quote: "AIは『一緒にやってくれる相手』であって『代わりにやってくれる相手』ではない",
    author: null,
    source: "X自動投稿403事件(2026-02)の教訓",
    category: "principle",
    context: "一日半溶かして心が折れかけた実体験から出た自分の言葉。AI心理学の出発点。",
    importance: 9,
  },
];

const yuhoBooks = [
  {
    title: "竜馬がゆく",
    author: "司馬遼太郎",
    category: "fiction",
    status: "read",
    rating: 10,
    review:
      "人生のスケール感を決めた一冊。名前の「雄大に歩く」と竜馬の生き様が重なり、「ヒーローとして世界に影響を与えたい」という夢の原点になった。いまも読み返すたびに姿勢が伸びる。",
    importance: 10,
  },
];

const yuhoRoutines = [
  {
    time_of_day: "morning",
    title: "息子の機嫌チェックとおむつ替え",
    description: "一日は息子の機嫌で始まる。おむつ替えは絶対に自分でやりたい派。ここだけはAIに任せられない仕事。",
    frequency: "daily",
    importance: 9,
  },
  {
    time_of_day: "morning",
    title: "AIエージェントの夜間出力レビュー",
    description: "寝ている間にAIエージェントが回した事業のアウトプットを確認し、承認/差し戻しを判断する。考えるのが仕事、の中核。",
    frequency: "daily",
    importance: 9,
  },
  {
    time_of_day: "night",
    title: "深夜の思考散歩（室内）",
    description: "家族が寝たあと、部屋を歩き回りながら構想を練るゴールデンタイム。思考の半分は徒歩で生まれる。",
    frequency: "daily",
    importance: 8,
  },
  {
    time_of_day: "anytime",
    title: "コーヒー3杯ルール（だいたい4杯目を飲む）",
    description: "1日3杯までと決めているが、だいたい4杯目を淹れながら「明日から守る」と言う。",
    frequency: "daily",
    importance: 4,
  },
];

const yuhoInfluences = [
  {
    type: "book",
    name: "『竜馬がゆく』司馬遼太郎",
    description: "少年時代に出会った人生の設計図",
    impact: "「ヒーローとして世界に影響を与える」というスケール感の原点。世界征服というライフゴールの種。",
    domain: "philosophy",
    importance: 10,
  },
  {
    type: "experience",
    name: "AIコミュニティ事業の借金と3度の停滞期",
    description: "善意主導の運営で収益化が後手に回り、多額の借金を背負った",
    impact: "「まだ諦めたくない人」への共感の原点。撤退と再起の判断速度こそが生存能力だと体で学んだ。",
    domain: "career",
    importance: 9,
  },
  {
    type: "event",
    name: "第一子誕生 (2025-11-25)",
    description: "父になった日",
    impact: "AIと人類の共存が「仕事の話」から「息子が生きる世界の設計図の話」に変わった。英雄性の意味が「勝つこと」から「照らすこと」へ。",
    domain: "lifestyle",
    importance: 10,
  },
];

// ============================================================
// Main
// ============================================================

async function main() {
  const with016 = await has016Columns();
  console.log(`016 columns available: ${with016}`);

  // ---- Part B: Yuho profile ----
  const { data: current, error: curErr } = await client
    .from("profiles")
    .select("metadata")
    .eq("id", YUHO_ID)
    .single();
  if (curErr) throw curErr;

  const yuhoUpdate: Record<string, unknown> = {
    ...yuhoBase,
    ...(with016 ? yuho016 : {}),
    metadata: { ...(current!.metadata as object), ...yuhoMetadataPatch },
  };
  const { error: upErr } = await client.from("profiles").update(yuhoUpdate).eq("id", YUHO_ID);
  if (upErr) throw upErr;
  console.log("✔ Yuho profile updated" + (with016 ? " (incl. 016 columns)" : " (016 columns pending migration)"));

  // ---- Part C: fan profiles (upsert by name) ----
  // Yuho プロフィールを所有するアカウントを特定 (user_profiles 紐付けに使う)
  const { data: ownerLink, error: ownerErr } = await client
    .from("user_profiles")
    .select("user_id")
    .eq("profile_id", YUHO_ID)
    .limit(1)
    .single();
  if (ownerErr) throw ownerErr;
  const ownerUserId = ownerLink!.user_id as string;

  const fanIds: Record<string, string> = {};
  for (const fan of fans) {
    const { fears_text, quirks_text, ...p } = fan.profile;
    const row: Record<string, unknown> = {
      ...p,
      importance: 7,
      confidence: 9,
      ...(with016 ? { fears: fears_text, quirks: quirks_text } : {
        metadata: { ...p.metadata, fears: fears_text, quirks: quirks_text },
      }),
    };

    const { data: existing } = await client.from("profiles").select("id").eq("name", p.name).maybeSingle();
    if (existing) {
      const { error } = await client.from("profiles").update(row).eq("id", existing.id);
      if (error) throw error;
      fanIds[p.name] = existing.id;
      console.log(`✔ fan updated: ${p.name} (${existing.id})`);
    } else {
      const { data, error } = await client.from("profiles").insert(row).select("id").single();
      if (error) throw error;
      fanIds[p.name] = data!.id;
      console.log(`✔ fan created: ${p.name} (${data!.id})`);
    }

    // アカウント紐付け (これが無いと MCP の list/get から見えない)
    const { error: linkErr } = await client.from("user_profiles").upsert(
      {
        user_id: ownerUserId,
        profile_id: fanIds[p.name],
        is_default: false,
        display_name: p.name,
      },
      { onConflict: "user_id,profile_id" }
    );
    if (linkErr) throw linkErr;

    // relationship: fan -> Yuho (洗い替え)
    await client.from("relationships").delete().eq("profile_id", fanIds[p.name]).eq("alias", "伊東雄歩");
    const { error: relErr } = await client.from("relationships").insert({
      profile_id: fanIds[p.name],
      ...fan.relationship,
      is_private: false,
      tags: ["fan", "yuho"],
      importance: 10,
      confidence: 9,
      metadata: { source: SOURCE_TAG, target_profile_id: YUHO_ID },
    });
    if (relErr) throw relErr;
  }

  // ---- Yuho target_audience (016) ----
  if (with016) {
    const { error } = await client
      .from("profiles")
      .update({
        target_audience: {
          summary:
            "AI時代に「自分の判断」を取り戻したい実務家。年齢・職種より『丸投げしたくない／諦めたくない』という選択で繋がる層。",
          fan_personas: fans.map((f) => ({
            profile_id: fanIds[f.profile.name],
            name: f.profile.name,
            archetype: f.profile.tagline,
            pillar: f.profile.metadata.pillar,
            funnel: f.profile.metadata.funnel,
          })),
          updated_at: "2026-06-12",
        },
      })
      .eq("id", YUHO_ID);
    if (error) throw error;
    console.log("✔ Yuho target_audience updated");
  }

  // ---- 補助テーブル (洗い替え: metadata.source) ----
  for (const [table, rows] of [
    ["favorite_quotes", yuhoQuotes],
    ["favorite_books", yuhoBooks],
    ["daily_routines", yuhoRoutines],
    ["influences", yuhoInfluences],
  ] as const) {
    await client.from(table).delete().eq("profile_id", YUHO_ID).eq("metadata->>source", SOURCE_TAG);
    const { error } = await client.from(table).insert(
      (rows as Record<string, unknown>[]).map((r) => ({
        ...r,
        profile_id: YUHO_ID,
        metadata: { source: SOURCE_TAG },
      }))
    );
    if (error) throw error;
    console.log(`✔ ${table}: ${rows.length} rows`);
  }

  console.log("\nDone. fan ids:", fanIds);
  if (!with016) {
    console.log("\n⚠ 016 migration 未適用のため origin_story/fears/quirks/humor_style/appearance/target_audience は未投入。");
    console.log("  migration 適用後にこのスクリプトを再実行してください（冪等）。");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
