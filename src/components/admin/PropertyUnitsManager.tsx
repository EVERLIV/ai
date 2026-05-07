import { useState } from "react";
import { usePropertyUnits, useUpsertUnit, useDeleteUnit, type PropertyUnit } from "@/hooks/usePropertyUnits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, X, Upload, ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  propertyId: string;
}

type Draft = Partial<PropertyUnit> & { id?: string };

const PURPOSES = ["Своб. назначения", "Офис", "Торговая", "Склад", "Производство", "Общепит", "Услуги"];

export default function PropertyUnitsManager({ propertyId }: Props) {
  const { data: units = [], isLoading } = usePropertyUnits(propertyId);
  const upsert = useUpsertUnit(propertyId);
  const remove = useDeleteUnit(propertyId);
  const { toast } = useToast();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [uploading, setUploading] = useState(false);

  const startNew = () => setDraft({ name: "", floor: "", area: 0, price: 0, price_per_m2: 0, purpose: "Своб. назначения", status: "available", sort_order: units.length, photos: [] });
  const startEdit = (u: PropertyUnit) => setDraft({ ...u, photos: u.photos || [] });

  const handleUpload = async (files: FileList | null) => {
    if (!files || !draft) return;
    setUploading(true);
    try {
      const urls: string[] = [...(draft.photos || [])];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop();
        const path = `${propertyId}/units/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("property-photos").upload(path, file);
        if (error) throw error;
        const { data } = supabase.storage.from("property-photos").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      setDraft({ ...draft, photos: urls });
    } catch (e: any) {
      toast({ title: "Ошибка загрузки", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (i: number) => {
    if (!draft) return;
    const photos = [...(draft.photos || [])];
    photos.splice(i, 1);
    setDraft({ ...draft, photos });
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.name?.trim()) { toast({ title: "Укажите название", variant: "destructive" }); return; }
    try {
      const area = Number(draft.area || 0);
      const price = Number(draft.price || 0);
      const ppm = area > 0 && price > 0 ? Math.round(price / area) : Number(draft.price_per_m2 || 0);
      await upsert.mutateAsync({ ...draft, price_per_m2: ppm });
      setDraft(null);
      toast({ title: "Сохранено" });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message, variant: "destructive" });
    }
  };

  const del = async (id: string) => {
    if (!confirm("Удалить помещение?")) return;
    await remove.mutateAsync(id);
    toast({ title: "Удалено" });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Помещения внутри объекта (этажи / блоки / точки в ТЦ)</p>
        {!draft && (
          <Button type="button" size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={startNew}>
            <Plus className="w-3.5 h-3.5" /> Добавить помещение
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-xs text-muted-foreground py-2">Загрузка…</div>
      ) : units.length === 0 && !draft ? (
        <div className="text-xs text-muted-foreground py-2">Помещения не добавлены</div>
      ) : (
        <div className="border border-border rounded overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-2 py-1.5">Название</th>
                <th className="text-left font-medium px-2 py-1.5 w-16">Этаж</th>
                <th className="text-left font-medium px-2 py-1.5">Назначение</th>
                <th className="text-right font-medium px-2 py-1.5 w-20">м²</th>
                <th className="text-right font-medium px-2 py-1.5 w-28">Цена ₽</th>
                <th className="text-center font-medium px-2 py-1.5 w-24">Статус</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {units.map((u) => (
                <tr key={u.id} className="hover:bg-muted/20">
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-2">
                      {u.photos?.[0] ? (
                        <img src={u.photos[0]} alt="" className="w-8 h-8 rounded object-cover border border-border" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center"><ImageIcon className="w-3.5 h-3.5 text-muted-foreground" /></div>
                      )}
                      <span>{u.name}</span>
                      {u.photos && u.photos.length > 0 && (
                        <span className="text-[10px] text-muted-foreground">×{u.photos.length}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-1.5">{u.floor || "—"}</td>
                  <td className="px-2 py-1.5 text-muted-foreground">{u.purpose || "—"}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{Number(u.area).toLocaleString("ru-RU")}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">{Number(u.price).toLocaleString("ru-RU")}</td>
                  <td className="px-2 py-1.5 text-center">
                    {u.status === "available" ? "Свободно" : u.status === "reserved" ? "Бронь" : "Занято"}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <button type="button" onClick={() => startEdit(u)} className="text-primary hover:underline text-[11px] mr-2">Изм.</button>
                    <button type="button" onClick={() => del(u.id)} className="text-destructive hover:underline text-[11px]">
                      <Trash2 className="w-3 h-3 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {draft && (
        <div className="border border-primary/30 rounded p-2 space-y-2 bg-primary/5">
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
            <Input className="h-8 text-xs col-span-2" placeholder="Название (напр. Помещение 12)" value={draft.name || ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            <Input className="h-8 text-xs" placeholder="Этаж" value={draft.floor || ""} onChange={(e) => setDraft({ ...draft, floor: e.target.value })} />
            <Select value={draft.purpose || "Своб. назначения"} onValueChange={(v) => setDraft({ ...draft, purpose: v })}>
              <SelectTrigger className="h-8 text-xs col-span-2"><SelectValue /></SelectTrigger>
              <SelectContent>{PURPOSES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={draft.status || "available"} onValueChange={(v) => setDraft({ ...draft, status: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Свободно</SelectItem>
                <SelectItem value="reserved">Бронь</SelectItem>
                <SelectItem value="occupied">Занято</SelectItem>
              </SelectContent>
            </Select>
            <Input className="h-8 text-xs" type="number" placeholder="Площадь м²" value={draft.area || ""} onChange={(e) => setDraft({ ...draft, area: Number(e.target.value) })} />
            <Input className="h-8 text-xs col-span-2" type="number" placeholder="Цена ₽" value={draft.price || ""} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setDraft(null)}>
              <X className="w-3.5 h-3.5 mr-1" /> Отмена
            </Button>
            <Button type="button" size="sm" className="h-7 text-xs" onClick={save} disabled={upsert.isPending}>
              <Save className="w-3.5 h-3.5 mr-1" /> Сохранить
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
