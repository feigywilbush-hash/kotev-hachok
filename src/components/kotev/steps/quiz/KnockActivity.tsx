import { useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { playFail, playSuccess } from "../../games/driveSounds";
import { playBell, playKnock } from "./knockSounds";

/*
 * "How do you knock nicely?" The learner knocks with four buttons. A gentle knock or the bell,
 * a few times, then a short pause to wait, is the polite way. A hard knock, knocking too fast
 * or knocking without stopping each get a friendly correction.
 * Sizes: px on mobile/tablet; on desktop multiples of --u (1vw on a 16:9 screen, smaller on short
 * screens so the step fits without scrolling; u = px / 19.2 from the 1920px Figma frame). See KotevLayout.
 */

export type KnockAction = "gentle" | "bell" | "hard" | "pause";
/** What the door photo should show for an action. */
export type DoorEffect = { action: KnockAction; label: string };

type Tone = "info" | "warn" | "good";

/** Right to left, as in the design. */
const BUTTONS: { action: KnockAction; label: string; emoji: string }[] = [
  { action: "gentle", label: "דפיקה עדינה", emoji: "✊" },
  { action: "bell", label: "צלצול בפעמון", emoji: "🔔" },
  { action: "hard", label: "דפיקה חזקה", emoji: "💥" },
  { action: "pause", label: "עצירה קצרה", emoji: "😊" },
];

const FAST_MS = 380;
const MAX_KNOCKS = 3;

export function KnockActivity({
  solved,
  onSolved,
  onEffect,
  className,
}: {
  solved: boolean;
  onSolved: () => void;
  onEffect: (effect: DoorEffect) => void;
  className?: string;
}) {
  const [feedback, setFeedback] = useState<{ id: number; tone: Tone; text: string } | null>(null);
  const streak = useRef(0);
  const fast = useRef(0);
  const lastAt = useRef(0);
  const tooMuch = useRef(false);
  const id = useRef(0);

  const say = (tone: Tone, text: string) => setFeedback({ id: ++id.current, tone, text });
  const reset = () => {
    streak.current = 0;
    fast.current = 0;
    tooMuch.current = false;
  };

  const act = (action: KnockAction) => {
    const now = performance.now();
    const quick = now - lastAt.current < FAST_MS;
    lastAt.current = now;

    if (action === "hard") {
      playKnock("hard");
      onEffect({ action, label: "בום! בום!" });
      reset();
      say("warn", "אוי, זה חזק מדי! 😬 דפיקה חזקה מבהילה את מי שבבית. נסו דפיקה עדינה.");
      return;
    }

    if (action === "gentle" || action === "bell") {
      if (action === "gentle") playKnock("soft");
      else playBell();
      onEffect({ action, label: action === "gentle" ? "טוק" : "דינג דונג" });
      streak.current += 1;
      fast.current = quick ? fast.current + 1 : 0;
      if (fast.current >= 2) {
        tooMuch.current = true;
        playFail();
        say("warn", "לאט יותר... 🐌 דפיקות מהירות נשמעות לחוצות. דופקים בקצב רגוע.");
      } else if (streak.current > MAX_KNOCKS) {
        tooMuch.current = true;
        playFail();
        say("warn", "לא בלי הפסקה! אחרי כמה דפיקות עושים עצירה קצרה ומחכים שיפתחו.");
      } else {
        say("info", action === "gentle" ? "טוק טוק, יופי של דפיקה עדינה. ואחר כך?" : "דינג דונג! 🔔 צלצול נעים. ואחר כך?");
      }
      return;
    }

    // Pause
    onEffect({ action, label: "שקט..." });
    if (streak.current === 0) {
      say("info", "קודם דופקים בעדינות או מצלצלים, ורק אז עוצרים לחכות.");
    } else if (tooMuch.current) {
      reset();
      playFail();
      say("warn", "עצירה זה טוב, אבל לפני כן היו יותר מדי דפיקות. נסו שוב: 2-3 דפיקות עדינות ואז עצירה.");
    } else {
      reset();
      say("good", "מעולה! 👏 דפקתם בעדינות ועצרתם לחכות. ככה דופקים בצורה נעימה ומקובלת.");
      playSuccess();
      if (!solved) onSolved();
    }
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="grid grid-cols-2 gap-2.5 rounded-[24px] bg-answer/50 p-3 md:flex md:flex-wrap md:items-center md:justify-start md:gap-[15px] md:rounded-[30px] md:px-[15px] md:py-[21px] lg:gap-[calc(var(--u)*0.781)] lg:rounded-[calc(var(--u)*1.5625)] lg:px-[calc(var(--u)*0.781)] lg:py-[calc(var(--u)*1.094)]">
        {BUTTONS.map((b) => (
          <button
            key={b.action}
            type="button"
            onClick={() => act(b.action)}
            className="flex h-[52px] items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-card px-4 text-[16px] transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_hsl(var(--mist)/0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:translate-y-0 active:scale-95 md:h-[69px] md:gap-6 md:px-5 md:text-[24px] lg:h-[calc(var(--u)*3.594)] lg:gap-[calc(var(--u)*1.25)] lg:px-[calc(var(--u)*0.885)] lg:text-[calc(var(--u)*1.25)] lg:hover:-translate-y-[calc(var(--u)*0.104)] lg:hover:shadow-[0_calc(var(--u)*0.313)_calc(var(--u)*0.833)_hsl(var(--mist)/0.45)]"
          >
            <span>{b.label}</span>
            <span aria-hidden="true">{b.emoji}</span>
          </button>
        ))}
      </div>

      <div className="flex min-h-[64px] items-center md:min-h-[80px] lg:h-[calc(var(--u)*5.469)] lg:min-h-0">
        {feedback && (
          <p
            key={feedback.id}
            role="status"
            className={cn(
              "text-right text-[16px] leading-snug motion-safe:animate-fade-up md:text-[18px] lg:text-[calc(var(--u)*1.042)]",
              feedback.tone === "warn" && "text-alert",
              feedback.tone === "good" && "font-bold text-primary",
            )}
          >
            {feedback.text}
          </p>
        )}
      </div>
    </div>
  );
}
