import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Building2, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function ResetPassword() {
  const [step, setStep] = useState<"request" | "new-password">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Supabase вставляет токен в хэш после перехода по ссылке сброса
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setStep("new-password");
    }
  }, []);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }
  };

  const handleNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Ошибка", description: "Пароли не совпадают", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Готово!", description: "Пароль успешно изменён" });
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-between mb-10">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">А</span>
            </div>
            <span className="font-display text-lg font-bold text-foreground">
              АРЕНДА<span className="text-primary">СИТИ</span>
            </span>
          </Link>
          <Link to="/auth" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Назад
          </Link>
        </div>

        {step === "request" ? (
          sent ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-7 h-7 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold mb-2">Письмо отправлено</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Проверьте <strong>{email}</strong> и перейдите по ссылке в письме.
              </p>
              <button onClick={() => navigate("/auth")} className="text-sm text-primary hover:underline">
                Вернуться к входу
              </button>
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold mb-1">Сброс пароля</h1>
              <p className="text-sm text-muted-foreground mb-7">
                Введите email — мы отправим ссылку для восстановления
              </p>
              <form onSubmit={handleRequest} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">Email</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="your@email.com"
                    className="w-full h-11 px-4 bg-muted border border-border text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full h-11 bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? "Отправка..." : <><ArrowRight className="w-4 h-4" /> Отправить ссылку</>}
                </button>
              </form>
            </>
          )
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold mb-1">Новый пароль</h1>
            <p className="text-sm text-muted-foreground mb-7">Придумайте надёжный пароль</p>
            <form onSubmit={handleNewPassword} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Новый пароль</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"} value={password}
                    onChange={e => setPassword(e.target.value)} required minLength={6}
                    placeholder="Минимум 6 символов"
                    className="w-full h-11 px-4 pr-11 bg-muted border border-border text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Подтвердите пароль</label>
                <input
                  type="password" value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)} required minLength={6}
                  placeholder="Повторите пароль"
                  className="w-full h-11 px-4 bg-muted border border-border text-sm focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full h-11 bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? "Сохранение..." : <><ShieldCheck className="w-4 h-4" /> Сохранить пароль</>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
