export const SUPABASE_URL = "https://api.arendacity.com";
export const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3Nzg4NDI5NDAsImV4cCI6MTkzNjUyMjk0MH0.3cy9jvXONpIRoTDA2YOvo13LdBCTZzWTPs-J6_1RhKg";

/**
 * На localhost upload идёт через Vite middleware `/storage` → api.arendacity.com
 * (обход CORS). Публичные URL для <img> всегда абсолютные.
 */
function storageRequestBase(): string {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") return "";
  }
  return SUPABASE_URL;
}

const authHeaders = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

export const supabaseAdmin = {
  db: {
    async select(table: string, query = "select=*") {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
        headers: authHeaders,
      });
      const data = await res.json();
      if (!res.ok) return { data: null as any, error: data };
      return { data, error: null };
    },
    async insert(table: string, row: Record<string, any>) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST",
        headers: { ...authHeaders, Prefer: "return=representation" },
        body: JSON.stringify(row),
      });
      const data = await res.json();
      if (!res.ok) return { data: null as any, error: data };
      return { data: Array.isArray(data) ? data[0] : data, error: null };
    },
    async upsert(table: string, row: Record<string, any>) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST",
        headers: {
          ...authHeaders,
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(row),
      });
      const data = await res.json();
      if (!res.ok) return { data: null as any, error: data };
      return { data: Array.isArray(data) ? data[0] : data, error: null };
    },
    async update(table: string, match: string, row: Record<string, any>) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${match}`, {
        method: "PATCH",
        headers: { ...authHeaders, Prefer: "return=representation" },
        body: JSON.stringify(row),
      });
      const data = await res.json();
      if (!res.ok) return { data: null as any, error: data };
      return { data: Array.isArray(data) ? data[0] : data, error: null };
    },
    async delete(table: string, match: string) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${match}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      if (!res.ok) {
        const data = await res.json();
        return { error: data };
      }
      return { error: null };
    },
  },
  roles: {
    async set(userId: string, role: string) {
      // Удаляем все роли пользователя
      await fetch(`${SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${userId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      // Вставляем новую роль
      if (role !== "client") {
        await fetch(`${SUPABASE_URL}/rest/v1/user_roles`, {
          method: "POST",
          headers: { ...authHeaders, Prefer: "return=minimal" },
          body: JSON.stringify({ user_id: userId, role }),
        });
      }
    },
    async toggle(userId: string, role: string, hasIt: boolean) {
      if (hasIt) {
        // Снимаем роль — возвращаем client
        await fetch(
          `${SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${userId}&role=eq.${role}`,
          {
            method: "DELETE",
            headers: authHeaders,
          },
        );
        // Если больше нет других ролей — ставим client
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${userId}&select=role`,
          { headers: authHeaders },
        );
        const remaining = await res.json();
        if (!remaining?.length) {
          await fetch(`${SUPABASE_URL}/rest/v1/user_roles`, {
            method: "POST",
            headers: { ...authHeaders, Prefer: "return=minimal" },
            body: JSON.stringify({ user_id: userId, role: "client" }),
          });
        }
      } else {
        // Назначаем роль — удаляем все старые и ставим новую
        await fetch(`${SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${userId}`, {
          method: "DELETE",
          headers: authHeaders,
        });
        await fetch(`${SUPABASE_URL}/rest/v1/user_roles`, {
          method: "POST",
          headers: { ...authHeaders, Prefer: "return=minimal" },
          body: JSON.stringify({ user_id: userId, role }),
        });
      }
    },
  },
  storage: {
    async upload(
      bucket: string,
      path: string,
      file: File,
    ): Promise<{ error: string | null }> {
      const clean = path.replace(/^\/+/, "");
      const base = storageRequestBase();
      const bytes = await file.arrayBuffer();
      const res = await fetch(`${base}/storage/v1/object/${bucket}/${clean}`, {
        method: "PUT",
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          "Content-Type": file.type || "application/octet-stream",
          "x-upsert": "true",
        },
        body: bytes,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg =
          typeof data === "object" && data
            ? String(
                (data as { error?: string; message?: string; msg?: string })
                  .message ||
                  (data as { error?: string }).error ||
                  (data as { msg?: string }).msg ||
                  "",
              )
            : "";
        return {
          error: msg || `Upload failed (${res.status})`,
        };
      }
      return { error: null };
    },
    /** Проверка, что объект реально лежит в bucket (service_role). */
    async exists(bucket: string, path: string): Promise<boolean> {
      const clean = path.replace(/^\/+/, "");
      const base = storageRequestBase();
      const res = await fetch(
        `${base}/storage/v1/object/authenticated/${bucket}/${clean}`,
        {
          method: "GET",
          headers: {
            apikey: SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          },
        },
      );
      return res.ok;
    },
    getPublicUrl(bucket: string, path: string): string {
      const clean = path.replace(/^\/+/, "");
      return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${clean}`;
    },
  },
  async rpc(fn: string, params: Record<string, unknown> = {}) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify(params),
    });
    const text = await res.text();
    let data: any = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    if (!res.ok) {
      const msg =
        typeof data === "object" && data
          ? String(
              data.message ||
                data.msg ||
                data.error ||
                data.hint ||
                JSON.stringify(data),
            )
          : `HTTP ${res.status}`;
      return {
        data: null,
        error: {
          message: msg,
          ...(typeof data === "object" && data ? data : {}),
        },
      };
    }
    return { data, error: null };
  },
  auth: {
    admin: {
      async createUser(attrs: {
        email: string;
        password: string;
        full_name?: string;
      }) {
        // Prefer GoTrue Admin; if gateway returns 403, create via Auth signup is not available
        // with email_confirm — use REST only after SQL helper exists is not enough for create.
        const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            email: attrs.email,
            password: attrs.password,
            email_confirm: true,
            user_metadata: attrs.full_name
              ? { full_name: attrs.full_name }
              : {},
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (res.status === 403) {
            const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
              "admin_create_user",
              {
                p_email: attrs.email,
                p_password: attrs.password,
                p_full_name: attrs.full_name || null,
              },
            );
            if (rpcError) {
              return {
                data: null,
                error: {
                  message: `Auth Admin 403. Нужен RPC admin_create_user (self_hosted_admin_user_rpc.sql). ${rpcError.message}`,
                },
              };
            }
            const row =
              typeof rpcData === "object" && rpcData
                ? (rpcData as { id?: string; email?: string })
                : {};
            return {
              data: { id: row.id, email: row.email ?? attrs.email },
              error: null,
            };
          }
          return {
            data: null,
            error: {
              message: String(
                (data as any)?.msg ||
                  (data as any)?.message ||
                  `HTTP ${res.status}`,
              ),
              ...((typeof data === "object" && data) || {}),
            },
          };
        }
        return { data, error: null };
      },
      async listUsers({ perPage = 1000, page = 1 } = {}) {
        const res = await fetch(
          `${SUPABASE_URL}/auth/v1/admin/users?per_page=${perPage}&page=${page}`,
          { headers: authHeaders },
        );
        if (res.ok) {
          const data = await res.json();
          return { data: { users: data.users ?? data }, error: null };
        }

        // Fallback: gateway often blocks /auth/v1/admin (403) — use SECURITY DEFINER RPC
        const { data, error } = await supabaseAdmin.rpc("admin_list_users");
        if (error) {
          return {
            data: { users: [] as any[] },
            error: {
              message:
                res.status === 403
                  ? `Auth Admin 403. Примените supabase/self_hosted_admin_user_rpc.sql и обновите страницу. RPC: ${error.message}`
                  : `Auth Admin HTTP ${res.status}. RPC: ${error.message}`,
            },
          };
        }
        const rows = Array.isArray(data) ? data : [];
        // Client-side pagination to keep call sites unchanged
        const start = (page - 1) * perPage;
        const users = rows.slice(start, start + perPage).map((u: any) => ({
          id: u.id,
          email: u.email,
          phone: u.phone,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          email_confirmed_at: u.email_confirmed_at,
          user_metadata: u.raw_user_meta_data ?? {},
          app_metadata: {},
        }));
        return { data: { users }, error: null };
      },
      async updateUserById(
        userId: string,
        attrs: { password?: string; email_confirm?: boolean },
      ) {
        const res = await fetch(
          `${SUPABASE_URL}/auth/v1/admin/users/${userId}`,
          {
            method: "PUT",
            headers: authHeaders,
            body: JSON.stringify(attrs),
          },
        );
        if (res.ok) {
          const data = await res.json();
          return { data, error: null };
        }

        if (attrs.password) {
          const { error } = await supabaseAdmin.rpc("admin_set_user_password", {
            p_user_id: userId,
            p_password: attrs.password,
          });
          if (error) {
            return {
              data: null,
              error: {
                message:
                  res.status === 403
                    ? `Auth Admin 403. Нужен RPC admin_set_user_password (self_hosted_admin_user_rpc.sql). ${error.message}`
                    : error.message,
              },
            };
          }
        }
        if (attrs.email_confirm) {
          const { error } = await supabaseAdmin.rpc("admin_confirm_user", {
            p_user_id: userId,
          });
          if (error) {
            return {
              data: null,
              error: {
                message:
                  res.status === 403
                    ? `Auth Admin 403. Нужен RPC admin_confirm_user. ${error.message}`
                    : error.message,
              },
            };
          }
        }
        if (!attrs.password && !attrs.email_confirm) {
          const data = await res.json().catch(() => ({}));
          return { data: null, error: data };
        }
        return { data: { id: userId }, error: null };
      },
      async deleteUser(userId: string) {
        // Hard-delete: иначе на self-hosted юзер может остаться «мягко удалённым»
        const res = await fetch(
          `${SUPABASE_URL}/auth/v1/admin/users/${userId}?should_soft_delete=false`,
          { method: "DELETE", headers: authHeaders },
        );
        if (res.ok) return { error: null };

        const { error } = await supabaseAdmin.rpc("admin_delete_user", {
          p_user_id: userId,
        });
        if (error) {
          const data = await res.json().catch(() => ({}));
          const authMsg =
            typeof data === "object" && data
              ? String(
                  (data as any).msg ||
                    (data as any).message ||
                    (data as any).error ||
                    "",
                )
              : "";
          return {
            error: {
              message:
                res.status === 403
                  ? `Auth Admin 403. Примените self_hosted_admin_user_rpc.sql. RPC: ${error.message}`
                  : error.message || authMsg || `HTTP ${res.status}`,
            },
          };
        }
        return { error: null };
      },
    },
  },
};
