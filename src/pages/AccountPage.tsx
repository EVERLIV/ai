import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Heart, FileText, User, LogOut, MapPin, Maximize2, ChevronRight } from "lucide-react";
import { useProperties } from "@/hooks/useProperties";

const TABS = [
  { key: "favorites", label: "Избранное", icon: Heart },
  { key: "requests", label: "Мои заявки", icon: FileText },
  { key: "profile", label: "Мои данные", icon: User },
] as const;

type Tab = typeof TABS[number]["key"];

export default function AccountPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("favorites");
  const { data: properties = [] } = useProperties();

  if (!user) {
    navigate("/auth");
    return null;
  }

  const fullName = user.user_metadata?.full_name || "";
  const email = user.email || "";
  const initials = fullName ? fullName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : email[0]?.toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Mock favorites from local storage for demo
  const savedIds: string[] = JSON.parse(localStorage.getItem("saved_properties") || "[]");
  const savedProperties = properties.filter(p => savedIds.includes(p.id));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      {/* Breadcrumbs */}
      <div className="sticky top-[98px] z-30 mt-[98px] bg-card/90 backdrop-blur-xl shadow-[0_1px_0_0_hsl(var(--border)/0.5)]">
        <div className="container mx-auto px-4 lg:px-8 h-10 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Главная</Link>
          <span className="opacity-50">/</span>
          <span className="text-foreground">Личный кабинет</span>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0">
            {/* Avatar */}
            <div className="bg-card border border-border overflow-hidden">
              {/* Profile */}
              <div className="flex items-center gap-3 p-4 border-b border-border">
                <div className="w-10 h-10 bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  {fullName && <div className="text-sm font-semibold text-foreground truncate">{fullName}</div>}
                  <div className="text-xs text-muted-foreground truncate">{email}</div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary font-medium shrink-0">
                  User
                </span>
              </div>

              {/* Nav */}
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                    tab === key ? "text-primary font-medium" : "text-foreground hover:text-primary"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    {label}
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              ))}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Выйти
              </button>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {tab === "favorites" && (
              <div>
                <h2 className="font-display text-xl font-bold text-foreground mb-5">Избранное</h2>
                {savedProperties.length === 0 ? (
                  <div className="bg-card border border-border p-12 text-center">
                    <Heart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm font-medium text-foreground mb-1">Нет сохранённых объектов</p>
                    <p className="text-xs text-muted-foreground mb-4">Нажмите ♡ на карточке объекта чтобы добавить в избранное</p>
                    <Link to="/catalog" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                      Перейти в каталог <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedProperties.map(p => (
                      <Link key={p.id} to={`/property/${p.id}`}
                        className="group flex gap-4 bg-card border border-border p-4 hover:shadow-md transition-all">
                        <div className="w-24 h-20 bg-muted shrink-0 overflow-hidden">
                          {p.cover_photo && <img src={p.cover_photo} alt={p.address} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-semibold bg-primary text-primary-foreground px-1.5 py-0.5">{p.deal_type}</span>
                            <span className="text-[10px] text-muted-foreground">{p.type}</span>
                          </div>
                          <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{p.address}</div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.district}</span>
                            <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3" />{p.area} м²</span>
                          </div>
                          {Number(p.price) > 0 && (
                            <div className="mt-1.5 text-sm font-bold text-foreground">
                              {Number(p.price).toLocaleString("ru-RU")} ₽
                              {p.deal_type === "Аренда" && <span className="text-xs font-normal text-muted-foreground">/мес</span>}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "requests" && (
              <div>
                <h2 className="font-display text-xl font-bold text-foreground mb-5">Мои заявки</h2>
                <div className="bg-card border border-border p-12 text-center">
                  <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground mb-1">Заявок пока нет</p>
                  <p className="text-xs text-muted-foreground mb-4">Оставьте заявку на понравившийся объект и она появится здесь</p>
                  <Link to="/catalog" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                    Смотреть объекты <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {tab === "profile" && (
              <div>
                <h2 className="font-display text-xl font-bold text-foreground mb-5">Мои данные</h2>
                <div className="bg-card border border-border p-6 space-y-4">
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Имя</label>
                    <div className="h-10 px-3 bg-muted border border-border flex items-center text-sm text-foreground">
                      {fullName || <span className="text-muted-foreground">Не указано</span>}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Email</label>
                    <div className="h-10 px-3 bg-muted border border-border flex items-center text-sm text-foreground">
                      {email}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Телефон</label>
                    <div className="h-10 px-3 bg-muted border border-border flex items-center text-sm text-muted-foreground">
                      {user.user_metadata?.phone || "Не указан"}
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">Роль</label>
                    <div className="h-10 px-3 bg-muted border border-border flex items-center text-sm text-foreground">
                      Пользователь
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground pt-2">
                    Для изменения данных свяжитесь с менеджером по телефону{" "}
                    <a href="tel:+73952551234" className="text-primary hover:underline">+7 (3952) 55-12-34</a>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
