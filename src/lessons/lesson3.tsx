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
    game: "merge",
    instruction: (
      <>
        הרכב שלך עומד בצד הכביש ורוצה להצטרף לנסיעה. בדוק אם הכביש עמוס ואם המכוניות נוסעות מהר, אותת, וצא לנתיב רק כשיש
        רווח גדול&nbsp;🚗
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
  socialParts: [
    {
      label: "עומד בצד",
      instruction: "צפו בסרטון: הילד רוצה להצטרף לשיחה של החברים. מה הוא עושה?",
      video: { src: "./assets/join-1.mp4", poster: "./assets/join-1-poster.jpg", title: "סרטון 1: הילד עומד בצד ולא מצטרף לשיחה" },
      activities: [
        {
          kind: "choice",
          question: "אני רוצה להצטרף למשחק של יוני ודני, מה כדאי לי לעשות? 🤔",
          answers: [
            { image: "./assets/join-answer-wait.webp", imageFocus: "78% center", text: "אני אמשיך לחכות. אם ירצו, הם יזמינו אותי." },
            { image: "./assets/join-answer-leave.webp", imageFocus: "55% center", text: "אני אלך משם. אם לא הזמינו אותי, הם בטח לא רוצים אותי." },
            { image: "./assets/join-answer-join.webp", imageFocus: "72% center", text: "אני אתקרב והראה להם שאני רוצה להצטרף. הם פשוט עסוקים בשיחה שלהם." },
          ],
          correct: 2,
          explain: "אם לא מזמינים אותנו, זה לא אומר שלא רוצים בנו. החברים פשוט עסוקים \"בנסיעה\" שלהם, ומי שרוצה להצטרף צריך לאותת ולהצטרף.",
        },
      ],
    },
    {
      label: "מצטרף, אבל לא בדיוק",
      instruction: "צפו בסרטון: הפעם הילד מצטרף לשיחה. שימו לב על מה החברים מדברים, ועל מה הוא מדבר.",
      video: { src: "./assets/join-2.mp4", poster: "./assets/join-2-poster.jpg", title: "סרטון 2: הילד מצטרף לשיחה ומדבר על נושא אחר" },
      activities: [
        {
          kind: "choice",
          question: "על מה החברים דיברו?",
          answers: [
            { image: "./assets/join-topic-animals.webp", imageFit: "contain", text: "על בעלי חיים" },
            { image: "./assets/join-topic-gift.webp", imageFit: "contain", text: "על מתנות" },
            { image: "./assets/join-topic-ball.webp", imageFit: "contain", text: "על כדורגל" },
          ],
          correct: 0,
          explain: "החברים דיברו על בעלי חיים, והילד דיבר על מתנה.",
        },
        {
          kind: "choice",
          question: "ניסיתי לספר לחברים משהו, אבל הם לא התעניינו. למה זה קרה? 🤔",
          answers: [
            { image: "./assets/join-answer-unloved.webp", imageFocus: "62% center", text: "אולי הם לא אוהבים אותי." },
            { image: "./assets/join-answer-offtopic.webp", imageFocus: "65% center", text: "אולי דיברתי על משהו שלא קשור לשיחה שלהם." },
            { image: "./assets/join-answer-quiet.webp", imageFocus: "70% center", text: "אולי דיברתי בשקט מדי." },
          ],
          correct: 1,
          explain: "לפני שמצטרפים בודקים על מה מדברים, ומצטרפים עם משהו שקשור לנושא.",
        },
      ],
    },
    {
      label: "מצטרף נכון",
      instruction: "צפו בסרטון: עכשיו הילד מצטרף לשיחה בדיוק כמו שצריך. שימו לב מה הוא עושה, שלב אחרי שלב.",
      video: { src: "./assets/join-3.mp4", poster: "./assets/join-3-poster.jpg", title: "סרטון 3: הילד מצטרף נכון לשיחה" },
      activities: [
        {
          kind: "choice",
          question: "מה עשיתי הפעם, ולמה החברים שמחו שהצטרפתי?",
          answers: [
            { image: "./assets/join-answer-offtopic.webp", imageFocus: "65% center", text: "סיפרתי על המתנה שקיבלתי, כי זה הכי מעניין." },
            { image: "./assets/join-answer-snake.webp", imageFocus: "65% center", text: "הקשבתי, הבנתי שמדברים על בעלי חיים, וסיפרתי על נחש. זה התאים לשיחה." },
            { image: "./assets/join-answer-loud.webp", imageFocus: "70% center", text: "דיברתי הכי חזק, כדי שכולם ישמעו אותי." },
          ],
          correct: 1,
          explain: "הוא התאים את עצמו לשיחה, כמו רכב שמתאים את עצמו לקצב הנסיעה.",
        },
      ],
    },
    {
      label: "השלבים להצטרפות",
      instruction: "צפו בסרטון: כותב החוק מסביר איך מצטרפים לשיחה, שלב אחרי שלב.",
      video: { src: "./assets/join-4.mp4", poster: "./assets/join-4-poster.jpg", title: "סרטון 4: השלבים להצטרפות לשיחה" },
      activities: [],
    },
  ],
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
  topicGame: {
    instruction: "החברים מדברים על נושא מסוים. גררו לבועה של הילד שרוצה להצטרף תמונה שקשורה למה שהם מדברים עליו!",
    scene: { src: "./assets/game-scene.webp", alt: "שני ילדים יושבים על ספסל ומדברים, וילד שלישי עומד לידם ורוצה להצטרף" },
    bubble: "./assets/game-bubble.webp",
    rounds: [
      {
        topic: { src: "./assets/game-topic-animals.webp", alt: "החברים מדברים על בעלי חיים: אריה, פיל וארנב" },
        options: [
          { id: "snake", image: { src: "./assets/game-snake.webp", alt: "נחש ירוק" } },
          { id: "slide", image: { src: "./assets/game-slide.webp", alt: "מגלשה" } },
          { id: "car", image: { src: "./assets/game-car.webp", alt: "מכונית אדומה" } },
        ],
        correct: "snake",
        hint: "זה לא קשור לשיחה. על מה החברים מדברים? נסו שוב!",
        praise: "נכון! הם מדברים על בעלי חיים, ונחש מתאים לשיחה.",
      },
      {
        topic: { src: "./assets/game-topic-ferris.webp", alt: "החברים מדברים על גלגל ענק בלונה פארק" },
        options: [
          { id: "carousel", image: { src: "./assets/game-carousel.webp", alt: "קרוסלת סוסים" } },
          { id: "cake", image: { src: "./assets/game-cake.webp", alt: "עוגת יום הולדת עם בלונים" } },
          { id: "ball", image: { src: "./assets/game-ball.webp", alt: "כדורגל" } },
        ],
        correct: "carousel",
        hint: "זה לא קשור לשיחה. על מה החברים מדברים? נסו שוב!",
        praise: "נכון! הם מדברים על לונה פארק, וקרוסלה מתאימה לשיחה.",
      },
      {
        topic: { src: "./assets/game-topic-crash.webp", alt: "החברים מדברים על תאונה בין שתי מכוניות" },
        options: [
          { id: "carousel", image: { src: "./assets/game-carousel.webp", alt: "קרוסלת סוסים" } },
          { id: "police", image: { src: "./assets/game-police.webp", alt: "שוטר" } },
          { id: "ball", image: { src: "./assets/game-ball.webp", alt: "כדורגל" } },
        ],
        correct: "police",
        hint: "זה לא קשור לשיחה. על מה החברים מדברים? נסו שוב!",
        praise: "נכון! הם מדברים על תאונה, ושוטר מתאים לשיחה.",
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
