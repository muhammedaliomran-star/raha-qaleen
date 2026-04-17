import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { initStore, store, type User } from "./store";

interface AuthCtx {
  user: User | null;
  setUser: (u: User | null) => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>({ user: null, setUser: () => {}, logout: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);

  useEffect(() => {
    initStore();
    setUserState(store.getSession());
  }, []);

  const setUser = (u: User | null) => {
    setUserState(u);
    if (u) store.setSession(u);
    else store.logout();
  };
  const logout = () => { store.logout(); setUserState(null); };

  return <Ctx.Provider value={{ user, setUser, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
