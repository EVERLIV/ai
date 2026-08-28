import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Briefcase,
  Building2,
  ExternalLink,
  Home,
  Search,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AdminTableEmptyRow,
  AdminTableHead,
  AdminTableLoadingRow,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/admin/AdminDataTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import VerifiedBadge from "@/components/VerifiedBadge";
import { useToast } from "@/hooks/use-toast";
import {
  ACCOUNT_TYPE_LABELS,
  type ProfileAccountType,
  type UserProfile,
  VERIFICATION_LABELS,
  type VerificationStatus,
} from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import {
  adminUpdateProfile,
  fetchClientProfiles,
  fetchPropertyCountsBySubmitter,
} from "@/lib/adminModeration";
import {
  compareValues,
  nextSortState,
  type SortDir,
} from "@/lib/adminTableSort";
import {
  type Agency,
  adminUpdateAgencyApi,
  fetchAgenciesAdminApi,
} from "@/lib/agencyApi";
import { cn } from "@/lib/utils";

type TypeFilter = "all" | "owner" | "agency";
type StatusFilter = "all" | "pending" | "verified" | "unverified";

const STATUS_STYLES: Record<VerificationStatus, string> = {
  unverified:
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  pending:
    "bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
  verified:
    "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  rejected:
    "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
};

function StatusBadge({ status }: { status: VerificationStatus }) {
  return (
    <span
      className={cn(
        "inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap",
        STATUS_STYLES[status],
      )}
    >
      {VERIFICATION_LABELS[status]}
    </span>
  );
}

