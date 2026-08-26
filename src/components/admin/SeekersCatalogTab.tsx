import { useQuery } from "@tanstack/react-query";
import { Bell, BellOff, RefreshCw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ACCOUNT_TYPE_LABELS } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import type { SearchSubscription } from "@/lib/searchSubscriptions";

type SeekerRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  created_at: string | null;
  account_type: string;
};

type FilterMode = "all" | "subscribed" | "unsubscribed";

export default function SeekersCatalogTab() {
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<FilterMode>("all");

  const {
    data,
    isLoading,
    refetch,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["admin-seekers"],
    queryFn: async () => {
      const [profilesRes, subsRes, presenceRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email, created_at, account_type")
          .eq("account_type", "seeker")
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("search_subscriptions" as never)
          .select("*")
          .eq("is_active", true),
        supabase
          .from("site_presence" as never)
          .select("user_id, last_seen_at, path")
          .not("user_id", "is", null)
          .order("last_seen_at", { ascending: false })
          .limit(500),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (subsRes.error) throw subsRes.error;

      const seekers = (profilesRes.data || []) as SeekerRow[];
      const subs = (subsRes.data || []) as unknown as SearchSubscription[];
      const presence = (presenceRes.data || []) as unknown as {
        user_id: string;
        last_seen_at: string;
        path: string | null;
      }[];

      const subByUser = new Map(subs.map((s) => [s.user_id, s]));
      const lastByUser = new Map<string, { at: string; path: string | null }>();
      for (const p of presence) {
        if (!p.user_id || lastByUser.has(p.user_id)) continue;
        lastByUser.set(p.user_id, { at: p.last_seen_at, path: p.path });
      }

      return { seekers, subByUser, lastByUser };
    },
    refetchInterval: 30_000,
  });

  const rows = useMemo(() => {
    if (!data) return [];
    const needle = q.trim().toLowerCase();
    return data.seekers
      .map((s) => {
        const sub = data.subByUser.get(s.id) || null;
        const last = data.lastByUser.get(s.id) || null;
        return { seeker: s, sub, last };
      })
      .filter(({ seeker, sub }) => {
        if (mode === "subscribed" && !sub) return false;
        if (mode === "unsubscribed" && sub) return false;
        if (!needle) return true;
        const hay = `${seeker.full_name || ""} ${seeker.email || ""}`.toLowerCase();
        return hay.includes(needle);
      });
  }, [data, mode, q]);

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-sm text-muted-foreground text-center">
          Не удалось загрузить список. Проверьте SQL и RLS.
        </CardContent>
      </Card>
    );
  }

  const subscribedCount = data
    ? data.seekers.filter((s) => data.subByUser.has(s.id)).length
    : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">Ищут недвижимость</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Профили «{ACCOUNT_TYPE_LABELS.seeker}». С подпиской:{" "}
            {subscribedCount} / {data?.seekers.length ?? 0}
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

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Имя или email"
            className="pl-8 h-9"
          />
        </div>
        <Select
          value={mode}
          onValueChange={(v) => setMode(v as FilterMode)}
        >
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="subscribed">С подпиской</SelectItem>
            <SelectItem value="unsubscribed">Без подписки</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Имя</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Регистрация</TableHead>
                <TableHead>Подписка</TableHead>
                <TableHead>Типы</TableHead>
                <TableHead>Активность</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-10 text-sm"
                  >
                    Загрузка…
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-10 text-sm"
                  >
                    Никого не найдено
                  </TableCell>
                </TableRow>
              ) : (
                rows.map(({ seeker, sub, last }) => (
                  <TableRow key={seeker.id}>
                    <TableCell className="font-medium text-sm">
                      {seeker.full_name || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {seeker.email || "—"}
                    </TableCell>
                    <TableCell className="text-xs tabular-nums whitespace-nowrap">
                      {seeker.created_at
                        ? new Date(seeker.created_at).toLocaleDateString("ru-RU")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {sub ? (
                        <Badge className="gap-1 bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-50">
                          <Bell className="w-3 h-3" />
                          Подписан
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <BellOff className="w-3 h-3" />
                          Нет
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs max-w-[180px]">
                      {sub?.property_types?.length
                        ? sub.property_types.join(", ")
                        : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {last
                        ? new Date(last.at).toLocaleString("ru-RU", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
