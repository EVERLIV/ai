import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Search, Building2, User, Mail, Phone, Users, ShieldCheck,
  Briefcase, FileText, Home,
} from "lucide-react";
import {
  adminUpdateProfile,
  fetchClientProfiles,
  fetchPropertyCountsBySubmitter,
} from "@/lib/adminModeration";
import {
  ACCOUNT_TYPE_LABELS,
  VERIFICATION_LABELS,
  type ProfileAccountType,
  type VerificationStatus,
  type UserProfile,
} from "@/hooks/useProfile";
import VerifiedBadge from "@/components/VerifiedBadge";
import { cn } from "@/lib/utils";

type TypeFilter = "all" | "owner" | "realtor";
type StatusFilter = "all" | "pending" | "verified" | "unverified";

const STATUS_STYLES: Record<VerificationStatus, string> = {
  unverified: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  pending: "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  verified: "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  rejected: "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
};

function initials(name: string, email?: string | null) {
  const n = name?.trim();
  if (n) return n.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  return email?.[0]?.toUpperCase() || "?";
}

function ClientCard({
  profile: u,
  propertyCount,
  onToggleVerified,
  onReject,
  busy,
}: {
  profile: UserProfile;
  propertyCount: number;
  onToggleVerified: (id: string, verified: boolean) => void;
  onReject: (id: string) => void;
  busy: boolean;
}) {
  const isRealtor = u.account_type === "realtor";
  const verified = u.verification_status === "verified";
  const pending = u.verification_status === "pending";

  return (
    <article
      className={cn(
        "bg-card border border-border rounded-lg overflow-hidden flex flex-col h-full",
        "shadow-sm hover:shadow-md transition-shadow duration-200",
        pending && "ring-1 ring-amber-300/60",
        verified && "ring-1 ring-emerald-300/40",
      )}
    >
      {/* Accent strip */}
      <div
        className={cn(
          "h-1 w-full",
          isRealtor ? "bg-primary" : "bg-slate-400",
          pending && "bg-amber-500",
          verified && "bg-emerald-500",
        )}
      />

      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-11 h-11 rounded-md flex items-center justify-center text-sm font-bold shrink-0",
              isRealtor
                ? "bg-primary/10 text-primary"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
            )}
          >
            {initials(u.full_name, u.email)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {u.full_name || "Без имени"}
              </h3>
              {verified && <VerifiedBadge showLabel={false} />}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded",
                  isRealtor ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                )}
              >
                {isRealtor ? <Building2 className="w-3 h-3" /> : <User className="w-3 h-3" />}
                {ACCOUNT_TYPE_LABELS[u.account_type as ProfileAccountType]}
              </span>
              <span
                className={cn(
                  "text-[10px] font-medium px-2 py-0.5 rounded-full",
                  STATUS_STYLES[u.verification_status],
                )}
              >
                {VERIFICATION_LABELS[u.verification_status]}
              </span>
            </div>
          </div>
        </div>

        {/* Contacts */}
        <div className="space-y-1.5 text-xs">
          {u.email && (
            <a
              href={`mailto:${u.email}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors truncate"
            >
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{u.email}</span>
            </a>
          )}
          {u.phone && (
            <a
              href={`tel:${u.phone}`}
              className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <Phone className="w-3.5 h-3.5 shrink-0" />
              {u.phone}
            </a>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Home className="w-3.5 h-3.5 shrink-0" />
            <span>
              {propertyCount > 0
                ? `${propertyCount} ${propertyCount === 1 ? "объект" : propertyCount < 5 ? "объекта" : "объектов"}`
                : "Объектов нет"}
            </span>
          </div>
        </div>

        {/* Agency block — realtors */}
        {isRealtor && (u.agency_name || u.agency_staff_count) && (
          <div className="rounded-md bg-muted/50 border border-border/60 px-3 py-2 space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Briefcase className="w-3 h-3" />
              Агентство
            </div>
            {u.agency_name && (
              <p className="text-xs font-medium text-foreground">{u.agency_name}</p>
            )}
            {u.agency_staff_count != null && u.agency_staff_count > 0 && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" />
                {u.agency_staff_count} сотрудников
              </p>
            )}
          </div>
        )}

        {/* About */}
        {u.agency_about && (
          <div className="rounded-md border border-border/50 px-3 py-2 bg-background/50">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              <FileText className="w-3 h-3" />
              {isRealtor ? "Об агентстве" : "О себе"}
            </div>
            <p className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed">
              {u.agency_about}
            </p>
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-auto pt-3 border-t border-border/60 flex items-center justify-between gap-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Switch
              checked={verified}
              disabled={busy}
              onCheckedChange={(checked) => onToggleVerified(u.id, checked)}
            />
            <span className="text-[11px] font-medium text-muted-foreground">
              Верифицирован
            </span>
          </label>
          {pending && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px] text-destructive border-destructive/30 hover:bg-destructive/5"
              disabled={busy}
              onClick={() => onReject(u.id)}
            >
              Отклонить
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function OwnersRealtorsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { data: users = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["client-profiles"],
    queryFn: fetchClientProfiles,
    staleTime: 0,
  });

  const { data: propertyCounts = {} } = useQuery({
    queryKey: ["client-property-counts"],
    queryFn: fetchPropertyCountsBySubmitter,
  });

  const toggleVerified = useMutation({
    mutationFn: async ({ id, verified }: { id: string; verified: boolean }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const moderatorId = session?.user?.id ?? null;

      const payload = verified
        ? {
            verification_status: "verified",
            verified_at: new Date().toISOString(),
            verified_by: moderatorId,
          }
        : {
            verification_status: "unverified",
            verified_at: null,
            verified_by: null,
          };

      await adminUpdateProfile(id, payload);
    },
    onSuccess: (_, { verified }) => {
      queryClient.invalidateQueries({ queryKey: ["client-profiles"] });
      toast({ title: verified ? "Пользователь верифицирован" : "Верификация снята" });
    },
    onError: (err: Error) => {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => adminUpdateProfile(id, { verification_status: "rejected" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-profiles"] });
      toast({ title: "Заявка отклонена" });
    },
    onError: (err: Error) => {
      toast({ title: "Ошибка", description: err.message, variant: "destructive" });
    },
  });

  const stats = useMemo(() => ({
    total: users.length,
    owners: users.filter((u) => u.account_type === "owner").length,
    realtors: users.filter((u) => u.account_type === "realtor").length,
    pending: users.filter((u) => u.verification_status === "pending").length,
    verified: users.filter((u) => u.verification_status === "verified").length,
  }), [users]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (typeFilter === "owner" && u.account_type !== "owner") return false;
      if (typeFilter === "realtor" && u.account_type !== "realtor") return false;
      if (statusFilter === "pending" && u.verification_status !== "pending") return false;
      if (statusFilter === "verified" && u.verification_status !== "verified") return false;
      if (statusFilter === "unverified" && u.verification_status !== "unverified") return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q) ||
        u.agency_name?.toLowerCase().includes(q) ||
        u.agency_about?.toLowerCase().includes(q)
      );
    });
  }, [users, typeFilter, statusFilter, search]);

  const busy = toggleVerified.isPending || rejectMutation.isPending;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Собственники и риелторы
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Клиенты платформы — верификация, контакты и данные агентств
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени, email, агентству…"
            className="pl-8 h-9 text-xs bg-card"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {[
          { label: "Всего", value: stats.total, icon: Users },
          { label: "Собственники", value: stats.owners, icon: User },
          { label: "Риелторы", value: stats.realtors, icon: Building2 },
          { label: "На проверке", value: stats.pending, icon: ShieldCheck, highlight: stats.pending > 0 },
          { label: "Верифицированы", value: stats.verified, icon: ShieldCheck },
        ].map(({ label, value, icon: Icon, highlight }) => (
          <div
            key={label}
            className={cn(
              "bg-card border border-border rounded-lg px-3 py-2.5 flex items-center gap-2.5",
              highlight && "border-amber-300 bg-amber-50/50 dark:bg-amber-950/20",
            )}
          >
            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold leading-none text-foreground">{value}</p>
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 p-0.5 bg-muted/50 rounded-lg border border-border/60">
          {([
            ["all", "Все"],
            ["owner", "Собственники"],
            ["realtor", "Риелторы"],
          ] as [TypeFilter, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={cn(
                "text-[11px] font-medium px-3 py-1.5 rounded-md transition-colors",
                typeFilter === key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 p-0.5 bg-muted/50 rounded-lg border border-border/60">
          {([
            ["all", "Любой статус"],
            ["pending", "На проверке"],
            ["verified", "Верифицированы"],
            ["unverified", "Не верифицированы"],
          ] as [StatusFilter, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              className={cn(
                "text-[11px] font-medium px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap",
                statusFilter === key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-52 bg-card border border-border rounded-lg animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg bg-card">
          <p className="text-sm text-destructive font-medium">Не удалось загрузить пользователей</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Повторить
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg bg-card">
          <Users className="w-10 h-10 text-muted-foreground/25 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">Пользователей не найдено</p>
          <p className="text-xs text-muted-foreground mt-1">
            {search ? "Измените поиск или фильтры" : "Зарегистрированные собственники и риелторы появятся здесь"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((u) => (
            <ClientCard
              key={u.id}
              profile={u as UserProfile}
              propertyCount={propertyCounts[u.id] || 0}
              busy={busy}
              onToggleVerified={(id, verified) => toggleVerified.mutate({ id, verified })}
              onReject={(id) => rejectMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      {!isLoading && filtered.length > 0 && (
        <p className="text-[10px] text-muted-foreground text-center">
          Показано {filtered.length} из {users.length}
        </p>
      )}
    </div>
  );
}
