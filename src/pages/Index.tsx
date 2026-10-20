import { useEffect, useRef, useState } from "react";

import { NoEntryDriveGame } from "@/components/kotev/games/NoEntryDriveGame";
import { KotevLayout } from "@/components/kotev/KotevLayout";
import { HomePracticeStep } from "@/components/kotev/steps/HomePracticeStep";
import { IntroStep } from "@/components/kotev/steps/IntroStep";
import { LessonVideo } from "@/components/kotev/steps/LessonVideo";
import { QuizStep, type QuizQuestion } from "@/components/kotev/steps/QuizStep";
import { StageStep } from "@/components/kotev/steps/StageStep";

const LESSON_STEPS = ["הקדמה", "בכביש התנועה", "בכביש החברתי", "משחק ותרגול", "יישום בבית"];
const BUILT_STEPS = 5;
/** How far the coral line reaches past the current step, per step (from the Figma frames). */
const STEP_PROGRESS = [0.18, 0.16, 0.066, 0.122, 0];

const DOOR = { src: "./assets/quiz-door.webp", alt: "ילד עומד מול דלת סגורה של בית" };

const QUIZ: QuizQuestion[] = [
  {
    kind: "choice",
    question: "קבעתי עם יוני שאבוא אליו אחר הצהריים. אני מגיע לבית שלו והדלת סגורה.\nאם קבענו, זה אומר שאפשר פשוט לפתוח ולהיכנס? 🤔",
    answers: [
      "אני אפתח את הדלת ואכנס לבד. יוני הזמין אותי, אז בטח אפשר להיכנס גם בלי לדפוק.",
      "לא פותחים דלת בלי לדפוק, אבל אם הדלת פתוחה אני פשוט אכנס.",
      "זה לא הבית שלי, אז אני אדפוק בדלת ואחכה שיפתחו לי ויזמינו אותי להיכנס.",
    ],
    correct: 2,
    image: DOOR,
  },
  {
    kind: "knock",
    question: "יוני עוד לא פתח לי את הדלת אז אדפוק ואחכה בסבלנות שיפתחו לי 😊\nאבל רגע… איך דופקים בצורה נעימה ומקובלת?",
    instruction:
      "נסו לדפוק על הדלת בעזרת הכפתורים. שימו לב לעוצמה ולקצב:\nלא חזק מדי, לא מהר מדי ולא בלי הפסקה. דפיקות נעימות עוזרות לאנשים להרגיש בנוח לפתוח את הדלת.",
    image: { src: "./assets/quiz-knock-door.webp", alt: "דלת כניסה סגורה של בית" },
  },
  {
    kind: "choice",
    question: "בבית של יוני אני רואה יומן שכתוב עליו: \"היומן האישי שלי\".\nהאם מותר להציץ ביומן של מישהו אחר? 🤔",
    answers: [
      "יוני חבר ממש טוב שלי, לכן אני חושב שמותר לי לפתוח ולהסתכל ביומן שלו.",
      "היומן שייך ליוני, וזה חפץ אישי שלו, ולכן אני לא נוגע ולא מסתכל בו.",
      "ליד יוני אני לא אסתכל כדי שלא יכעס, אבל כשלא יראה אני אציץ קצת.",
    ],
    correct: 1,
    image: { src: "./assets/quiz-diary.webp", alt: "ילד מביט ביומן אישי שמונח על שולחן" },
  },
  {
    kind: "choice",
    question: "רציתי לשאול את יוני כמה הוא קיבל במבחן בחשבון.\nאבל שמתי לב שיוני לא מעוניין לדבר על זה. האם עדיין מתאים לשאול אותו? 🤔",
    answers: [
      "כיוון שיוני לא מעוניין לדבר על המבחן אני אהיה רגיש ולא אשאל אותו כמה קיבל.",
      "אני אשאל אותו, כי אני כבר סיפרתי לו כמה אני קיבלתי, אז גם הוא צריך לספר לי.",
      "כיוון שיוני לא מעוניין לספר זה נעשה מעניין יותר ולכן אני אשכנע אותו לספר לי.",
    ],
    correct: 0,
    image: { src: "./assets/quiz-friends.webp", alt: "שני ילדים יושבים ומדברים בחדר" },
  },
];

