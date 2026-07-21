import {
  DoorOpen, Receipt, TrendingUp, MapPinned, Footprints, Train, ScrollText,
  Building2, Home, Users,
} from "lucide-react";
import consultantAvatar from "@/assets/consultant-anastasia.jpg";
import { resolveSidebarDisplay } from "@/lib/propertySidebar";
import VerifiedBadge from "@/components/VerifiedBadge";
import { useOwnerListingCard } from "@/hooks/useOwnerListingCard";
import { ACCOUNT_TYPE_LABELS } from "@/hooks/useProfile";

interface Props {
  property: {
    type?: string | null;
    deal_type?: string | null;
    district?: string | null;
    contract_term?: string | null;
    layout?: string | null;
    condition?: string | null;
    submitted_by?: string | null;
    extras?: Record<string, unknown> | null;
  };
}

export default function PropertySidebarExtras({ property }: Props) {
  const d = resolveSidebarDisplay(property);
  const { vis } = d;
  const ownerUserId = d.owner_user_id || property.submitted_by || "";
  const { data: liveOwner } = useOwnerListingCard(ownerUserId || null);

  const agentName = liveOwner?.full_name || (d.agent_name !== "—" ? d.agent_name : "");
  const agentAvatar = liveOwner?.avatar_url || d.agent_avatar_url || consultantAvatar;
  const accountType = liveOwner?.account_type || d.agent_account_type;
  const isRealtor = accountType === "realtor";
  const agencyName = liveOwner?.agency_name || (d.agent_company !== "—" && d.agent_company !== "Собственник" ? d.agent_company : "");
  const agencyAbout = liveOwner?.agency_about || d.agent_agency_about;
  const objectsCount = liveOwner?.published_objects_count ?? d.agent_objects_count;
  const isVerified = liveOwner
    ? liveOwner.verification_status === "verified"
    : d.agent_verified;
  const staffCount = liveOwner?.agency_staff_count;

  const hasOwnerData = !!ownerUserId && !!(agentName || liveOwner?.full_name);
  const showAgent = true;
  const displayAgentName = hasOwnerData ? agentName : "Анастасия Романова";
  const displayAgentAvatar = hasOwnerData ? agentAvatar : consultantAvatar;
  const displayIsVerified = hasOwnerData ? isVerified : true;
  const displayIsRealtor = hasOwnerData ? isRealtor : true;
  const displayAgencyName = hasOwnerData ? agencyName : "Аренда Сити";
  const displayObjectsCount = hasOwnerData ? objectsCount : 0;
  const displayAgencyAbout = hasOwnerData ? agencyAbout : "Эксперт по коммерческой недвижимости. Более 200 сделок.";
  const displayAccountType = hasOwnerData ? accountType : ("realtor" as const);
  const displayStaffCount = hasOwnerData ? staffCount : undefined;

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

      {showAgent && (
        <div className="bg-card rounded-2xl shadow-card p-3.5">
          <div className="flex items-start gap-3">
            <img
              src={displayAgentAvatar}
              alt={displayAgentName}
              className="w-12 h-12 rounded-lg object-cover shrink-0 bg-muted"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-semibold text-foreground leading-tight truncate">
                  {displayAgentName}
                </span>
                {displayIsVerified && <VerifiedBadge size="sm" showLabel={false} />}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {ACCOUNT_TYPE_LABELS[displayAccountType]}
              </p>
              {displayIsRealtor && displayAgencyName && (
                <p className="text-xs font-medium text-foreground mt-1 flex items-center gap-1 truncate">
                  <Building2 className="w-3 h-3 text-primary shrink-0" />
                  {displayAgencyName}
                </p>
              )}
            </div>
          </div>

          <div className="mt-3 grid gap-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Home className="w-3.5 h-3.5" />
                Объектов в каталоге
              </span>
              <span className="font-semibold text-foreground tabular-nums">
                {displayObjectsCount > 0 ? displayObjectsCount : 1}
              </span>
            </div>
            {displayIsRealtor && displayStaffCount != null && displayStaffCount > 0 && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  Сотрудников
                </span>
                <span className="font-semibold text-foreground tabular-nums">{displayStaffCount}</span>
              </div>
            )}
          </div>

          {displayAgencyAbout && (
            <p className="mt-2.5 text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
              {displayAgencyAbout}
            </p>
          )}
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
