import { Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import consultantAvatar from "@/assets/consultant-anastasia.jpg";
import { SpecRow, SpecSectionTitle } from "@/components/PropertySpecList";
import {
  pluralApartments,
  pluralProjects,
} from "@/components/specialists/specialistUtils";
import {
  RatingBadge,
} from "@/components/specialists/SpecialistReviews";
import VerifiedBadge from "@/components/VerifiedBadge";
import { DEFAULT_AGENT } from "@/config/defaultAgent";
import {
  useAgencyPublic,
  useManagerPublic,
} from "@/hooks/useAgency";
import {
  useDeveloperPublic,
  useDeveloperPublicProjects,
  useDeveloperPublicProperties,
} from "@/hooks/useDeveloper";
import { useOwnerListingCard } from "@/hooks/useOwnerListingCard";
import { ACCOUNT_TYPE_LABELS } from "@/hooks/useProfile";
import { useActivePropertiesCount } from "@/hooks/useProperties";
import {
  getPropertyDeveloperId,
  isAgencyListing,
  isDeveloperListing,
} from "@/lib/listingSource";
import {
  AGENCY_OBJECTS_FLOOR,
  formatAgentObjectsLabel,
} from "@/lib/propertyCard";
import { resolveSidebarDisplay } from "@/lib/propertySidebar";
import { publicStorageUrl } from "@/lib/storageUrl";

interface Props {
  property: {
    agency_id?: string | null;
    developer_id?: string | null;
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
  /** Скрыть блок агентства/агента (например, в галерее — без дубля) */
  hideAgent?: boolean;
}

export default function PropertySidebarExtras({
  property,
  hideAgent = false,
}: Props) {
  const d = resolveSidebarDisplay(property);
  const { vis } = d;
  const agencyListing = isAgencyListing(property);
  const developerListing = isDeveloperListing(property);
  const developerId =
    getPropertyDeveloperId(property) || d.developer_id || null;
  const { data: liveDeveloper } = useDeveloperPublic(
    developerListing ? developerId || undefined : undefined,
  );
  const { data: developerProjects = [] } = useDeveloperPublicProjects(
    developerListing ? developerId || undefined : undefined,
  );
  const { data: developerProperties = [] } = useDeveloperPublicProperties(
    developerListing ? developerId || undefined : undefined,
  );
  const developerProjectsCount = developerProjects.length;
  const developerApartmentsCount = developerProperties.length;

  const ownerUserId = d.owner_user_id || property.submitted_by || "";
  const { data: liveOwner } = useOwnerListingCard(
    agencyListing || developerListing ? null : ownerUserId || null,
  );

  const extrasAgentName = d.agent_name !== "—" ? d.agent_name : "";
  const extrasAgencyName =
    d.agent_company !== "—" && d.agent_company !== "Собственник"
      ? d.agent_company
      : "";

  const developerName =
    liveDeveloper?.name?.trim() ||
    extrasAgencyName ||
    extrasAgentName ||
    "";
  const developerAvatar = liveDeveloper?.logo_url?.trim() || "";
  const developerAbout =
    liveDeveloper?.about?.trim() || d.agent_agency_about || "";
  const developerVerified = liveDeveloper
    ? liveDeveloper.verification_status === "verified"
    : d.agent_verified;

  const agentName = developerListing
    ? developerName
    : agencyListing
      ? extrasAgentName
      : liveOwner?.full_name || extrasAgentName;
  const agentAvatar = developerListing
    ? developerAvatar
    : agencyListing
      ? d.agent_avatar_url || consultantAvatar
      : liveOwner?.avatar_url || d.agent_avatar_url || consultantAvatar;
  const accountType = developerListing
    ? "developer"
    : agencyListing
      ? d.agent_account_type
      : liveOwner?.account_type || d.agent_account_type;
  const isRealtor =
    !developerListing &&
    (accountType === "realtor" ||
      accountType === "agency" ||
      agencyListing);
  const agencyName = developerListing
    ? developerName
    : agencyListing
      ? extrasAgencyName
      : liveOwner?.agency_name || extrasAgencyName;
  const agencyAbout = developerListing
    ? developerAbout
    : agencyListing
      ? d.agent_agency_about
      : liveOwner?.agency_about || d.agent_agency_about;
  const objectsCount = developerListing
    ? d.agent_objects_count
    : agencyListing
      ? d.agent_objects_count
      : (liveOwner?.published_objects_count ?? d.agent_objects_count);
  const isVerified = developerListing
    ? developerVerified
    : agencyListing
      ? d.agent_verified
      : liveOwner
        ? liveOwner.verification_status === "verified"
        : d.agent_verified;
  const staffCount =
    agencyListing || developerListing
      ? undefined
      : liveOwner?.agency_staff_count;

  const hasOwnerData = developerListing
    ? !!(developerName || developerId)
    : agencyListing
      ? !!(extrasAgentName || extrasAgencyName)
      : !!ownerUserId && !!(agentName || liveOwner?.full_name);

  const { data: catalogCount } = useActivePropertiesCount();

  const showAgent = !hideAgent;
  const displayAgentName = hasOwnerData ? agentName : DEFAULT_AGENT.name;
  const displayAgentAvatar = hasOwnerData
    ? agentAvatar || (developerListing ? "" : consultantAvatar)
    : DEFAULT_AGENT.avatar;
  const displayIsVerified = hasOwnerData
    ? isVerified
    : DEFAULT_AGENT.isVerified;
  const displayIsRealtor = hasOwnerData ? isRealtor : true;
  const displayIsDeveloper = hasOwnerData && developerListing;
  const displayAgencyName = hasOwnerData
    ? agencyName
    : DEFAULT_AGENT.agencyName;
  const displayObjectsCount = hasOwnerData
    ? objectsCount
    : Math.max(catalogCount ?? 0, AGENCY_OBJECTS_FLOOR);
  const displayObjectsLabel = formatAgentObjectsLabel(displayObjectsCount, {
    // Мок 190+ только для агентства без данных / риелторов — не для застройщиков
    isAgency: !hasOwnerData || (isRealtor && !displayIsDeveloper),
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
  const developerHref =
    displayIsDeveloper && developerId
      ? `/zastroyshchik/${developerId}`
      : null;
  const agencyHref = agencyId ? `/agentstvo/${agencyId}` : null;
  const managerHref = managerId ? `/rieltor/${managerId}` : null;

  const { data: liveAgency } = useAgencyPublic(
    !displayIsDeveloper && agencyId ? agencyId : undefined,
  );
  const { data: liveManager } = useManagerPublic(
    !displayIsDeveloper && managerId ? managerId : undefined,
  );

  const liveRating =
    displayIsDeveloper
      ? Number(liveDeveloper?.avg_rating || 0)
      : Number(
          liveManager?.avg_rating ||
            liveAgency?.avg_rating ||
            0,
        );
  const liveReviewsCount = displayIsDeveloper
    ? Number(liveDeveloper?.reviews_count || 0)
    : Number(
        liveManager?.reviews_count || liveAgency?.reviews_count || 0,
      );

  const displayRating =
    liveRating > 0
      ? liveRating
      : d.agent_rating > 0
        ? d.agent_rating
        : !hasOwnerData
          ? DEFAULT_AGENT.rating
          : 0;
  const displayReviewsCount =
    liveReviewsCount > 0
      ? liveReviewsCount
      : !hasOwnerData && displayRating > 0
        ? liveAgency?.reviews_count || 0
        : liveReviewsCount;
  const displayResponseMin =
    d.agent_response_min > 0
      ? d.agent_response_min
      : liveManager?.response_minutes ||
          liveAgency?.response_minutes ||
          (!hasOwnerData ? DEFAULT_AGENT.responseMinutes : 0);

  const reviewsHref = displayIsDeveloper
    ? developerHref
      ? `${developerHref}#reviews`
      : null
    : managerHref
      ? `${managerHref}#reviews`
      : agencyHref
        ? `${agencyHref}#reviews`
        : null;

  const sectionTitle = displayIsDeveloper
    ? "Застройщик"
    : displayIsRealtor
      ? "Агентство / агент"
      : "Продавец";

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
          <SpecSectionTitle className="mb-3">{sectionTitle}</SpecSectionTitle>
          <div className="flex items-start gap-3">
            {displayAgentAvatar ? (
              <img
                src={
                  publicStorageUrl(displayAgentAvatar) || displayAgentAvatar
                }
                alt={displayAgentName}
                className="w-12 h-12 rounded-md object-cover shrink-0 bg-muted"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-12 h-12 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 text-sm font-bold">
                {(displayAgentName || "З").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                {developerHref ? (
                  <Link
                    to={developerHref}
                    className="text-sm font-semibold text-foreground leading-snug hover:underline"
                  >
                    {displayAgentName}
                  </Link>
                ) : managerHref ? (
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
                  ? ACCOUNT_TYPE_LABELS[
                      displayAccountType as keyof typeof ACCOUNT_TYPE_LABELS
                    ] || ACCOUNT_TYPE_LABELS.owner
                  : DEFAULT_AGENT.position}
              </p>
              {!displayIsDeveloper && displayIsRealtor && displayAgencyName && (
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
            {displayIsDeveloper ? (
              <>
                <SpecRow
                  label="Проекты"
                  value={`${developerProjectsCount} ${pluralProjects(developerProjectsCount)}`}
                />
                <SpecRow
                  label="Квартиры"
                  value={`${developerApartmentsCount} ${pluralApartments(developerApartmentsCount)}`}
                />
              </>
            ) : (
              displayObjectsLabel && (
                <SpecRow label="В каталоге" value={displayObjectsLabel} />
              )
            )}
            {displayRating > 0 && (
              <SpecRow
                label="Рейтинг"
                value={
                  <RatingBadge
                    avgRating={displayRating}
                    reviewsCount={
                      displayReviewsCount > 0 ? displayReviewsCount : null
                    }
                    href={reviewsHref}
                    className="justify-end"
                  />
                }
              />
            )}
            {Number(displayResponseMin) > 0 && (
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
