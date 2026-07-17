import { useState } from "react";
import { Lock, ArrowRight } from "lucide-react";
import heroImg from "@/assets/hero-warehouses.jpg";

const SITE_PASSWORD = "arenda2026";

interface GateProps {
  onUnlock: () => void;
}

export default function Gate({ onUnlock }: GateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === SITE_PASSWORD) {
      localStorage.setItem("site_unlocked", "true");
      onUnlock();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => { setError(false); setShake(false); }, 2000);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: form */}
      <div className="flex-1 flex flex-col justify-between px-8 sm:px-14 py-12 bg-background max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">А</span>
          </div>
          <span className="font-display text-[17px] font-bold text-foreground tracking-tight">
            АРЕНДА<span className="text-primary">СИТИ</span>
          </span>
        </div>

        {/* Main */}
        <div>
          {/* Coming soon badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-xs font-semibold uppercase tracking-widest mb-6">
            <span className="w-1.5 h-1.5 bg-primary animate-pulse" />
            Скоро открытие
          </div>

          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground leading-tight mb-4">
            Платформа аренды<br />коммерческой<br />
            <span className="text-primary">недвижимости</span>
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-10 max-w-sm">
            Офисы, торговые площади, склады и земельные участки в Иркутске, Ангарске и Шелехове. Скоро запускаемся — следите за обновлениями.
          </p>

          {/* Features */}
          <div className="space-y-3 mb-10">
            {[
              "78+ объектов коммерческой недвижимости",
              "ИИ-подбор по вашим параметрам",
              "Карта объектов с фильтрами",
            ].map((f) => (
              <div key={f} className="flex items-center gap-2.5 text-sm text-foreground">
                <div className="w-1 h-1 bg-primary shrink-0" />
                {f}
              </div>
            ))}
          </div>

          {/* Password form */}
          <form onSubmit={handleSubmit} className="max-w-xs">
            <p className="text-xs text-muted-foreground mb-2">Есть доступ? Введите пароль:</p>
            <div className={`flex border ${error ? "border-destructive" : "border-border"} ${shake ? "animate-[shake_0.3s_ease-in-out]" : ""}`}>
              <div className="flex items-center pl-3 text-muted-foreground">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 px-3 py-2.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {error && <p className="text-destructive text-xs mt-1.5">Неверный пароль</p>}
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground/50">
          <span>© 2025 АрендаСити</span>
          <a href="tel:+73952551234" className="hover:text-muted-foreground transition-colors">+7 (3952) 55-12-34</a>
        </div>
      </div>

      {/* Right: photo */}
      <div className="hidden lg:block flex-1 relative overflow-hidden">
        <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-foreground/50" />
        <div className="absolute inset-0 flex flex-col justify-end p-14 text-background">
          <div className="text-4xl font-display font-bold leading-tight mb-3">
            Иркутск · Ангарск<br />Шелехов
          </div>
          <p className="text-background/60 text-sm max-w-xs leading-relaxed">
            Профессиональный подбор коммерческой недвижимости с 2013 года
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}
