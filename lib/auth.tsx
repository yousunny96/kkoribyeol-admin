"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken, type User } from "./api";

interface AuthState {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  /** 비밀번호를 바꾼 뒤 내 정보를 다시 읽는다 */
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    // 어드민은 직원 전용. 고객 토큰이면 버린다
    const u = await api<User>("/auth/me");
    if (u.kind === "staff") setUser(u);
    else {
      setToken(null);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (!getToken()) {
      setReady(true);
      return;
    }
    refresh()
      .catch(() => setToken(null))
      .finally(() => setReady(true));
  }, [refresh]);

  useEffect(() => {
    const onLogout = () => setUser(null);
    const onMustChange = () => setUser((u) => (u ? { ...u, mustChangePassword: true } : u));
    window.addEventListener("kb-admin-logout", onLogout);
    window.addEventListener("kb-must-change", onMustChange);
    return () => {
      window.removeEventListener("kb-admin-logout", onLogout);
      window.removeEventListener("kb-must-change", onMustChange);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await api<{ token: string; user: User }>("/auth/staff/login", { method: "POST", body: { email, password } });
    setToken(r.token);
    setUser(r.user);
    return r.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, ready, login, logout, refresh }), [user, ready, login, logout, refresh]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("AuthProvider 안에서만 쓸 수 있어요.");
  return v;
}

/**
 * 직원 화면 가드. 로그인 안 했으면 로그인으로, 임시 비밀번호면 비밀번호 변경으로 보낸다.
 * role="admin"이면 관리자만. (화면에서 막는 것은 안내용이다. 진짜 막는 일은 백엔드가 한다)
 */
export function Guard({ role, children }: { role?: "admin"; children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const path = usePathname();

  useEffect(() => {
    if (!ready) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(path)}`);
    else if (user.mustChangePassword && path !== "/change-password") router.replace("/change-password");
  }, [ready, user, router, path]);

  if (!ready || !user || (user.mustChangePassword && path !== "/change-password")) {
    return <p className="muted">로그인 상태를 확인하고 있어요…</p>;
  }
  if (role === "admin" && user.role !== "admin") {
    return (
      <div className="panel narrow">
        <h1>관리자만 볼 수 있어요</h1>
        <p className="muted">{user.name}님은 일반 직원 계정이에요. 직원 계정 관리는 관리자만 할 수 있어요.</p>
        <Link href="/" className="btn primary">
          오늘 현황으로
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}
