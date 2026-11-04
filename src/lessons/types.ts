import type { ReactNode } from "react";

import type { PyramidRound } from "@/components/kotev/steps/PyramidStep";
import type { QuizQuestion } from "@/components/kotev/steps/QuizStep";
import type { TopicRound } from "@/components/kotev/steps/TopicBubbleStep";
import type { SocialPart } from "@/components/kotev/steps/SocialVideosStep";

type Picture = { src: string; alt: string };

/** Everything that changes from one law to the next; the five steps themselves are shared. */
export type LessonContent = {
  number: number;
  title: string;
  /** The picture on the law's card in the lessons page. */
  cardImage: Picture;
  intro: { image: Picture; trafficText: ReactNode; trafficWarning?: string; wideTraffic?: boolean; compactCards?: boolean; smallText?: boolean; socialText: ReactNode };
  /**
   * `title` replaces the law's name on this step only, e.g. a shorter one that fits beside the game.
   * `game` picks the driving game; the no-entry one when left out.
   */
  drive: { instruction: ReactNode; title?: string; game?: "no-entry" | "hierarchy" | "merge" };
  video: { instruction: string; title: string; src: string; poster: string };
  /** When set, the "בכביש החברתי" step is these short videos, each followed by an activity, instead of the one video. */
  socialParts?: SocialPart[];
  quiz: QuizQuestion[];
  /** When set, the "משחק ותרגול" step is the pyramid game instead of the quiz. */
  pyramid?: { instruction: ReactNode; rounds: PyramidRound[] };
  /** When set, the "משחק ותרגול" step is the speech-bubble topic game (law 3). */
  topicGame?: { instruction: ReactNode; scene: Picture; bubble: string; rounds: TopicRound[] };
  home: { text: ReactNode; sheet: Picture; downloadHref: string; downloadName: string };
};
