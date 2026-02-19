import type { DetailLevel } from "./scoring.js";

type Entry = Record<string, unknown>;

/** Render a single entry at the given detail level */
export function renderEntry(
  entry: Entry,
  entityType: string,
  level: DetailLevel,
  score: number
): string {
  const renderer = RENDERERS[entityType];
  if (!renderer) return renderGeneric(entry, level);
  return renderer(entry, level, score);
}

/** Format a period range string */
function period(entry: Entry): string {
  const start = entry.period_start as string | undefined;
  const end = entry.period_end as string | undefined;
  if (start && end) return `(${start} - ${end})`;
  if (start) return `(${start} - present)`;
  return "";
}

/** Confidence indicator */
function confTag(entry: Entry): string {
  const c = (entry.confidence as number) || 8;
  if (c >= 8) return "";
  if (c >= 5) return " [conf: medium]";
  return " [conf: low]";
}

/** Importance badge */
function impBadge(entry: Entry): string {
  const i = (entry.importance as number) || 5;
  return `${i}/10`;
}

type Renderer = (entry: Entry, level: DetailLevel, score: number) => string;

const RENDERERS: Record<string, Renderer> = {
  career_entries: (e, level) => {
    const title = `${e.role}${e.organization ? ` @ ${e.organization}` : ""}`;
    if (level === "full") {
      const lines = [`### ${title} ${period(e)}`];
      if (e.summary) lines.push(e.summary as string);
      if (e.domain) lines.push(`Domain: ${e.domain}`);
      const insights = e.insights as string[] | undefined;
      if (insights?.length) lines.push(`Insights: ${insights.join("; ")}`);
      if (e.mention_tone) lines.push(`Tone: ${e.mention_tone}`);
      return lines.join("\n");
    }
    if (level === "summary") {
      return `- **${title}** ${period(e)}${e.summary ? ` -- ${e.summary}` : ""}${confTag(e)}`;
    }
    return `${title} ${period(e)}`.trim();
  },

  skills: (e, level) => {
    const name = e.name as string;
    const prof = e.proficiency ? `${e.proficiency}/10` : "";
    const years = e.years_experience ? `${e.years_experience}y` : "";
    if (level === "full") {
      const parts = [`- **${name}** (${[prof, years].filter(Boolean).join(", ")})`];
      if (e.evidence) parts.push(`  Evidence: ${e.evidence}`);
      parts.push(`  ${confTag(e)}`.trimEnd());
      return parts.filter((p) => p.trim()).join("\n");
    }
    if (level === "summary") {
      return `- **${name}** (${[prof, years].filter(Boolean).join(", ")})${confTag(e)}`;
    }
    return name;
  },

  projects: (e, level) => {
    const name = e.name as string;
    if (level === "full") {
      const lines = [`### ${name} ${period(e)}`];
      if (e.description) lines.push(e.description as string);
      if (e.role) lines.push(`Role: ${e.role}`);
      const techs = e.technologies as string[] | undefined;
      if (techs?.length) lines.push(`Tech: ${techs.join(", ")}`);
      const outcomes = e.outcomes as string[] | undefined;
      if (outcomes?.length) lines.push(`Outcomes: ${outcomes.join("; ")}`);
      return lines.join("\n");
    }
    if (level === "summary") {
      return `- **${name}** ${period(e)}${e.description ? ` -- ${truncate(e.description as string, 80)}` : ""}`;
    }
    return name;
  },

  achievements: (e, level) => {
    const name = e.name as string;
    const year = e.year ? `(${e.year})` : "";
    if (level === "full") {
      const lines = [`### ${name} ${year}`];
      if (e.type) lines.push(`Type: ${e.type}`);
      if (e.detail) lines.push(e.detail as string);
      if (e.issuer) lines.push(`Issuer: ${e.issuer}`);
      return lines.join("\n");
    }
    if (level === "summary") {
      return `- **${name}** ${year}${e.type ? ` (${e.type})` : ""}${confTag(e)}`;
    }
    return `${name} ${year}`.trim();
  },

  episodes: (e, level) => {
    const title = e.title as string;
    if (level === "full") {
      const lines = [`### ${title} ${period(e)}`];
      if (e.type) lines.push(`Type: ${e.type}`);
      if (e.situation) lines.push(`**S**: ${e.situation}`);
      if (e.task) lines.push(`**T**: ${e.task}`);
      if (e.action) lines.push(`**A**: ${e.action}`);
      if (e.result) lines.push(`**R**: ${e.result}`);
      const insights = e.insights as string[] | undefined;
      if (insights?.length) lines.push(`Insights: ${insights.join("; ")}`);
      return lines.join("\n");
    }
    if (level === "summary") {
      return `- **${title}** ${period(e)}${e.type ? ` (${e.type})` : ""}${confTag(e)}`;
    }
    return title;
  },

  education: (e, level) => {
    const inst = (e.institution as string) || (e.type as string) || "Education";
    const field = e.field as string | undefined;
    if (level === "full") {
      const lines = [`### ${inst} ${period(e)}`];
      if (field) lines.push(`Field: ${field}`);
      if (e.degree) lines.push(`Degree: ${e.degree}`);
      if (e.description) lines.push(e.description as string);
      return lines.join("\n");
    }
    if (level === "summary") {
      return `- **${inst}**${field ? ` - ${field}` : ""} ${period(e)}`;
    }
    return `${inst}${field ? ` (${field})` : ""}`;
  },

  hobbies: (e, level) => {
    const name = e.name as string;
    if (level === "full") {
      const lines = [`### ${name}`];
      if (e.passion_level) lines.push(`Passion: ${e.passion_level}/10`);
      if (e.description) lines.push(e.description as string);
      const skills = e.related_skills as string[] | undefined;
      if (skills?.length) lines.push(`Related skills: ${skills.join(", ")}`);
      return lines.join("\n");
    }
    if (level === "summary") {
      return `- **${name}**${e.passion_level ? ` (passion: ${e.passion_level}/10)` : ""}`;
    }
    return name;
  },

  values_philosophy: (e, level) => {
    const title = e.title as string;
    if (level === "full") {
      const lines = [`### ${title}`];
      if (e.type) lines.push(`Type: ${e.type}`);
      if (e.description) lines.push(e.description as string);
      if (e.origin) lines.push(`Origin: ${e.origin}`);
      return lines.join("\n");
    }
    if (level === "summary") {
      return `- **${title}**${e.type ? ` (${e.type})` : ""}${e.description ? ` -- ${truncate(e.description as string, 60)}` : ""}`;
    }
    return title;
  },

  health_entries: (e, level) => {
    const title = e.title as string;
    if (level === "full") {
      const lines = [`### ${title}`];
      if (e.type) lines.push(`Type: ${e.type}`);
      if (e.description) lines.push(e.description as string);
      return lines.join("\n");
    }
    if (level === "summary") {
      return `- **${title}**${e.type ? ` (${e.type})` : ""}`;
    }
    return title;
  },

  life_events: (e, level) => {
    const title = e.title as string;
    const date = e.event_date ? ` (${e.event_date})` : "";
    if (level === "full") {
      const lines = [`### ${title}${date}`];
      if (e.type) lines.push(`Type: ${e.type}`);
      if (e.description) lines.push(e.description as string);
      if (e.impact) lines.push(`Impact: ${e.impact}`);
      return lines.join("\n");
    }
    if (level === "summary") {
      return `- **${title}**${date}${e.impact ? ` -- ${truncate(e.impact as string, 60)}` : ""}`;
    }
    return `${title}${date}`;
  },

  relationships: (e, level) => {
    const alias = e.alias as string;
    if (level === "full") {
      const lines = [`### ${alias}`];
      if (e.type) lines.push(`Type: ${e.type}`);
      if (e.description) lines.push(e.description as string);
      if (e.influence) lines.push(`Influence: ${e.influence}`);
      return lines.join("\n");
    }
    if (level === "summary") {
      return `- **${alias}**${e.type ? ` (${e.type})` : ""}${confTag(e)}`;
    }
    return alias;
  },

  goals: (e, level) => {
    const title = e.title as string;
    const status = e.status as string | undefined;
    const progress = e.progress as number | undefined;
    if (level === "full") {
      const lines = [`### ${title}`];
      if (e.type) lines.push(`Type: ${e.type}`);
      if (status) lines.push(`Status: ${status}`);
      if (progress !== undefined) lines.push(`Progress: ${progress}%`);
      if (e.description) lines.push(e.description as string);
      if (e.target_date) lines.push(`Target: ${e.target_date}`);
      return lines.join("\n");
    }
    if (level === "summary") {
      return `- **${title}**${status ? ` [${status}]` : ""}${progress !== undefined ? ` ${progress}%` : ""}`;
    }
    return title;
  },

  favorite_books: (e, level) => {
    const title = e.title as string;
    const author = e.author as string | undefined;
    if (level === "full") {
      const lines = [`### ${title}${author ? ` by ${author}` : ""}`];
      if (e.category) lines.push(`Category: ${e.category}`);
      if (e.rating) lines.push(`Rating: ${e.rating}/10`);
      if (e.review) lines.push(e.review as string);
      return lines.join("\n");
    }
    if (level === "summary") {
      return `- **${title}**${author ? ` by ${author}` : ""}${e.rating ? ` (${e.rating}/10)` : ""}`;
    }
    return `${title}${author ? ` (${author})` : ""}`;
  },

  favorite_quotes: (e, level) => {
    const quote = e.quote as string;
    const author = e.author as string | undefined;
    if (level === "full") {
      const lines = [`> "${quote}"${author ? ` — ${author}` : ""}`];
      if (e.source) lines.push(`Source: ${e.source}`);
      if (e.context) lines.push(e.context as string);
      return lines.join("\n");
    }
    if (level === "summary") {
      return `- "${truncate(quote, 60)}"${author ? ` — ${author}` : ""}`;
    }
    return `"${truncate(quote, 40)}"`;
  },

  influences: (e, level) => {
    const name = e.name as string;
    if (level === "full") {
      const lines = [`### ${name}`];
      if (e.type) lines.push(`Type: ${e.type}`);
      if (e.description) lines.push(e.description as string);
      if (e.impact) lines.push(`Impact: ${e.impact}`);
      if (e.domain) lines.push(`Domain: ${e.domain}`);
      return lines.join("\n");
    }
    if (level === "summary") {
      return `- **${name}**${e.type ? ` (${e.type})` : ""}${e.impact ? ` -- ${truncate(e.impact as string, 60)}` : ""}`;
    }
    return name;
  },

  daily_routines: (e, level) => {
    const title = e.title as string;
    const tod = e.time_of_day as string | undefined;
    if (level === "full") {
      const lines = [`### ${title}`];
      if (tod) lines.push(`Time: ${tod}`);
      if (e.frequency) lines.push(`Frequency: ${e.frequency}`);
      if (e.duration_minutes) lines.push(`Duration: ${e.duration_minutes}min`);
      if (e.description) lines.push(e.description as string);
      return lines.join("\n");
    }
    if (level === "summary") {
      return `- **${title}**${tod ? ` (${tod})` : ""}${e.frequency ? ` [${e.frequency}]` : ""}`;
    }
    return title;
  },

  favorite_tools: (e, level) => {
    const name = e.name as string;
    if (level === "full") {
      const lines = [`### ${name}`];
      if (e.category) lines.push(`Category: ${e.category}`);
      if (e.description) lines.push(e.description as string);
      if (e.why_favorite) lines.push(`Why: ${e.why_favorite}`);
      if (e.proficiency) lines.push(`Proficiency: ${e.proficiency}`);
      return lines.join("\n");
    }
    if (level === "summary") {
      return `- **${name}**${e.category ? ` (${e.category})` : ""}`;
    }
    return name;
  },

  faq: (e, level) => {
    const q = e.question as string;
    if (level === "full") {
      const lines = [`**Q: ${q}**`, `A: ${e.answer}`];
      return lines.join("\n");
    }
    if (level === "summary") {
      return `- **Q**: ${truncate(q, 60)}`;
    }
    return truncate(q, 40);
  },

  custom_entries: (e, level) => {
    const title = e.title as string;
    if (level === "full") {
      const lines = [`### ${title}`];
      if (e.content) lines.push(JSON.stringify(e.content, null, 2));
      return lines.join("\n");
    }
    if (level === "summary") {
      return `- **${title}**`;
    }
    return title;
  },
};

function renderGeneric(entry: Entry, level: DetailLevel): string {
  const title =
    (entry.title as string) ||
    (entry.name as string) ||
    (entry.role as string) ||
    "Untitled";
  if (level === "full") {
    const lines = [`### ${title}`];
    if (entry.description) lines.push(entry.description as string);
    return lines.join("\n");
  }
  if (level === "summary") {
    return `- **${title}**`;
  }
  return title;
}

function truncate(s: string, maxLen: number): string {
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen - 3) + "...";
}

/** Human-readable labels for entity types */
export const ENTITY_LABELS: Record<string, string> = {
  career_entries: "Career",
  skills: "Skills",
  projects: "Projects",
  achievements: "Achievements",
  episodes: "Episodes",
  education: "Education",
  hobbies: "Hobbies",
  values_philosophy: "Values & Philosophy",
  health_entries: "Health",
  life_events: "Life Events",
  relationships: "Relationships",
  goals: "Goals",
  favorite_books: "Books",
  favorite_quotes: "Quotes",
  influences: "Influences",
  daily_routines: "Daily Routines",
  favorite_tools: "Tools",
  faq: "FAQ",
  custom_entries: "Custom",
};
