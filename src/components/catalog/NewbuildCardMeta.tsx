import { useQuery } from "@tanstack/react-query";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { DbProperty } from "@/hooks/useProperties";
import { fetchProjectByIdApi } from "@/lib/developerApi";
import type { Developer } from "@/lib/developerTypes";
import {
  formatProjectCardTitle,
  getCardDeveloperLabel,
  getNewbuildBodyBadges,
  isMadeToOrderListing,
  isNewbuildListing,
} from "@/lib/propertyNewbuildCard";
import { cn } from "@/lib/utils";

function InlineNav({
  to,
  className,
  children,
}: {
  to: string;
  className?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const go = (e: MouseEvent | KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(to);
  };
  return (
    <span
      role="link"
      tabIndex={0}
      className={cn("cursor-pointer", className)}
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") go(e);
      }}
    >
      {children}
    </span>
  );
}

function pickDeveloper(
  property: DbProperty,
  projectDev: Developer | null,
): { name: string; href: string | null; avatarUrl: string | null } | null {
  const fromExtras = getCardDeveloperLabel(property);
  if (fromExtras) return fromExtras;
  if (!projectDev?.name?.trim()) return null;
  return {
    name: projectDev.name.trim(),
    href: projectDev.id ? `/zastroyshchik/${projectDev.id}` : null,
    avatarUrl: projectDev.logo_url?.trim() || null,
  };
}

type Props = {
  property: DbProperty;
  /** grid — компактно; list — бейджи+ЖК; developer — только блок застройщика */
  variant?: "grid" | "list" | "developer";
  className?: string;
};

/**
 * ПК: проект (ЖК) + застройщик + бейджи отделки для новостроек.
 * На мобилке скрыт (sm+).
 */
export default function NewbuildCardMeta({
  property,
  variant = "grid",
  className,
}: Props) {
  const show =
    isNewbuildListing(property) ||
    isMadeToOrderListing(property) ||
    !!property.developer_project_id ||
    !!property.developer_id;

  const projectId = property.developer_project_id || undefined;
  const { data: project } = useQuery({
    queryKey: ["developer-project", projectId],
    queryFn: () => fetchProjectByIdApi(projectId!),
    enabled: !!projectId && show,
    staleTime: 5 * 60_000,
  });

  if (!show) return null;

  const rawDev = project?.developers;
  const projectDeveloper: Developer | null = Array.isArray(rawDev)
    ? rawDev[0] || null
    : rawDev || null;
  const developerShow = pickDeveloper(property, projectDeveloper);
  const projectTitle = project?.title
    ? formatProjectCardTitle(project.title, project.project_kind)
    : null;
  const projectHref = projectId ? `/proekt/${projectId}` : null;
  const badges = getNewbuildBodyBadges(property);

  if (variant === "developer") {
    if (!developerShow) return null;
    return (
      <div
        className={cn(
          "hidden sm:flex items-center gap-2 min-w-0 text-left w-full",
          className,
        )}
      >
        {developerShow.avatarUrl ? (
          <img
            src={developerShow.avatarUrl}
            alt=""
            className="w-8 h-8 rounded-md object-cover bg-muted shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-md bg-muted shrink-0" />
        )}
        <div className="min-w-0">
          <div className="text-[9px] uppercase tracking-wide text-muted-foreground">
            Застройщик
          </div>
          {developerShow.href ? (
            <InlineNav
              to={developerShow.href}
              className="text-xs font-semibold text-foreground hover:underline truncate block"
            >
              {developerShow.name}
            </InlineNav>
          ) : (
            <span className="text-xs font-semibold text-foreground truncate block">
              {developerShow.name}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (variant === "list") {
    if (!projectTitle && badges.length === 0) return null;
    return (
      <div className={cn("hidden sm:flex flex-col gap-2 min-w-0", className)}>
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {badges.map((b) => (
              <span
                key={b}
                className="px-2 py-0.5 rounded-full border border-border text-[10px] font-medium text-foreground/80"
              >
                {b}
              </span>
            ))}
          </div>
        )}
        {projectTitle &&
          (projectHref ? (
            <InlineNav
              to={projectHref}
              className="text-sm font-medium text-primary hover:underline truncate"
            >
              {projectTitle}
            </InlineNav>
          ) : (
            <span className="text-sm font-medium text-primary truncate">
              {projectTitle}
            </span>
          ))}
      </div>
    );
  }

  if (!projectTitle && !developerShow && badges.length === 0) return null;

  return (
    <div className={cn("hidden sm:flex flex-col gap-1 min-w-0", className)}>
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {badges.map((b) => (
            <span
              key={b}
              className="px-1.5 py-0.5 rounded-md bg-muted text-[10px] text-muted-foreground"
            >
              {b}
            </span>
          ))}
        </div>
      )}
      {projectTitle &&
        (projectHref ? (
          <InlineNav
            to={projectHref}
            className="text-[12px] font-medium text-primary hover:underline truncate"
          >
            {projectTitle}
          </InlineNav>
        ) : (
          <span className="text-[12px] font-medium text-primary truncate">
            {projectTitle}
          </span>
        ))}
      {developerShow && (
        <div className="flex items-center gap-1.5 min-w-0">
          {developerShow.avatarUrl ? (
            <img
              src={developerShow.avatarUrl}
              alt=""
              className="w-5 h-5 rounded object-cover bg-muted shrink-0"
            />
          ) : null}
          <span className="text-[11px] text-muted-foreground truncate">
            <span className="text-muted-foreground/80">Застройщик · </span>
            {developerShow.href ? (
              <InlineNav
                to={developerShow.href}
                className="font-medium text-foreground hover:underline"
              >
                {developerShow.name}
              </InlineNav>
            ) : (
              <span className="font-medium text-foreground">
                {developerShow.name}
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
