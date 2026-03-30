import { useState } from "react";
import { Building2, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const SITE_PASSWORD = "arenda2024";

interface GateProps {
  onUnlock: () => void;
}

export default function Gate({ onUnlock }: GateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === SITE_PASSWORD) {
      localStorage.setItem("site_unlocked", "true");
      onUnlock();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight text-foreground">
            АРЕНДА<span className="text-primary">СИТИ</span>
          </span>
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Скоро
        </div>

        {/* Heading */}
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground leading-tight">
            Аренда коммерческой недвижимости в Иркутске
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-md mx-auto">
            Офисы, торговые площади, склады и земельные участки в Иркутске и Иркутской области. Профессиональный подбор от агентства.
          </p>
        </div>

        {/* Password form */}
        <form onSubmit={handleSubmit} className="max-w-xs mx-auto space-y-3">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="password"
              placeholder="Пароль для входа"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`pl-10 ${error ? "border-destructive ring-destructive/30 ring-2" : ""}`}
            />
          </div>
          {error && (
            <p className="text-destructive text-sm">Неверный пароль</p>
          )}
          <Button type="submit" className="w-full">
            Войти на сайт
          </Button>
        </form>

        <p className="text-xs text-muted-foreground/60">
          © 2024 АрендаСити. Все права защищены.
        </p>
      </div>
    </div>
  );
}
