import { BarChart3, Loader2 } from "lucide-react";
import { useDeveloperEventStats, useMyDeveloper } from "@/hooks/useDeveloper";

const EVENT_LABELS: Record<string, string> = {
  view_developer: "Просмотры карточки",
  view_project: "Просмотры проектов",
  click_layout: "Клики по планировкам",
  lead_submit: "Заявки",
};

export default function DeveloperStatsPanel() {
  const { data: developer, isLoading: devLoading } = useMyDeveloper();
  const { data: stats = [], isLoading } = useDeveloperEventStats();

  if (devLoading || isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" /> Загрузка статистики…
      </div>
    );
  }

  if (!developer) return null;

  const total = stats.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">События застройщика</h3>
      </div>
      <p className="text-xs text-muted-foreground">
        Данные из append-only таблицы developer_analytics_events (без ClickHouse
        на MVP).
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border/60 p-3 bg-card">
          <div className="text-lg font-semibold tabular-nums">{total}</div>
          <div className="text-[11px] text-muted-foreground">Всего событий</div>
        </div>
        {stats.map((s) => (
          <div
            key={s.event_type}
            className="rounded-lg border border-border/60 p-3 bg-card"
          >
            <div className="text-lg font-semibold tabular-nums">{s.count}</div>
            <div className="text-[11px] text-muted-foreground">
              {EVENT_LABELS[s.event_type] || s.event_type}
            </div>
          </div>
        ))}
      </div>
      {stats.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Пока нет событий — они появятся после просмотров публичных страниц.
        </p>
      )}
    </div>
  );
}
