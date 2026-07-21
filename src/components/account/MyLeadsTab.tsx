import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Eye, Phone, Mail, User, Calendar, MessageSquareText } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Lead {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;
  object_id: string | null;
  source: string;
  created_at: string;
  business_category: string | null;
}

interface PropertyInfo {
  id: string;
  address: string;
  type: string;
  area: number;
  price: number;
  cover_photo: string | null;
}

function useMyLeads() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-leads", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: myProps } = await supabase
        .from("properties")
        .select("id, address, type, area, price, cover_photo")
        .eq("submitted_by", user!.id);

      if (!myProps?.length) return { leads: [] as Lead[], properties: {} as Record<string, PropertyInfo> };

      const propMap: Record<string, PropertyInfo> = {};
      for (const p of myProps) {
        propMap[p.id] = p as PropertyInfo;
      }

      const propIds = myProps.map((p) => p.id);
      const { data: leads } = await supabase
        .from("crm_leads")
        .select("*")
        .in("object_id", propIds)
        .order("created_at", { ascending: false });

      return { leads: (leads || []) as Lead[], properties: propMap };
    },
  });
}

function maskValue(val: string): string {
  if (val.includes("@")) {
    const [local, domain] = val.split("@");
    return `${local[0]}${"•".repeat(Math.max(local.length - 1, 2))}@${domain}`;
  }
  if (/[\d+\-()\s]/.test(val) && val.length > 4) {
    return val.slice(0, 3) + "•".repeat(val.length - 5) + val.slice(-2);
  }
  if (val.length > 2) {
    return val[0] + "•".repeat(val.length - 1);
  }
  return "••••";
}

function LeadCard({ lead, property }: { lead: Lead; property?: PropertyInfo }) {
  const storageKey = `lead_revealed_${lead.id}`;
  const [revealed, setRevealed] = useState(() => localStorage.getItem(storageKey) === "1");

  const handleReveal = () => {
    localStorage.setItem(storageKey, "1");
    setRevealed(true);
  };

  const date = new Date(lead.created_at);
  const dateStr = date.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

  return (
    <article className="bg-card rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            {dateStr}, {timeStr}
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 whitespace-nowrap">
            {lead.source === "owner_message" ? "Вопрос" : "Заявка"}
          </span>
        </div>

        {property && (
          <Link
            to={`/property/${property.id}`}
            className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
          >
            {property.cover_photo && (
              <img src={property.cover_photo} alt="" className="w-12 h-12 rounded object-cover shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-foreground truncate">{property.address}</div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-2">
                <span>{property.type}</span>
                <span>{property.area} м²</span>
                {Number(property.price) > 0 && (
                  <span className="font-medium">{Number(property.price).toLocaleString("ru-RU")} ₽</span>
                )}
              </div>
            </div>
          </Link>
        )}

        {revealed ? (
          <div className="space-y-2">
            {lead.name && (
              <span className="flex items-center gap-1.5 text-sm">
                <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-foreground">{lead.name}</span>
              </span>
            )}
            {lead.phone && (
              <div className="flex items-center gap-1.5 text-sm">
                <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <a href={`tel:${lead.phone}`} className="text-primary hover:underline">{lead.phone}</a>
              </div>
            )}
            {lead.email && (
              <div className="flex items-center gap-1.5 text-sm">
                <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a>
              </div>
            )}
            {lead.message && (
              <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                  <MessageSquareText className="w-3 h-3" />
                  Сообщение
                </div>
                <p className="text-sm text-foreground leading-relaxed">{lead.message}</p>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleReveal}
            className="w-full group cursor-pointer"
          >
            <div className="space-y-2 relative">
              {lead.name && (
                <span className="flex items-center gap-1.5 text-sm">
                  <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{maskValue(lead.name)}</span>
                </span>
              )}
              {lead.phone && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{maskValue(lead.phone)}</span>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-1.5 text-sm">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{maskValue(lead.email)}</span>
                </div>
              )}
              {lead.message && (
                <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1">
                    <MessageSquareText className="w-3 h-3" />
                    Сообщение
                  </div>
                  <p className="text-sm text-muted-foreground">••••••••••••••••••</p>
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-card/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                  <Eye className="w-3.5 h-3.5" />
                  Показать данные
                </span>
              </div>
            </div>
          </button>
        )}
      </div>
    </article>
  );
}

export default function MyLeadsTab() {
  const { data, isLoading } = useMyLeads();
  const leads = data?.leads || [];
  const properties = data?.properties || {};

  if (isLoading) {
    return (
      <div>
        <h2 className="font-display text-xl font-bold text-foreground mb-5">Мои заявки</h2>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card rounded-lg h-[120px] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-xl font-bold text-foreground">Мои заявки</h2>
        {leads.length > 0 && (
          <span className="text-xs text-muted-foreground">{leads.length} заявок</span>
        )}
      </div>

      {leads.length === 0 ? (
        <div className="bg-card rounded-lg p-12 text-center">
          <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">Заявок пока нет</p>
          <p className="text-xs text-muted-foreground mb-4">
            Когда кто-то оставит заявку по вашему объекту, она появится здесь
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              property={lead.object_id ? properties[lead.object_id] : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
