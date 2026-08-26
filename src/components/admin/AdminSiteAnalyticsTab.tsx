import { Activity, Eye, Home, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminSiteStats } from "@/lib/adminAnalytics";

export default function AdminSiteAnalyticsTab() {
  const { data, isLoading, isFetching, refetch, error } = useAdminSiteStats(true);

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-sm text-muted-foreground text-center">
          Не удалось загрузить аналитику. Примените SQL{" "}
          <code className="text-xs">search_subscriptions_and_analytics.sql</code>
          .
        </CardContent>
      </Card>
    );
  }

  const stats = data;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">Аналитика сайта</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Realtime presence и просмотры (обновление ~30 с)
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`}
          />
          Обновить
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Activity className="w-4 h-4 text-emerald-600" />}
          label="Сейчас онлайн"
          value={isLoading ? "…" : String(stats?.onlineCount ?? 0)}
          hint="heartbeat < 2 мин"
        />
        <StatCard
          icon={<Eye className="w-4 h-4 text-primary" />}
          label="Просмотры страниц"
          value={isLoading ? "…" : String(stats?.pageViews24h ?? 0)}
          hint={`7 дней: ${stats?.pageViews7d ?? 0}`}
        />
        <StatCard
          icon={<Home className="w-4 h-4 text-primary" />}
          label="Просмотры объектов"
          value={isLoading ? "…" : String(stats?.propertyViews24h ?? 0)}
          hint={`7 дней: ${stats?.propertyViews7d ?? 0}`}
        />
        <StatCard
          icon={<Eye className="w-4 h-4 text-muted-foreground" />}
          label="Топ-разделы"
          value={isLoading ? "…" : String(stats?.topSections?.[0]?.section || "—")}
          hint={
            stats?.topSections?.[0]
              ? `${stats.topSections[0].count} событий`
              : "пока нет данных"
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-semibold">Пути (7 дней)</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Путь</TableHead>
                  <TableHead className="text-right w-20">Просм.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(stats?.topPaths || []).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="text-center text-muted-foreground text-sm py-8"
                    >
                      Пока нет данных
                    </TableCell>
                  </TableRow>
                ) : (
                  stats!.topPaths.map((r) => (
                    <TableRow key={r.path}>
                      <TableCell className="font-mono text-xs truncate max-w-[240px]">
                        {r.path}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.count}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-semibold">
              Разделы и объекты
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4 pb-4">
            <div className="flex flex-wrap gap-2">
              {(stats?.topSections || []).map((s) => (
                <Badge key={s.section} variant="secondary" className="gap-1.5">
                  {s.section}
                  <span className="tabular-nums opacity-70">{s.count}</span>
                </Badge>
              ))}
              {!stats?.topSections?.length && (
                <span className="text-xs text-muted-foreground">Нет данных</span>
              )}
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID объекта</TableHead>
                  <TableHead className="text-right w-20">Просм.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(stats?.topProperties || []).length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="text-center text-muted-foreground text-sm py-6"
                    >
                      Нет просмотров объектов
                    </TableCell>
                  </TableRow>
                ) : (
                  stats!.topProperties.map((r) => (
                    <TableRow key={r.property_id}>
                      <TableCell className="font-mono text-xs">
                        {r.property_id.slice(0, 8)}…
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r.count}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4 space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {icon}
          {label}
        </div>
        <p className="text-2xl font-semibold tabular-nums tracking-tight">
          {value}
        </p>
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
