import { ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { ArrowLeftIcon } from "../icons";
import { softCard, softShadow } from "../steps/StepParts";

/*
 * "שיעורים" page: a card for every law, with its picture, "חוק מספר N" in handwriting and the
 * law's name in coral (the same pair as the lesson header). A lesson without a picture yet keeps
 * an empty frame in its place; only lessons with an href open.
 * Sizes are px; the grid grows from two columns on mobile to four on wide screens (1536px and up).
 */

export type Lesson = {
  number: number;
  title: string;
  image?: { src: string; alt: string };
  /** Where the card leads. Lessons that aren't built yet have none. */
  href?: string;
};

/** The title band shown in the top strip of the layout. */
export function LessonsBanner() {
  return (
    <header className="flex h-full flex-col justify-center text-right motion-safe:animate-fade-up">
      <p className="font-hand text-[28px] leading-normal md:text-[40px] lg:text-[2.6vw]">חוק אחרי חוק</p>
      <h1 className="-mt-2 text-[40px] font-bold leading-tight text-primary md:-mt-3 md:text-[52px] lg:-mt-[0.8vw] lg:text-[3.4vw]">
        השיעורים
      </h1>
    </header>
  );
}

function LessonCard({ lesson, index }: { lesson: Lesson; index: number }) {
  const { number, title, image, href } = lesson;
  const body = (
    <>
      <div className="relative aspect-[4/3] overflow-hidden rounded-[16px] bg-surface sm:rounded-[24px]">
        {image ? (
          <img
            src={image.src}
            alt={image.alt}
            loading={index < 8 ? "eager" : "lazy"}
            className="size-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.04]"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex size-full items-center justify-center rounded-[16px] border-2 sm:rounded-[24px] border-dashed border-mist text-mist"
          >
            <ImageIcon className="size-8 sm:size-12" strokeWidth={1.5} />
          </div>
        )}
      </div>

      <div className="flex items-end justify-between gap-2 px-1 pb-1 pt-2 sm:gap-3 sm:px-2 sm:pt-3">
        <div className="min-w-0 text-right">
          <p className="font-hand text-[20px] leading-normal sm:text-[28px] xl:text-[32px]">חוק מספר {number}</p>
          <h2 className="-mt-2 text-[22px] font-bold leading-snug text-primary sm:-mt-3 sm:text-[30px] xl:text-[34px]">{title}</h2>
        </div>
        {href && (
          <span className="mb-1.5 flex size-8 shrink-0 sm:mb-2 sm:size-11 items-center justify-center rounded-full bg-brand-sun">
            <ArrowLeftIcon className="size-5 sm:size-6 text-primary transition-transform duration-300 ease-out motion-safe:group-hover:-translate-x-1" />
          </span>
        )}
      </div>
    </>
  );

  const cardClass = cn(
    "group flex h-full flex-col rounded-[24px] bg-card p-2 sm:rounded-[32px] sm:p-3",
    softCard,
    softShadow,
    href &&
      "transition-transform duration-300 ease-out hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99]",
  );

  return (
    <li className="motion-safe:animate-fade-up" style={{ animationDelay: `${Math.min(index, 11) * 40}ms` }}>
      {href ? (
        <a href={href} className={cardClass} aria-label={`חוק מספר ${number}: ${title}`}>
          {body}
        </a>
      ) : (
        <div className={cardClass}>{body}</div>
      )}
    </li>
  );
}

export function LessonsPage({ lessons }: { lessons: Lesson[] }) {
  return (
    <div className="px-4 pb-12 pt-6 md:px-8 md:pt-10 lg:px-[3.5vw] lg:pb-[4vw] lg:pt-[2.6vw]">
      <ul className="grid grid-cols-2 gap-4 md:gap-8 lg:grid-cols-3 2xl:grid-cols-4">
        {lessons.map((lesson, i) => (
          <LessonCard key={lesson.number} lesson={lesson} index={i} />
        ))}
      </ul>
    </div>
  );
}
