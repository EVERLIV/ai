import { useState, useEffect } from "react";
import { Phone, X, Send, Star, Clock3, BadgeCheck, CheckCircle2 } from "lucide-react";
import consultantAvatar from "@/assets/consultant-anastasia.jpg";

const PHONE = "+73952551234";
const PHONE_DISPLAY = "+7 (3952) 55-12-34";

export default function ConsultationWidget() {
  const [open, setOpen] = useState(false);
  const [wiggle, setWiggle] = useState(false);
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Wiggle animation: triggers after 4s, then every 12s
  useEffect(() => {
    if (open) return;
    const first = setTimeout(() => setWiggle(true), 4000);
    const interval = setInterval(() => {
      setWiggle(true);
    }, 12000);
    return () => { clearTimeout(first); clearInterval(interval); };
  }, [open]);

  useEffect(() => {
    if (!wiggle) return;
    const t = setTimeout(() => setWiggle(false), 800);
    return () => clearTimeout(t);
  }, [wiggle]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setSent(true);
  };

  return (
    <>
      {/* ── BUBBLE TAB (closed) ── */}
      <div
        className={`fixed right-5 top-1/2 -translate-y-1/2 z-40 transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          open ? "opacity-0 pointer-events-none scale-90" : "opacity-100 scale-100"
        }`}
      >
        <button
          onClick={() => setOpen(true)}
          aria-label="Открыть консультацию"
          className={`flex flex-col items-center gap-1.5 group ${wiggle ? "animate-[consult-wiggle_0.8s_ease-in-out]" : ""}`}
        >
          {/* Avatar bubble + unread badge */}
          <div className="relative w-12 h-12 bg-card border border-border shadow-[0_4px_20px_-4px_rgba(0,0,0,0.18)] flex items-center justify-center group-hover:shadow-[0_6px_24px_-4px_rgba(0,0,0,0.22)] transition-shadow duration-200">
            <img src={consultantAvatar} alt="Анастасия" className="w-10 h-10 object-cover" />
            <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-card" />
            {/* Unread badge */}
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center shadow-sm animate-[badge-pop_0.4s_cubic-bezier(0.34,1.56,0.64,1)]">
              1
            </span>
          </div>
          {/* Phone icon only */}
          <div className="flex items-center justify-center w-8 h-5 bg-card border border-border shadow-sm">
            <Phone className="w-3 h-3 text-muted-foreground" />
          </div>
        </button>
      </div>

      {/* ── PANEL ── */}
      <div
        className={`
          fixed z-50 right-0 top-1/2 -translate-y-1/2 w-[288px]
          bg-card border-l border-y border-border
          shadow-[-12px_0_40px_-8px_rgba(0,0,0,0.15)]
          transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${open ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0 pointer-events-none"}
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <div className="relative shrink-0">
            <img
              src={consultantAvatar}
              alt="Анастасия"
              className="w-9 h-9 object-cover"
            />
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-card" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-foreground">Анастасия</span>
              <BadgeCheck className="w-3 h-3 text-primary shrink-0" />
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                <span className="font-medium text-foreground">4.9</span>
              </span>
              <span className="text-border text-[10px]">·</span>
              <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <Clock3 className="w-2.5 h-2.5" />~12 мин
              </span>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="shrink-0 w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {sent ? (
            <div className="py-4 flex flex-col items-center gap-2 text-center">
              <CheckCircle2 className="w-9 h-9 text-emerald-500" />
              <p className="text-sm font-semibold text-foreground">Заявка принята!</p>
              <p className="text-xs text-muted-foreground leading-snug">
                Анастасия свяжется с вами в течение 15 минут
              </p>
              <button
                onClick={() => { setSent(false); setName(""); setPhone(""); }}
                className="mt-1 text-[11px] text-primary hover:underline"
              >
                Отправить ещё
              </button>
            </div>
          ) : (
            <>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Оставьте заявку — перезвоним в течение 15 минут
              </p>
              <form onSubmit={handleSubmit} className="space-y-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ваше имя"
                  required
                  className="w-full px-3 py-2 bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-background border border-transparent focus:border-border transition-colors"
                />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (___) ___-__-__"
                  type="tel"
                  required
                  className="w-full px-3 py-2 bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-background border border-transparent focus:border-border transition-colors"
                />
                <button
                  type="submit"
                  className="w-full h-9 flex items-center justify-center gap-1.5 bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  <Send className="w-3 h-3" />
                  Перезвоните мне
                </button>
              </form>
            </>
          )}

          <div className="flex items-center gap-2">
            <span className="flex-1 h-px bg-border/60" />
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider">или</span>
            <span className="flex-1 h-px bg-border/60" />
          </div>

          <a
            href={`tel:${PHONE}`}
            className="flex items-center justify-center gap-2 h-8 border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Phone className="w-3 h-3 text-primary" />
            {PHONE_DISPLAY}
          </a>
        </div>
      </div>

      {/* Wiggle keyframes */}
      <style>{`
        @keyframes consult-wiggle {
          0%,100% { transform: translateY(-50%) scale(1); }
          20%      { transform: translateY(-52%) scale(1.04) rotate(1deg); }
          50%      { transform: translateY(-49%) scale(1.03) rotate(-0.8deg); }
          80%      { transform: translateY(-51%) scale(1.01) rotate(0.4deg); }
        }
        @keyframes badge-pop {
          0%   { transform: scale(0); opacity: 0; }
          70%  { transform: scale(1.25); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
