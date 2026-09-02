/** Извлекает и нормализует российский номер из текста. */
export function normalizeRussianPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
    return `+7${digits.slice(1)}`;
  }
  if (digits.length === 10 && digits.startsWith("9")) {
    return `+7${digits}`;
  }
  if (digits.length >= 10 && digits.length <= 12) {
    return digits;
  }
  return null;
}

export function extractPhoneFromText(text: string): string | null {
  const patterns = [
    /(?:\+7|8)[\s\-()]*(?:\d[\s\-()]*){10}/,
    /\b9\d{2}[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}\b/,
    /\b\d{3}[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}\b/,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const normalized = normalizeRussianPhone(match[0]);
    if (normalized && normalized.replace(/\D/g, "").length >= 10) {
      return normalized;
    }
  }
  return null;
}

export function phoneTailDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.slice(-10);
}
