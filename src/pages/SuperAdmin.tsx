import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { supabaseAdmin } from "@/integrations/supabase/adminClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, Users, ArrowLeft, Search, MoreHorizontal,
  UserCheck, Trash2, Key, Crown, RefreshCw, Mail, Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type AppRole = "admin" | "manager" | "client";

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
  last_sign_in: string | null;
  roles: AppRole[];
  confirmed: boolean;
}

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Администратор",
  manager: "Менеджер",
  client: "Клиент",
};

const ROLE_COLORS: Record<AppRole, string> = {
  admin: "bg-red-100 text-red-700 border-red-200",
  manager: "bg-blue-100 text-blue-700 border-blue-200",
  client: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function SuperAdmin() {
  const { user, hasRole, loading, roles } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<AppRole | "all">("all");
  const [resetDialog, setResetDialog] = useState<{ open: boolean; userId: string; email: string }>({
    open: false, userId: "", email: "",
  });
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [roleDialog, setRoleDialog] = useState<{ open: boolean; user: UserRow | null }>({
    open: false, user: null,
  });
  const [newRole, setNewRole] = useState<AppRole>("client");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      </div>
    );
  }

  if (!hasRole("admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-lg font-semibold">Доступ запрещён</p>
          <p className="text-sm text-muted-foreground mt-1">Только для администраторов</p>
          <p className="text-xs text-muted-foreground mt-1">Роли: {roles.join(", ") || "нет"}</p>
          <Link to="/" className="mt-4 inline-block text-sm text-primary hover:underline">На главную</Link>
        </div>
      </div>
    );
  }

  const { data: users = [], isLoading } = useQuery<UserRow[]>({
    queryKey: ["super-admin-users"],
    queryFn: async () => {
      // Получаем всех пользователей через Auth Admin API
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (authError) throw authError;

      // Получаем profiles и роли
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, phone");
      const { data: rolesData } = await supabase.from("user_roles").select("user_id, role");

      const profileMap: Record<string, { full_name: string | null; phone: string | null }> = {};
      profiles?.forEach(p => { profileMap[p.id] = { full_name: p.full_name, phone: p.phone }; });

      const rolesMap: Record<string, AppRole[]> = {};
      rolesData?.forEach(r => {
        if (!rolesMap[r.user_id]) rolesMap[r.user_id] = [];
        rolesMap[r.user_id].push(r.role as AppRole);
      });

      return authData.users.map(u => ({
        id: u.id,
        email: u.email || "",
        full_name: profileMap[u.id]?.full_name ?? null,
        phone: profileMap[u.id]?.phone ?? u.phone ?? null,
        created_at: u.created_at,
        last_sign_in: u.last_sign_in_at ?? null,
        roles: rolesMap[u.id]?.length ? rolesMap[u.id] : ["client"],
        confirmed: !!u.email_confirmed_at,
      }));
    },
  });

  const setRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      await supabase.from("user_roles").delete().eq("user_id", userId);
      await supabase.from("user_roles").insert({ user_id: userId, role });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-users"] });
      toast({ title: "Роль обновлена" });
      setRoleDialog({ open: false, user: null });
    },
    onError: () => toast({ title: "Ошибка", variant: "destructive" }),
  });

  // Сброс пароля — устанавливаем новый пароль напрямую через Admin API
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Пароль изменён", description: "Новый пароль установлен успешно" });
      setResetDialog({ open: false, userId: "", email: "" });
      setNewPasswordValue("");
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  // Подтверждение email вручную
  const confirmEmailMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email_confirm: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-users"] });
      toast({ title: "Email подтверждён" });
    },
    onError: (e: any) => toast({ title: "Ошибка", description: e.message, variant: "destructive" }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await supabaseAdmin.auth.admin.deleteUser(userId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["super-admin-users"] });
      toast({ title: "Пользователь удалён" });
    },
    onError: (e: any) => toast({ title: "Ошибка удаления", description: e.message, variant: "destructive" }),
  });

  // Отправить ссылку сброса пароля на email (если SMTP настроен)
  const sendResetEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
    },
    onSuccess: () => toast({ title: "Письмо отправлено" }),
    onError: (e: any) => toast({ title: "Ошибка отправки письма", description: e.message, variant: "destructive" }),
  });

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.roles.includes(roleFilter);
    return matchSearch && matchRole;
  });

  const stats = {
    total: users.length,
    admins: users.filter(u => u.roles.includes("admin")).length,
    managers: users.filter(u => u.roles.includes("manager")).length,
    clients: users.filter(u => !u.roles.includes("admin") && !u.roles.includes("manager")).length,
    unconfirmed: users.filter(u => !u.confirmed).length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-sm">Управление пользователями</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5" />
            {user?.email}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Всего", value: stats.total, color: "text-foreground" },
            { label: "Администраторов", value: stats.admins, color: "text-red-500" },
            { label: "Менеджеров", value: stats.managers, color: "text-blue-500" },
            { label: "Клиентов", value: stats.clients, color: "text-gray-500" },
            { label: "Не подтв.", value: stats.unconfirmed, color: "text-amber-500" },
          ].map(({ label, value, color }) => (
            <Card key={label} className="border-border">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`text-2xl font-bold mt-0.5 ${color}`}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Поиск по email или имени..."
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={v => setRoleFilter(v as AppRole | "all")}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Все роли" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все роли</SelectItem>
              <SelectItem value="admin">Администраторы</SelectItem>
              <SelectItem value="manager">Менеджеры</SelectItem>
              <SelectItem value="client">Клиенты</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => qc.invalidateQueries({ queryKey: ["super-admin-users"] })}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Table */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Пользователи ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Пользователь</TableHead>
                    <TableHead>Телефон</TableHead>
                    <TableHead>Роль</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Последний вход</TableHead>
                    <TableHead>Регистрация</TableHead>
                    <TableHead className="text-right pr-6">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Загрузка...</TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Пользователи не найдены</TableCell>
                    </TableRow>
                  ) : filtered.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="pl-6">
                        <div>
                          <p className="font-medium text-sm">{u.full_name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.phone || "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map(role => (
                            <span key={role} className={`text-xs px-2 py-0.5 border rounded-full font-medium ${ROLE_COLORS[role]}`}>
                              {ROLE_LABELS[role]}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {u.confirmed ? (
                          <span className="text-xs text-green-600 font-medium">подтверждён</span>
                        ) : (
                          <span className="text-xs text-amber-500 font-medium">не подтверждён</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {u.last_sign_in ? new Date(u.last_sign_in).toLocaleDateString("ru-RU") : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString("ru-RU")}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem onClick={() => {
                              setNewRole(u.roles[0] || "client");
                              setRoleDialog({ open: true, user: u });
                            }}>
                              <Shield className="w-4 h-4 mr-2" />
                              Изменить роль
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setNewPasswordValue("");
                              setResetDialog({ open: true, userId: u.id, email: u.email });
                            }}>
                              <Key className="w-4 h-4 mr-2" />
                              Установить пароль
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => sendResetEmailMutation.mutate(u.email)}>
                              <Mail className="w-4 h-4 mr-2" />
                              Письмо сброса пароля
                            </DropdownMenuItem>
                            {!u.confirmed && (
                              <DropdownMenuItem onClick={() => confirmEmailMutation.mutate(u.id)}>
                                <UserCheck className="w-4 h-4 mr-2" />
                                Подтвердить email
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                if (confirm(`Удалить пользователя ${u.email}?`)) {
                                  deleteUserMutation.mutate(u.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Удалить
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Dialog */}
      <Dialog open={roleDialog.open} onOpenChange={open => !open && setRoleDialog({ open: false, user: null })}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Изменить роль</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">{roleDialog.user?.email}</p>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Новая роль</label>
              <Select value={newRole} onValueChange={v => setNewRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Клиент</SelectItem>
                  <SelectItem value="manager">Менеджер</SelectItem>
                  <SelectItem value="admin">Администратор</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialog({ open: false, user: null })}>Отмена</Button>
            <Button
              onClick={() => roleDialog.user && setRoleMutation.mutate({ userId: roleDialog.user.id, role: newRole })}
              disabled={setRoleMutation.isPending}
            >
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Password Dialog */}
      <Dialog open={resetDialog.open} onOpenChange={open => { if (!open) { setResetDialog({ open: false, userId: "", email: "" }); setNewPasswordValue(""); } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Установить пароль</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">{resetDialog.email}</p>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Новый пароль</label>
              <Input
                type="password"
                value={newPasswordValue}
                onChange={e => setNewPasswordValue(e.target.value)}
                placeholder="Минимум 6 символов"
                minLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setResetDialog({ open: false, userId: "", email: "" }); setNewPasswordValue(""); }}>
              Отмена
            </Button>
            <Button
              onClick={() => resetPasswordMutation.mutate({ userId: resetDialog.userId, password: newPasswordValue })}
              disabled={resetPasswordMutation.isPending || newPasswordValue.length < 6}
            >
              <Key className="w-4 h-4 mr-2" />
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
