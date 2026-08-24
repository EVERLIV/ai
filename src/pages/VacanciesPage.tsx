import {
  CheckCircle2,
  Heart,
  Loader2,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import heroImg from "@/assets/hero-commercial.jpg";
import CompanyStatsSidebar from "@/components/CompanyStatsSidebar";
import PropertyAIChat from "@/components/PropertyAIChat";
import SeoHead from "@/components/SeoHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import VacancyCard from "@/components/VacancyCard";
import { COMPANY, CONTACTS } from "@/config/company";
import { absoluteUrl } from "@/config/site";
import { VACANCIES } from "@/data/vacancies";
import { submitLead } from "@/lib/submitLead";

const perks = [
  {
    icon: Users,
    text: "Команда без бюрократии — один менеджер ведёт сделку до конца",
  },
  { icon: Heart, text: "Уважение к людям и прозрачные условия работы" },
  {
    icon: Sparkles,
    text: "Реальные объекты и сделки, не «виртуальный» каталог",
  },
];

export default function VacanciesPage() {
  const [scrollPct, setScrollPct] = useState(0);
  const [selectedVacancy, setSelectedVacancy] = useState(
    VACANCIES[0]?.title ?? "",
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setScrollPct(docH > 0 ? Math.min(100, (window.scrollY / docH) * 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleApplyClick = (title: string) => {
    setSelectedVacancy(title);
    setSent(false);
    setError(null);
    document
      .getElementById("vacancy-apply")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (trimmedName.length < 2 || trimmedPhone.length < 6) {
      setError("Укажите имя и телефон для связи.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const resumeNote = message.trim()
        ? `Резюме / комментарий: ${message.trim()}`
        : null;
      await submitLead({
        name: trimmedName,
        phone: trimmedPhone,
        email: email.trim() || null,
        message: resumeNote,
        source: "vacancies_page",
        business_category: `Вакансия: ${selectedVacancy}`,
      });
      setSent(true);
      setName("");
      setPhone("");
      setEmail("");
      setMessage("");
    } catch {
      setError(
        "Не удалось отправить отклик. Позвоните нам или напишите на почту.",
      );
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full h-11 px-3 bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors";

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <SeoHead
        title="Вакансии АрендаСити"
        description="Работа в агентстве коммерческой недвижимости в Ангарске и Иркутске: менеджер по аренде, юрист."
        url={absoluteUrl("/vacancies")}
      />
      <SiteHeader />

      <div className="sticky top-[56px] md:top-[98px] z-30 mt-[56px] md:mt-[98px] bg-card/90 backdrop-blur-xl shadow-[0_1px_0_0_hsl(var(--border)/0.5)]">
        <div className="container mx-auto px-4 lg:px-8 h-10 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            Главная
          </Link>
          <span className="opacity-50">/</span>
          <span className="text-foreground">Вакансии</span>
        </div>
        <div className="h-px bg-border/30">
          <div
            className="h-full bg-foreground/20 transition-[width] duration-100"
            style={{ width: `${scrollPct}%` }}
          />
        </div>
      </div>

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border">
          <div className="relative h-[280px] lg:h-[320px]">
            <img
              src={heroImg}
              alt=""
              className="w-full h-full object-cover"
              aria-hidden
            />
            <div className="absolute inset-0 bg-foreground/70" />
            <div className="absolute inset-0 flex items-center">
              <div className="container mx-auto px-4 lg:px-8">
                <p className="text-primary text-xs font-semibold uppercase tracking-widest mb-3">
                  Карьера
                </p>
                <h1 className="font-display text-4xl lg:text-5xl font-bold text-background leading-tight mb-4">
                  Вакансии в {COMPANY.brand}
                </h1>
                <p className="text-background/75 text-base max-w-2xl leading-relaxed">
                  Развиваем рынок коммерческой недвижимости в Иркутской области.
                  Открыты позиции менеджера по аренде и юриста — заработная
                  плата обсуждается на собеседовании.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 min-w-0 space-y-8">
                <div className="grid sm:grid-cols-3 gap-3">
                  {perks.map((p) => {
                    const Icon = p.icon;
                    return (
                      <div
                        key={p.text}
                        className="flex gap-3 p-4 bg-muted/30 border border-border"
                      >
                        <Icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {p.text}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                      Открытые позиции
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {VACANCIES.length} вакансии · отклик через форму ниже или
                      по телефону
                    </p>
                  </div>
                  {VACANCIES.map((vacancy) => (
                    <VacancyCard
                      key={vacancy.id}
                      vacancy={vacancy}
                      onApply={handleApplyClick}
                    />
                  ))}
                </div>

                <div
                  id="vacancy-apply"
                  className="bg-card border border-border p-6 sm:p-8 scroll-mt-28"
                >
                  {sent ? (
                    <div className="text-center py-6 space-y-3">
                      <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                      <h2 className="font-display text-xl font-bold text-foreground">
                        Отклик отправлен
                      </h2>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Мы свяжемся с вами в рабочее время. Можно также
                        позвонить: {CONTACTS.phone}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSent(false)}
                        className="text-sm text-primary hover:underline"
                      >
                        Отправить ещё один отклик
                      </button>
                    </div>
                  ) : (
                    <>
                      <h2 className="font-display text-xl font-bold text-foreground mb-1">
                        Отклик на вакансию
                      </h2>
                      <p className="text-sm text-muted-foreground mb-6">
                        Оставьте контакты и коротко расскажите о себе — мы
                        перезвоним или напишем.
                      </p>
                      <form
                        onSubmit={handleSubmit}
                        className="space-y-4 max-w-xl"
                      >
                        <div>
                          <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">
                            Вакансия
                          </label>
                          <select
                            value={selectedVacancy}
                            onChange={(e) => setSelectedVacancy(e.target.value)}
                            className={inputClass}
                          >
                            {VACANCIES.map((v) => (
                              <option key={v.id} value={v.title}>
                                {v.title}
                              </option>
                            ))}
                          </select>
                        </div>
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ваше имя"
                          required
                          className={inputClass}
                        />
                        <input
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          type="tel"
                          placeholder="+7 (___) ___-__-__"
                          required
                          className={inputClass}
                        />
                        <input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          type="email"
                          placeholder="Email (необязательно)"
                          className={inputClass}
                        />
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Ссылка на резюме, опыт, ожидания по зарплате…"
                          rows={4}
                          className={`${inputClass} h-auto py-3 resize-none`}
                        />
                        <button
                          type="submit"
                          disabled={loading}
                          className="inline-flex items-center justify-center gap-2 h-11 px-6 bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                        >
                          {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          {loading ? "Отправка…" : "Отправить отклик"}
                        </button>
                        {error && (
                          <p className="text-sm text-destructive">{error}</p>
                        )}
                        <p className="text-[11px] text-muted-foreground">
                          Нажимая кнопку, вы соглашаетеся с обработкой
                          персональных данных.
                        </p>
                      </form>
                    </>
                  )}
                </div>
              </div>

              <div className="hidden lg:block lg:w-[280px] xl:w-[300px] shrink-0 sticky top-[110px] self-start">
                <CompanyStatsSidebar />
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <PropertyAIChat />
    </div>
  );
}
