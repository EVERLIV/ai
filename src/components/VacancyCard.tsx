import { Banknote, Briefcase, CheckCircle2, Clock, MapPin } from "lucide-react";
import type { Vacancy } from "@/data/vacancies";

type Props = {
  vacancy: Vacancy;
  onApply: (title: string) => void;
};

export default function VacancyCard({ vacancy, onApply }: Props) {
  return (
    <article className="bg-card border border-border overflow-hidden">
      <div className="p-6 sm:p-8 border-b border-border bg-muted/20">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider mb-3">
              <Briefcase className="w-3 h-3" />
              {vacancy.department}
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              {vacancy.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
              {vacancy.intro}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onApply(vacancy.title)}
            className="shrink-0 h-10 px-5 bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Откликнуться
          </button>
        </div>

        <div className="flex flex-wrap gap-4 mt-5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Banknote className="w-3.5 h-3.5 text-primary" />
            {vacancy.salary}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            {vacancy.location}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary" />
            {vacancy.schedule}
          </span>
          <span>{vacancy.employment}</span>
        </div>
      </div>

      <div className="p-6 sm:p-8 grid sm:grid-cols-3 gap-8">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
            Задачи
          </h3>
          <ul className="space-y-2">
            {vacancy.tasks.map((item) => (
              <li
                key={item}
                className="flex gap-2 text-sm text-muted-foreground leading-relaxed"
              >
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
            Требования
          </h3>
          <ul className="space-y-2">
            {vacancy.requirements.map((item) => (
              <li
                key={item}
                className="flex gap-2 text-sm text-muted-foreground leading-relaxed"
              >
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
            Условия
          </h3>
          <ul className="space-y-2">
            {vacancy.conditions.map((item) => (
              <li
                key={item}
                className="flex gap-2 text-sm text-muted-foreground leading-relaxed"
              >
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
