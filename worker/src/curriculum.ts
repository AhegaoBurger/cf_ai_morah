export interface Chapter {
  number: number;
  titleEn: string;
  titleHe: string;
  titleRu: string;
  objectives: string[];
  lessons: string[];
}

export const CHAPTERS: Chapter[] = [
  {
    number: 1,
    titleEn: "Alphabet & Reading/Writing",
    titleHe: "לומדים לקרוא ולכתוב",
    titleRu: "Учимся читать и писать",
    objectives: ["Learn the Hebrew alphabet", "Read basic words with nikud", "Write letters"],
    lessons: ["alphabet-alef-bet", "alphabet-gimel-dalet", "alphabet-he-vav", "alphabet-reading-practice"],
  },
  {
    number: 2,
    titleEn: "Coming Home",
    titleHe: "מגיעים הביתה",
    titleRu: "Приходим домой",
    objectives: ["Greetings", "Family members", "Rooms of the house", "Basic verbs: to be, to have"],
    lessons: ["home-greetings", "home-family", "home-rooms", "home-verbs"],
  },
  {
    number: 3,
    titleEn: "Walk Around the Neighborhood",
    titleHe: "סיבוב בשכונה",
    titleRu: "Прогулка по району",
    objectives: ["Places in the neighborhood", "Asking for directions", "Numbers 1-20"],
    lessons: ["neighborhood-places", "neighborhood-directions", "neighborhood-numbers"],
  },
  {
    number: 4,
    titleEn: "Weekend in Jerusalem",
    titleHe: "סוף שבוע בירושלים",
    titleRu: "Выходные в Иерусалиме",
    objectives: ["Days of the week", "Telling time", "Ordering food", "Transportation"],
    lessons: ["jerusalem-days", "jerusalem-time", "jerusalem-food", "jerusalem-transport"],
  },
  {
    number: 5,
    titleEn: "Plans",
    titleHe: "תוכניות",
    titleRu: "Планы",
    objectives: ["Future tense basics", "Making plans", "Calendar and dates"],
    lessons: ["plans-future-tense", "plans-making-plans", "plans-calendar"],
  },
  {
    number: 6,
    titleEn: "At School",
    titleHe: "בבית הספר",
    titleRu: "В школе",
    objectives: ["School vocabulary", "Imperatives", "Colors and descriptions"],
    lessons: ["school-vocab", "school-imperatives", "school-descriptions"],
  },
  {
    number: 7,
    titleEn: "Family",
    titleHe: "המשפחה המורחבת",
    titleRu: "Родственники",
    objectives: ["Extended family", "Possessives", "Describing people"],
    lessons: ["family-extended", "family-possessives", "family-descriptions"],
  },
  {
    number: 8,
    titleEn: "Hanukkah",
    titleHe: "חנוכה",
    titleRu: "Ханука",
    objectives: ["Jewish holidays vocabulary", "Past tense", "Traditions and culture"],
    lessons: ["hanukkah-vocab", "hanukkah-past-tense", "hanukkah-culture"],
  },
  {
    number: 9,
    titleEn: "At the Clinic",
    titleHe: "בקופת חולים",
    titleRu: "В поликлинике купат холим",
    objectives: ["Body parts", "Medical vocabulary", "Describing symptoms", "Making appointments"],
    lessons: ["clinic-body", "clinic-medical", "clinic-symptoms", "clinic-appointments"],
  },
  {
    number: 10,
    titleEn: "Meetings",
    titleHe: "פגישות",
    titleRu: "Встречи",
    objectives: ["Formal introductions", "Work vocabulary", "Making and cancelling plans"],
    lessons: ["meetings-introductions", "meetings-work", "meetings-plans"],
  },
];

export function getChapter(number: number): Chapter | null {
  if (number < 1 || number > 10) return null;
  return CHAPTERS[number - 1];
}
