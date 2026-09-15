import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from "@/integrations/supabase/adminClient";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: string[];
  hasRole: (role: string) => boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  roles: [],
  hasRole: () => false,
  signOut: async () => {},
});

async function fetchRolesForUser(userId: string): Promise<string[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/user_roles?user_id=eq.${userId}&select=role`,
      {
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
      },
    );
    const data = await res.json();
    return Array.isArray(data) ? data.map((r: any) => r.role) : [];
  } catch {
    return [];
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    const applySession = async (session: Session | null) => {
      if (cancelled) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        const r = await fetchRolesForUser(session.user.id);
        if (!cancelled) setRoles(r);
      } else {
        setRoles([]);
      }
      setLoading(false);
    };

    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (cancelled) return;

      if (error) {
        await supabase.auth.signOut({ scope: "local" });
        await applySession(null);
        return;
      }

      // Протухший refresh token в localStorage → иначе 400 в консоли на каждом заходе
      if (data.session) {
        const { error: userError } = await supabase.auth.getUser();
        if (cancelled) return;
        if (userError) {
          await supabase.auth.signOut({ scope: "local" });
          await applySession(null);
          return;
        }
      }

      await applySession(data.session);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      await applySession(session);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const hasRole = (role: string) => roles.includes(role);

  const signOut = async () => {
    setRoles([]);
    setUser(null);
    setSession(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, roles, hasRole, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
