import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Eye, MessageSquareText, Building2, TrendingUp, Phone,
  Calendar, ArrowUpRight, ArrowDownRight, Minus,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Period = "7d" | "30d" | "90d" | "all";

const PERIOD_LABELS: Record<Period, string> = {
  "7d": "7 дней",
  "30d": "30 дней",
  "90d": "90 дней",
  all: "Всё время",
};

interface PropertyStat {
  id: string;
  address: string;
  type: string;
  views_count: number;
  cover_photo: string | null;
  moderation_status: string;
  created_at: string;
}

interface LeadRow {
  id: string;
  object_id: string | null;
  created_at: string;
  source: string;
  name: string | null;
  phone: string | null;
}

interface EventRow {
  id: string;
  object_id: string | null;
  event_type: string;
  created_at: string;
}

function useAnalytics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["analytics", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: props } = await supabase
        .from("properties")
        .select("id, address, type, views_count, cover_photo, moderation_status, created_at")
        .eq("submitted_by", user!.id)
        .order("views_count", { ascending: false });

      if (!props?.length) return {
        properties: [] as PropertyStat[],
        leads: [] as LeadRow[],
        events: [] as EventRow[],
      };

      const propIds = props.map((p) => p.id);

      const [leadsRes, eventsRes] = await Promise.all([
        supabase.from("crm_leads").select("id, object_id, created_at, source, name, phone").in("object_id", propIds).order("created_at", { ascending: true }),
        supabase.from("crm_events").select("id, object_id, event_type, created_at").in("object_id", propIds).order("created_at", { ascending: true }),
      ]);

      return {
        properties: props as PropertyStat[],
        leads: (leadsRes.data || []) as LeadRow[],
        events: (eventsRes.data || []) as EventRow[],
      };
    },
  });
}

function getPeriodStart(period: Period): Date {
  const now = new Date();
  if (period === "7d") return new Date(now.getTime() - 7 * 86400000);
  if (period === "30d") return new Date(now.getTime() - 30 * 86400000);
  if (period === "90d") return new Date(now.getTime() - 90 * 86400000);
  return new Date(2020, 0, 1);
}

