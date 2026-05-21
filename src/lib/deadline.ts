export type DeadlineState = "overdue" | "critical" | "warning" | "normal" | "done";

export interface DeadlineInfo {
  state: DeadlineState;
  label: string;      // "Просрочено 2д" / "2д 4ч" / "сегодня"
  emoji: string;      // 🔥 / ⚠️ / ⏰ / ""
  colorClass: string; // tailwind классы для текста
  bgClass: string;    // tailwind классы для фона
}

export function getDeadlineInfo(dueDate: string | null, status: string): DeadlineInfo | null {
  if (!dueDate) return null;

  const now = new Date();
  const due = new Date(dueDate + "T23:59:59"); // конец дня дедлайна
  const diffMs = due.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (status === "done") {
    return {
      state: "done",
      label: new Date(dueDate).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
      emoji: "✓",
      colorClass: "text-green-600",
      bgClass: "bg-green-50",
    };
  }

  // Просрочено
  if (diffMs < 0) {
    const overdueDays = Math.abs(diffDays);
    const label = overdueDays === 0 ? "просрочено сегодня"
      : overdueDays === 1 ? "просрочено вчера"
      : `просрочено ${overdueDays}д`;
    return { state: "overdue", label, emoji: "🔥", colorClass: "text-red-600", bgClass: "bg-red-50" };
  }

  // Критично — меньше 24 часов
  if (diffHours < 24) {
    const h = Math.floor(diffHours);
    const m = Math.floor((diffHours - h) * 60);
    const label = h === 0 ? `${m}мин` : `${h}ч ${m}мин`;
    return { state: "critical", label, emoji: "⚠️", colorClass: "text-orange-600", bgClass: "bg-orange-50" };
  }

  // Скоро — меньше 3 дней
  if (diffDays <= 3) {
    const label = diffDays === 1 ? "завтра" : `${diffDays}д`;
    return { state: "warning", label, emoji: "⏰", colorClass: "text-yellow-700", bgClass: "bg-yellow-50" };
  }

  // Норма
  const label = new Date(dueDate).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
  return { state: "normal", label, emoji: "", colorClass: "text-gray-500", bgClass: "bg-gray-50" };
}

// Форматирует обратный отсчёт для таймера
export function formatCountdown(dueDate: string): string {
  const now = new Date();
  const due = new Date(dueDate + "T23:59:59");
  const diffMs = due.getTime() - now.getTime();

  if (diffMs < 0) {
    const abs = Math.abs(diffMs);
    const d = Math.floor(abs / (1000 * 60 * 60 * 24));
    const h = Math.floor((abs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((abs % (1000 * 60 * 60)) / (1000 * 60));
    if (d > 0) return `-${d}д ${h}ч`;
    return `-${h}ч ${m}мин`;
  }

  const d = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const h = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diffMs % (1000 * 60)) / 1000);

  if (d > 0) return `${d}д ${h}ч`;
  if (h > 0) return `${h}ч ${m}мин`;
  return `${m}м ${s}с`;
}
