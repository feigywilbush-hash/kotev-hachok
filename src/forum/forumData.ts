/*
 * Kids' forum data. There is no server yet, so the sample threads live here and whatever a child
 * writes (questions, answers, "עזר לי") is kept in this browser's localStorage only.
 * When a backend is added, swap loadThreads/saveUserPosts for API calls; the shapes stay the same.
 */

export const FORUM_HASH = "#forum";
export const isForumHash = (hash: string) => hash === FORUM_HASH || hash.startsWith(`${FORUM_HASH}/`);

export type TopicId = "space" | "join" | "privacy" | "hierarchy" | "friends";

export type Topic = {
  id: TopicId;
  label: string;
  /** The law this topic belongs to, when there is one. */
  law?: number;
  /** Tailwind classes for the topic chip. */
  chip: string;
};

export const TOPICS: Topic[] = [
  { id: "privacy", label: "פרטיות", law: 1, chip: "bg-alert/10 text-alert" },
  { id: "hierarchy", label: "למי מקשיבים", law: 2, chip: "bg-plate/60 text-foreground" },
  { id: "join", label: "הצטרפות לקבוצה", law: 3, chip: "bg-lime/70 text-foreground" },
  { id: "space", label: "שמירת מרחק", law: 4, chip: "bg-brand-sun/70 text-foreground" },
  { id: "friends", label: "חברים", chip: "bg-primary/15 text-primary" },
];

export const topicById = (id: TopicId) => TOPICS.find((t) => t.id === id)!;

export type Author = {
  name: string;
  /** "כיתה ג'" etc. Empty for the site admin. */
  grade?: string;
  /** The site admin ("כותב החוק") gets a badge and a highlighted card. */
  admin?: boolean;
};

export const ADMIN: Author = { name: "כותב החוק", admin: true };

export type Reply = {
  id: string;
  author: Author;
  text: string;
  /** ms since epoch */
  at: number;
  helpful: number;
};

export type Thread = {
  id: string;
  topic: TopicId;
  title: string;
  text: string;
  author: Author;
  at: number;
  replies: Reply[];
};

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

/** Sample threads, dated relative to now so they always look fresh. */
function sampleThreads(now: number): Thread[] {
  return [
    {
      id: "join-football",
      topic: "join",
      title: "איך מצטרפים למשחק כדורגל באמצע ההפסקה?",
      text: "כל ההפסקה אני עומד ליד המגרש ורוצה לשחק, אבל אני מתבייש לשאול. מה אומרים?",
      author: { name: "מוישי", grade: "כיתה ב'" },
      at: now - 1 * DAY,
      replies: [
        {
          id: "r1",
          author: { name: "שמעון", grade: "כיתה ה'" },
          text: "מחכים שהכדור יוצא מהמגרש או שיש גול, ואז שואלים את מי שמחלק את הקבוצות \"אפשר להצטרף?\"",
          at: now - 22 * HOUR,
          helpful: 8,
        },
        {
          id: "r2",
          author: ADMIN,
          text: "בדיוק כמו רכב שמצטרף לכביש מהיר: קודם מסתכלים ומבינים מה קורה, מחכים לרווח, ורק אז נכנסים. אל תתבייש, רוב הילדים שמחים שעוד מישהו בא לשחק ⚽",
          at: now - 20 * HOUR,
          helpful: 9,
        },
        {
          id: "r3",
          author: { name: "דוד", grade: "כיתה ב'" },
          text: "אני גם מתבייש! אולי מחר נשאל ביחד?",
          at: now - 18 * HOUR,
          helpful: 4,
        },
      ],
    },
    {
      id: "brother-room",
      topic: "privacy",
      title: "אח שלי הקטן נכנס לחדר שלי בלי לדפוק",
      text: "הוא בן 4 ולוקח לי דברים מהשולחן. אני לא רוצה לצעוק עליו, אבל זה החדר שלי.",
      author: { name: "שמוליק", grade: "כיתה ד'" },
      at: now - 3 * DAY,
      replies: [
        {
          id: "r1",
          author: { name: "אליהו", grade: "כיתה ד'" },
          text: "עשיתי שלט \"אין כניסה\" מהדף להדפסה של חוק 1 ותליתי על הדלת. אח שלי מאוד אהב אותו וזה עזר!",
          at: now - 2 * DAY,
          helpful: 7,
        },
        {
          id: "r2",
          author: { name: "בנימין", grade: "כיתה ג'" },
          text: "תלמד אותו לדפוק בדלת כמו משחק. ככה הוא יתלהב לדפוק 😄",
          at: now - 2 * DAY + 3 * HOUR,
          helpful: 5,
        },
      ],
    },
    {
      id: "pool-guard",
      topic: "hierarchy",
      title: "למה צריך להקשיב למציל אם אבא כבר הרשה?",
      text: "אבא אמר שמותר לי לקפוץ למים, אבל המציל שרק לי ואמר שאסור. אז למי צריך להקשיב?",
      author: { name: "אהרון", grade: "כיתה ה'" },
      at: now - 5 * DAY,
      replies: [
        {
          id: "r1",
          author: ADMIN,
          text: "יופי של שאלה! בכביש, כשיש שוטר בצומת, מקשיבים לו גם אם הרמזור ירוק, כי הוא אחראי על המקום הזה עכשיו. בבריכה המציל הוא האחראי, וגם אבא שלך היה רוצה שתקשיב לו. אחר כך אפשר לספר לאבא מה קרה 💙",
          at: now - 5 * DAY + 2 * HOUR,
          helpful: 14,
        },
      ],
    },
    {
      id: "sorry-friend",
      topic: "friends",
      title: "איך מבקשים סליחה מחבר אחרי ריב?",
      text: "רבתי עם החבר הכי טוב שלי על משחק ועכשיו הוא לא מדבר איתי. אני רוצה להשלים אבל לא יודע איך להתחיל.",
      author: { name: "צבי", grade: "כיתה ג'" },
      at: now - 35 * MIN,
      replies: [],
    },
  ];
}

