import { MessageSquareText, Phone } from "lucide-react";
import VerifiedBadge from "@/components/VerifiedBadge";
import { DEFAULT_AGENT } from "@/config/defaultAgent";
import { Button } from "@/components/ui/button";

export default function ConsultantWidget() {
  const agent = DEFAULT_AGENT;

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        Ваш консультант
      </p>
      <div className="flex items-start gap-3">
        <img
          src={agent.avatar}
          alt={agent.name}
          className="w-12 h-12 rounded-lg object-cover shrink-0 bg-muted"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-foreground truncate">
              {agent.name}
            </span>
            {agent.isVerified && (
              <VerifiedBadge size="sm" showLabel={false} className="shrink-0" />
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
            Менеджер · «{agent.agencyName}»
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Ответ ~{agent.responseMinutes} мин
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a href={`tel:${agent.phoneTel}`}>
          <Button variant="outline" size="sm" className="w-full h-9 gap-1.5">
            <Phone className="w-3.5 h-3.5" />
            Позвонить
          </Button>
        </a>
        <Button
          type="button"
          size="sm"
          className="w-full h-9 gap-1.5"
          onClick={() =>
            window.dispatchEvent(new CustomEvent("open-consultant-chat"))
          }
        >
          <MessageSquareText className="w-3.5 h-3.5" />
          Написать
        </Button>
      </div>
    </div>
  );
}
