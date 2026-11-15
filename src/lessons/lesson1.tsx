import type { LessonContent } from "./types";

/** Law 1: no entry. */
export const lesson1: LessonContent = {
  number: 1,
  title: "אין כניסה!",
  cardImage: { src: "./assets/lesson-1.webp", alt: "ילד עם תיק על הגב מביט בשלט אין כניסה" },
  intro: {
    image: { src: "./assets/intro-no-entry.webp", alt: "ילד עומד ליד שלט אין כניסה ומביט בו" },
    trafficText: "שלט ‘אין כניסה’ אוסר על הנהג להכנס לשטח מסוים. כניסה לשטח זה מהווה סכנה.",
    trafficWarning: "על נהג הנכנס בשלט אין כניסה לשלם קנס של כ - 500 ש”ח.",
    socialText: (
      <p>
        לא נגע בחפצים פרטיים של אדם אחר.
        <br />
        לא נכנס לשטח או לחדר של אדם אחר ללא רשות.
        <br />
        ולא נשאל שאלות בנושאים שהאחר לא רוצה לדבר עליהם.
      </p>
    ),
  },
  drive: {
    instruction: (
      <>
        בוא נצא לנסיעה! סע בכביש, שים לב לתמרורים <br className="max-lg:hidden" />
        <span className="lg:whitespace-nowrap">ובחר לאן לפנות. שים לב לא להיכנס ל״אין כניסה״&nbsp;🚫</span>
      </>
    ),
  },
  video: {
    instruction:
      "צפה בסרטון שבו כותב החוק מסביר מה זה “אין כניסה” גם במצבים חברתיים. תגלה איך לזהות מצבים כאלה ומה כדאי לעשות בהם.",
    title: "כותב החוק מסביר: אין כניסה במצבים חברתיים",
    src: "./assets/social-road.mp4",
    poster: "./assets/social-road-poster.jpg",
  },
  quiz: [
    {
      kind: "pictures",
      question: "קבעתי עם יוני שאבוא אליו אחר הצהריים. אני מגיע לבית שלו והדלת סגורה.\nאם קבענו, זה אומר שאפשר פשוט לפתוח ולהיכנס? 🤔",
      answers: [
        { image: "./assets/door-answer-open.webp", text: "אני אפתח את הדלת ואכנס לבד. יוני הזמין אותי, אז בטח אפשר להיכנס גם בלי לדפוק." },
        { image: "./assets/door-answer-walk-in.webp", text: "לא פותחים דלת בלי לדפוק, אבל אם הדלת פתוחה אני פשוט אכנס." },
        { image: "./assets/door-answer-knock.webp", text: "זה לא הבית שלי, אז אני אדפוק בדלת ואחכה שיפתחו לי ויזמינו אותי להיכנס." },
      ],
      correct: 2,
    },
    {
      kind: "knock",
      question: "יוני עוד לא פתח לי את הדלת אז אדפוק ואחכה בסבלנות שיפתחו לי 😊\nאבל רגע… איך דופקים בצורה נעימה ומקובלת?",
      instruction:
        "נסו לדפוק על הדלת בעזרת הכפתורים. שימו לב לעוצמה ולקצב:\nלא חזק מדי, לא מהר מדי ולא בלי הפסקה. דפיקות נעימות עוזרות לאנשים להרגיש בנוח לפתוח את הדלת.",
      image: { src: "./assets/quiz-knock-door.webp", alt: "דלת כניסה סגורה של בית" },
    },
    {
      kind: "pictures",
      question: "בבית של יוני אני רואה יומן שכתוב עליו: \"היומן האישי שלי\".\nהאם מותר להציץ ביומן של מישהו אחר? 🤔",
      answers: [
        { image: "./assets/diary-answer-open.webp", text: "יוני חבר ממש טוב שלי, לכן אני חושב שמותר לי לפתוח ולהסתכל ביומן שלו." },
        { image: "./assets/diary-answer-no-touch.webp", text: "היומן שייך ליוני, וזה חפץ אישי שלו, ולכן אני לא נוגע ולא מסתכל בו." },
        { image: "./assets/diary-answer-peek.webp", text: "ליד יוני אני לא אסתכל כדי שלא יכעס, אבל כשלא יראה אני אציץ קצת." },
      ],
      correct: 1,
    },
    {
      kind: "pictures",
      question: "רציתי לשאול את יוני כמה הוא קיבל במבחן בחשבון.\nאבל שמתי לב שיוני לא מעוניין לדבר על זה. האם עדיין מתאים לשאול אותו? 🤔",
      answers: [
        { image: "./assets/test-answer-sensitive.webp", text: "כיוון שיוני לא מעוניין לדבר על המבחן אני אהיה רגיש ולא אשאל אותו כמה קיבל." },
        { image: "./assets/test-answer-told-mine.webp", text: "אני אשאל אותו, כי אני כבר סיפרתי לו כמה אני קיבלתי, אז גם הוא צריך לספר לי." },
        { image: "./assets/test-answer-convince.webp", text: "כיוון שיוני לא מעוניין לספר זה נעשה מעניין יותר ולכן אני אשכנע אותו לספר לי." },
      ],
      correct: 0,
    },
  ],
  home: {
    text: (
      <>
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
      </>
    ),
    sheet: { src: "./files/no-entry-cutouts.svg", alt: "דף עם 12 תמרורי אין כניסה לגזירה" },
    downloadHref: "./files/no-entry-signs.pdf",
    downloadName: "no-entry-signs.pdf",
  },
};
