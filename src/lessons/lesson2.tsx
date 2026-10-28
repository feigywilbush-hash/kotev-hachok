import type { LessonContent } from "./types";

const DOOR = { src: "./assets/quiz-door.webp", alt: "ילד עומד מול דלת סגורה של בית" };

/** Law 2: for now a copy of law 1, to be adjusted. */
export const lesson2: LessonContent = {
  number: 2,
  title: "היררכיות",
  cardImage: { src: "./assets/lesson-2.webp", alt: "שוטר מסביר משהו לילד עם תיק על הגב ליד הכביש" },
  intro: {
    image: { src: "./assets/intro-lesson-2.webp", alt: "שוטר מסביר משהו לילד שמקשיב לו ליד הכביש" },
    trafficText: (
      <>
        בכביש יש סדר ברור, אולי ברור מדי. לסדר הזה קוראים "היררכיה", וזה בעצם אומר מי אמור לציית למי ומתי.
        <span className="mt-[1.4em] block">
          אם אתה הנהג עליך להקשיב לשוטר, אם השוטר לא נמצא עליך להקשיב לרמזור ואם גם רמזור אין עליך להקשיב לתמרור.
        </span>
      </>
    ),
    wideTraffic: true,
    compactCards: true,
    socialText: (
      <p>
        בכל מקום בו אנו נמצאים יש את האנשים "בעלי הסמכות" המקבלים את ההחלטות.
        <br />
        <br />
        עלינו לזהות מי הם ומה הם הכללים החשובים להם כדי שנדע מה ההתנהגות המצופה מאתנו!
      </p>
    ),
  },
  drive: {
    title: "היררכיות",
    game: "hierarchy",
    instruction: (
      <>
        בוא נצא לנסיעה! בכל צומת בחר למי מקשיבים: <br className="max-lg:hidden" />
        <span className="lg:whitespace-nowrap">קודם לשוטר, אחר כך לרמזור ואחר כך לתמרור&nbsp;👮</span>
      </>
    ),
  },
  video: {
    instruction:
      "צפה בסרטון שבו כותב החוק מסביר מה זה “היררכיות” גם במצבים חברתיים. תגלה איך לזהות מצבים כאלה ומה כדאי לעשות בהם.",
    title: "כותב החוק מסביר: היררכיות במצבים חברתיים",
    src: "./assets/social-road.mp4",
    poster: "./assets/social-road-poster.jpg",
  },
  quiz: [
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
  ],
  pyramid: {
    instruction: (
      <>
        מקמו את הדמויות למטה על גבי הפירמידה -
        <br />
        איך נראית פירמידה בבית? איך נראית בחנות? נסו לחשוב ולמקם!
      </>
    ),
    rounds: [
      {
        cards: [
          { id: "parents", image: { src: "./assets/pyramid-parents.webp", alt: "אבא ואמא" }, rank: 0 },
          { id: "children", image: { src: "./assets/pyramid-children.webp", alt: "שלושה ילדים: בן, בת ותינוק" }, rank: 1 },
        ],
        hint: "רגע! בבית ההורים נמצאים מעל הילדים בפירמידה.",
        praise: "כל הכבוד! בבית ההורים מעל הילדים",
      },
      {
        cards: [
          { id: "principal", image: { src: "./assets/pyramid-principal.webp", alt: "מנהל בית הספר ליד שולחנו" }, rank: 0 },
          { id: "students", image: { src: "./assets/pyramid-students.webp", alt: "שני תלמידים כותבים בכיתה" }, rank: 2 },
          { id: "teacher", image: { src: "./assets/pyramid-teacher.webp", alt: "מורה מלמדת ליד הלוח" }, rank: 1 },
        ],
        hint: "רגע! בבית הספר המנהל למעלה, מתחתיו המורה, ומתחתיה התלמידים.",
        praise: "כל הכבוד! בבית הספר המנהל, אחריו המורה ואז התלמידים",
      },
      {
        cards: [
          { id: "host", image: { src: "./assets/pyramid-host.webp", alt: "ילד מארח מוזג מים לכוסות" }, rank: 0 },
          { id: "guest", image: { src: "./assets/pyramid-guest.webp", alt: "ילד אורח עם תיק נכנס בדלת" }, rank: 1 },
        ],
        hint: "רגע! כשבאים לבקר, המארח הוא בעל הבית, ולכן הוא מעל האורח.",
        praise: "כל הכבוד! המארח מעל האורח",
      },
      {
        cards: [
          { id: "passengers", image: { src: "./assets/pyramid-passengers.webp", alt: "נוסעים עם מזוודות בשדה התעופה" }, rank: 2 },
          { id: "attendant", image: { src: "./assets/pyramid-attendant.webp", alt: "דיילת במטוס" }, rank: 1 },
          { id: "pilot", image: { src: "./assets/pyramid-pilot.webp", alt: "טייס בתא הטייס" }, rank: 0 },
        ],
        hint: "רגע! במטוס הטייס למעלה, מתחתיו הדיילת, ומתחתיה הנוסעים.",
        praise: "כל הכבוד! במטוס הטייס, אחריו הדיילת ואז הנוסעים",
      },
      {
        cards: [
          { id: "customer", image: { src: "./assets/pyramid-customer.webp", alt: "צרכן עם עגלת קניות" }, rank: 2 },
          { id: "manager", image: { src: "./assets/pyramid-manager.webp", alt: "מנהל הסופר בחליפה" }, rank: 0 },
          { id: "cashier", image: { src: "./assets/pyramid-cashier.webp", alt: "קופאי סורק מוצרים בקופה" }, rank: 1 },
        ],
        hint: "רגע! בסופר המנהל למעלה, מתחתיו הקופאי, ומתחתיו הצרכן.",
        praise: "כל הכבוד! בסופר המנהל, אחריו הקופאי ואז הצרכן",
      },
      {
        cards: [
          { id: "sign", image: { src: "./assets/pyramid-sign.webp", alt: "תמרור אסור לפנות פניית פרסה" }, rank: 2 },
          { id: "police", image: { src: "./assets/pyramid-police.webp", alt: "שוטר מסמן עצור ביד" }, rank: 0 },
          { id: "traffic-light", image: { src: "./assets/pyramid-traffic-light.webp", alt: "רמזור" }, rank: 1 },
          { id: "driver", image: { src: "./assets/pyramid-driver.webp", alt: "נהג ברכב" }, rank: 3 },
        ],
        hint: "רגע! בכביש השוטר למעלה, מתחתיו הרמזור, אחריו התמרור, ולמטה הנהג.",
        praise: "כל הכבוד! בכביש השוטר, אחריו הרמזור, התמרור ואז הנהג",
      },
    ],
  },
  home: {
    sheet: { src: "./files/no-entry-cutouts.svg", alt: "דף עם 12 תמרורי אין כניסה לגזירה" },
    downloadHref: "./files/no-entry-signs.pdf",
    downloadName: "no-entry-signs.pdf",
  },
};
