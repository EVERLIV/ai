import {
  Building2,
} from "lucide-react";
import consultantAvatar from "@/assets/consultant-anastasia.jpg";
import { SpecRow, SpecSectionTitle } from "@/components/PropertySpecList";
import VerifiedBadge from "@/components/VerifiedBadge";
import { DEFAULT_AGENT } from "@/config/defaultAgent";
import { useOwnerListingCard } from "@/hooks/useOwnerListingCard";
import { ACCOUNT_TYPE_LABELS } from "@/hooks/useProfile";
import { useActivePropertiesCount } from "@/hooks/useProperties";
import { isAgencyListing } from "@/lib/listingSource";
import {
  AGENCY_OBJECTS_FLOOR,
  formatAgentObjectsLabel,
} from "@/lib/propertyCard";
import { resolveSidebarDisplay } from "@/lib/propertySidebar";
import { Link } from "react-router-dom";

interface Props {
  property: {
    agency_id?: string | null;
    listing_manager_id?: string | null;
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
  const agencyListing = isAgencyListing(property);
  const ownerUserId = d.owner_user_id || property.submitted_by || "";
  const { data: liveOwner } = useOwnerListingCard(
    agencyListing ? null : ownerUserId || null,
  );

  const extrasAgentName = d.agent_name !== "—" ? d.agent_name : "";
  const extrasAgencyName =
    d.agent_company !== "—" && d.agent_company !== "Собственник"
      ? d.agent_company
      : "";

  const agentName = agencyListing
    ? extrasAgentName
    : liveOwner?.full_name || extrasAgentName;
  const agentAvatar = agencyListing
    ? d.agent_avatar_url || consultantAvatar
    : liveOwner?.avatar_url || d.agent_avatar_url || consultantAvatar;
  const accountType = agencyListing
    ? d.agent_account_type
    : liveOwner?.account_type || d.agent_account_type;
  const isRealtor =
    accountType === "realtor" || accountType === "agency" || agencyListing;
  const agencyName = agencyListing
    ? extrasAgencyName
    : liveOwner?.agency_name || extrasAgencyName;
  const agencyAbout = agencyListing
    ? d.agent_agency_about
    : liveOwner?.agency_about || d.agent_agency_about;
  const objectsCount = agencyListing
    ? d.agent_objects_count
    : (liveOwner?.published_objects_count ?? d.agent_objects_count);
  const isVerified = agencyListing
    ? d.agent_verified
    : liveOwner
      ? liveOwner.verification_status === "verified"
      : d.agent_verified;
  const staffCount = agencyListing ? undefined : liveOwner?.agency_staff_count;

  const hasOwnerData = agencyListing
    ? !!(extrasAgentName || extrasAgencyName)
    : !!ownerUserId && !!(agentName || liveOwner?.full_name);

  const { data: catalogCount } = useActivePropertiesCount();

  const showAgent = true;
  const displayAgentName = hasOwnerData ? agentName : DEFAULT_AGENT.name;
  const displayAgentAvatar = hasOwnerData ? agentAvatar : DEFAULT_AGENT.avatar;
  const displayIsVerified = hasOwnerData
    ? isVerified
    : DEFAULT_AGENT.isVerified;
  const displayIsRealtor = hasOwnerData ? isRealtor : true;
  const displayAgencyName = hasOwnerData
    ? agencyName
    : DEFAULT_AGENT.agencyName;
  const displayObjectsCount = hasOwnerData
    ? objectsCount
    : Math.max(catalogCount ?? 0, AGENCY_OBJECTS_FLOOR);
  const displayObjectsLabel = formatAgentObjectsLabel(displayObjectsCount, {
    isAgency: !hasOwnerData || isRealtor,
  });
  const displayAgencyAbout = hasOwnerData ? agencyAbout : DEFAULT_AGENT.about;
  const displayAccountType = hasOwnerData
    ? accountType
    : DEFAULT_AGENT.accountType;
  const displayStaffCount = hasOwnerData ? staffCount : undefined;
  const agencyId =
    d.agency_id ||
    property.agency_id ||
    (!hasOwnerData ? DEFAULT_AGENT.agencyId : "") ||
    "";
  const managerId =
    d.listing_manager_id ||
    property.listing_manager_id ||
    (!hasOwnerData ? DEFAULT_AGENT.managerId : "") ||
    "";
  const agencyHref = agencyId ? `/agentstvo/${agencyId}` : null;
  const managerHref = managerId ? `/rieltor/${managerId}` : null;
  const displayRating =
    d.agent_rating > 0
      ? d.agent_rating
      : !hasOwnerData
        ? DEFAULT_AGENT.rating
        : 0;
  const displayResponseMin =
    d.agent_response_min > 0
      ? d.agent_response_min
      : !hasOwnerData
        ? DEFAULT_AGENT.responseMinutes
        : 0;

  const conditionRows: { label: string; value: string }[] = [];
  if (vis.entrance && d.entrance_group !== "—")
    conditionRows.push({ label: "Вход", value: d.entrance_group });
  if (d.utilities_included !== "—")
    conditionRows.push({
      label: "Коммунальные",
      value: d.utilities_included,
    });
  if (d.vat !== "—") conditionRows.push({ label: "НДС", value: d.vat });
  if (vis.indexation && d.indexation !== "—")
    conditionRows.push({ label: "Индексация", value: d.indexation });
  if (vis.minTerm && d.min_term !== "—")
    conditionRows.push({ label: "Мин. срок", value: d.min_term });
  if (vis.contractForm && d.contract_form !== "—")
    conditionRows.push({ label: "Форма договора", value: d.contract_form });
  if (d.landlord_type !== "—")
    conditionRows.push({ label: vis.landlordLabel, value: d.landlord_type });
  if (vis.sublease && d.sublease !== "—")
    conditionRows.push({ label: "Субаренда", value: d.sublease });
  if (d.purpose !== "—")
    conditionRows.push({ label: vis.purposeLabel, value: d.purpose });

  const locationRows: { label: string; value: string }[] = [];
  if (d.metro_minutes !== "—")
    locationRows.push({ label: "До метро", value: d.metro_minutes });
  if (d.district !== "—")
    locationRows.push({ label: "Район", value: d.district });
  if (d.transport_hub !== "—")
    locationRows.push({ label: "Транспортный узел", value: d.transport_hub });

  return (
    <div className="space-y-4">
      {(conditionRows.length > 0 ||
        (vis.pedestrianTraffic && d.pedestrian_traffic) ||
        locationRows.length > 0) && (
        <div className="rounded-lg border border-border/70 bg-card p-4 shadow-sm">
          {conditionRows.length > 0 && (
            <div>
              <SpecSectionTitle className="mb-1.5">Условия</SpecSectionTitle>
              {conditionRows.map((row) => (
                <SpecRow
                  key={row.label}
                  label={row.label}
                  value={row.value}
                  emphasis={row.label === "Мин. срок"}
                />
              ))}
            </div>
          )}

          {vis.pedestrianTraffic && d.pedestrian_traffic ? (
            <div
              className={
                conditionRows.length > 0
                  ? "border-t border-border/40 pt-0.5 mt-0.5"
                  : ""
              }
            >
              <SpecRow
                label="Пешеходный трафик"
                value={
                  <span className="inline-flex flex-col items-end gap-1.5">
                    <span>{d.trafficLabel}</span>
                    <span className="flex gap-1 w-[5.5rem]">
                      {[1, 2, 3, 4].map((i) => (
                        <span
                          key={i}
                          className={`h-1 flex-1 rounded-full ${
                            i <= (d.pedestrian_traffic || 0)
                              ? "bg-foreground/75"
                              : "bg-muted"
                          }`}
                        />
                      ))}
                    </span>
                  </span>
                }
              />
            </div>
          ) : null}

          {locationRows.length > 0 && (
            <div
              className={
                conditionRows.length > 0 || d.pedestrian_traffic
                  ? "border-t border-border/40 pt-0.5 mt-0.5"
                  : ""
              }
            >
              <SpecSectionTitle className="mb-1.5 mt-2">
                Локация
              </SpecSectionTitle>
              {locationRows.map((row) => (
                <SpecRow key={row.label} label={row.label} value={row.value} />
              ))}
            </div>
          )}
        </div>
      )}

      {showAgent && (
        <div className="rounded-lg border border-border/70 bg-card p-4 shadow-sm">
          <SpecSectionTitle className="mb-3">
            {displayIsRealtor ? "Агентство / агент" : "Продавец"}
          </SpecSectionTitle>
          <div className="flex items-start gap-3">
            <img
              src={displayAgentAvatar}
              alt={displayAgentName}
              className="w-12 h-12 rounded-md object-cover shrink-0 bg-muted"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                {managerHref ? (
                  <Link
                    to={managerHref}
                    className="text-sm font-semibold text-foreground leading-snug hover:underline"
                  >
                    {displayAgentName}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold text-foreground leading-snug">
                    {displayAgentName}
                  </span>
                )}
                {displayIsVerified && (
                  <VerifiedBadge size="sm" showLabel={false} />
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {hasOwnerData
                  ? ACCOUNT_TYPE_LABELS[displayAccountType]
                  : DEFAULT_AGENT.position}
              </p>
              {displayIsRealtor && displayAgencyName && (
                agencyHref ? (
                  <Link
                    to={agencyHref}
                    className="text-xs font-medium text-foreground mt-1.5 inline-flex items-center gap-1 hover:underline"
                  >
                    <Building2 className="w-3 h-3 text-muted-foreground shrink-0" />
                    {displayAgencyName}
                  </Link>
                ) : (
                  <p className="text-xs font-medium text-foreground mt-1.5 flex items-center gap-1 truncate">
                    <Building2 className="w-3 h-3 text-muted-foreground shrink-0" />
                    {displayAgencyName}
                  </p>
                )
              )}
            </div>
          </div>

          <div className="mt-3 space-y-0 border-t border-border/40 pt-1">
            {displayObjectsLabel && (
              <SpecRow label="В каталоге" value={displayObjectsLabel} />
            )}
            {displayRating > 0 && (
              <SpecRow
                label="Рейтинг"
                value={displayRating.toLocaleString("ru-RU", {
                  minimumFractionDigits: 1,
                  maximumFractionDigits: 1,
                })}
              />
            )}
            {displayResponseMin > 0 && (
              <SpecRow label="Ответ" value={`~${displayResponseMin} мин`} />
            )}
            {displayIsRealtor &&
              displayStaffCount != null &&
              displayStaffCount > 0 && (
                <SpecRow label="Сотрудников" value={String(displayStaffCount)} />
              )}
          </div>

          {displayAgencyAbout && (
            <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
              {displayAgencyAbout}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
