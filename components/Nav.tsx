"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export function Nav() {
  const path = usePathname();
  const router = useRouter();
  const { user, ready, logout } = useAuth();
  const on = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
  const working = user && !user.mustChangePassword;

  const links = [
    { href: "/", label: "오늘 현황" },
    { href: "/reservations", label: "예약 목록" },
    { href: "/sales", label: "매출" },
    ...(user?.role === "admin" ? [{ href: "/staff", label: "직원 계정" }] : []),
  ];

  return (
    <header className="nav">
      <div className="nav-in">
        <Link href="/" className="brand">
          꼬리별 <span className="tag">어드민</span>
        </Link>
        {working && (
          <nav aria-label="메뉴">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={on(l.href) ? "on" : ""}>
                {l.label}
              </Link>
            ))}
          </nav>
        )}
        <nav className="account" aria-label="계정">
          {ready && user && (
            <>
              <Link href="/change-password" className="who">
                {user.name} <span className="tag">{user.role === "admin" ? "관리자" : "직원"}</span>
              </Link>
              <button
                className="btn ghost sm"
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
              >
                로그아웃
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
