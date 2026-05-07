import { usePropertyUnits, type PropertyUnit } from "@/hooks/usePropertyUnits";
import { Layers } from "lucide-react";

interface Props {
  propertyId: string;
}

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  available: { text: "Свободно", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  reserved: { text: "Бронь", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  occupied: { text: "Занято", cls: "bg-muted text-muted-foreground border-border" },
};

export default function PropertyUnitsTable({ propertyId }: Props) {
  const { data: units = [], isLoading } = usePropertyUnits(propertyId);

  if (isLoading || units.length === 0) return null;

  const fmt = (n: number) => Number(n || 0).toLocaleString("ru-RU");

  return (
    <section className="mb-8">
      <h2 className="font-display text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
        <Layers className="w-5 h-5 text-primary" /> Помещения в объекте
        <span className="text-sm font-normal text-muted-foreground">({units.length})</span>
      </h2>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left font-medium px-4 py-2.5">Помещение</th>
                <th className="text-left font-medium px-4 py-2.5">Этаж</th>
                <th className="text-left font-medium px-4 py-2.5">Назначение</th>
                <th className="text-right font-medium px-4 py-2.5">Площадь</th>
                <th className="text-right font-medium px-4 py-2.5">Цена</th>
                <th className="text-center font-medium px-4 py-2.5">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {units.map((u: PropertyUnit) => {
                const st = STATUS_LABEL[u.status] || STATUS_LABEL.available;
                return (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{u.name || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.floor || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{u.purpose || "—"}</td>
                    <td className="px-4 py-3 text-right text-foreground tabular-nums">
                      {Number(u.area) > 0 ? `${fmt(Number(u.area))} м²` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-foreground tabular-nums">
                      {Number(u.price) > 0 ? (
                        <span className="font-semibold">{fmt(Number(u.price))} ₽</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">по запросу</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full border text-[11px] font-medium ${st.cls}`}>
                        {st.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
