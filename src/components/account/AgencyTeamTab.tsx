import { Loader2, Mail, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  useAgencyInvites,
  useAgencyMembers,
  useAgencyTeamMutations,
  useMyAgency,
} from "@/hooks/useAgency";
import { useAuth } from "@/hooks/useAuth";
import type { AgencyMemberRole } from "@/lib/agencyApi";
import {
  buildAgencyInviteLink,
  sendAgencyInviteEmail,
} from "@/lib/sendAgencyInviteEmail";

const ROLE_LABELS: Record<AgencyMemberRole, string> = {
  owner: "Владелец",
  admin: "Админ",
  member: "Сотрудник",
};

export default function AgencyTeamTab() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data } = useMyAgency();
  const agencyId = data?.agency.id;
  const agencyName = data?.agency.name || "Агентство";
  const myRole = data?.membership.role;
  const canManage = myRole === "owner" || myRole === "admin";
  const invitedByName =
    (user?.user_metadata?.full_name as string | undefined)?.trim() ||
    user?.email ||
    "";

  const { data: members = [], isLoading: membersLoading } =
    useAgencyMembers(agencyId);
  const { data: invites = [] } = useAgencyInvites(agencyId);
  const { invite, revokeInvite, removeMember, setRole } =
    useAgencyTeamMutations(agencyId);

  const [email, setEmail] = useState("");
  const [role, setInviteRole] = useState<AgencyMemberRole>("member");
  const [resendingId, setResendingId] = useState<string | null>(null);

  const sendInviteMail = async (opts: {
    to: string;
    token: string;
    role: AgencyMemberRole;
    expiresAt?: string | null;
  }) => {
    const inviteUrl = buildAgencyInviteLink(opts.token);
    return sendAgencyInviteEmail({
      to: opts.to,
      agencyName,
      roleLabel: ROLE_LABELS[opts.role] || opts.role,
      inviteUrl,
      invitedByName,
      expiresAt: opts.expiresAt,
    });
  };

  const onInvite = async () => {
    if (!email.trim()) return;
    try {
      const row = await invite.mutateAsync({ email: email.trim(), role });
      const link = buildAgencyInviteLink(row.token);
      await navigator.clipboard.writeText(link).catch(() => undefined);

      const mail = await sendInviteMail({
        to: row.email,
        token: row.token,
        role: row.role,
        expiresAt: row.expires_at,
      });

      if (mail.ok) {
        toast({
          title: "Приглашение отправлено",
          description: `Письмо ушло на ${row.email}. Ссылка также скопирована.`,
        });
      } else {
        toast({
          title: "Приглашение создано, письмо не ушло",
          description: `${mail.error}. Ссылка скопирована — отправьте вручную.`,
          variant: "destructive",
        });
      }
      setEmail("");
    } catch (err) {
      toast({
        title: "Не удалось пригласить",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      });
    }
  };

  if (!agencyId) {
    return (
      <p className="text-sm text-muted-foreground py-6">
        Сначала заполните профиль агентства.
      </p>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold">Команда агентства</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Несколько сотрудников могут входить в кабинет одного агентства.
        </p>
      </div>

      {canManage && (
        <div className="rounded-lg border border-border p-4 space-y-3">
          <div className="text-sm font-medium flex items-center gap-1.5">
            <UserPlus className="w-4 h-4" /> Пригласить сотрудника
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="flex-1 h-10 px-3 rounded-md border border-border bg-background text-sm"
            />
            <select
              value={role}
              onChange={(e) =>
                setInviteRole(e.target.value as AgencyMemberRole)
              }
              className="h-10 px-3 rounded-md border border-border bg-background text-sm"
            >
              <option value="member">Сотрудник</option>
              <option value="admin">Админ</option>
            </select>
            <Button onClick={onInvite} disabled={invite.isPending}>
              {invite.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Пригласить"
              )}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Участники</h3>
        {membersLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {members.map((m) => {
              const isMe = m.user_id === user?.id;
              const isOwner = m.role === "owner";
              return (
                <li
                  key={m.user_id}
                  className="flex items-center gap-3 px-3 py-2.5 bg-card"
                >
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                    {m.profiles?.avatar_url ? (
                      <img
                        src={m.profiles.avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      (
                        m.profiles?.full_name?.[0] ||
                        m.profiles?.email?.[0] ||
                        "?"
                      ).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {m.profiles?.full_name || "Без имени"}
                      {isMe ? " (вы)" : ""}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {m.profiles?.email || m.user_id}
                    </div>
                  </div>
                  {canManage && !isOwner ? (
                    <select
                      value={m.role}
                      onChange={async (e) => {
                        try {
                          await setRole.mutateAsync({
                            userId: m.user_id,
                            role: e.target.value as AgencyMemberRole,
                          });
                        } catch (err) {
                          toast({
                            title: "Ошибка",
                            description:
                              err instanceof Error ? err.message : "",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="h-8 text-xs rounded border border-border bg-background px-2"
                    >
                      <option value="admin">Админ</option>
                      <option value="member">Сотрудник</option>
                    </select>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">
                      {ROLE_LABELS[m.role]}
                    </span>
                  )}
                  {canManage && !isOwner && !isMe && (
                    <button
                      type="button"
                      className="p-1.5 text-muted-foreground hover:text-destructive"
                      onClick={async () => {
                        try {
                          await removeMember.mutateAsync(m.user_id);
                          toast({ title: "Участник удалён" });
                        } catch (err) {
                          toast({
                            title: "Ошибка",
                            description:
                              err instanceof Error ? err.message : "",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {canManage && invites.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Ожидают принятия</h3>
          <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
            {invites.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center gap-3 px-3 py-2.5 text-sm"
              >
                <div className="flex-1 min-w-0">
                  <div className="truncate">{inv.email}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {ROLE_LABELS[inv.role]} · до{" "}
                    {new Date(inv.expires_at).toLocaleDateString("ru-RU")}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={resendingId === inv.id}
                  onClick={async () => {
                    setResendingId(inv.id);
                    try {
                      const mail = await sendInviteMail({
                        to: inv.email,
                        token: inv.token,
                        role: inv.role,
                        expiresAt: inv.expires_at,
                      });
                      if (mail.ok) {
                        toast({
                          title: "Письмо отправлено",
                          description: inv.email,
                        });
                      } else {
                        toast({
                          title: "Не удалось отправить",
                          description: mail.error,
                          variant: "destructive",
                        });
                      }
                    } finally {
                      setResendingId(null);
                    }
                  }}
                  className="gap-1"
                >
                  {resendingId === inv.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Mail className="w-3.5 h-3.5" />
                  )}
                  Email
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    const link = buildAgencyInviteLink(inv.token);
                    await navigator.clipboard
                      .writeText(link)
                      .catch(() => undefined);
                    toast({ title: "Ссылка скопирована" });
                  }}
                >
                  Ссылка
                </Button>
                <button
                  type="button"
                  className="p-1.5 text-muted-foreground hover:text-destructive"
                  onClick={() => revokeInvite.mutateAsync(inv.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
