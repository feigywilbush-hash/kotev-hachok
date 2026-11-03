import type { LessonContent } from "./types";

const DOOR = { src: "./assets/quiz-door.webp", alt: "ילד עומד מול דלת סגורה של בית" };

/** Law 3: for now a copy of law 2, to be adjusted. */
export const lesson3: LessonContent = {
  number: 3,
  title: "הצטרפות לקבוצה",
  cardImage: { src: "./assets/lesson-3.webp", alt: "שני ילדים משוחחים על ספסל בפארק וילד שלישי עומד לידם וחושב" },
  intro: {
    image: { src: "./assets/intro-lesson-3.webp", alt: "שני ילדים משוחחים על ספסל, וילד שלישי עומד לידם ומתבונן וחושב איך להצטרף" },
    trafficText: (
      <>
        רכב העומד בצד הכביש ורוצה להשתלב בדרך חייב לבדוק קודם את מצב הכביש: עד כמה הוא עמוס? מה קצב הנסיעה? האם הרכבים נוסעים לאט או מהר?
        <span className="block">
          לאחר שבדק, עליו לאותת לנהגים שהוא רוצה להשתלב בנתיב ורק אז להצטרף ולהתאים את עצמו לקצב הנסיעה. על הנהג לתת זכות קדימה לרכבים
          הנוסעים, רק אחרי שיעברו והכביש יתפנה הוא יוכל להתחיל בנסיעתו ולהצטרף לנתיב.
        </span>
      </>
    ),
    wideTraffic: true,
    compactCards: true,
    smallText: true,
    socialText: (
      <p>
        כשאנחנו רוצים להצטרף למשחק או לקבוצה, חשוב להתבונן, להבין את המצב ולבדוק אם מתאים לאחרים שנצטרף.
        <span className="mt-[0.9em] block">
          עלינו לכבד את המשתתפים, להכיר את כללי המשחק ולמצוא את הדרך הנכונה להשתלב.
        </span>
      </p>
    ),
  },
  drive: {
    title: "הצטרפות לקבוצה",
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
      "צפה בסרטון שבו כותב החוק מגלה מי מחליט בבית, בבית הספר ובחנות. תבין למה כדאי להקשיב לכללים של המקום שבו אתה נמצא.",
    title: "כותב החוק מסביר: מי מחליט?",
    src: "./assets/who-decides.mp4",
    poster: "./assets/who-decides-poster.jpg",
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
    text: (
      <>
        <p>
          מצורפת חוברת צביעה של היררכיות.
          <br />
          בכל עמוד יש היררכיה של מקום אחר: בבית, בבית הספר, בביקור אצל חבר, במטוס, בסופר ובכביש.
        </p>
        <p className="mt-[1.5em] font-bold">
          צבעו את הדמויות, ובכל פירמידה שימו לב: מי נמצא למעלה ומחליט, ומי מקשיב?
          <br />
          בעמוד היררכיה נוספת רשמו היררכיה של מקום נוסף מהחיים שלכם.
        </p>
        <p>את העמוד האחרון, עם כל ההיררכיות, תלו במקום בולט בבית!</p>
      </>
    ),
    sheet: { src: "./assets/hierarchies-sheet.webp", alt: "דף עם שש פירמידות היררכיה לצביעה: בבית, בבית הספר, בביקור אצל חבר, במטוס, בסופר ובכביש" },
    downloadHref: "./files/hierarchies-coloring-book.pdf",
    downloadName: "hierarchies-coloring-book.pdf",
  },
};
