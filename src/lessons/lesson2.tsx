import type { LessonContent } from "./types";

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
      "צפה בסרטון שבו כותב החוק מגלה מי מחליט בבית, בבית הספר ובחנות. תבין למה כדאי להקשיב לכללים של המקום שבו אתה נמצא.",
    title: "כותב החוק מסביר: מי מחליט?",
    src: "./assets/who-decides.mp4",
    poster: "./assets/who-decides-poster.jpg",
  },
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
