import { Heart, Home, Plus, Search, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { placementCtaPath } from "@/lib/listPropertyLinks";
import { cn } from "@/lib/utils";

const tabs = [
  {
    id: "home",
    label: "Главная",
    href: "/",
    icon: Home,
    match: (p: string) => p === "/",
  },
  {
    id: "catalog",
    label: "Каталог",
    href: "/catalog",
    icon: Search,
    match: (p: string) =>
      p.startsWith("/catalog") ||
      p.startsWith("/zhilaya/catalog") ||
      p.startsWith("/zemlya") ||
      p.startsWith("/offices") ||
      p.startsWith("/retail") ||
      p.startsWith("/warehouses") ||
      p.startsWith("/zhilaya/kvartiry"),
  },
  {
    id: "favorites",
    label: "Избранное",
    href: "/account#favorites",
    icon: Heart,
    match: (p: string, h: string) =>
      p === "/account" && h.includes("favorites"),
  },
  { id: "post", label: "Разместить", href: "", icon: Plus, match: () => false },
  {
    id: "profile",
    label: "Профиль",
    href: "",
    icon: User,
    match: (p: string) => p === "/account" || p === "/auth",
  },
] as const;

export default function MobileBottomNav() {
  const { pathname, hash } = useLocation();
  const { user } = useAuth();
  const placeHref = placementCtaPath("commercial", "rent", !!user);
  const profileHref = user ? "/account#profile" : "/auth";

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card pb-safe"
      aria-label="Основная навигация"
    >
      <div className="grid grid-cols-5 h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          let href = tab.href;
          if (tab.id === "post") href = placeHref;
          if (tab.id === "profile") href = profileHref;

          const active =
            tab.id === "favorites"
              ? pathname === "/account" && hash.includes("favorites")
              : tab.id === "profile"
                ? (pathname === "/account" && hash.includes("profile")) ||
                  pathname === "/auth"
                : tab.match(pathname, hash);

          return (
            <Link
              key={tab.id}
              to={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon
                className={cn("w-5 h-5", active && "stroke-[2.5px]")}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className="leading-none">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
