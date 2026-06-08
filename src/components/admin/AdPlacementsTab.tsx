import { useMemo, useState } from "react";
import { useAllAdPlacements, useDeleteAdPlacement } from "@/hooks/useAdPlacements";
import {
  AD_TYPES, AD_TYPE_MAP, TRAFFIC_LABELS, AVAILABILITY_LABELS, AVAILABILITY_BADGE,
  type AdTypeKey, type TrafficKey, type AvailabilityKey,
} from "@/lib/adTypes";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Search, Trash2, Megaphone } from "lucide-react";

export default function AdPlacementsTab() {
  const { data = [], isLoading } = useAllAdPlacements();
  const del = useDeleteAdPlacement();
  const { toast } = useToast();

  const [q, setQ] = useState("");
  const [type, setType] = useState<AdTypeKey | "all">("all");
  const [avail, setAvail] = useState<AvailabilityKey | "all">("all");

  const filtered = useMemo(() => {
    let list = data as any[];
    if (q) {
      const s = q.toLowerCase();
      list = list.filter((p) =>
        (p.property?.address || "").toLowerCase().includes(s) ||
        (p.property?.district || "").toLowerCase().includes(s)
      );
    }
    if (type !== "all") list = list.filter((p) => p.ad_type === type);
    if (avail !== "all") list = list.filter((p) => p.availability === avail);
    return list;
  }, [data, q, type, avail]);

  const remove = async (id: string) => {
    if (!confirm("Удалить позицию?")) return;
    try {
      await del.mutateAsync(id);
      toast({ title: "Удалено" });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
  };

  const totalRevenue = filtered.reduce((s, p: any) => s + Number(p.monthly_price || 0), 0);
  const availableCount = (data as any[]).filter((p) => p.availability === "available").length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold">{data.length}</div>
            <div className="text-xs text-muted-foreground">Всего позиций</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold text-emerald-600">{availableCount}</div>
            <div className="text-xs text-muted-foreground">Свободно</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString("ru-RU")} ₽</div>
            <div className="text-xs text-muted-foreground">Потенциал в фильтре /мес</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="text-2xl font-bold">{filtered.length}</div>
            <div className="text-xs text-muted-foreground">В выборке</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск по адресу или району..."
            className="h-9 pl-8 text-xs"
          />
        </div>
        <Select value={type} onValueChange={(v) => setType(v as any)}>
          <SelectTrigger className="h-9 w-[180px] text-xs"><SelectValue placeholder="Тип" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все типы</SelectItem>
            {AD_TYPES.map((t) => (
              <SelectItem key={t.key} value={t.key}>{t.short}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={avail} onValueChange={(v) => setAvail(v as any)}>
          <SelectTrigger className="h-9 w-[140px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="available">Свободно</SelectItem>
            <SelectItem value="reserved">Бронь</SelectItem>
            <SelectItem value="occupied">Занято</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-md overflow-x-auto bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead>Тип рекламы</TableHead>
              <TableHead>Объект</TableHead>
              <TableHead>Район</TableHead>
              <TableHead>Размер</TableHead>
              <TableHead>Трафик</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="text-right">Цена/мес</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9} className="text-center text-xs text-muted-foreground py-6">Загрузка...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center text-xs text-muted-foreground py-6">
                <Megaphone className="w-6 h-6 mx-auto mb-2 opacity-40" />
                Ничего не найдено
              </TableCell></TableRow>
            ) : (
              filtered.map((row: any) => {
                const meta = AD_TYPE_MAP[row.ad_type as AdTypeKey];
                const Icon = meta?.icon || Megaphone;
                return (
                  <TableRow key={row.id}>
                    <TableCell><Icon className="w-3.5 h-3.5 text-muted-foreground" /></TableCell>
                    <TableCell className="text-xs font-medium">{meta?.short}</TableCell>
                    <TableCell className="text-xs max-w-[260px] truncate">{row.property?.address || "—"}</TableCell>
                    <TableCell className="text-xs">{row.property?.district || "—"}</TableCell>
                    <TableCell className="text-xs">{row.width_m}×{row.height_m} м</TableCell>
                    <TableCell className="text-xs">{TRAFFIC_LABELS[row.traffic as TrafficKey]}</TableCell>
                    <TableCell>
                      <span className={`px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${AVAILABILITY_BADGE[row.availability as AvailabilityKey]}`}>
                        {AVAILABILITY_LABELS[row.availability as AvailabilityKey]}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-right">
                      {Number(row.monthly_price).toLocaleString("ru-RU")} ₽
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => remove(row.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Подсказка: чтобы добавить или отредактировать позицию — откройте карточку объекта во вкладке «Объекты»; внутри редактирования есть блок «Рекламные размещения».
      </p>
    </div>
  );
}
