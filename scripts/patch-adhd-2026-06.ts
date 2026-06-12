/**
 * 『ADHDは、AIで化ける』書籍化決定 (2026-06) に伴うプロフィール群の更新
 * - 伊東雄歩: ADHDグレーゾーン開示を bio/origin_story/fears/stance 等に編み込み、書籍をproductsに追加
 * - episodes: 「社員を失って、AIと向き合って覚醒した2026年」(turning_point)
 * - life_events: 書籍化決定 (2026-06-12)
 * - ファン3人: 書籍への反応軸を分化 (当事者/優等生解除/懐疑派)
 * Usage: npx tsx scripts/patch-adhd-2026-06.ts （冪等）
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const YUHO_ID = "82c84579-e94d-413f-8dc6-2d5ec5419d98";
const FAN = {
  manabe: "0fad78a1-3ae9-4379-96c1-21b73f7ca2c5",
  hayase: "f6bc9679-a7b5-4a27-ba25-9864e237c06a",
  morohoshi: "2f7b31bb-a5d9-48b8-afcf-dbc520d8202e",
};
const SOURCE_TAG = "adhd-2026-06-12";

const client = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { db: { schema: "personal_db" }, auth: { persistSession: false } }
);

// ============================================================
// 伊東雄歩
// ============================================================

const yuhoBio = `神奈川県横須賀市生まれ。少年時代は虫取り網を担いで裏山を歩き回り、「昆虫博士」と呼ばれていた。興味は次々に移り、ひとつの遊びが3日と続かない子どもでもあった。父が名前に込めたのは「雄大に歩く」。その名の通りに生きようと決めたのは、司馬遼太郎『竜馬がゆく』に出会った日からだ。

東北大学でプログラミングに出会い、SEO独学で「恋愛術」Google検索1位を獲る。作ったものが知らない誰かに届く——あの感覚が原点になった。一方で教室では浮いていた。興味のない授業に座っていられず、好きなことには寝食を忘れた。ソフトバンクでセキュリティ技術主任を務めたのち、2015年に株式会社ウォーカーを創業。億規模のシステムを組み、2000人同時接続の修羅場をくぐった。

順風満帆ではない。AIコミュニティ事業で多額の借金を背負い、停滞期を3度くぐり、SNSの毎日投稿にすら挫折した。「真面目にコツコツ」「完璧に仕上げる」「一人でやり遂げる」——その全部が人並みにできない自分を、長いあいだ欠陥品だと思っていた。後年知る。ADHDグレーゾーン。集中できない・続かない・飽きっぽいは、性格の欠陥ではなく脳の仕様だった。

2026年、社員を失った。会社に残ったのは自分とAIだけだった。そこで恐れるのをやめ、AIと正面から向き合って覚醒する。飽きっぽさは強い知的好奇心に、過集中は資産に、頭の多動は8つのAIを同時に動かす並列処理に——欠陥だと思っていた性質が、AIという増幅器で全部武器に変わった。10日でSaaSを作って売り、SNSが続かないなら続けなくていい仕組み（MirAI-POST）を作った。いまは会社の実務をAIエージェントに任せ、自分は考えることと決めることに集中している。ミライジン——思いついたミライから、作る。

2025年、父になった。守るものができてから、「人類とAIの共存」は仕事の話ではなく、家族の話になった。2026年、『ADHDは、AIで化ける』の出版が決まった。かつての自分と同じように「集中できない自分」を責めている誰かに、"その全部が武器に変わる"と手渡す一冊になる。TAOLIS人機和総研、MiraiPost、miraipage 創始者。`;

const yuhoUpdate = {
  bio: yuhoBio,
  origin_story: `【出自】横須賀の昆虫博士。興味が3日ごとに移る子ども。父が名に込めた「雄大に歩く」と『竜馬がゆく』が、世界に影響を与えるという途方もない夢の種になった。
【登攀】東北大→ソフトバンク→2015年独立。億規模システム、2000人同時接続の修羅場。誰にも負けないと思っていた。
【挫折】AIコミュニティ事業で多額の借金。SNS習慣化に挫折。「コツコツ・完璧・自力」が人並みにできない自分を欠陥品だと思っていた——後年、ADHDグレーゾーンだと知る。さらにAIの登場で12年の優位性が一瞬で崩れた。
【転換】2026年、社員を失い、残った自分とAIで正面から向き合って覚醒。飽きっぽさ=知的好奇心、過集中=資産、多動=並列処理。欠陥だと思っていた性質がAIという増幅器で全部武器に変わった。会社をAIに任せ、考えることと決めることに集中する「ミライジン」になった。
【現在】2025年に父になり、2026年に『ADHDは、AIで化ける』の出版が決まった。英雄になりたいのではない。かつての自分と同じ場所で転んでいる誰かに、増幅器の使い方を手渡す側でいたい。`,
  fears:
    "考えることをやめた自分になること。AIに判断を委ねて楽になりかけた瞬間の、あの誘惑を知っている。息子が大人になる頃の日本が、設計を放棄した国になっていること。そしてもうひとつ——増幅されるのは強みだけではないと、自分が一番知っている。依存・思考停止・刺激中毒。AIはADHDの負の面も増幅する。その境界を見失うこと。",
  stance:
    "AIを脅威や神のような存在として恐れるのではなく、設計し、制度に組み込み、新しい常識として社会に定着させる。AIは常にバイアスを持ち、それを認識し修正できるのは人間だけ。決断と物理的行動は人間の仕事。AIは道具ではなく自己増幅器——化けるとは「強みの増幅×弱みからの解脱×選択の自由」。ADHDグレーゾーン当事者として、「集中できない・続かない・飽きっぽい」がAI時代に武器化する構造を発信する（診断名のレッテルではなく、特性と増幅の話として語る）。日々の発信ではミライジンとして「思いついたミライから、作る」を体現し、思想を語る文脈では「新常識の設計者」ロールを内部的に使う（自称はしない）。",
  thinking_habits:
    "常に長期視点と新常識の側からの合理性を前提に思考し、真実かどうかを最優先で検証する。AIの限界と可能性を同時に観察する。「正解」を出すことよりも「違和感」を言語化することを自分の仕事だと定義している。磨くのは3つ——違和感の言語化、撤退の判断、自己観察。",
  strengths:
    "一晩で全体の構造を組み上げる設計力と、5,000行/日の実装速度。頭の多動を、8つのAIを同時に動かす並列処理に変換できること。そして、折れた回数より立ち上がった回数のほうが1回多いこと。",
  catchphrases: [
    "新人類になるには〜",
    "常識は、もう変わった",
    "行動しなければ意味がない",
    "やる奴がやる",
    "飽きたら次へ、で構わない",
    "全部、武器に変わる",
  ],
};

const yuhoBookProduct = {
  name: "ADHDは、AIで化ける",
  type: "book",
  description:
    "出版決定（2026-06）。「集中できない、続かない、飽きっぽい。その全部が、武器に変わる。」ADHD当事者・グレーゾーンの知識労働者に向け、ADHD3特性（多動・衝動・不注意）がAIで反転・武器化する構造を、8つのAIを同時に操る著者の頭の中とともに全公開する一冊。全15章＋旧常識vs新常識対比表。",
};

const yuhoMetadataPatch = {
  adhd: {
    status: "ADHDグレーゾーン（自認・エビデンス含む。確定診断とは書かない）",
    disclosed: true,
    policy_since: "2026-06-12",
    policy:
      "書籍化決定を機に当事者発信を強化。レッテルではなく『特性×AI増幅』の構造として語る。負の増幅（依存・思考停止・刺激中毒）も必ず併記する",
    book: {
      title: "ADHDは、AIで化ける",
      tagline: "集中できない、続かない、飽きっぽい。その全部が、武器に変わる。",
      decided_at: "2026-06-12",
      target: "30〜45歳の知識労働者・ADHD当事者・グレーゾーン",
      core_formula: "化ける = 強みの増幅 × 弱みからの解脱 × 選択の自由",
      key_concepts: [
        "AIは自己増幅器（道具ではなく身体の延長）",
        "ADHD3特性（多動・衝動・不注意）の反転武器化",
        "4つの増幅軸: アイデア速射砲/速度/過集中/飽きっぽさ(知的好奇心)",
        "AI操縦3レベル: 会話→生産→工場化",
        "磨くべき3能力: 違和感の言語化・撤退の判断・自己観察",
        "捨てるべき3努力: 普通・完璧・自力",
        "ISP-DCサイクル（独自FW）",
        "負の増幅: 依存・思考停止・刺激中毒",
      ],
    },
  },
  adhd_updated: SOURCE_TAG,
};

const yuhoEpisode = {
  profile_id: YUHO_ID,
  title: "社員を失って、AIと向き合って覚醒した2026年",
  type: "turning_point",
  domain: "business",
  situation: "2026年、会社から社員が去り、残ったのは自分とAIだけになった。（詳細な経緯は書籍で開示予定）",
  task: "喪失の中で、会社と自分の働き方を作り直す。",
  action:
    "AIエージェントとの協働に全振りし、実務を任せて自分は考えることと決めることに集中する体制を構築。飽きっぽさ・過集中・多動というADHD的特性を、AIという増幅器に接続した。",
  result:
    "「ADHD的特性×AI増幅」の実体験が確立し、ミライジンとしての現在の働き方と『ADHDは、AIで化ける』の核になった。",
  insights: [
    "AIは道具ではなく自己増幅器。化ける＝強みの増幅×弱みからの解脱×選択の自由",
    "「コツコツ・完璧・自力」を捨てたとき、初めて自分の特性が武器になった",
    "喪失は覚醒の条件ではないが、退路を断つことは条件だった",
  ],
  emotions: ["喪失感", "孤独", "覚悟", "覚醒"],
  mention_tone: "lesson",
  mentionable: true,
  period_start: "2026-01-01",
  tags: ["ADHD", "覚醒", "書籍", "turning-point", "AI増幅器"],
  importance: 10,
  confidence: 7,
  metadata: { source: SOURCE_TAG, origin: "書籍企画『ADHDは、AIで化ける』目次案より。詳細は執筆中に追記" },
};

const yuhoLifeEvent = {
  profile_id: YUHO_ID,
  type: "milestone",
  title: "『ADHDは、AIで化ける』書籍化決定",
  description:
    "2026年6月、書籍企画『ADHDは、AIで化ける』の出版が決定。ADHDグレーゾーン当事者としての発信を強化する転機。",
  impact: "ADHD×AIが発信の主軸のひとつに加わる。学生時代の孤独・トラウマ・2026年の覚醒を開示する初の場になる",
  event_date: "2026-06-12",
  tags: ["book", "adhd", "publishing", "milestone"],
  importance: 9,
  confidence: 10,
  metadata: { source: SOURCE_TAG },
};

// ============================================================
// ファン3人: 書籍への反応軸を分化
// ============================================================

const fanPatches: Array<{
  id: string;
  bioAppend: string;
  metadataPatch: Record<string, unknown>;
}> = [
  {
    // 早瀬みなと: 当事者・本命読者
    id: FAN.hayase,
    bioAppend: `

2026年6月、雄歩の『ADHDは、AIで化ける』書籍化発表を見た。"集中できない、続かない、飽きっぽい"——全部、自分のことだった。7回の三日坊主も、サウナで設計が降ってくる頭も、欠陥ではなく仕様なのかもしれない。グレーゾーンという言葉に初めて自分を重ねて、発売を本命読者のど真ん中で待っている。`,
    metadataPatch: {
      adhd_relation: "当事者寄り（グレーゾーン自認に向き合い始めた本命読者）",
      book_touchpoint: "発表当日に目次を読み、旧常識vs新常識の対比表をスクショ保存。「飽きたら次へ、で構わない」を引用RT",
      adhd_updated: SOURCE_TAG,
    },
  },
  {
    // 真鍋航平: 旧常識の優等生が解除される読者
    id: FAN.manabe,
    bioAppend: `

『ADHDは、AIで化ける』の常識対比表を見て、自分が"旧常識の優等生"だったと気づいた。真面目にコツコツ、完璧主義で仕上げる、一人でやり遂げる——20年それで戦ってきて、それで詰まっていた。いまは「7割で投げて、フィードバックで育てる」を練習中。会議を脱線させてばかりだと思っていた多動な部下の見方も、変わり始めている。`,
    metadataPatch: {
      adhd_relation: "非当事者。旧労働観の優等生が解除される読者枠。部下にADHD傾向の若手がいる管理職視点",
      book_touchpoint: "対比表を会議資料に引用（出典明記）。「捨てるべき3つの努力」の章を心待ちにしている",
      adhd_updated: SOURCE_TAG,
    },
  },
  {
    // 諸星徹三: 懐疑派（健全な摩擦枠）
    id: FAN.morohoshi,
    bioAppend: `

『真面目にコツコツが負け筋になった』という書籍の章立てには、正直カチンと来た。来たが、読みたい。明治から続く店はコツコツで守ってきたし、それは降りない。ただ——「同じ仕事を継続する」は「飽きたら次へ」ではなく「AIに移譲する」でもいいらしい。それなら、わかる気がする。発売したら、反論を3つ用意して読むつもりでいる。`,
    metadataPatch: {
      adhd_relation: "旧常識側からの懐疑的読者。反発と興味が半々（健全な摩擦枠・賛否両論の起点）",
      book_touchpoint: "「コツコツ=負け筋」への反論を準備しながら発売を待つ。継続業務のAI移譲だけは先に実践",
      adhd_updated: SOURCE_TAG,
    },
  },
];

// ============================================================
// Main
// ============================================================

async function main() {
  // Yuho profile
  const { data: yuho, error: yErr } = await client
    .from("profiles")
    .select("metadata, products")
    .eq("id", YUHO_ID)
    .single();
  if (yErr) throw yErr;

  const products = (yuho!.products as Array<Record<string, unknown>>) ?? [];
  const hasBook = products.some((p) => p.name === yuhoBookProduct.name);
  const { error: upErr } = await client
    .from("profiles")
    .update({
      ...yuhoUpdate,
      products: hasBook ? products : [...products, yuhoBookProduct],
      metadata: { ...(yuho!.metadata as object), ...yuhoMetadataPatch },
    })
    .eq("id", YUHO_ID);
  if (upErr) throw upErr;
  console.log("✔ Yuho profile updated (ADHD axis)");

  // episode & life_event (洗い替え)
  await client.from("episodes").delete().eq("profile_id", YUHO_ID).eq("metadata->>source", SOURCE_TAG);
  const { error: epErr } = await client.from("episodes").insert(yuhoEpisode);
  if (epErr) throw epErr;
  console.log("✔ episode: 社員喪失→覚醒2026");

  await client.from("life_events").delete().eq("profile_id", YUHO_ID).eq("metadata->>source", SOURCE_TAG);
  const { error: leErr } = await client.from("life_events").insert(yuhoLifeEvent);
  if (leErr) throw leErr;
  console.log("✔ life_event: 書籍化決定 2026-06-12");

  // fans
  for (const patch of fanPatches) {
    const { data: fan, error: fErr } = await client
      .from("profiles")
      .select("name, bio, metadata")
      .eq("id", patch.id)
      .single();
    if (fErr) throw fErr;
    const meta = fan!.metadata as Record<string, unknown>;
    const alreadyPatched = meta.adhd_updated === SOURCE_TAG;
    const bio = alreadyPatched ? (fan!.bio as string) : `${fan!.bio}${patch.bioAppend}`;
    const { error } = await client
      .from("profiles")
      .update({ bio, metadata: { ...meta, ...patch.metadataPatch } })
      .eq("id", patch.id);
    if (error) throw error;
    console.log(`✔ fan updated: ${fan!.name}${alreadyPatched ? " (bio既適用、metadataのみ)" : ""}`);
  }

  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
