import { DoorOpen, Receipt, TrendingUp, MapPinned, Footprints, Train, ScrollText, Star, Clock3, BadgeCheck } from "lucide-react";
import consultantAvatar from "@/assets/consultant-anastasia.jpg";

type Extras = {
  entrance_group?: string;          // "Отдельный" | "Общий"
  utilities_included?: string;      // "включены" | "отдельно"
  vat?: string;                     // "не облагается" | "20%"
  indexation?: string;              // "раз в год"
  min_term?: string;                // "от 1 мес."
  pedestrian_traffic?: 1 | 2 | 3 | 4; // 1..4
  metro_minutes?: string;           // "5 мин."
  transport_hub?: string;           // "250 м"
  contract_form?: string;           // "Краткосрочный"
  sublease?: string;                // "Запрещена" | "Разрешена"
  landlord_type?: string;           // "Юр. лицо"
  purpose?: string;                 // "Офис, услуги"
  agent_name?: string;
  agent_company?: string;
  agent_objects_count?: number;
  agent_rating?: number;            // 0..5
  agent_response_min?: number;      // среднее минут
  agent_verified?: boolean;
};

interface Props {
  property: any;
}

export default function PropertySidebarExtras({ property }: Props) {
  const e: Extras = property?.extras || {};

  // Безопасные дефолты для демо/новых объектов (не влияют на БД)
  const ex = {
    entrance_group: e.entrance_group || "Отдельный",
    utilities_included: e.utilities_included || "включены",
    vat: e.vat || "не облагается",
    indexation: e.indexation || "раз в год",
    min_term: e.min_term || (property?.contract_term ? `от ${property.contract_term}` : "от 1 мес."),
    pedestrian_traffic: (e.pedestrian_traffic ?? 3) as 1 | 2 | 3 | 4,
    metro_minutes: e.metro_minutes || "—",
    transport_hub: e.transport_hub || "250 м",
    contract_form: e.contract_form || "Краткосрочный",
    sublease: e.sublease || "По согласованию",
    landlord_type: e.landlord_type || "Юр. лицо",
    purpose: e.purpose || (property?.type === "Торговая" ? "Торговля, услуги" : "Офис, услуги"),
    agent_name: e.agent_name || "Анастасия Романова",
    agent_company: e.agent_company || "АРЕНДА СИТИ",
    agent_objects_count: e.agent_objects_count ?? 47,
    agent_rating: e.agent_rating ?? 4.9,
    agent_response_min: e.agent_response_min ?? 12,
    agent_verified: e.agent_verified ?? true,
  };

  const trafficLabel = ["Низкий", "Средний", "Высокий", "Очень высокий"][ex.pedestrian_traffic - 1];

  return (
    <>
      {/* Входная группа — короткая строка-заголовок */}
      <div className="bg-card rounded-2xl shadow-card px-3 py-2.5 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <DoorOpen className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Вход</span>
          <span className="text-xs font-semibold text-foreground">{ex.entrance_group}</span>
        </div>
      </div>

      {/* Финансовые условия */}
      <Block title="Финансовые условия" icon={Receipt}>
        <Row label="Коммунальные платежи" value={ex.utilities_included} accent={ex.utilities_included === "включены"} />
        <Row label="НДС" value={ex.vat} />
        <Row label="Индексация" value={ex.indexation} icon={TrendingUp} />
        <Row label="Мин. срок аренды" value={ex.min_term} />
      </Block>

      {/* Трафик и локация */}
      <Block title="Трафик и локация">
        <div className="px-1 pb-2">
          <div className="text-xs text-muted-foreground mb-1.5">Пешеходный трафик</div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={`h-2 w-9 rounded-full transition-colors ${
                    i <= ex.pedestrian_traffic ? "bg-emerald-500" : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-medium text-foreground">{trafficLabel}</span>
          </div>
        </div>
        <Row label="До метро" value={ex.metro_minutes} icon={Train} />
        <Row label="Район" value={property?.district || "—"} icon={MapPinned} />
        <Row label="Транспортный узел" value={ex.transport_hub} icon={Footprints} />
      </Block>

      {/* Юридические условия */}
      <Block title="Юридические условия" icon={ScrollText}>
        <Row label="Форма договора" value={ex.contract_form} />
        <Row label="Арендодатель" value={ex.landlord_type} />
        <Row label="Субаренда" value={ex.sublease} />
        <Row label="Назначение" value={ex.purpose} />
      </Block>

      {/* Агент */}
      <div className="bg-card rounded-2xl shadow-card p-3">
        <div className="flex items-center gap-2.5">
          <img
            src={consultantAvatar}
            alt={ex.agent_name}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <div className="text-sm font-semibold text-foreground truncate">{ex.agent_name}</div>
              {ex.agent_verified && <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
              <span className="inline-flex items-center gap-0.5 text-foreground">
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                <span className="font-semibold">{ex.agent_rating.toFixed(1)}</span>
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-0.5">
                <Clock3 className="w-3 h-3" />~{ex.agent_response_min} мин
              </span>
              <span>·</span>
              <span>{ex.agent_objects_count} об.</span>
            </div>
          </div>
        </div>
      </div>
    </>
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
    <div className="bg-card rounded-2xl shadow-card p-4">
      <div className="flex items-center gap-2 mb-2.5">
        {Icon && <Icon className="w-4 h-4 text-primary" />}
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{title}</div>
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
  return (
    <div className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </span>
      <span
        className={`text-sm text-right ${
          accent ? "text-emerald-600 font-medium" : "text-foreground font-medium"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