/** The step to open, from the address (#step-2 opens the second step). */
const stepFromHash = () => {
  const n = Number(window.location.hash.match(/^#step-(\d+)$/)?.[1]) - 1;
  return n >= 0 && n < BUILT_STEPS ? n : 0;
};

const Index = () => {
  const [step, setStep] = useState(stepFromHash);

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
    setStep(index);
    window.history.replaceState(null, "", `#step-${index + 1}`);
    window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    const onHash = () => setStep(stepFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const shared = { lawNumber: 1, title: "אין כניסה!", step: step + 1, totalSteps: LESSON_STEPS.length, onNext: () => {
      earn(`step-${step}`);
      goTo(step + 1);
    },
  };

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
          key="intro"
          {...shared}
          image={{ src: "./assets/intro-no-entry.webp", alt: "ילד עומד ליד שלט אין כניסה ומביט בו" }}
          trafficText="שלט ‘אין כניסה’ אוסר על הנהג להכנס לשטח מסוים. כניסה לשטח זה מהווה סכנה."
          trafficWarning="על נהג הנכנס בשלט אין כניסה לשלם קנס של כ - 500 ש”ח."
          socialText={
            <p>
              מה לא ממש הוגן בעולם החברתי? ששלטי ה ’אין כניסה’ שקופים! מסתבר שיש הרבה מקומות אליהם אסור לנו להיכנס או
              חפצים בהם אסור לנו לגעת! מעולם לא ראיתי חק המסביר זאת.
              <br />
              אז הנה אני דואג לכם!
            </p>
          }
        />
      )}
      {step === 1 && (
        <StageStep
          key="traffic"
          {...shared}
          instruction={
            <>
              בוא נצא לנסיעה! סע בכביש, שים לב לתמרורים <br className="max-lg:hidden" />
              <span className="lg:whitespace-nowrap">ובחר לאן לפנות. שים לב לא להיכנס ל״אין כניסה״&nbsp;🚫</span>
            </>
          }
        >
          <NoEntryDriveGame onScore={(i) => earn(`drive-${i}`)} />
        </StageStep>
      )}
      {step === 2 && (
        <StageStep
          key="social"
          {...shared}
          instruction="צפה בסרטון שבו כותב החוק מסביר מה זה “אין כניסה” גם במצבים חברתיים. תגלה איך לזהות מצבים כאלה ומה כדאי לעשות בהם."
          instructionClassName="lg:pb-[calc(var(--u)*1.667)]"
          stageClassName="aspect-video md:aspect-video lg:aspect-video lg:h-auto"
          // Keeps the video's own 16:9 shape; on wide, short screens the column narrows so it still fits.
          columnClassName="lg:mr-auto lg:max-w-[calc(var(--u)*50.466)]"
        >
          <LessonVideo
            title="כותב החוק מסביר: אין כניסה במצבים חברתיים"
            src="./assets/social-road.mp4"
            poster="./assets/social-road-poster.jpg"
          />
        </StageStep>
      )}
      {step === 3 && (
        <QuizStep
          key="quiz"
          lawNumber={shared.lawNumber}
          title={shared.title}
          questions={QUIZ}
          step={shared.step}
          totalSteps={shared.totalSteps}
          onFinish={shared.onNext}
          onSolve={(i) => earn(`quiz-${i}`)}
        />
      )}
      {step === 4 && (
        <HomePracticeStep
          key="home"
          lawNumber={shared.lawNumber}
          title={shared.title}
          sheet={{ src: "./files/no-entry-cutouts.svg", alt: "דף עם 12 תמרורי אין כניסה לגזירה" }}
          downloadHref="./files/no-entry-signs.pdf"
          downloadName="no-entry-signs.pdf"
          onNextLaw={() => earn(`step-${step}`)}
        />
      )}
    </KotevLayout>
  );
};

export default Index;
