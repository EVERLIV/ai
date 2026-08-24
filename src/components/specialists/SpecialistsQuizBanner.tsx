import { cn } from "@/lib/utils";

type Props = {
  onOpenQuiz: () => void;
  className?: string;
};

export default function SpecialistsQuizBanner({
  onOpenQuiz,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-sky-100 bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 px-5 py-5 sm:px-6 sm:py-6",
        className,
      )}
    >
      <div className="relative z-[1] max-w-xl">
        <h2 className="text-lg sm:text-xl font-bold text-foreground leading-snug">
          Подберём лучшего специалиста под ваш запрос
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
          Без предоплат и скрытых комиссий — оплата только агенту и только
          после сделки
        </p>
        <button
          type="button"
          onClick={onOpenQuiz}
          className="mt-4 ui-btn-primary"
        >
          Оставить заявку
        </button>
      </div>
    </div>
  );
}
