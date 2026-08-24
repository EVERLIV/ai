import {
  BookOpen,
  ChevronLeft,
  Columns2,
  Heart,
  Info,
  LogIn,
  Mail,
  Newspaper,
  Plus,
  Search,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { CONTACTS } from "@/config/company";
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

function SecondaryRow({
  item,
  onNavigate,
}: {
  item: MenuItem;
  onNavigate: () => void;
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
    <Link to={item.href!} className={className} onClick={onNavigate}>
      <Icon className="w-4 h-4 shrink-0 opacity-70" />
      {item.label}
    </Link>
  );
}

export default function MobileMenuDrawer({
  open,
  onOpenChange,
  isLoggedIn,
  placeHref,
  onOpenWizard,
}: Props) {
  const close = () => onOpenChange(false);
  const megaMenus = getMainNavMegaMenus();

  const secondaryItems: MenuItem[] = [
    { label: "Риелторы", href: "/rieltory", icon: Users },
    { label: "Разместить за 0 ₽", href: placeHref, icon: Plus },
    {
      label: "Сравнение",
      href: isLoggedIn ? "/compare" : "/auth?redirect=%2Fcompare",
      icon: Columns2,
    },
    { label: "Избранное", href: "/account#favorites", icon: Heart },
    { label: "Поиск по каталогу", href: "/catalog", icon: Search },
    { label: "О нас", href: "/about", icon: Info },
    { label: "Контакты", href: "/contacts", icon: BookOpen },
    { label: "Новости", href: "/news", icon: Newspaper },
    ...(onOpenWizard
      ? [{ label: "Умный подбор", icon: Sparkles, onClick: onOpenWizard }]
      : []),
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
            onClick={close}
            className="w-9 h-9 flex items-center justify-center text-foreground rounded-md hover:bg-muted shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <Link
            to="/"
            onClick={close}
            className="font-display text-[14px] font-bold tracking-tight text-foreground leading-none"
          >
            АРЕНДА<span className="text-primary">СИТИ</span>
          </Link>
          <Link
            to={isLoggedIn ? "/account" : "/auth"}
            onClick={close}
            className="ml-auto flex items-center gap-1.5 pr-1 text-[13px] text-muted-foreground hover:text-foreground"
          >
            {isLoggedIn ? (
              <User className="w-4 h-4" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            {isLoggedIn ? "Кабинет" : "Войти"}
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <nav className="pt-1">
            {megaMenus.map((menu) => (
              <Link
                key={menu.id}
                to={menu.catalogHref}
                onClick={close}
                className="block px-4 py-[7px] text-[15px] font-medium leading-tight text-foreground hover:bg-muted/50"
              >
                {menu.triggerLabel}
              </Link>
            ))}
          </nav>

          <div className="border-t border-border/60 mt-1 pt-1">
            {secondaryItems.map((item) => (
              <SecondaryRow key={item.label} item={item} onNavigate={close} />
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
