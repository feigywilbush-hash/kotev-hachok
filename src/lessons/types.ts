import type { ReactNode } from "react";

import type { PyramidRound } from "@/components/kotev/steps/PyramidStep";
import type { QuizQuestion } from "@/components/kotev/steps/QuizStep";

type Picture = { src: string; alt: string };

/** Everything that changes from one law to the next; the five steps themselves are shared. */
export type LessonContent = {
  number: number;
  title: string;
  /** The picture on the law's card in the lessons page. */
  cardImage: Picture;
  intro: { image: Picture; trafficText: ReactNode; trafficWarning?: string; wideTraffic?: boolean; compactCards?: boolean; socialText: ReactNode };
  /**
   * `title` replaces the law's name on this step only, e.g. a shorter one that fits beside the game.
   * `game` picks the driving game; the no-entry one when left out.
   */
  drive: { instruction: ReactNode; title?: string; game?: "no-entry" | "hierarchy" };
  video: { instruction: string; title: string; src: string; poster: string };
  quiz: QuizQuestion[];
  /** When set, the "משחק ותרגול" step is the pyramid game instead of the quiz. */
  pyramid?: { instruction: ReactNode; rounds: PyramidRound[] };
  home: { sheet: Picture; downloadHref: string; downloadName: string };
};
