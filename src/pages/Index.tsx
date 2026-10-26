import { useEffect, useRef, useState } from "react";

import { HierarchyDriveGame } from "@/components/kotev/games/HierarchyDriveGame";
import { NoEntryDriveGame } from "@/components/kotev/games/NoEntryDriveGame";
import { KotevLayout } from "@/components/kotev/KotevLayout";
import { LessonsBanner, LessonsPage, type Lesson } from "@/components/kotev/pages/LessonsPage";
import { HomePracticeStep } from "@/components/kotev/steps/HomePracticeStep";
import { IntroStep } from "@/components/kotev/steps/IntroStep";
import { LessonVideo } from "@/components/kotev/steps/LessonVideo";
import { PyramidStep } from "@/components/kotev/steps/PyramidStep";
import { QuizStep } from "@/components/kotev/steps/QuizStep";
import { StageStep } from "@/components/kotev/steps/StageStep";
import { lesson1 } from "@/lessons/lesson1";
import { lesson2 } from "@/lessons/lesson2";
import type { LessonContent } from "@/lessons/types";

const LESSON_STEPS = ["הקדמה", "בכביש התנועה", "בכביש החברתי", "משחק ותרגול", "יישום בבית"];
const BUILT_STEPS = 5;
/** How far the coral line reaches past the current step, per step (from the Figma frames). */
const STEP_PROGRESS = [0.18, 0.16, 0.066, 0.122, 0];

const LESSON_COUNT = 30;

/** The laws that are built, in order. */
const BUILT_LESSONS: LessonContent[] = [lesson1, lesson2];

/** Built laws open from their card; the rest keep an empty picture frame and a placeholder name until they're written. */
const LESSONS: Lesson[] = Array.from({ length: LESSON_COUNT }, (_, i) => {
  const lesson = BUILT_LESSONS[i];
  return lesson
    ? { number: lesson.number, title: lesson.title, image: lesson.cardImage, href: stepHash(lesson.number, 0) }
    : { number: i + 1, title: "בקרוב..." };
});

const LESSONS_HASH = "#lessons";
const isLessonsPage = () => window.location.hash === LESSONS_HASH;

/** Law 1 keeps its short address (#step-2); later laws add their number (#lesson-2-step-2). */
function stepHash(lesson: number, step: number) {
  return lesson === 1 ? `#step-${step + 1}` : `#lesson-${lesson}-step-${step + 1}`;
}

/** The law and step to open, from the address. */
const placeFromHash = () => {
  const match = window.location.hash.match(/^#(?:lesson-(\d+)-)?step-(\d+)$/);
  const lesson = Number(match?.[1] ?? 1) - 1;
  const step = Number(match?.[2]) - 1;
  return {
    lesson: lesson >= 0 && lesson < BUILT_LESSONS.length ? lesson : 0,
    step: step >= 0 && step < BUILT_STEPS ? step : 0,
  };
};

const Index = () => {
  const [place, setPlace] = useState(placeFromHash);
  const { step } = place;
  const lesson = BUILT_LESSONS[place.lesson];
  const [showLessons, setShowLessons] = useState(isLessonsPage);

  // Snail points: start at 0, one for each step finished and each success inside a step.
  // Each success counts once (keyed), so replaying the game or revisiting a step doesn't add more.
  const [points, setPoints] = useState(0);
  const earned = useRef(new Set<string>());
  const earn = (key: string) => {
    if (earned.current.has(key)) return;
    earned.current.add(key);
    setPoints((p) => p + 1);
  };

  const goTo = (index: number) => {
    if (index < 0 || index >= BUILT_STEPS) return;
    setPlace({ lesson: place.lesson, step: index });
    window.history.replaceState(null, "", stepHash(lesson.number, index));
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    const onHash = () => {
      setShowLessons(isLessonsPage());
      setPlace(placeFromHash());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Points are keyed by law too, so finishing the same step in another law still counts.
  const earnHere = (key: string) => earn(`${lesson.number}-${key}`);
  const nextLesson = BUILT_LESSONS[place.lesson + 1];

  const shared = { lawNumber: lesson.number, title: lesson.title, step: step + 1, totalSteps: LESSON_STEPS.length, onNext: () => {
      earnHere(`step-${step}`);
      goTo(step + 1);
    },
  };

  if (showLessons) {
    return (
      <KotevLayout user={{ name: "דניאל", points }} banner={<LessonsBanner />} activeHref={LESSONS_HASH}>
        <LessonsPage lessons={LESSONS} />
      </KotevLayout>
    );
  }

  return (
    <KotevLayout
      user={{ name: "דניאל", points }}
      steps={LESSON_STEPS}
      currentStep={step}
      stepProgress={STEP_PROGRESS[step]}
      onStepSelect={goTo}
    >
      {step === 0 && (
        <IntroStep
          key={`intro-${lesson.number}`}
          {...shared}
          image={lesson.intro.image}
          trafficText={lesson.intro.trafficText}
          trafficWarning={lesson.intro.trafficWarning}
          wideTraffic={lesson.intro.wideTraffic}
          compactCards={lesson.intro.compactCards}
          socialText={lesson.intro.socialText}
        />
      )}
      {step === 1 && (
        <StageStep
          key={`traffic-${lesson.number}`}
          {...shared}
          title={lesson.drive.title ?? lesson.title}
          instruction={lesson.drive.instruction}
        >
          {lesson.drive.game === "hierarchy" ? (
            <HierarchyDriveGame onScore={(i) => earnHere(`drive-${i}`)} />
          ) : (
            <NoEntryDriveGame onScore={(i) => earnHere(`drive-${i}`)} />
          )}
        </StageStep>
      )}
      {step === 2 && (
        <StageStep
          key={`social-${lesson.number}`}
          {...shared}
          instruction={lesson.video.instruction}
          instructionClassName="lg:pb-[calc(var(--u)*1.667)]"
          stageClassName="aspect-video md:aspect-video lg:aspect-video lg:h-auto"
          // Keeps the video's own 16:9 shape; on wide, short screens the column narrows so it still fits.
          columnClassName="lg:mr-auto lg:max-w-[calc(var(--u)*50.466)]"
        >
          <LessonVideo
            title={lesson.video.title}
            src={lesson.video.src}
            poster={lesson.video.poster}
          />
        </StageStep>
      )}
      {step === 3 && lesson.pyramid && (
        <PyramidStep
          key={`pyramid-${lesson.number}`}
          lawNumber={shared.lawNumber}
          title={shared.title}
          instruction={lesson.pyramid.instruction}
          rounds={lesson.pyramid.rounds}
          onNext={shared.onNext}
          onSolve={(i) => earnHere(`pyramid-${i}`)}
        />
      )}
      {step === 3 && !lesson.pyramid && (
        <QuizStep
          key={`quiz-${lesson.number}`}
          lawNumber={shared.lawNumber}
          title={shared.title}
          questions={lesson.quiz}
          step={shared.step}
          totalSteps={shared.totalSteps}
          onFinish={shared.onNext}
          onSolve={(i) => earnHere(`quiz-${i}`)}
        />
      )}
      {step === 4 && (
        <HomePracticeStep
          key={`home-${lesson.number}`}
          lawNumber={shared.lawNumber}
          title={shared.title}
          sheet={lesson.home.sheet}
          downloadHref={lesson.home.downloadHref}
          downloadName={lesson.home.downloadName}
          onNextLaw={() => {
            earnHere(`step-${step}`);
            if (nextLesson) window.location.hash = stepHash(nextLesson.number, 0);
          }}
        />
      )}
    </KotevLayout>
  );
};

export default Index;