const STORAGE_KEY = "kotev-forum-v1";

type Stored = {
  /** Threads the child opened. */
  threads: Thread[];
  /** Replies the child added to sample threads, by thread id. */
  replies: Record<string, Reply[]>;
  /** Reply keys ("threadId/replyId") the child marked as helpful. */
  helpful: string[];
};

const empty = (): Stored => ({ threads: [], replies: {}, helpful: [] });

export function loadStored(): Stored {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty();
    return { ...empty(), ...(JSON.parse(raw) as Partial<Stored>) };
  } catch {
    return empty();
  }
}

export function saveStored(stored: Stored) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Private mode or storage blocked: the forum still works until the page is closed.
  }
}

/** Sample threads merged with what this child wrote, most recent activity first. */
export function buildThreads(stored: Stored, now = Date.now()): Thread[] {
  const all = [...stored.threads, ...sampleThreads(now)].map((t) => ({
    ...t,
    replies: [...t.replies, ...(stored.replies[t.id] ?? [])],
  }));
  return all.sort((a, b) => lastActivity(b) - lastActivity(a));
}

export const lastActivity = (t: Thread) => Math.max(t.at, ...t.replies.map((r) => r.at));

export type { Stored };

/** "לפני 5 דקות", "אתמול"... */
export function timeAgo(at: number, now = Date.now()) {
  const diff = Math.max(0, now - at);
  if (diff < MIN) return "עכשיו";
  const mins = Math.floor(diff / MIN);
  if (mins < 60) return mins === 1 ? "לפני דקה" : `לפני ${mins} דקות`;
  const hours = Math.floor(diff / HOUR);
  if (hours < 24) return hours === 1 ? "לפני שעה" : hours === 2 ? "לפני שעתיים" : `לפני ${hours} שעות`;
  const days = Math.floor(diff / DAY);
  if (days === 1) return "אתמול";
  if (days === 2) return "לפני יומיים";
  if (days < 7) return `לפני ${days} ימים`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "לפני שבוע" : `לפני ${weeks} שבועות`;
}

export { personalInfoWarning } from "./personalInfo";
