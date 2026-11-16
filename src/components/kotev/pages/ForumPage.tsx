import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Lock, MessageCircle, Plus, Search, ShieldCheck, Smile, ThumbsUp, X } from "lucide-react";

import { burstConfetti } from "@/lib/confetti";
import { cn } from "@/lib/utils";
import {
  FORUM_HASH,
  TOPICS,
  buildThreads,
  lastActivity,
  loadStored,
  personalInfoWarning,
  saveStored,
  timeAgo,
  topicById,
  type Author,
  type Reply,
  type Stored,
  type Thread,
  type TopicId,
} from "@/forum/forumData";
import { playWin } from "../games/driveSounds";
import { ArrowLeftIcon, KotevLogo } from "../icons";
import { softCard, softShadow } from "../steps/StepParts";

/*
 * "פורום לילדים": kids ask questions about social situations, other kids answer, and כותב החוק
 * (the site admin) answers some of them with a badge and a highlighted card.
 * Addresses: #forum is the list, #forum/<thread id> opens a thread.
 * There's no server yet: sample threads come from forumData, and what a child writes is kept in
 * this browser only (see forumData).
 * Sizes are px, in a centred column so lines stay readable on wide screens.
 */

const threadIdFromHash = () => {
  const m = window.location.hash.match(/^#forum\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
};
const threadHash = (id: string) => `${FORUM_HASH}/${encodeURIComponent(id)}`;

/** The title band shown in the top strip of the layout. */
export function ForumBanner() {
  // Same sizes and spacing as a law's title ("חוק מספר 1" over its name, see LawTitle), in vw like the banner.
  return (
    <header className="flex h-full flex-col justify-center text-right motion-safe:animate-fade-up">
      <p className="font-hand text-[30px] leading-normal md:text-[44px] lg:text-[3.9vw]">שואלים, עונים ולומדים ביחד</p>
      <h1 className="-mt-3.5 py-[0.2em] text-[48px] font-bold leading-[1.1] text-primary md:-mt-6 md:text-[64px] lg:-mt-[3.3vw] lg:py-[0.15em] lg:text-[5.208vw]">
        פורום לילדים
      </h1>
    </header>
  );
}

/* ---------- small pieces ---------- */

const AVATAR_COLORS = ["bg-brand-sun", "bg-lime", "bg-plate", "bg-primary/25", "bg-progress-track", "bg-lime-soft"];

function Avatar({ author, size = "md" }: { author: Author; size?: "sm" | "md" }) {
  const box = size === "sm" ? "size-9 text-[16px]" : "size-11 text-[20px] md:size-12";
  if (author.admin) {
    return (
      <span className={cn("flex shrink-0 items-center justify-center rounded-full bg-card ring-2 ring-primary", box)}>
        <KotevLogo className="h-[62%] w-auto" />
      </span>
    );
  }
  const hash = [...author.name].reduce((n, c) => n + c.charCodeAt(0), 0);
  return (
    <span
      aria-hidden="true"
      className={cn("flex shrink-0 items-center justify-center rounded-full font-bold text-foreground", AVATAR_COLORS[hash % AVATAR_COLORS.length], box)}
    >
      {author.name[0]}
    </span>
  );
}

function AuthorLine({ author, at, now, me }: { author: Author; at: number; now: number; me?: boolean }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 leading-tight">
      <span className={cn("font-bold", author.admin && "text-primary")}>{author.name}</span>
      {me && <span className="rounded-full bg-lime px-2 py-0.5 text-[13px] leading-5">אני</span>}
      {author.grade && <span className="text-[14px] opacity-70">{author.grade}</span>}
      <span aria-hidden="true" className="opacity-40">·</span>
      <time className="text-[14px] opacity-70" dateTime={new Date(at).toISOString()}>
        {timeAgo(at, now)}
      </time>
    </div>
  );
}

