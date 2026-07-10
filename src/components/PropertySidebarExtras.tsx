import {
  DoorOpen, Receipt, TrendingUp, MapPinned, Footprints, Train, ScrollText,
  Star, Clock3, BadgeCheck,
} from "lucide-react";
import consultantAvatar from "@/assets/consultant-anastasia.jpg";
import { resolveSidebarDisplay } from "@/lib/propertySidebar";

interface Props {
  property: {
    type?: string | null;
    deal_type?: string | null;
    district?: string | null;
    contract_term?: string | null;
    layout?: string | null;
    condition?: string | null;
    extras?: Record<string, unknown> | null;
  };
}

export default function PropertySidebarExtras({ property }: Props) {
  const d = resolveSidebarDisplay(property);
  const { vis } = d;

  return (
    <div className="space-y-3">
      {vis.entrance && (
        <div className="bg-card rounded-2xl shadow-card px-3 py-2.5 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <DoorOpen className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Вход</span>
            <span className="text-xs font-semibold text-foreground">{d.entrance_group}</span>
          </div>
        </div>
      )}

      <Block title="Финансовые условия" icon={Receipt}>
        <Row label="Коммунальные платежи" value={d.utilities_included} accent={d.utilitiesAccent} />
        <Row label="НДС" value={d.vat} />
        {vis.indexation && <Row label="Индексация" value={d.indexation} icon={TrendingUp} />}
        {vis.minTerm && <Row label="Мин. срок аренды" value={d.min_term} />}
      </Block>

      <Block title="Трафик и локация">
        {vis.pedestrianTraffic && d.pedestrian_traffic ? (
          <div className="px-1 pb-2">
            <div className="text-xs text-muted-foreground mb-1.5">Пешеходный трафик</div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className={`h-2 w-9 rounded-full transition-colors ${
                      i <= (d.pedestrian_traffic || 0) ? "bg-emerald-500" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs font-medium text-foreground">{d.trafficLabel}</span>
            </div>
          </div>
        ) : null}
        <Row label="До метро" value={d.metro_minutes} icon={Train} />
        <Row label="Район" value={d.district} icon={MapPinned} />
        <Row label="Транспортный узел" value={d.transport_hub} icon={Footprints} />
      </Block>

      <Block title="Юридические условия" icon={ScrollText}>
        {vis.contractForm && <Row label="Форма договора" value={d.contract_form} />}
        <Row label={vis.landlordLabel} value={d.landlord_type} />
        {vis.sublease && <Row label="Субаренда" value={d.sublease} />}
        <Row label={vis.purposeLabel} value={d.purpose} />
      </Block>

      {d.showAgent && (
        <div className="bg-card rounded-2xl shadow-card p-3">
          <div className="flex items-center gap-2.5">
            <img
              src={consultantAvatar}
              alt={d.agent_name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <div className="text-sm font-semibold text-foreground truncate">{d.agent_name}</div>
                {d.agent_verified && <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />}
              </div>
              {d.agent_company !== "—" && (
                <div className="text-[11px] text-muted-foreground truncate">{d.agent_company}</div>
              )}
              {(d.agent_rating > 0 || d.agent_response_min > 0 || d.agent_objects_count > 0) && (
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                  {d.agent_rating > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-foreground">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span className="font-semibold">{d.agent_rating.toFixed(1)}</span>
                    </span>
                  )}
                  {d.agent_rating > 0 && d.agent_response_min > 0 && <span>·</span>}
                  {d.agent_response_min > 0 && (
                    <span className="inline-flex items-center gap-0.5">
                      <Clock3 className="w-3 h-3" />~{d.agent_response_min} мин
                    </span>
                  )}
                  {d.agent_objects_count > 0 && (
                    <>
                      <span>·</span>
                      <span>{d.agent_objects_count} об.</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Block({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-2xl shadow-card p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-primary" />}
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{title}</div>
      </div>
      <div className="divide-y divide-border/60">{children}</div>
    </div>
  );
}

function Row({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon?: React.ElementType;
  accent?: boolean;
}) {
  if (value === "—") return null;

  return (
    <div className="flex items-center justify-between gap-3 py-1.5 first:pt-0 last:pb-0">
      <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </span>
      <span
        className={`text-xs text-right ${
          accent ? "text-emerald-600 font-medium" : "text-foreground font-medium"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
