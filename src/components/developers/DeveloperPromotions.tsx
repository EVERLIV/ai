import { Percent } from "lucide-react";
import type { DeveloperPromotion } from "@/lib/developerTypes";

type Props = {
  promotions: DeveloperPromotion[];
};

export default function DeveloperPromotions({ promotions }: Props) {
  if (!promotions.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Акции от застройщика</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {promotions.map((p) => (
          <div
            key={p.title}
            className="rounded-xl border border-border/60 bg-card p-4 flex gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Percent className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold">{p.title}</h3>
                {p.badge && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                    {p.badge}
                  </span>
                )}
              </div>
              {p.text && (
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {p.text}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