function TopicChip({ id, className }: { id: TopicId; className?: string }) {
  const t = topicById(id);
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-[13px] leading-none md:text-[14px]", t.chip, className)}>
      {t.label}
      {t.law && <span className="opacity-70">· חוק {t.law}</span>}
    </span>
  );
}

const yellowPill =
  "group inline-flex shrink-0 items-center gap-3 whitespace-nowrap rounded-full bg-brand-sun p-2 ps-5 text-[18px] transition-[filter,transform] duration-200 hover:brightness-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100 disabled:active:scale-100";

function PillIcon({ children }: { children: ReactNode }) {
  return <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card text-primary">{children}</span>;
}

/* ---------- forum rules (side card) ---------- */

const RULES = [
  { icon: Smile, text: "מדברים יפה, גם כשלא מסכימים." },
  { icon: Lock, text: "לא כותבים טלפון, מייל, כתובת או שם משפחה." },
  { icon: ThumbsUp, text: "תשובה שעזרה לך? לוחצים \"עזר\u00a0לי\"." },
  { icon: ShieldCheck, text: "כותב החוק קורא הכל ועונה מדי פעם." },
];

function RulesCard({ className }: { className?: string }) {
  return (
    <aside className={cn("rounded-[32px] bg-surface p-6 md:p-8", className)} aria-label="כללי הפורום">
      <p className="text-[26px] font-bold leading-tight md:text-[28px]">כללי הפורום</p>
      <ul className="mt-6 flex flex-col gap-5">
        {RULES.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-start gap-4 text-[18px] leading-snug">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-card text-primary">
              <Icon className="size-6" />
            </span>
            <span className="pt-2">{text}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/* ---------- composer (new question / reply) ---------- */

function Composer({
  kind,
  onSend,
  onCancel,
  autoFocus,
}: {
  kind: "question" | "reply";
  onSend: (data: { topic?: TopicId; title?: string; text: string }) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}) {
  const [topic, setTopic] = useState<TopicId | null>(null);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [tried, setTried] = useState(false);
  const firstRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  useEffect(() => {
    if (autoFocus) firstRef.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  const isQuestion = kind === "question";
  // Personal details (phone, email, address) block sending; see forum/personalInfo for the rules.
  const titleBlocked = isQuestion && !!personalInfoWarning(title);
  const textBlocked = !!personalInfoWarning(text);
  const warning = personalInfoWarning(`${title}\n${text}`);
  const missing = isQuestion
    ? !topic
      ? "בחר נושא לשאלה"
      : title.trim().length < 5
        ? "כתוב כותרת קצרה לשאלה"
        : text.trim().length < 10
          ? "ספר לנו קצת יותר (לפחות כמה מילים)"
          : null
    : text.trim().length < 3
      ? "כתוב את התשובה שלך"
      : null;

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTried(true);
    if (missing || warning) return;
    const r = (e.nativeEvent as SubmitEvent).submitter?.getBoundingClientRect();
    if (r) burstConfetti({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    playWin();
    onSend({ topic: topic ?? undefined, title: title.trim(), text: text.trim() });
    setTitle("");
    setText("");
    setTopic(null);
    setTried(false);
  };

  const field =
    "w-full rounded-[20px] border-2 border-transparent bg-answer px-4 py-3 text-[17px] text-foreground placeholder:text-foreground/50 transition-colors focus:border-primary/60 focus:bg-card focus:outline-none";

  const blockedField = "border-alert/70 bg-alert/5 focus:border-alert focus:bg-alert/5";

  return (
    <form onSubmit={submit} className={cn("rounded-[32px] bg-card p-5 md:p-6", softCard, softShadow)} noValidate>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[20px] font-bold md:text-[22px]">{isQuestion ? "שאלה חדשה" : "לכתוב תשובה"}</p>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            aria-label="סגירה"
            className="flex size-9 items-center justify-center rounded-full bg-surface transition-colors hover:bg-answer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-5" />
          </button>
        )}
      </div>

      {isQuestion && (
        <fieldset className="mt-4">
          <legend className="mb-2 text-[16px]">על מה השאלה?</legend>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={topic === t.id}
                onClick={() => setTopic(t.id)}
                className={cn(
                  "rounded-full border-2 px-3 py-1.5 text-[15px] transition-[background-color,border-color,transform] duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  topic === t.id ? "border-primary bg-primary text-primary-foreground" : "border-mist/50 bg-card hover:border-primary/50",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {isQuestion && (
          <label className="block">
            <span className="sr-only">כותרת השאלה</span>
            <input
              ref={firstRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              placeholder="מה רצית לשאול? (כותרת קצרה)"
              aria-invalid={titleBlocked}
              className={cn(field, titleBlocked && blockedField)}
            />
          </label>
        )}
        <label className="block">
          <span className="sr-only">{isQuestion ? "פרטי השאלה" : "התשובה שלך"}</span>
          <textarea
            ref={isQuestion ? undefined : firstRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={600}
            rows={isQuestion ? 4 : 3}
            placeholder={isQuestion ? "ספר מה קרה ומה היית רוצה לדעת..." : "איך היית עוזר לו? כתוב בנחמדות 🙂"}
            aria-invalid={textBlocked}
            className={cn(field, "resize-none leading-relaxed", textBlocked && blockedField)}
          />
        </label>
      </div>

      {warning && (
        <div role="alert" className="mt-4 flex items-start gap-3 rounded-[20px] bg-alert/10 p-4 text-[16px] leading-snug text-alert motion-safe:animate-shake">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-card">
            <Lock className="size-5" />
          </span>
          <p className="pt-1.5">{warning}</p>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p
          role={!warning && tried && missing ? "alert" : undefined}
          className={cn("min-h-6 text-[15px]", tried && missing ? "text-primary" : "opacity-60")}
        >
          {(tried && missing) || (isQuestion ? "ילדים אחרים וכותב החוק יענו לך." : `${text.length}/600`)}
        </p>
        <button type="submit" className={yellowPill} disabled={!!warning}>
          {isQuestion ? "לשלוח שאלה" : "לשלוח תשובה"}
          <PillIcon>
            <ArrowLeftIcon className="size-5 transition-transform duration-300 ease-out motion-safe:group-enabled:group-hover:-translate-x-1" />
          </PillIcon>
        </button>
      </div>
    </form>
  );
}

/* ---------- list view ---------- */

function ThreadCard({ thread, now, index, me }: { thread: Thread; now: number; index: number; me: string }) {
  const adminReplied = thread.replies.some((r) => r.author.admin);
  const count = thread.replies.length;
  return (
    <li className="motion-safe:animate-fade-up" style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}>
      <a
        href={threadHash(thread.id)}
        className={cn(
          "group flex gap-3 rounded-[28px] bg-card p-4 transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.995] md:gap-4 md:rounded-[32px] md:p-5",
          softCard,
          softShadow,
        )}
      >
        <Avatar author={thread.author} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <TopicChip id={thread.topic} />
            {adminReplied && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[13px] font-bold leading-none text-primary">
                <ShieldCheck className="size-3.5" />
                כותב החוק ענה
              </span>
            )}
          </div>
          <h2 className="mt-2 text-[19px] font-bold leading-snug transition-colors group-hover:text-primary md:text-[22px]">{thread.title}</h2>
          <p className="mt-1 line-clamp-2 text-[15px] leading-relaxed opacity-80 md:text-[16px]">{thread.text}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[14px]">
            <span className="flex items-center gap-1.5 opacity-70">
              <span className="font-bold">{thread.author.name}</span>
              {thread.author.name === me && !thread.author.grade && <span className="rounded-full bg-lime px-2 text-[12px] leading-5">אני</span>}
              <span aria-hidden="true">·</span>
              <span>{timeAgo(lastActivity(thread), now)}</span>
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 leading-none",
                count ? "bg-answer" : "bg-brand-sun/60 font-bold",
              )}
            >
              <MessageCircle className="size-4 text-primary" />
              {count === 0 ? "מחכה לתשובה הראשונה" : count === 1 ? "תשובה אחת" : `${count} תשובות`}
            </span>
          </div>
        </div>
      </a>
    </li>
  );
}

function ForumList({
  threads,
  now,
  me,
  onAsk,
}: {
  threads: Thread[];
  now: number;
  me: string;
  onAsk: (data: { topic: TopicId; title: string; text: string }) => void;
}) {
  const [filter, setFilter] = useState<TopicId | "all">("all");
  const [query, setQuery] = useState("");
  const [asking, setAsking] = useState(false);

  const shown = threads.filter((t) => {
    if (filter !== "all" && t.topic !== filter) return false;
    const q = query.trim();
    return !q || t.title.includes(q) || t.text.includes(q);
  });

  const chip = (active: boolean) =>
    cn(
      "whitespace-nowrap rounded-full px-4 py-2 text-[15px] leading-none transition-[background-color,transform] duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-[16px]",
      active ? "bg-foreground text-card" : "bg-card hover:bg-answer",
    );

  return (
    <div className="flex flex-col gap-5">
      {asking ? (
        <div className="motion-safe:animate-fade-in-scale">
          <Composer
            kind="question"
            autoFocus
            onCancel={() => setAsking(false)}
            onSend={(d) => {
              setAsking(false);
              onAsk({ topic: d.topic!, title: d.title!, text: d.text });
            }}
          />
        </div>
      ) : (
        <div
          className={cn(
            // The button stays on one line; when the text and the button don't fit side by side, the button wraps below the text.
            "flex flex-wrap items-center justify-between gap-4 rounded-[32px] bg-card p-5 motion-safe:animate-fade-up md:p-6",
            softCard,
            softShadow,
          )}
        >
          <div className="min-w-0 grow basis-[22rem]">
            <p className="text-[20px] font-bold md:text-[22px]">משהו מציק לך? יש לך שאלה?</p>
            <p className="mt-1 text-[16px] opacity-80">כאן כל ילד יכול לשאול, וחברים עוזרים לחברים.</p>
          </div>
          <button type="button" onClick={() => setAsking(true)} className={yellowPill}>
            לשאול שאלה חדשה
            <PillIcon>
              <Plus className="size-5 transition-transform duration-300 group-hover:rotate-90" />
            </PillIcon>
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <label className="relative block">
          <span className="sr-only">חיפוש בפורום</span>
          <Search className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 opacity-50" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="לחפש שאלה..."
            className="w-full rounded-full border-2 border-transparent bg-card py-3 pe-4 ps-12 text-[16px] placeholder:text-foreground/50 focus:border-primary/50 focus:outline-none"
          />
        </label>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0" role="group" aria-label="סינון לפי נושא">
          <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")} className={chip(filter === "all")}>
            הכל
          </button>
          {TOPICS.map((t) => (
            <button key={t.id} type="button" aria-pressed={filter === t.id} onClick={() => setFilter(t.id)} className={chip(filter === t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {shown.length ? (
        <ul className="flex flex-col gap-4" aria-label="שאלות בפורום">
          {shown.map((t, i) => (
            <ThreadCard key={t.id} thread={t} now={now} index={i} me={me} />
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-[32px] border-2 border-dashed border-mist px-6 py-12 text-center motion-safe:animate-fade-up">
          <MessageCircle className="size-10 text-mist" />
          <p className="text-[18px]">עדיין אין כאן שאלות.</p>
          <button type="button" onClick={() => setAsking(true)} className="text-[17px] font-bold text-primary underline-offset-4 hover:underline">
            רוצה להיות הראשון לשאול?
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- thread view ---------- */

function ReplyCard({
  reply,
  now,
  me,
  helpful,
  onHelpful,
  index,
}: {
  reply: Reply;
  now: number;
  me: boolean;
  helpful: boolean;
  onHelpful: () => void;
  index: number;
}) {
  const admin = reply.author.admin;
  return (
    <li className="motion-safe:animate-fade-up" style={{ animationDelay: `${Math.min(index, 8) * 60 + 120}ms` }}>
      <article
        className={cn(
          "relative flex gap-3 rounded-[28px] p-4 md:gap-4 md:rounded-[32px] md:p-5",
          admin ? "border-2 border-primary/40 bg-gradient-to-l from-primary/[0.07] to-card" : cn("bg-card", softCard),
          softShadow,
        )}
      >
        <Avatar author={reply.author} />
        <div className="min-w-0 flex-1">
          <AuthorLine author={reply.author} at={reply.at} now={now} me={me} />
          <p className="mt-2 whitespace-pre-line text-[16px] leading-relaxed md:text-[17px]">{reply.text}</p>
          <button
            type="button"
            onClick={onHelpful}
            aria-pressed={helpful}
            className={cn(
              "mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[14px] leading-none transition-[background-color,transform] duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              helpful ? "bg-primary text-primary-foreground" : "bg-surface hover:bg-answer",
            )}
          >
            <ThumbsUp className={cn("size-4", helpful && "motion-safe:animate-pop")} />
            עזר לי
            <span className="tabular-nums opacity-80">{reply.helpful + (helpful ? 1 : 0)}</span>
          </button>
        </div>
      </article>
    </li>
  );
}

function ThreadView({
  thread,
  now,
  me,
  stored,
  onReply,
  onHelpful,
}: {
  thread: Thread;
  now: number;
  me: string;
  stored: Stored;
  onReply: (text: string) => void;
  onHelpful: (replyId: string) => void;
}) {
  const count = thread.replies.length;
  const mine = (a: Author) => !a.admin && !a.grade && a.name === me;
  return (
    <div className="flex flex-col gap-5">
      <a
        href={FORUM_HASH}
        className="group inline-flex w-fit items-center gap-2 rounded-full bg-card py-2 pe-4 ps-2 text-[16px] transition-colors hover:bg-answer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:animate-fade-up"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-surface text-primary">
          <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
        לכל השאלות
      </a>

      <article className={cn("rounded-[32px] bg-card p-5 motion-safe:animate-fade-up md:p-7", softCard, softShadow)}>
        <div className="flex items-center gap-3">
          <Avatar author={thread.author} />
          <AuthorLine author={thread.author} at={thread.at} now={now} me={mine(thread.author)} />
        </div>
        <TopicChip id={thread.topic} className="mt-4" />
        <h2 className="mt-2 text-[24px] font-bold leading-tight text-primary md:text-[30px]">{thread.title}</h2>
        <p className="mt-3 whitespace-pre-line text-[17px] leading-relaxed md:text-[18px]">{thread.text}</p>
      </article>

      <h3 className="flex items-center gap-2 px-1 text-[19px] font-bold md:text-[20px]">
        <MessageCircle className="size-5 text-primary" />
        {count === 0 ? "עדיין אין תשובות" : count === 1 ? "תשובה אחת" : `${count} תשובות`}
      </h3>

      {count > 0 ? (
        <ol className="flex flex-col gap-4">
          {thread.replies.map((r, i) => (
            <ReplyCard
              key={r.id}
              reply={r}
              now={now}
              index={i}
              me={mine(r.author)}
              helpful={stored.helpful.includes(`${thread.id}/${r.id}`)}
              onHelpful={() => onHelpful(r.id)}
            />
          ))}
        </ol>
      ) : (
        <p className="rounded-[28px] border-2 border-dashed border-mist px-5 py-6 text-center text-[17px]">
          {thread.author.name} מחכה לעזרה. אולי אתה תהיה הראשון לענות? 💪
        </p>
      )}

      <Composer kind="reply" onSend={(d) => onReply(d.text)} />
    </div>
  );
}

/* ---------- page ---------- */

export function ForumPage({ userName, onEarn }: { userName: string; onEarn?: (key: string) => void }) {
  const [stored, setStored] = useState(loadStored);
  const [threadId, setThreadId] = useState(threadIdFromHash);
  const [now, setNow] = useState(() => Date.now());
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const onHash = () => setThreadId(threadIdFromHash());
    window.addEventListener("hashchange", onHash);
    const tick = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.clearInterval(tick);
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Sample dates are built once per visit, so they don't drift as `now` ticks.
  const [baseNow] = useState(() => Date.now());
  const threads = useMemo(() => buildThreads(stored, baseNow), [stored, baseNow]);
  const thread = threadId ? threads.find((t) => t.id === threadId) : undefined;

  const update = (next: Stored) => {
    setStored(next);
    saveStored(next);
  };
  const me: Author = { name: userName };

  const ask = (d: { topic: TopicId; title: string; text: string }) => {
    if (personalInfoWarning(`${d.title}\n${d.text}`)) return;
    const id = `my-${Date.now()}`;
    update({ ...stored, threads: [{ id, topic: d.topic, title: d.title, text: d.text, author: me, at: Date.now(), replies: [] }, ...stored.threads] });
    onEarn?.(`forum-${id}`);
    setToast("השאלה שלך עלתה לפורום! 🎉");
    window.location.hash = threadHash(id);
  };

  const reply = (text: string) => {
    if (!thread || personalInfoWarning(text)) return;
    const r: Reply = { id: `my-${Date.now()}`, author: me, text, at: Date.now(), helpful: 0 };
    const own = stored.threads.find((t) => t.id === thread.id);
    update(
      own
        ? { ...stored, threads: stored.threads.map((t) => (t.id === thread.id ? { ...t, replies: [...t.replies, r] } : t)) }
        : { ...stored, replies: { ...stored.replies, [thread.id]: [...(stored.replies[thread.id] ?? []), r] } },
    );
    onEarn?.(`forum-${r.id}`);
    setToast("תודה שעזרת! קיבלת חילזון 🐌");
  };

  const toggleHelpful = (replyId: string) => {
    if (!thread) return;
    const key = `${thread.id}/${replyId}`;
    const helpful = stored.helpful.includes(key) ? stored.helpful.filter((k) => k !== key) : [...stored.helpful, key];
    update({ ...stored, helpful });
  };

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [threadId]);

  return (
    <div className="px-4 pb-12 pt-6 md:px-14 md:pt-10 lg:px-[5.385vw] lg:pb-[4vw] lg:pt-[2.6vw]">
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
        <div className="min-w-0">
          {threadId && !thread ? (
            <div className="flex flex-col items-center gap-3 rounded-[32px] bg-card px-6 py-12 text-center">
              <p className="text-[20px] font-bold">לא מצאנו את השאלה הזאת</p>
              <a href={FORUM_HASH} className="text-[17px] font-bold text-primary underline-offset-4 hover:underline">
                חזרה לכל השאלות
              </a>
            </div>
          ) : thread ? (
            <ThreadView key={thread.id} thread={thread} now={now} me={userName} stored={stored} onReply={reply} onHelpful={toggleHelpful} />
          ) : (
            <ForumList threads={threads} now={now} me={userName} onAsk={ask} />
          )}
        </div>
        <RulesCard className="motion-safe:animate-fade-up motion-safe:[animation-delay:150ms] lg:sticky lg:top-6" />
      </div>

      <div
        role="status"
        aria-live="polite"
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 transition-[opacity,translate] duration-300",
          toast ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        )}
      >
        {toast && <p className="rounded-full bg-foreground px-6 py-3 text-[17px] text-card shadow-lg">{toast}</p>}
      </div>
    </div>
  );
}
