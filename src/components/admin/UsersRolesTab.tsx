import { useQuery } from "@tanstack/react-query";
import { Key, Plus, Search, Shield, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useAdminTableState } from "@/hooks/useAdminTableState";
import {
  SERVICE_ROLE_KEY,
  SUPABASE_URL,
  supabaseAdmin,
} from "@/integrations/supabase/adminClient";
import { compareDates, compareValues } from "@/lib/adminTableSort";

function formatLastSignIn(value: string | null | undefined) {
  if (!value) return "Никогда";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type UserColKey = "name" | "account_type" | "roles" | "email" | "last_sign_in" | "created_at" | "actions";

const USER_COLUMNS = [
  { key: "name" as const, label: "Пользователь", defaultOn: true },
  { key: "account_type" as const, label: "Тип", defaultOn: true },
  { key: "roles" as const, label: "Роли", defaultOn: true, sortable: false },
  { key: "email" as const, label: "Email", defaultOn: true },
  { key: "last_sign_in" as const, label: "Последний вход", defaultOn: true },
  { key: "created_at" as const, label: "Регистрация", defaultOn: true },
  { key: "actions" as const, label: "Действия", defaultOn: true, sortable: false },
];
export default function UsersRolesTab({
  isAdmin,
  currentUserId,
}: {
  isAdmin: boolean;
  currentUserId?: string;
}) {
  const { toast } = useToast();
  const [roleFilter, setRoleFilter] = useState<"all" | "staff" | "client">(
    "all",
  );
  const [pwDialog, setPwDialog] = useState<{
    open: boolean;
    userId: string;
    email: string;
  }>({ open: false, userId: "", email: "" });
  const [newPw, setNewPw] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "client",
  });
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    data: users = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-all-users"],
    queryFn: async () => {
      const { data: authData, error } =
        await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (error) throw error;
      const authHeaders = {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      };
      const [rolesRes, profilesRes] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/user_roles?select=user_id,role`, {
          headers: authHeaders,
        }),
        fetch(
          `${SUPABASE_URL}/rest/v1/profiles?select=id,full_name,phone,account_type,verification_status`,
          { headers: authHeaders },
        ),
      ]);
      const rolesData = await rolesRes.json();
      const profiles = await profilesRes.json();
      const rolesMap: Record<string, string[]> = {};
      (Array.isArray(rolesData) ? rolesData : []).forEach(
        (r: { user_id: string; role: string }) => {
          if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
          rolesMap[r.user_id].push(r.role);
        },
      );
      const profileMap: Record<
        string,
        {
          full_name?: string | null;
          phone?: string | null;
          account_type?: string | null;
          verification_status?: string | null;
        }
      > = {};
      (Array.isArray(profiles) ? profiles : []).forEach((p) => {
        profileMap[p.id] = p;
      });
      return (authData.users || []).map((u: any) => ({
        id: u.id,
        email: u.email || "",
        full_name:
          profileMap[u.id]?.full_name || u.user_metadata?.full_name || null,
        phone: profileMap[u.id]?.phone || u.phone || null,
        account_type:
          profileMap[u.id]?.account_type ||
          u.user_metadata?.account_type ||
          "owner",
        verification_status:
          profileMap[u.id]?.verification_status || "unverified",
        created_at: u.created_at,
        last_sign_in: u.last_sign_in_at || null,
        roles: rolesMap[u.id] || [],
        confirmed: !!u.email_confirmed_at,
      }));
    },
    enabled: isAdmin,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const roleLabel = (r: string) =>
    r === "admin"
      ? "Администратор"
      : r === "manager"
        ? "Менеджер"
        : r === "staff"
          ? "Сотрудник"
          : r === "client"
            ? "Клиент"
            : r;

  const roleBadgeColor = (r: string) =>
    r === "admin"
      ? "bg-red-100 text-red-700"
      : r === "manager"
        ? "bg-blue-100 text-blue-700"
        : r === "staff"
          ? "bg-purple-100 text-purple-700"
          : "bg-gray-100 text-gray-600";

  const accountTypeLabel = (t: string) =>
    t === "agency" || t === "realtor"
      ? "Агентство"
      : t === "owner"
        ? "Собственник"
        : t;

  const toggleRole = async (userId: string, role: string, hasIt: boolean) => {
    await supabaseAdmin.roles.toggle(userId, role, hasIt);
    await refetch();
    toast({ title: hasIt ? `Роль убрана` : `Роль назначена` });
  };

  const setPassword = async () => {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      pwDialog.userId,
      { password: newPw },
    );
    if (error) {
      toast({
        title: "Ошибка",
        description: (error as any).message || String(error),
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Пароль изменён" });
    setPwDialog({ open: false, userId: "", email: "" });
    setNewPw("");
  };

  const deleteUser = async (userId: string, email: string) => {
    if (
      !confirm(
        `Удалить пользователя ${email || userId}?\n\nБудет удалён аккаунт входа. Связанные данные с CASCADE тоже удалятся; если есть FK без CASCADE — удаление не пройдёт.`,
      )
    ) {
      return;
    }
    setDeletingId(userId);
    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) {
        toast({
          title: "Не удалось удалить",
          description: (error as any).message || JSON.stringify(error),
          variant: "destructive",
        });
        return;
      }
      await refetch();
      toast({ title: "Пользователь удалён" });
    } finally {
      setDeletingId(null);
    }
  };

  const confirmEmail = async (userId: string) => {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });
    if (error) {
      toast({
        title: "Ошибка",
        description: (error as any).message || String(error),
        variant: "destructive",
      });
      return;
    }
    refetch();
    toast({ title: "Email подтверждён" });
  };

  const createUser = async () => {
    if (!newUser.email || newUser.password.length < 6) {
      toast({
        title: "Заполните email и пароль (мин. 6 символов)",
        variant: "destructive",
      });
      return;
    }
    setCreating(true);
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: newUser.email,
      password: newUser.password,
      full_name: newUser.full_name || undefined,
    });
    if (error) {
      toast({
        title: "Ошибка создания",
        description:
          (error as any).message || (error as any).msg || JSON.stringify(error),
        variant: "destructive",
      });
      setCreating(false);
      return;
    }
    if (newUser.role !== "client" && data?.id) {
      await supabaseAdmin.roles.set(data.id, newUser.role);
    }
    toast({ title: "Пользователь создан" });
    setAddOpen(false);
    setNewUser({ email: "", password: "", full_name: "", role: "client" });
    setCreating(false);
    refetch();
  };

  const table = useAdminTableState<UserColKey>(
    "admin-users-table",
    USER_COLUMNS,
  );

  const filtered = useMemo(() => {
    const q = table.search.trim().toLowerCase();
    let list = users
      .filter((u) => {
        if (roleFilter === "staff") {
          return u.roles.some(
            (r: string) => r === "admin" || r === "manager" || r === "staff",
          );
        }
        if (roleFilter === "client") {
          return !u.roles.some(
            (r: string) => r === "admin" || r === "manager" || r === "staff",
          );
        }
        return true;
      })
      .filter(
        (u) =>
          !q ||
          u.email.toLowerCase().includes(q) ||
          u.full_name?.toLowerCase().includes(q) ||
          u.phone?.toLowerCase().includes(q),
      );

    if (!table.sortField) {
      return [...list].sort((a, b) =>
        compareDates(b.last_sign_in, a.last_sign_in, "desc"),
      );
    }

    return [...list].sort((a, b) => {
      const field = table.sortField!;
      if (field === "last_sign_in" || field === "created_at") {
        return compareDates(
          a[field as "last_sign_in" | "created_at"],
          b[field as "last_sign_in" | "created_at"],
          table.sortDir,
        );
      }
      if (field === "name") {
        return compareValues(
          a.full_name || a.email,
          b.full_name || b.email,
          table.sortDir,
        );
      }
      return compareValues(
        (a as Record<string, unknown>)[field],
        (b as Record<string, unknown>)[field],
        table.sortDir,
      );
    });
  }, [users, roleFilter, table.search, table.sortField, table.sortDir]);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Все пользователи (
            {users.length})
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <div className="flex gap-1 p-0.5 bg-muted/50 rounded-lg border border-border/60">
              {(
                [
                  ["all", "Все"],
                  ["client", "Клиенты"],
                  ["staff", "Сотрудники"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRoleFilter(key)}
                  className={`text-[11px] font-medium px-2.5 py-1.5 rounded-md transition-colors ${
                    roleFilter === key
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                value={table.search}
                onChange={(e) => table.setSearch(e.target.value)}
                placeholder="Email, имя, телефон…"
                className="pl-8 h-8 text-xs"
              />
            </div>
            {isAdmin && (
              <Button
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="w-3.5 h-3.5" /> Добавить
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <AdminTableHead
                  label="Пользователь"
                  field="name"
                  sortable
                  sortField={table.sortField}
                  sortDir={table.sortDir}
                  onSort={table.handleSort}
                  className="pl-4"
                />
                <AdminTableHead
                  label="Тип"
                  field="account_type"
                  sortable
                  sortField={table.sortField}
                  sortDir={table.sortDir}
                  onSort={table.handleSort}
                />
                <AdminTableHead
                  label="Роли"
                  sortField={table.sortField}
                  sortDir={table.sortDir}
                  onSort={table.handleSort}
                />
                <AdminTableHead
                  label="Email"
                  field="email"
                  sortable
                  sortField={table.sortField}
                  sortDir={table.sortDir}
                  onSort={table.handleSort}
                />
                <AdminTableHead
                  label="Последний вход"
                  field="last_sign_in"
                  sortable
                  sortField={table.sortField}
                  sortDir={table.sortDir}
                  onSort={table.handleSort}
                />
                <AdminTableHead
                  label="Регистрация"
                  field="created_at"
                  sortable
                  sortField={table.sortField}
                  sortDir={table.sortDir}
                  onSort={table.handleSort}
                />
                {isAdmin && (
                  <AdminTableHead
                    label="Действия"
                    sortField={table.sortField}
                    sortDir={table.sortDir}
                    onSort={table.handleSort}
                    className="text-right pr-4"
                  />
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground text-sm"
                  >
                    Загрузка...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground text-sm"
                  >
                    Пользователи не найдены
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((u: any) => {
                  const isSelf = u.id === currentUserId;
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="pl-4">
                        <div className="font-medium text-sm">
                          {u.full_name || "—"}
                          {isSelf && (
                            <span className="ml-1 text-[10px] text-muted-foreground">
                              (вы)
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {u.email}
                        </div>
                        {u.phone && (
                          <div className="text-[11px] text-muted-foreground">
                            {u.phone}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-[11px] text-muted-foreground">
                          {accountTypeLabel(u.account_type)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {u.roles.length === 0 ? (
                            <span className="text-xs text-muted-foreground">
                              Клиент
                            </span>
                          ) : (
                            u.roles.map((r: string) => (
                              <span
                                key={r}
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleBadgeColor(r)}`}
                              >
                                {roleLabel(r)}
                              </span>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {u.confirmed ? (
                          <span className="text-xs text-green-600">
                            подтверждён
                          </span>
                        ) : (
                          <button
                            onClick={() => confirmEmail(u.id)}
                            className="text-xs text-amber-500 hover:underline"
                          >
                            подтвердить
                          </button>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatLastSignIn(u.last_sign_in)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString("ru-RU")
                          : "—"}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-1">
                            {["manager", "admin"].map((role) => {
                              const has = u.roles.includes(role);
                              return (
                                <button
                                  key={role}
                                  onClick={() => toggleRole(u.id, role, has)}
                                  disabled={isSelf && role === "admin"}
                                  className={`text-[10px] px-2 py-1 rounded border transition-colors ${has ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary hover:text-primary"} disabled:opacity-40 disabled:cursor-not-allowed`}
                                >
                                  {has ? "✓ " : ""}
                                  {roleLabel(role)}
                                </button>
                              );
                            })}
                            <button
                              onClick={() => {
                                setNewPw("");
                                setPwDialog({
                                  open: true,
                                  userId: u.id,
                                  email: u.email,
                                });
                              }}
                              className="text-[10px] px-2 py-1 rounded border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                            >
                              Пароль
                            </button>
                            {!isSelf && (
                              <button
                                onClick={() => deleteUser(u.id, u.email)}
                                disabled={deletingId === u.id}
                                className="text-[10px] px-2 py-1 rounded border border-border text-muted-foreground hover:border-destructive hover:text-destructive transition-colors disabled:opacity-50"
                                title="Удалить пользователя"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add user dialog */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent side="right" className="w-80">
          <SheetHeader>
            <SheetTitle>Новый пользователь</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div>
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                placeholder="user@example.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Имя</Label>
              <Input
                value={newUser.full_name}
                onChange={(e) =>
                  setNewUser({ ...newUser, full_name: e.target.value })
                }
                placeholder="Имя Фамилия"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Пароль</Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                placeholder="Минимум 6 символов"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Роль</Label>
              <select
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value })
                }
                className="mt-1 w-full h-9 px-3 border border-input rounded-md text-sm bg-background"
              >
                <option value="client">Клиент</option>
                <option value="staff">Сотрудник</option>
                <option value="manager">Менеджер</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
            <Button
              onClick={createUser}
              disabled={
                creating || !newUser.email || newUser.password.length < 6
              }
              className="w-full"
            >
              {creating ? "Создание..." : "Создать"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Set password dialog */}
      <Sheet
        open={pwDialog.open}
        onOpenChange={(open) =>
          !open && setPwDialog({ open: false, userId: "", email: "" })
        }
      >
        <SheetContent side="right" className="w-80">
          <SheetHeader>
            <SheetTitle>Изменить пароль</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <p className="text-sm text-muted-foreground">{pwDialog.email}</p>
            <div>
              <Label className="text-xs">Новый пароль</Label>
              <Input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="Минимум 6 символов"
                className="mt-1"
              />
            </div>
            <Button
              onClick={setPassword}
              disabled={newPw.length < 6}
              className="w-full"
            >
              Сохранить
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
