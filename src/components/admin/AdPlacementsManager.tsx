import { useState } from "react";
import {
  useAdPlacementsByProperty,
  useUpsertAdPlacement,
  useDeleteAdPlacement,
  type DbAdPlacement,
} from "@/hooks/useAdPlacements";
import {
  AD_TYPES, AD_TYPE_MAP, TRAFFIC_LABELS, AVAILABILITY_LABELS,
  AVAILABILITY_BADGE, LIGHTING_OPTIONS, SIDE_OPTIONS,
  type AdTypeKey, type TrafficKey, type AvailabilityKey,
} from "@/lib/adTypes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit2, Megaphone, Check, X } from "lucide-react";

interface Props {
  propertyId: string;
}

interface DraftRow {
  id?: string;
  ad_type: AdTypeKey;
  monthly_price: number;
  traffic: TrafficKey;
  availability: AvailabilityKey;
  side: string;
  lighting: string;
  width_m: number;
  height_m: number;
}

const empty: DraftRow = {
  ad_type: "billboard",
  monthly_price: 35000,
  traffic: "medium",
  availability: "available",
  side: "Фасад",
  lighting: "day",
  width_m: 3,
  height_m: 6,
};

export default function AdPlacementsManager({ propertyId }: Props) {
  const { data = [], isLoading } = useAdPlacementsByProperty(propertyId);
  const upsert = useUpsertAdPlacement();
  const del = useDeleteAdPlacement();
  const { toast } = useToast();

  const [draft, setDraft] = useState<DraftRow | null>(null);

  const startNew = () => setDraft({ ...empty });
  const startEdit = (row: DbAdPlacement) =>
    setDraft({
      id: row.id,
      ad_type: row.ad_type as AdTypeKey,
      monthly_price: Number(row.monthly_price),
      traffic: row.traffic as TrafficKey,
      availability: row.availability as AvailabilityKey,
      side: row.side || "",
      lighting: row.lighting || "day",
      width_m: Number(row.width_m) || 0,
      height_m: Number(row.height_m) || 0,
    });

  const cancel = () => setDraft(null);

  const save = async () => {
    if (!draft) return;
    try {
      await upsert.mutateAsync({
        ...(draft.id ? { id: draft.id } : {}),
        property_id: propertyId,
        ad_type: draft.ad_type,
        monthly_price: draft.monthly_price,
        traffic: draft.traffic,
        availability: draft.availability,
        side: draft.side,
        lighting: draft.lighting,
        width_m: draft.width_m,
        height_m: draft.height_m,
        is_active: true,
      } as any);
      setDraft(null);
      toast({ title: draft.id ? "Позиция обновлена" : "Позиция добавлена" });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Удалить рекламную позицию?")) return;
    try {
      await del.mutateAsync(id);
      toast({ title: "Удалено" });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Рекламные размещения
          </span>
          <span className="text-[11px] text-muted-foreground">({data.length})</span>
        </div>
        {!draft && (
          <Button type="button" size="sm" variant="outline" onClick={startNew} className="h-7 text-xs">
            <Plus className="w-3 h-3 mr-1" />
            Добавить
          </Button>
        )}
      </div>

      {/* Inline edit form */}
      {draft && (
        <div className="border border-primary/30 bg-primary/5 rounded-md p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Label className="text-[10px] mb-1 block">Тип рекламы</Label>
              <Select value={draft.ad_type} onValueChange={(v) => setDraft({ ...draft, ad_type: v as AdTypeKey })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AD_TYPES.map((t) => (
                    <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] mb-1 block">Цена / мес, ₽</Label>
              <Input type="number" className="h-8 text-xs" value={draft.monthly_price || ""}
                onChange={(e) => setDraft({ ...draft, monthly_price: Number(e.target.value) })} />
            </div>
            <div>
              <Label className="text-[10px] mb-1 block">Доступность</Label>
              <Select value={draft.availability} onValueChange={(v) => setDraft({ ...draft, availability: v as AvailabilityKey })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["available", "reserved", "occupied"] as AvailabilityKey[]).map((a) => (
                    <SelectItem key={a} value={a}>{AVAILABILITY_LABELS[a]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] mb-1 block">Трафик</Label>
              <Select value={draft.traffic} onValueChange={(v) => setDraft({ ...draft, traffic: v as TrafficKey })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(["low", "medium", "high"] as TrafficKey[]).map((t) => (
                    <SelectItem key={t} value={t}>{TRAFFIC_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] mb-1 block">Сторона</Label>
              <Select value={draft.side || "Фасад"} onValueChange={(v) => setDraft({ ...draft, side: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SIDE_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] mb-1 block">Освещение</Label>
              <Select value={draft.lighting} onValueChange={(v) => setDraft({ ...draft, lighting: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LIGHTING_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[10px] mb-1 block">Ширина, м</Label>
              <Input type="number" step="0.1" className="h-8 text-xs" value={draft.width_m || ""}
                onChange={(e) => setDraft({ ...draft, width_m: Number(e.target.value) })} />
            </div>
            <div>
              <Label className="text-[10px] mb-1 block">Высота, м</Label>
              <Input type="number" step="0.1" className="h-8 text-xs" value={draft.height_m || ""}
                onChange={(e) => setDraft({ ...draft, height_m: Number(e.target.value) })} />
            </div>
          </div>
          <div className="flex justify-end gap-1.5 pt-1">
            <Button type="button" size="sm" variant="ghost" onClick={cancel} className="h-7 text-xs">
              <X className="w-3 h-3 mr-1" />Отмена
            </Button>
            <Button type="button" size="sm" onClick={save} disabled={upsert.isPending} className="h-7 text-xs">
              <Check className="w-3 h-3 mr-1" />
              {upsert.isPending ? "..." : "Сохранить"}
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="text-xs text-muted-foreground py-4 text-center">Загрузка...</div>
      ) : data.length === 0 && !draft ? (
        <div className="text-xs text-muted-foreground py-4 text-center border border-dashed border-border rounded-md">
          Нет рекламных позиций. Нажмите «Добавить»
        </div>
      ) : (
        <div className="space-y-1.5">
          {data.map((row) => {
            const meta = AD_TYPE_MAP[row.ad_type as AdTypeKey];
            const Icon = meta?.icon || Megaphone;
            return (
              <div
                key={row.id}
                className="flex items-center gap-2 p-2 border border-border rounded-md text-xs hover:bg-muted/40"
              >
                <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-foreground truncate">{meta?.short}</span>
                    <span className={`px-1.5 py-0.5 text-[9px] uppercase tracking-wide ${AVAILABILITY_BADGE[row.availability as AvailabilityKey]}`}>
                      {AVAILABILITY_LABELS[row.availability as AvailabilityKey]}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Трафик: {TRAFFIC_LABELS[row.traffic as TrafficKey]}
                    </span>
                    {(row.width_m || row.height_m) ? (
                      <span className="text-[10px] text-muted-foreground">
                        {row.width_m}×{row.height_m} м
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="font-semibold text-foreground shrink-0">
                  {Number(row.monthly_price).toLocaleString("ru-RU")} ₽
                </div>
                <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => startEdit(row)}>
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => remove(row.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
