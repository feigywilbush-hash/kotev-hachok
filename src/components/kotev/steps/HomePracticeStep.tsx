import { FileDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { ArrowLeftIcon } from "../icons";
import { LawTitle, softCard, softShadow } from "./StepParts";

/*
 * "יישום בבית" step, the last one of the lesson: a sheet of "no entry" signs to print, cut out and
 * stick (with permission) on things that are private to someone else, then a button to the next law.
 * Sizes: px on mobile/tablet; on desktop multiples of --u (1vw on a 16:9 screen, smaller on short
 * screens so the step fits without scrolling; u = px / 19.2 from the 1920px Figma frame). See KotevLayout.
 * Mobile stacks: title → sheet → text → download → finish. Desktop: sheet column on the left.
 */

type HomePracticeStepProps = {
  lawNumber: number;
  title: string;
  /** Preview of the printable sheet. */
  sheet: { src: string; alt: string };
  /** The file the download button saves (e.g. an A4 PDF). */
  downloadHref: string;
  downloadName: string;
  onNextLaw?: () => void;
};

export function HomePracticeStep({ lawNumber, title, sheet, downloadHref, downloadName, onNextLaw }: HomePracticeStepProps) {
  return (
    <div className="flex flex-col gap-6 px-4 pb-10 pt-6 md:gap-8 md:px-8 md:pt-10 lg:flex-row lg:items-center lg:gap-[calc(var(--u)*4.01)] lg:py-[calc(var(--u)*1.5)] lg:pl-[2.865vw] lg:pr-[3.594vw]">
      {/* Text column: on mobile its children join the outer column so the sheet can sit after the title. */}
      <div className="contents lg:order-1 lg:flex lg:min-w-0 lg:flex-1 lg:flex-col">
        <LawTitle lawNumber={lawNumber} title={title} className="order-1" />

        <div className="order-3 text-right text-[18px] leading-normal motion-safe:animate-fade-up motion-safe:[animation-delay:120ms] md:text-[22px] lg:max-w-[calc(var(--u)*41.719)] lg:self-start lg:text-[calc(var(--u)*1.25)]">
          <p>
            מצורף קובץ תמרורי אין כניסה.
            <br />
            גזרו אותם והדביקו במקומות המתאימים ברחבי הבית או הכיתה.
          </p>
          <p className="mt-[1.5em] font-bold">
            חשבו: אילו חפצים / ארונות / חדרים נחשבים פרטיים לאדם אחר? חבר או אח?
            <br />
            הדביקו עליהם מדבקת אין כניסה.
          </p>
          <p>אבל רגע, זכרו לשאול את רשותם לפני ההדבקה - הסבירו להם מדוע אתם מדביקים תמרור זה!</p>
        </div>

        <a
          href={downloadHref}
          download={downloadName}
          className="group order-4 flex w-full max-w-[340px] items-center justify-between self-start rounded-full bg-sidebar-accent py-3 pl-2.5 pr-5 text-[20px] leading-none transition-[background-color,transform,box-shadow] duration-200 hover:bg-sidebar hover:shadow-[0_6px_16px_hsl(var(--mist)/0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] motion-safe:animate-fade-up motion-safe:[animation-delay:180ms] md:text-[22px] lg:mt-[calc(var(--u)*1.38)] lg:w-[calc(var(--u)*19.792)] lg:max-w-none lg:py-[calc(var(--u)*0.625)] lg:pl-[calc(var(--u)*0.521)] lg:pr-[calc(var(--u)*1.25)] lg:text-[calc(var(--u)*1.302)]"
        >
          <span>להורדה והדפסה</span>
          <span className="flex size-10 items-center justify-center lg:size-[calc(var(--u)*2.344)]">
            <FileDown
              aria-hidden="true"
              className="size-7 text-primary transition-transform duration-300 ease-out motion-safe:group-hover:translate-y-0.5 lg:size-[calc(var(--u)*1.563)] lg:motion-safe:group-hover:translate-y-[calc(var(--u)*0.104)]"
            />
          </span>
        </a>

        <button
          type="button"
          onClick={onNextLaw}
          className="group order-5 flex w-full items-center justify-between gap-3 rounded-full bg-primary p-3 text-right text-[18px] leading-snug text-primary-foreground transition-[filter,transform] duration-200 hover:brightness-[1.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99] motion-safe:animate-fade-up motion-safe:[animation-delay:240ms] md:p-4 md:text-[24px] lg:mt-[calc(var(--u)*3.958)] lg:p-[calc(var(--u)*0.833)] lg:text-[calc(var(--u)*1.25)]"
        >
          <span className="ps-2 md:ps-3 lg:ps-[calc(var(--u)*0.417)]">
            כל הכבוד סיימת חוק מספר {lawNumber}!{" "}
            <span aria-hidden="true" className="inline-block motion-safe:group-hover:animate-bob">
              🎉
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-3 md:gap-6 lg:gap-[calc(var(--u)*1.25)]">
            <span>לחוק הבא</span>
            <span className="flex size-11 items-center justify-center rounded-full bg-card md:size-[53px] lg:size-[calc(var(--u)*2.76)]">
              <ArrowLeftIcon className="size-6 text-primary transition-transform duration-300 ease-out motion-safe:group-hover:-translate-x-1 lg:size-[calc(var(--u)*1.25)] lg:motion-safe:group-hover:-translate-x-[calc(var(--u)*0.26)]" />
            </span>
          </span>
        </button>
      </div>

      <figure className="order-2 mx-auto w-full max-w-[300px] motion-safe:animate-fade-in-scale motion-safe:[animation-delay:80ms] md:max-w-[360px] lg:order-none lg:mx-0 lg:w-[calc(var(--u)*25)] lg:max-w-none lg:shrink-0">
        <img
          src={sheet.src}
          alt={sheet.alt}
          className={cn(
            "aspect-[480/678] w-full rounded-[30px] transition-transform duration-500 ease-out motion-safe:hover:-rotate-1 lg:rounded-[calc(var(--u)*1.5625)]",
            softCard,
            softShadow,
          )}
        />
      </figure>
    </div>
  );
}
