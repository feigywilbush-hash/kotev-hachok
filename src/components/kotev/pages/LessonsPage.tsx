import { ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";
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
      <p className="font-hand text-[7.18vw] leading-normal md:text-[5.208vw] lg:text-[2.6vw]">חוק אחרי חוק</p>
      <h1 className="-mt-2 text-[10.26vw] font-bold leading-tight text-primary md:-mt-3 md:text-[6.771vw] lg:-mt-[0.8vw] lg:text-[3.4vw]">
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

      <div className="px-1 pb-1 pt-2 sm:px-2 sm:pt-3">
        <div className="min-w-0 text-right">
          <p className="font-hand text-[5.128vw] leading-normal md:text-[3.646vw] lg:text-[2.5vw] 2xl:text-[1.667vw]">חוק מספר {number}</p>
          <h2 className="-mt-2 whitespace-nowrap text-[4.6vw] font-bold leading-snug text-primary sm:-mt-3 md:text-[3.906vw] lg:text-[2.656vw] 2xl:text-[1.771vw]">{title}</h2>
        </div>
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
      {/* Gaps in vw on tablet and desktop, so they grow and shrink with the screen (32px at 768 and at 1920). */}
      <ul className="grid grid-cols-2 gap-4 md:gap-[4.167vw] lg:grid-cols-3 lg:gap-[1.667vw] 2xl:grid-cols-4">
        {lessons.map((lesson, i) => (
          <LessonCard key={lesson.number} lesson={lesson} index={i} />
        ))}
      </ul>
    </div>
  );
}
