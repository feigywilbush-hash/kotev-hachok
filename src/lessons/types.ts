import type { ReactNode } from "react";

import type { QuizQuestion } from "@/components/kotev/steps/QuizStep";

type Picture = { src: string; alt: string };

/** Everything that changes from one law to the next; the five steps themselves are shared. */
export type LessonContent = {
  number: number;
  title: string;
  /** The picture on the law's card in the lessons page. */
  cardImage: Picture;
  intro: { image: Picture; trafficText: ReactNode; trafficWarning?: string; wideTraffic?: boolean; compactCards?: boolean; socialText: ReactNode };
  drive: { instruction: ReactNode };
  video: { instruction: string; title: string; src: string; poster: string };
  quiz: QuizQuestion[];
  home: { sheet: Picture; downloadHref: string; downloadName: string };
};
