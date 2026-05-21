import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowRight, ArrowLeft, Building2, ShieldCheck, Heart, FileText } from "lucide-react";
import heroImg from "@/assets/hero-commercial.jpg";

const BENEFITS = [
  { icon: Heart, text: "Сохраняйте понравившиеся объекты в избранное" },
  { icon: FileText, text: "Отслеживайте статус своих заявок" },
  { icon: ShieldCheck, text: "Быстрый доступ к персональному менеджеру" },
];

export default function Auth() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const navigate = useNavigate();
  const { search } = useLocation();
  const redirectTo = new URLSearchParams(search).get("redirect") || "/";
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Ошибка входа", description: "Неверный email или пароль", variant: "destructive" });
    } else {
      navigate(redirectTo);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, phone },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        toast({ title: "Ошибка регистрации", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }

      // Если autoconfirm включён — сессия уже есть, сразу входим
      if (data.session) {
        navigate(redirectTo);
        return;
      }

      // Если письмо не требуется (идентiti уже создан) — пробуем войти сразу
      if (data.user && !data.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (!signInError) {
          navigate(redirectTo);
          return;
        }
      }

      // Иначе — стандартный экран "проверьте почту"
      setRegistered(true);
    } catch (err: any) {
      toast({
        title: "Ошибка соединения",
        description: "Не удалось подключиться к серверу. Попробуйте позже.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">Почти готово!</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Мы отправили письмо на <strong>{email}</strong>. Перейдите по ссылке в письме для подтверждения аккаунта.
          </p>
          <button onClick={() => { setRegistered(false); setTab("login"); }}
            className="text-sm text-primary hover:underline">
            Войти в аккаунт
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left: form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-12 max-w-lg mx-auto w-full">
        {/* Logo + back */}
        <div className="flex items-center justify-between mb-10">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">А</span>
            </div>
            <span className="font-display text-lg font-bold text-foreground">
              АРЕНДА<span className="text-primary">СИТИ</span>
            </span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            На сайт
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 mb-8">
          {([["login", "Вход"], ["register", "Регистрация"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`text-sm font-semibold transition-colors outline-none ${
                tab === key ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "login" ? (
          <>
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">Добро пожаловать</h1>
            <p className="text-sm text-muted-foreground mb-7">Войдите в свой аккаунт АрендаСити</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="your@email.com"
                  className="w-full h-11 px-4 bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Пароль</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                    placeholder="••••••••"
                    className="w-full h-11 px-4 pr-11 bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full h-11 bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? "Вход..." : <><ArrowRight className="w-4 h-4" /> Войти</>}
              </button>
            </form>
            <p className="text-xs text-muted-foreground mt-6 text-center">
              Нет аккаунта?{" "}
              <button onClick={() => setTab("register")} className="text-primary hover:underline font-medium">
                Зарегистрироваться
              </button>
            </p>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">Создать аккаунт</h1>
            <p className="text-sm text-muted-foreground mb-7">Бесплатно — доступ к избранному и заявкам</p>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Имя и фамилия</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
                  placeholder="Иван Иванов"
                  className="w-full h-11 px-4 bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="your@email.com"
                  className="w-full h-11 px-4 bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Телефон <span className="text-muted-foreground/50">(необязательно)</span></label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="+7 (999) 000-00-00"
                  className="w-full h-11 px-4 bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Пароль</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                    placeholder="Минимум 6 символов"
                    className="w-full h-11 px-4 pr-11 bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full h-11 bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? "Регистрация..." : <><ArrowRight className="w-4 h-4" /> Создать аккаунт</>}
              </button>
              <p className="text-[11px] text-muted-foreground text-center">
                Регистрируясь, вы принимаете{" "}
                <a href="#" className="text-primary hover:underline">условия использования</a>
              </p>
            </form>
            <p className="text-xs text-muted-foreground mt-6 text-center">
              Уже есть аккаунт?{" "}
              <button onClick={() => setTab("login")} className="text-primary hover:underline font-medium">
                Войти
              </button>
            </p>
          </>
        )}
      </div>

      {/* Right: photo + benefits */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-foreground/70" />
        <div className="relative flex flex-col justify-end p-12 text-background">
          <div className="mb-8">
            <Building2 className="w-10 h-10 text-primary mb-4" />
            <h2 className="font-display text-3xl font-bold leading-tight mb-3">
              Личный кабинет<br />АрендаСити
            </h2>
            <p className="text-background/60 text-sm leading-relaxed max-w-sm">
              Управляйте избранными объектами, отслеживайте заявки и получайте персональные предложения.
            </p>
          </div>
          <div className="space-y-3">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary/20 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm text-background/80">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