function groupByDay(items: { created_at: string }[], periodStart: Date): { date: string; count: number }[] {
  const map: Record<string, number> = {};
  for (const item of items) {
    const d = new Date(item.created_at);
    if (d < periodStart) continue;
    const key = d.toISOString().slice(0, 10);
    map[key] = (map[key] || 0) + 1;
  }

  const now = new Date();
  const start = periodStart > new Date(2020, 0, 1) ? periodStart : items.length ? new Date(items[0].created_at) : now;
  const result: { date: string; count: number }[] = [];
  const cur = new Date(start);
  while (cur <= now) {
    const key = cur.toISOString().slice(0, 10);
    result.push({ date: key, count: map[key] || 0 });
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function calcTrend(data: { count: number }[]): { pct: number; direction: "up" | "down" | "flat" } {
  if (data.length < 2) return { pct: 0, direction: "flat" };
  const half = Math.floor(data.length / 2);
  const first = data.slice(0, half).reduce((s, d) => s + d.count, 0);
  const second = data.slice(half).reduce((s, d) => s + d.count, 0);
  if (first === 0 && second === 0) return { pct: 0, direction: "flat" };
  if (first === 0) return { pct: 100, direction: "up" };
  const pct = Math.round(((second - first) / first) * 100);
  return { pct: Math.abs(pct), direction: pct > 0 ? "up" : pct < 0 ? "down" : "flat" };
}

const PIE_COLORS = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

function StatCard({ icon: Icon, label, value, trend, color }: {
  icon: React.ElementType;
  label: string;
  value: number;
  trend?: { pct: number; direction: "up" | "down" | "flat" };
  color: string;
}) {
  return (
    <div className="bg-card rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
        </div>
        {trend && trend.direction !== "flat" && (
          <span className={`flex items-center gap-0.5 text-[11px] font-medium ${
            trend.direction === "up" ? "text-emerald-600" : "text-red-500"
          }`}>
            {trend.direction === "up" ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {trend.pct}%
          </span>
        )}
        {trend && trend.direction === "flat" && (
          <span className="flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground">
            <Minus className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-foreground">{value.toLocaleString("ru-RU")}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl p-4">
      <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>
      {children}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg text-xs">
      <div className="text-muted-foreground mb-1">{formatDateLabel(label)}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-foreground font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function StatsTab() {
  const { data, isLoading } = useAnalytics();
  const [period, setPeriod] = useState<Period>("30d");

  const analytics = useMemo(() => {
    if (!data) return null;
    const { properties, leads, events } = data;
    const periodStart = getPeriodStart(period);

    const viewEvents = events.filter((e) => e.event_type === "view" || e.event_type === "page_view");
    const viewsTimeline = groupByDay(viewEvents.length ? viewEvents : [], periodStart);
    const leadsTimeline = groupByDay(leads, periodStart);

    const periodLeads = leads.filter((l) => new Date(l.created_at) >= periodStart);
    const periodViews = viewEvents.filter((e) => new Date(e.created_at) >= periodStart);

    const totalViews = properties.reduce((s, p) => s + (p.views_count || 0), 0);

    const leadsByProperty: Record<string, number> = {};
    for (const l of periodLeads) {
      if (l.object_id) leadsByProperty[l.object_id] = (leadsByProperty[l.object_id] || 0) + 1;
    }

    const typeDistribution: Record<string, number> = {};
    for (const p of properties) {
      typeDistribution[p.type] = (typeDistribution[p.type] || 0) + 1;
    }
    const pieData = Object.entries(typeDistribution).map(([name, value]) => ({ name, value }));

    const sourceDistribution: Record<string, number> = {};
    for (const l of periodLeads) {
      const src = l.source === "owner_message" ? "Вопрос" : l.source === "property_contact" ? "Форма" : l.source;
      sourceDistribution[src] = (sourceDistribution[src] || 0) + 1;
    }
    const sourcePie = Object.entries(sourceDistribution).map(([name, value]) => ({ name, value }));

    const combined = viewsTimeline.map((v, i) => ({
      date: v.date,
      views: v.count,
      leads: leadsTimeline[i]?.count || 0,
    }));

    return {
      totalViews,
      totalLeads: leads.length,
      periodLeads: periodLeads.length,
      periodViews: periodViews.length,
      properties,
      leadsByProperty,
      combined,
      leadsTimeline,
      pieData,
      sourcePie,
      viewsTrend: calcTrend(viewsTimeline),
      leadsTrend: calcTrend(leadsTimeline),
    };
  }, [data, period]);

  if (isLoading) {
    return (
      <div>
        <h2 className="font-display text-xl font-bold text-foreground mb-5">Статистика</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card rounded-xl h-[100px] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!analytics || !analytics.properties.length) {
    return (
      <div>
        <h2 className="font-display text-xl font-bold text-foreground mb-5">Статистика</h2>
        <div className="bg-card rounded-xl p-12 text-center">
          <TrendingUp className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">Нет данных</p>
          <p className="text-xs text-muted-foreground">Добавьте объекты чтобы увидеть статистику</p>
        </div>
      </div>
    );
  }

  const publishedCount = analytics.properties.filter((p) => p.moderation_status === "published").length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="font-display text-xl font-bold text-foreground">Статистика</h2>
        <div className="flex gap-1 p-0.5 bg-muted rounded-lg">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                period === p ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={Building2}
          label="Объектов"
          value={analytics.properties.length}
          color="bg-primary/10 text-primary"
        />
        <StatCard
          icon={Eye}
          label="Просмотров всего"
          value={analytics.totalViews}
          trend={analytics.viewsTrend}
          color="bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
        />
        <StatCard
          icon={MessageSquareText}
          label={`Заявок за ${PERIOD_LABELS[period]}`}
          value={analytics.periodLeads}
          trend={analytics.leadsTrend}
          color="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
        />
        <StatCard
          icon={Phone}
          label="Всего заявок"
          value={analytics.totalLeads}
          color="bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
        />
      </div>

      {/* Main charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ChartCard title="Заявки по дням">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.combined}>
                <defs>
                  <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateLabel}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={40}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="leads"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#leadsGrad)"
                  name="Заявки"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Просмотры по дням">
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.combined}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDateLabel}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={40}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="views" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Просмотры" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Pie charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {analytics.pieData.length > 0 && (
          <ChartCard title="Типы объектов">
            <div className="flex items-center gap-4">
              <div className="w-[140px] h-[140px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics.pieData} dataKey="value" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                      {analytics.pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 flex-1">
                {analytics.pieData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-foreground flex-1">{d.name}</span>
                    <span className="text-muted-foreground font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        )}

        {analytics.sourcePie.length > 0 && (
          <ChartCard title="Источники заявок">
            <div className="flex items-center gap-4">
              <div className="w-[140px] h-[140px] shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics.sourcePie} dataKey="value" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                      {analytics.sourcePie.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[(i + 2) % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 flex-1">
                {analytics.sourcePie.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[(i + 2) % PIE_COLORS.length] }} />
                    <span className="text-foreground flex-1">{d.name}</span>
                    <span className="text-muted-foreground font-medium">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        )}
      </div>

      {/* Per-property table */}
      <ChartCard title="Детализация по объектам">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground">
                <th className="text-left font-medium pb-3 pr-4">Объект</th>
                <th className="text-right font-medium pb-3 px-2 whitespace-nowrap">Просмотры</th>
                <th className="text-right font-medium pb-3 px-2 whitespace-nowrap">Заявки</th>
                <th className="text-right font-medium pb-3 pl-2 whitespace-nowrap">Конверсия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {analytics.properties.map((p) => {
                const leads = analytics.leadsByProperty[p.id] || 0;
                const views = p.views_count || 0;
                const conv = views > 0 ? ((leads / views) * 100).toFixed(1) : "—";
                return (
                  <tr key={p.id} className="group">
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2.5">
                        {p.cover_photo ? (
                          <img src={p.cover_photo} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-medium text-foreground truncate max-w-[200px]">{p.address}</div>
                          <div className="text-[10px] text-muted-foreground">{p.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-right text-foreground font-medium">{views.toLocaleString("ru-RU")}</td>
                    <td className="py-2.5 px-2 text-right text-foreground font-medium">{leads}</td>
                    <td className="py-2.5 pl-2 text-right">
                      <span className={`font-medium ${typeof conv === "string" && conv !== "—" && parseFloat(conv) > 0 ? "text-emerald-600" : "text-muted-foreground"}`}>
                        {conv}{conv !== "—" ? "%" : ""}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}
