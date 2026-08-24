import {
  BookOpen,
  Building2,
  ChevronLeft,
  Heart,
  Home,
  Info,
  LogIn,
  Mail,
  Newspaper,
  Phone,
  Plus,
  Search,
  Sparkles,
  TreePine,
  User,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { CONTACTS } from "@/config/company";
import { SEGMENT_ROUTES } from "@/config/propertySegments";
import { buildCatalogUrl } from "@/lib/catalogLinks";
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

function MenuRow({
  item,
  onNavigate,
}: {
  item: MenuItem;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  const className = cn(
    "flex items-center gap-3 w-full px-4 py-3 text-sm text-foreground hover:bg-muted/60 transition-colors text-left",
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
        <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
        {item.label}
      </button>
    );
  }

  return (
    <Link to={item.href!} className={className} onClick={onNavigate}>
      <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
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

  const mainItems: MenuItem[] = [
    { label: "Новый поиск", href: "/catalog", icon: Search },
    { label: "Разместить за 0 ₽", href: placeHref, icon: Plus },
    { label: "Избранное", href: "/account#favorites", icon: Heart },
    {
      label: "Каталог жилья",
      href: SEGMENT_ROUTES.residential.catalog,
      icon: Home,
    },
    {
      label: "Коммерция",
      href: SEGMENT_ROUTES.commercial.catalog,
      icon: Building2,
    },
    { label: "Участки", href: "/zhilaya/uchastki", icon: TreePine },
  ];

  const companyItems: MenuItem[] = [
    { label: "О нас", href: "/about", icon: Info },
    { label: "Контакты", href: "/contacts", icon: BookOpen },
    { label: "Новости", href: "/news", icon: Newspaper },
    ...(onOpenWizard
      ? [{ label: "ИИ-подбор", icon: Sparkles, onClick: onOpenWizard }]
      : []),
  ];

  const quickLinks = [
    { label: "Аренда", href: buildCatalogUrl({ deal: "Аренда" }) },
    { label: "Продажа", href: buildCatalogUrl({ deal: "Продажа" }) },
    {
      label: "Новостройки",
      href: buildCatalogUrl({ segment: "residential", market: "Новостройка" }),
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[min(100vw,320px)] p-0 flex flex-col [&>button]:hidden"
        aria-describedby={undefined}
      >
        <SheetTitle className="sr-only">Меню</SheetTitle>
        <div className="flex items-center gap-2 px-3 py-3 border-b border-border/60">
          <button
            type="button"
            aria-label="Закрыть меню"
            onClick={close}
            className="w-9 h-9 flex items-center justify-center text-foreground"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <Link
            to={isLoggedIn ? "/account" : "/auth"}
            onClick={close}
            className="flex items-center gap-2 text-sm font-medium text-foreground"
          >
            {isLoggedIn ? (
              <User className="w-5 h-5" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
            {isLoggedIn ? "Кабинет" : "Войти"}
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="py-1">
            {mainItems.map((item) => (
              <MenuRow key={item.label} item={item} onNavigate={close} />
            ))}
          </div>

          <div className="border-t border-border/60 py-1">
            {companyItems.map((item) => (
              <MenuRow key={item.label} item={item} onNavigate={close} />
            ))}
          </div>

          <div className="px-4 py-3 border-t border-border/60 space-y-2 text-xs text-muted-foreground">
            <a
              href={`tel:${CONTACTS.phoneTel}`}
              className="flex items-center gap-2 hover:text-foreground"
            >
              <Phone className="w-4 h-4" /> {CONTACTS.phone}
            </a>
            <a
              href={`mailto:${CONTACTS.email}`}
              className="flex items-center gap-2 hover:text-foreground"
            >
              <Mail className="w-4 h-4" /> {CONTACTS.email}
            </a>
          </div>
        </div>

        <div className="border-t border-border/60 px-4 py-4 pb-safe flex flex-wrap gap-x-4 gap-y-2">
          {quickLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              onClick={close}
              className="text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
