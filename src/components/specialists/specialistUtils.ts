export const SPECIALIST_QUIZ_STORAGE_KEY = "specialist_quiz_dismissed";

export const SPECIALIST_INTENTS = [
  "Снять жильё",
  "Сдать квартиру",
  "Купить",
  "Продать",
  "Другой запрос",
] as const;

export type SpecialistIntent = (typeof SPECIALIST_INTENTS)[number];

export function isQuizDismissed(): boolean {
  try {
    return localStorage.getItem(SPECIALIST_QUIZ_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissQuizPermanently() {
  try {
    localStorage.setItem(SPECIALIST_QUIZ_STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function pluralObjects(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "объект";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14))
    return "объекта";
  return "объектов";
}

export function pluralRealtors(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "риелтор";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14))
    return "риелтора";
  return "риелторов";
}

export function pluralAgencies(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "агентство";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14))
    return "агентства";
  return "агентств";
}

export function pluralProjects(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "проект";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14))
    return "проекта";
  return "проектов";
}

export function pluralApartments(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "квартира";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14))
    return "квартиры";
  return "квартир";
}
