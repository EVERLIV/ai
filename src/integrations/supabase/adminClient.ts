export const SUPABASE_URL = "https://api.arendacity.com";
export const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3Nzg4NDI5NDAsImV4cCI6MTkzNjUyMjk0MH0.3cy9jvXONpIRoTDA2YOvo13LdBCTZzWTPs-J6_1RhKg";

const authHeaders = {
  "apikey": SERVICE_ROLE_KEY,
  "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

export const supabaseAdmin = {
  db: {
    async select(table: string, query = "select=*") {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers: authHeaders });
      const data = await res.json();
      if (!res.ok) return { data: null as any, error: data };
      return { data, error: null };
    },
    async upsert(table: string, row: Record<string, any>) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST",
        headers: { ...authHeaders, "Prefer": "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify(row),
      });
      const data = await res.json();
      if (!res.ok) return { data: null as any, error: data };
      return { data: Array.isArray(data) ? data[0] : data, error: null };
    },
    async update(table: string, match: string, row: Record<string, any>) {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${match}`, {
        method: "PATCH",
        headers: { ...authHeaders, "Prefer": "return=representation" },
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
      if (!res.ok) { const data = await res.json(); return { error: data }; }
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
          headers: { ...authHeaders, "Prefer": "return=minimal" },
          body: JSON.stringify({ user_id: userId, role }),
        });
      }
    },
    async toggle(userId: string, role: string, hasIt: boolean) {
      if (hasIt) {
        // Снимаем роль — возвращаем client
        await fetch(`${SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${userId}&role=eq.${role}`, {
          method: "DELETE",
          headers: authHeaders,
        });
        // Если больше нет других ролей — ставим client
        const res = await fetch(`${SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${userId}&select=role`, { headers: authHeaders });
        const remaining = await res.json();
        if (!remaining?.length) {
          await fetch(`${SUPABASE_URL}/rest/v1/user_roles`, {
            method: "POST",
            headers: { ...authHeaders, "Prefer": "return=minimal" },
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
          headers: { ...authHeaders, "Prefer": "return=minimal" },
          body: JSON.stringify({ user_id: userId, role }),
        });
      }
    },
  },
  storage: {
    async upload(bucket: string, path: string, file: File): Promise<{ error: string | null }> {
      const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${path}`, {
        method: "POST",
        headers: {
          "apikey": SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
        },
        body: file,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { error: data.error ?? data.message ?? "Upload failed" };
      }
      return { error: null };
    },
    getPublicUrl(bucket: string, path: string): string {
      return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
    },
  },
  auth: {
    admin: {
      async createUser(attrs: { email: string; password: string; full_name?: string }) {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            email: attrs.email,
            password: attrs.password,
            email_confirm: true,
            user_metadata: attrs.full_name ? { full_name: attrs.full_name } : {},
          }),
        });
        const data = await res.json();
        if (!res.ok) return { data: null, error: data };
        return { data, error: null };
      },
      async listUsers({ perPage = 1000 } = {}) {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=${perPage}`, { headers: authHeaders });
        const data = await res.json();
        if (!res.ok) return { data: { users: [] }, error: data };
        return { data: { users: data.users ?? data }, error: null };
      },
      async updateUserById(userId: string, attrs: { password?: string; email_confirm?: boolean }) {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
          method: "PUT",
          headers: authHeaders,
          body: JSON.stringify(attrs),
        });
        const data = await res.json();
        if (!res.ok) return { data: null, error: data };
        return { data, error: null };
      },
      async deleteUser(userId: string) {
        const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
          method: "DELETE",
          headers: authHeaders,
        });
        if (!res.ok) { const data = await res.json(); return { error: data }; }
        return { error: null };
      },
    },
  },
};