export default function OwnersRealtorsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [agencySortField, setAgencySortField] = useState<string | null>(null);
  const [agencySortDir, setAgencySortDir] = useState<SortDir>("asc");
  const [profileSortField, setProfileSortField] = useState<string | null>(null);
  const [profileSortDir, setProfileSortDir] = useState<SortDir>("asc");

  const handleAgencySort = (field: string) => {
    const next = nextSortState(agencySortField, agencySortDir, field);
    setAgencySortField(next.field);
    setAgencySortDir(next.dir);
  };

  const handleProfileSort = (field: string) => {
    const next = nextSortState(profileSortField, profileSortDir, field);
    setProfileSortField(next.field);
    setProfileSortDir(next.dir);
  };

  const {
    data: users = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["client-profiles"],
    queryFn: fetchClientProfiles,
    staleTime: 0,
  });

  const { data: agencies = [] } = useQuery({
    queryKey: ["admin-agencies"],
    queryFn: fetchAgenciesAdminApi,
    staleTime: 0,
  });

  const { data: propertyCounts = {} } = useQuery({
    queryKey: ["client-property-counts"],
    queryFn: fetchPropertyCountsBySubmitter,
  });

  const toggleVerified = useMutation({
    mutationFn: async ({ id, verified }: { id: string; verified: boolean }) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
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
      toast({
        title: verified ? "Пользователь верифицирован" : "Верификация снята",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Ошибка",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const toggleAgencyVerified = useMutation({
    mutationFn: async ({ id, verified }: { id: string; verified: boolean }) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const moderatorId = session?.user?.id ?? null;
      await adminUpdateAgencyApi(
        id,
        verified
          ? {
              verification_status: "verified",
              verified_at: new Date().toISOString(),
              verified_by: moderatorId,
            }
          : {
              verification_status: "unverified",
              verified_at: null,
              verified_by: null,
            },
      );
    },
    onSuccess: (_, { verified }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-agencies"] });
      toast({
        title: verified ? "Агентство верифицировано" : "Верификация снята",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Ошибка",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) =>
      adminUpdateProfile(id, { verification_status: "rejected" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-profiles"] });
      toast({ title: "Заявка отклонена" });
    },
    onError: (err: Error) => {
      toast({
        title: "Ошибка",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const rejectAgencyMutation = useMutation({
    mutationFn: (id: string) =>
      adminUpdateAgencyApi(id, { verification_status: "rejected" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-agencies"] });
      toast({ title: "Заявка агентства отклонена" });
    },
    onError: (err: Error) => {
      toast({
        title: "Ошибка",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const stats = useMemo(
    () => ({
      total: users.length,
      owners: users.filter((u) => u.account_type === "owner").length,
      realtors: users.filter(
        (u) => u.account_type === "realtor" || u.account_type === "agency",
      ).length,
      agencies: agencies.length,
      pending:
        users.filter((u) => u.verification_status === "pending").length +
        agencies.filter((a) => a.verification_status === "pending").length,
      verified:
        users.filter((u) => u.verification_status === "verified").length +
        agencies.filter((a) => a.verification_status === "verified").length,
    }),
    [users, agencies],
  );

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (typeFilter === "owner" && u.account_type !== "owner") return false;
      if (
        typeFilter === "agency" &&
        u.account_type !== "realtor" &&
        u.account_type !== "agency"
      )
        return false;
      if (statusFilter === "pending" && u.verification_status !== "pending")
        return false;
      if (statusFilter === "verified" && u.verification_status !== "verified")
        return false;
      if (
        statusFilter === "unverified" &&
        u.verification_status !== "unverified"
      )
        return false;

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

  const filteredAgencies = useMemo(() => {
    if (typeFilter === "owner") return [] as Agency[];
    return agencies.filter((a) => {
      if (statusFilter === "pending" && a.verification_status !== "pending")
        return false;
      if (statusFilter === "verified" && a.verification_status !== "verified")
        return false;
      if (
        statusFilter === "unverified" &&
        a.verification_status !== "unverified"
      )
        return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        a.name?.toLowerCase().includes(q) || a.about?.toLowerCase().includes(q)
      );
    });
  }, [agencies, typeFilter, statusFilter, search]);

  const sortedAgencies = useMemo(() => {
    if (!agencySortField) return filteredAgencies;
    return [...filteredAgencies].sort((a, b) => {
      if (agencySortField === "name") {
        return compareValues(a.name, b.name, agencySortDir);
      }
      if (agencySortField === "verification_status") {
        return compareValues(
          a.verification_status,
          b.verification_status,
          agencySortDir,
        );
      }
      return 0;
    });
  }, [filteredAgencies, agencySortField, agencySortDir]);

  const sortedProfiles = useMemo(() => {
    if (!profileSortField) return filtered;
    return [...filtered].sort((a, b) => {
      if (profileSortField === "name") {
        return compareValues(
          a.full_name || a.email,
          b.full_name || b.email,
          profileSortDir,
        );
      }
      if (profileSortField === "email") {
        return compareValues(a.email, b.email, profileSortDir);
      }
      if (profileSortField === "account_type") {
        return compareValues(a.account_type, b.account_type, profileSortDir);
      }
      if (profileSortField === "verification_status") {
        return compareValues(
          a.verification_status,
          b.verification_status,
          profileSortDir,
        );
      }
      if (profileSortField === "objects") {
        return compareValues(
          propertyCounts[a.id] || 0,
          propertyCounts[b.id] || 0,
          profileSortDir,
        );
      }
      return 0;
    });
  }, [filtered, profileSortField, profileSortDir, propertyCounts]);

  const busy =
    toggleVerified.isPending ||
    rejectMutation.isPending ||
    toggleAgencyVerified.isPending ||
    rejectAgencyMutation.isPending;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Собственники и агентства
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Клиенты платформы — верификация собственников и агентств
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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          { label: "Профили", value: stats.total, icon: Users },
          { label: "Собственники", value: stats.owners, icon: User },
          { label: "Профили агентств", value: stats.realtors, icon: Building2 },
          { label: "Агентства", value: stats.agencies, icon: Briefcase },
          {
            label: "На проверке",
            value: stats.pending,
            icon: ShieldCheck,
            highlight: stats.pending > 0,
          },
          { label: "Верифицированы", value: stats.verified, icon: ShieldCheck },
        ].map(({ label, value, icon: Icon, highlight }) => (
          <div
            key={label}
            className={cn(
              "bg-card border border-border rounded-lg px-3 py-2.5 flex items-center gap-2.5",
              highlight &&
                "border-amber-300 bg-amber-50/50 dark:bg-amber-950/20",
            )}
          >
            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold leading-none text-foreground">
                {value}
              </p>
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 p-0.5 bg-muted/50 rounded-lg border border-border/60">
          {(
            [
              ["all", "Все"],
              ["owner", "Собственники"],
              ["agency", "Агентства"],
            ] as [TypeFilter, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
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
          {(
            [
              ["all", "Любой статус"],
              ["pending", "На проверке"],
              ["verified", "Верифицированы"],
              ["unverified", "Не верифицированы"],
            ] as [StatusFilter, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
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

      {isError ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg bg-card">
          <p className="text-sm text-destructive font-medium">
            Не удалось загрузить пользователей
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => refetch()}
          >
            Повторить
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {typeFilter !== "owner" && (
            <Card>
              <CardContent className="p-0">
                <div className="px-4 py-3 border-b border-border">
                  <h3 className="text-sm font-semibold">
                    Агентства ({sortedAgencies.length})
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <AdminTableHead
                          label="Название"
                          field="name"
                          sortable
                          sortField={agencySortField}
                          sortDir={agencySortDir}
                          onSort={handleAgencySort}
                        />
                        <AdminTableHead
                          label="Статус"
                          field="verification_status"
                          sortable
                          sortField={agencySortField}
                          sortDir={agencySortDir}
                          onSort={handleAgencySort}
                          className="w-32"
                        />
                        <AdminTableHead
                          label="Описание"
                          sortField={agencySortField}
                          sortDir={agencySortDir}
                          onSort={handleAgencySort}
                        />
                        <AdminTableHead
                          label="Страница"
                          sortField={agencySortField}
                          sortDir={agencySortDir}
                          onSort={handleAgencySort}
                          className="w-28"
                        />
                        <AdminTableHead
                          label="Верификация"
                          sortField={agencySortField}
                          sortDir={agencySortDir}
                          onSort={handleAgencySort}
                          className="w-36"
                        />
                        <AdminTableHead
                          label="Действия"
                          sortField={agencySortField}
                          sortDir={agencySortDir}
                          onSort={handleAgencySort}
                          className="w-24 text-right"
                        />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <AdminTableLoadingRow colSpan={6} />
                      ) : sortedAgencies.length === 0 ? (
                        <AdminTableEmptyRow
                          colSpan={6}
                          message="Агентства не найдены"
                        />
                      ) : (
                        sortedAgencies.map((a) => {
                          const verified = a.verification_status === "verified";
                          const pending = a.verification_status === "pending";
                          return (
                            <TableRow
                              key={a.id}
                              className={cn(
                                "text-xs even:bg-muted/30",
                                pending && "bg-amber-50/40 dark:bg-amber-950/10",
                              )}
                            >
                              <TableCell className="py-1.5 font-medium">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="truncate max-w-[200px]">
                                    {a.name || "Без названия"}
                                  </span>
                                  {verified && (
                                    <VerifiedBadge showLabel={false} />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-1.5">
                                <StatusBadge status={a.verification_status} />
                              </TableCell>
                              <TableCell className="py-1.5 text-muted-foreground max-w-[280px] truncate">
                                {a.about || "—"}
                              </TableCell>
                              <TableCell className="py-1.5">
                                <Link
                                  to={`/agentstvo/${a.id}`}
                                  className="text-primary inline-flex items-center gap-1 hover:underline whitespace-nowrap"
                                >
                                  Открыть
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              </TableCell>
                              <TableCell className="py-1.5">
                                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                                  <Switch
                                    checked={verified}
                                    disabled={busy}
                                    onCheckedChange={(checked) =>
                                      toggleAgencyVerified.mutate({
                                        id: a.id,
                                        verified: checked,
                                      })
                                    }
                                  />
                                  <span className="text-[11px] text-muted-foreground">
                                    {verified ? "Да" : "Нет"}
                                  </span>
                                </label>
                              </TableCell>
                              <TableCell className="py-1.5 text-right">
                                {pending && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[10px] text-destructive border-destructive/30"
                                    disabled={busy}
                                    onClick={() =>
                                      rejectAgencyMutation.mutate(a.id)
                                    }
                                  >
                                    Отклонить
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold">
                  Профили ({sortedProfiles.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <AdminTableHead
                        label="Имя"
                        field="name"
                        sortable
                        sortField={profileSortField}
                        sortDir={profileSortDir}
                        onSort={handleProfileSort}
                      />
                      <AdminTableHead
                        label="Тип"
                        field="account_type"
                        sortable
                        sortField={profileSortField}
                        sortDir={profileSortDir}
                        onSort={handleProfileSort}
                        className="w-28"
                      />
                      <AdminTableHead
                        label="Email"
                        field="email"
                        sortable
                        sortField={profileSortField}
                        sortDir={profileSortDir}
                        onSort={handleProfileSort}
                      />
                      <AdminTableHead
                        label="Телефон"
                        sortField={profileSortField}
                        sortDir={profileSortDir}
                        onSort={handleProfileSort}
                        className="w-28"
                      />
                      <AdminTableHead
                        label="Объекты"
                        field="objects"
                        sortable
                        sortField={profileSortField}
                        sortDir={profileSortDir}
                        onSort={handleProfileSort}
                        className="w-20"
                      />
                      <AdminTableHead
                        label="Агентство"
                        sortField={profileSortField}
                        sortDir={profileSortDir}
                        onSort={handleProfileSort}
                        className="w-32"
                      />
                      <AdminTableHead
                        label="Статус"
                        field="verification_status"
                        sortable
                        sortField={profileSortField}
                        sortDir={profileSortDir}
                        onSort={handleProfileSort}
                        className="w-32"
                      />
                      <AdminTableHead
                        label="Верификация"
                        sortField={profileSortField}
                        sortDir={profileSortDir}
                        onSort={handleProfileSort}
                        className="w-36"
                      />
                      <AdminTableHead
                        label="Действия"
                        sortField={profileSortField}
                        sortDir={profileSortDir}
                        onSort={handleProfileSort}
                        className="w-24 text-right"
                      />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <AdminTableLoadingRow colSpan={9} />
                    ) : sortedProfiles.length === 0 ? (
                      <AdminTableEmptyRow
                        colSpan={9}
                        message="Профили не найдены"
                      />
                    ) : (
                      sortedProfiles.map((u) => {
                        const profile = u as UserProfile;
                        const verified =
                          profile.verification_status === "verified";
                        const pending =
                          profile.verification_status === "pending";
                        const count = propertyCounts[profile.id] || 0;
                        const isRealtor =
                          profile.account_type === "realtor" ||
                          profile.account_type === "agency";

                        return (
                          <TableRow
                            key={profile.id}
                            className={cn(
                              "text-xs even:bg-muted/30",
                              pending && "bg-amber-50/40 dark:bg-amber-950/10",
                            )}
                          >
                            <TableCell className="py-1.5 font-medium">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="truncate max-w-[180px]">
                                  {profile.full_name || "Без имени"}
                                </span>
                                {verified && (
                                  <VerifiedBadge showLabel={false} />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-1.5 whitespace-nowrap">
                              {
                                ACCOUNT_TYPE_LABELS[
                                  profile.account_type as ProfileAccountType
                                ]
                              }
                            </TableCell>
                            <TableCell className="py-1.5 text-muted-foreground max-w-[200px] truncate">
                              {profile.email ? (
                                <a
                                  href={`mailto:${profile.email}`}
                                  className="hover:text-primary"
                                >
                                  {profile.email}
                                </a>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell className="py-1.5 whitespace-nowrap">
                              {profile.phone ? (
                                <a
                                  href={`tel:${profile.phone}`}
                                  className="hover:text-primary"
                                >
                                  {profile.phone}
                                </a>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell className="py-1.5 tabular-nums">
                              <span className="inline-flex items-center gap-1">
                                <Home className="w-3 h-3 text-muted-foreground" />
                                {count}
                              </span>
                            </TableCell>
                            <TableCell className="py-1.5 truncate max-w-[140px]">
                              {isRealtor && profile.agency_name
                                ? profile.agency_name
                                : "—"}
                            </TableCell>
                            <TableCell className="py-1.5">
                              <StatusBadge status={profile.verification_status} />
                            </TableCell>
                            <TableCell className="py-1.5">
                              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                                <Switch
                                  checked={verified}
                                  disabled={busy}
                                  onCheckedChange={(checked) =>
                                    toggleVerified.mutate({
                                      id: profile.id,
                                      verified: checked,
                                    })
                                  }
                                />
                                <span className="text-[11px] text-muted-foreground">
                                  {verified ? "Да" : "Нет"}
                                </span>
                              </label>
                            </TableCell>
                            <TableCell className="py-1.5 text-right">
                              {pending && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-[10px] text-destructive border-destructive/30"
                                  disabled={busy}
                                  onClick={() =>
                                    rejectMutation.mutate(profile.id)
                                  }
                                >
                                  Отклонить
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
