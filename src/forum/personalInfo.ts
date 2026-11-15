/*
 * Automatic check that a child doesn't share personal details in the forum.
 * Plain fixed rules (regular expressions), no AI: the same text always gets the same answer,
 * and nothing is sent anywhere. A question or answer that breaks a rule can't be sent.
 *
 * Phone
 *   1. 7 or more digits in a row, also when split by spaces, dashes, dots, slashes or brackets
 *      ("050-1234567", "050 123 45 67", "(03) 123.4567").
 *   2. An international prefix: "+972" or "972" before digits.
 *   3. 5 or more digits written as Hebrew words in a row ("אפס חמש שתיים ...").
 *   4. Phrases that hand out a number or ask to be called: "הטלפון שלי", "המספר שלי",
 *      "תתקשר אליי", "וואטסאפ", "סמס" ...
 * Email
 *   1. Anything with "@" between letters or digits ("dani@gmail.com", "dani @ walla").
 *   2. A web address ending: ".com", ".co.il", ".net", ".org" ...
 *   3. Mail services by name, in English or Hebrew: gmail, walla, hotmail, ג'ימייל, וואלה ...
 *   4. Spelled-out addresses and phrases: "שטרודל", "דוט קום", "נקודה קום", "המייל שלי".
 * Home address
 *   1. Street words: "רחוב", "רח'", "שדרות", "שד'", "סמטת", "דרך" + a number.
 *   2. Building details with a number: "דירה 4", "קומה 2", "בניין 7", "כניסה ב".
 *   3. "מיקוד", "ת.ד", "תא דואר".
 *   4. Phrases that tell where you live: "הכתובת שלי", "אני גר ב", "אנחנו גרים ב", "הבית שלי ב",
 *      "תבוא אליי הביתה".
 */

export type PersonalInfoKind = "phone" | "email" | "address";

type Rule = { kind: PersonalInfoKind; test: (text: string) => boolean };

const DIGIT_WORDS = "אפס|אחת|אחד|שתיים|שתים|שניים|שלוש|שלושה|ארבע|ארבעה|חמש|חמישה|שש|שישה|שבע|שבעה|שמונה|תשע|תשעה";

const RULES: Rule[] = [
  // ---- phone ----
  { kind: "phone", test: (t) => /\d(?:[\s\-–—.()/\\]*\d){6,}/.test(t) },
  { kind: "phone", test: (t) => /(?:\+|\b)972[\s\-.]*\d/.test(t) },
  { kind: "phone", test: (t) => new RegExp(`(?:(?:${DIGIT_WORDS})[\\s,\\-]+){4,}(?:${DIGIT_WORDS})`).test(t) },
  {
    kind: "phone",
    test: (t) =>
      /(הטלפון שלי|הפלאפון שלי|הנייד שלי|המספר שלי|מספר הטלפון|מספר טלפון|תתקשר אלי|תתקשרו אלי|תצלצל אלי|וואטסאפ|ווטסאפ|whatsapp|סמס|\bsms\b)/i.test(t),
  },

  // ---- email ----
  { kind: "email", test: (t) => /[\p{L}\p{N}._-]\s*[@＠]\s*[\p{L}\p{N}]/u.test(t) },
  { kind: "email", test: (t) => /\.\s*(com|co\.il|net|org|org\.il|gov\.il|ac\.il|il)\b/i.test(t) },
  {
    kind: "email",
    test: (t) =>
      /(gmail|hotmail|walla|yahoo|outlook|icloud|e-?mail|ג['׳]?ימייל|גימייל|הוטמייל|וואלה|יאהו|אאוטלוק|אימייל|אי-מייל)/i.test(t),
  },
  { kind: "email", test: (t) => /(שטרודל|דוט קום|דוט קו|נקודה קום|נקודה קו|המייל שלי|מייל שלי|תשלח לי מייל|כתובת מייל|כתובת המייל)/.test(t) },

  // ---- home address ----
  { kind: "address", test: (t) => /(?:^|[\s,.(])(רחוב|רח['׳]|שדרות|שד['׳]|סמטת|סמ['׳])\s*[\p{L}"'׳״-]/u.test(t) },
  { kind: "address", test: (t) => /(?:^|[\s,.(])דרך\s+[\p{L}"'׳״-]+\s+\d/u.test(t) },
  { kind: "address", test: (t) => /(דירה|קומה|בניין|בנין|כניסה)\s*(מספר\s*)?(\d|[א-ד](?:['׳]|\s|$))/.test(t) },
  { kind: "address", test: (t) => /(מיקוד|ת\.\s*ד|ת["״]ד|תא דואר)/.test(t) },
  {
    kind: "address",
    test: (t) =>
      /(הכתובת שלי|הכתובת שלנו|כתובת הבית|אני גר ב|אני גר ליד|אנחנו גרים ב|הבית שלי ב|הבית שלי נמצא|תבוא אלי הביתה|תבואו אלי הביתה|בוא אלי הביתה)/.test(t),
  },
];

/** Which kinds of personal details the text seems to contain (empty when it's fine). */
export function findPersonalInfo(text: string): PersonalInfoKind[] {
  const kinds = new Set<PersonalInfoKind>();
  for (const rule of RULES) if (rule.test(text)) kinds.add(rule.kind);
  return [...kinds];
}

const LABELS: Record<PersonalInfoKind, string> = { phone: "מספר טלפון", email: "כתובת מייל", address: "כתובת או מקום מגורים" };

/** A friendly message for the child, or null when the text can be sent. */
export function personalInfoWarning(text: string) {
  const kinds = findPersonalInfo(text);
  if (!kinds.length) return null;
  const what = kinds.map((k) => LABELS[k]);
  const list = what.length > 1 ? `${what.slice(0, -1).join(", ")} ו${what[what.length - 1]}` : what[0];
  return `נראה שכתבת ${list}. בפורום לא משתפים פרטים כאלה, כדי לשמור עליך. מחק אותם ואז אפשר לשלוח 🙏`;
}
