import {
  BookOpen,
  Building2,
  ChevronLeft,
  Columns2,
  Heart,
  Info,
  LogIn,
  Mail,
  Newspaper,
  Plus,
  Search,
  Smartphone,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import BrandMark from "@/components/BrandMark";
import { CONTACTS } from "@/config/company";
import { useAllDictionaryValues } from "@/hooks/useDictionaries";
import { getMainNavMegaMenus } from "@/lib/catalogMegaMenu";
import { cn } from "@/lib/utils";

type MenuItem = {
  label: string;
  href?: string;
  icon: React.ElementType;
  onClick?: () => void;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isLoggedIn: boolean;
  placeHref: string;
  onOpenWizard?: () => void;
};

/** Сброс scroll-lock Radix после ухода со страницы с открытым Sheet */
function clearBodyScrollLock() {
  document.body.style.pointerEvents = "";
  document.body.style.overflow = "";
  document.body.style.paddingRight = "";
  document.documentElement.style.overflow = "";
}

function SecondaryRow({
  item,
  onNavigate,
}: {
  item: MenuItem;
  onNavigate: (href?: string) => void;
}) {
  const Icon = item.icon;
  const className = cn(
    "flex items-center gap-2.5 w-full px-4 py-[7px] text-[13px] leading-tight text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-left",
  );

  if (item.onClick) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => {
          item.onClick?.();
          onNavigate();
        }}
      >
        <Icon className="w-4 h-4 shrink-0 opacity-70" />
        {item.label}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={() => onNavigate(item.href)}
    >
      <Icon className="w-4 h-4 shrink-0 opacity-70" />
      {item.label}
    </button>
  );
}

export default function MobileMenuDrawer({
  open,
  onOpenChange,
  isLoggedIn,
  placeHref,
  onOpenWizard,
}: Props) {
  const navigate = useNavigate();
  const { propertyTypes } = useAllDictionaryValues();
  const commercialTypes = useMemo(
    () => propertyTypes("commercial"),
    [propertyTypes],
  );
  const megaMenus = useMemo(
    () =>
      getMainNavMegaMenus({
        isLoggedIn,
        commercialTypes,
      }),
    [isLoggedIn, commercialTypes],
  );

  const go = (href?: string) => {
    onOpenChange(false);
    window.setTimeout(() => {
      clearBodyScrollLock();
      if (href) navigate(href);
    }, 50);
  };

  const secondaryItems: MenuItem[] = [
    { label: "Риелторы", href: "/rieltory", icon: Users },
    { label: "Застройщики", href: "/zastroyshchiki", icon: Building2 },
    { label: "Разместить за 0 ₽", href: placeHref, icon: Plus },
    {
      label: "Сравнение",
      href: isLoggedIn ? "/compare" : "/auth?redirect=%2Fcompare",
      icon: Columns2,
    },
    { label: "Избранное", href: "/account#favorites", icon: Heart },
    { label: "Поиск по каталогу", href: "/catalog", icon: Search },
    { label: "О нас", href: "/about", icon: Info },
    { label: "Поддержка", href: "/support", icon: BookOpen },
    { label: "Приложение", href: "/app", icon: Smartphone },
    { label: "Новости", href: "/news", icon: Newspaper },
    ...(onOpenWizard
      ? [{ label: "Умный подбор", icon: Sparkles, onClick: onOpenWizard }]
      : []),
  ];

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) clearBodyScrollLock();
      }}
    >
      <SheetContent
        side="left"
        className="w-[min(100vw,360px)] max-w-[100vw] p-0 gap-0 flex flex-col [&>button]:hidden"
        aria-describedby={undefined}
      >
        <SheetTitle className="sr-only">Меню</SheetTitle>
        <div className="flex items-center h-14 px-3 gap-1 shrink-0 border-b border-border/50 bg-card">
          <button
            type="button"
            aria-label="Закрыть меню"
            onClick={() => go()}
            className="w-9 h-9 flex items-center justify-center text-foreground rounded-md hover:bg-muted shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => go("/")}
            className="text-left"
            aria-label="DADATYT"
          >
            <BrandMark className="h-7" />
          </button>
          <button
            type="button"
            onClick={() => go(isLoggedIn ? "/account" : "/auth")}
            className="ml-auto flex items-center gap-1.5 pr-1 text-[13px] text-muted-foreground hover:text-foreground"
          >
            {isLoggedIn ? (
              <User className="w-4 h-4" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            {isLoggedIn ? "Кабинет" : "Войти"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <nav className="pt-1">
            {megaMenus.map((menu) => (
              <button
                key={menu.id}
                type="button"
                onClick={() => go(menu.catalogHref)}
                className="block w-full text-left px-4 py-[7px] text-[15px] font-medium leading-tight text-foreground hover:bg-muted/50"
              >
                {menu.triggerLabel}
              </button>
            ))}
          </nav>

          <div className="border-t border-border/60 mt-1 pt-1">
            {secondaryItems.map((item) => (
              <SecondaryRow key={item.label} item={item} onNavigate={go} />
            ))}
          </div>
        </div>

        <div className="border-t border-border/60 px-4 py-3 shrink-0 bg-background">
          <a
            href={`mailto:${CONTACTS.email}?subject=${encodeURIComponent("Сотрудничество")}`}
            className="inline-flex items-center gap-2 text-[13px] text-[#2a6fdb] hover:underline underline-offset-2"
          >
            <Mail className="w-4 h-4" />
            Сотрудничество
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
