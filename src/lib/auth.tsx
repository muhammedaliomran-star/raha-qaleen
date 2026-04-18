import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User as SupaUser } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Profile, Role } from "./store";

interface AuthCtx {
  session: Session | null;
  user: SupaUser | null;
  profile: Profile | null;
  roles: Role[];
  loading: boolean;
  primaryRole: Role | null;
  hasRole: (r: Role) => boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  session: null,
  user: null,
  profile: null,
  roles: [],
  loading: true,
  primaryRole: null,
  hasRole: () => false,
  refresh: async () => {},
  logout: async () => {},
});

const ROLE_PRIORITY: Role[] = ["admin", "doctor", "receptionist", "patient"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUserData = async (userId: string) => {
    const [{ data: prof }, { data: rolesData }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);

    setProfile(
      prof
        ? {
            id: prof.id,
            username: prof.username,
            fullName: prof.full_name,
            age: prof.age,
            gender: prof.gender,
            phone: prof.phone,
          }
        : null,
    );
    setRoles((rolesData ?? []).map((r) => r.role as Role));
  };

  useEffect(() => {
    // Set up listener FIRST (synchronous state update only)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        // Defer Supabase calls to avoid deadlocks
        setTimeout(() => { loadUserData(newSession.user.id); }, 0);
      } else {
        setProfile(null);
        setRoles([]);
      }
    });

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) loadUserData(s.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const refresh = async () => {
    if (session?.user) await loadUserData(session.user.id);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRoles([]);
  };

  const primaryRole = ROLE_PRIORITY.find((r) => roles.includes(r)) ?? null;

  return (
    <Ctx.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        roles,
        loading,
        primaryRole,
        hasRole: (r) => roles.includes(r),
        refresh,
        logout,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
