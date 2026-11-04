"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field, Notice } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { Guard, useAuth } from "@/lib/auth";

function ChangePassword() {
  const { user, refresh } = useAuth();
  const router = useRouter();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNext] = useState("");
  const [error, setError] = useState<ApiError | null>(null);
  const [done, setDone] = useState(false);
  const forced = user!.mustChangePassword;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api("/auth/change-password", { method: "POST", body: { currentPassword, newPassword } });
      await refresh();
      if (forced) router.replace("/");
      else {
        setDone(true);
        setCurrent("");
        setNext("");
      }
    } catch (err) {
      setError(err as ApiError);
    }
  }

  return (
    <div className="panel narrow">
      <h1>비밀번호 바꾸기</h1>
      {forced ? (
        <Notice kind="info">임시 비밀번호로 로그인했어요. 새 비밀번호로 바꿔야 다른 화면을 쓸 수 있어요.</Notice>
      ) : (
        <p className="sub">
          {user!.name} · {user!.email}
        </p>
      )}
      {error && <Notice>{error.message}</Notice>}
      {done && <Notice kind="ok">비밀번호를 바꿨어요.</Notice>}
      <form onSubmit={submit} noValidate>
        <Field label={forced ? "임시 비밀번호" : "지금 비밀번호"} error={error?.errors.currentPassword}>
          <input type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} />
        </Field>
        <Field label="새 비밀번호" error={error?.errors.newPassword} hint="8자 이상">
          <input type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNext(e.target.value)} />
        </Field>
        <button className="btn primary wide">바꾸기</button>
      </form>
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <Guard>
      <ChangePassword />
    </Guard>
  );
}
