"use client";

import { useState } from "react";
import { Field, Notice } from "@/components/ui";
import { api, ApiError, type Staff } from "@/lib/api";
import { Guard, useAuth } from "@/lib/auth";
import { dateTime } from "@/lib/format";
import { useFetch } from "@/lib/useFetch";

const ROLE_LABEL = { admin: "관리자", staff: "일반 직원" } as const;

/** 임시 비밀번호는 이 화면에 한 번만 보인다. DB에는 해시만 남는다 */
function TemporaryPassword({ who, password, onClose }: { who: string; password: string; onClose: () => void }) {
  return (
    <div className="notice info">
      <p style={{ marginTop: 0 }}>
        <strong>{who}</strong>님의 임시 비밀번호예요. 지금만 보이니 직원에게 직접 전달해 주세요. 직원은 첫 로그인 때 새 비밀번호로 바꿔야 해요.
      </p>
      <div className="row wrap">
        <span className="secret">{password}</span>
        <button className="btn ghost sm" onClick={() => navigator.clipboard?.writeText(password)}>
          복사
        </button>
        <button className="btn ghost sm" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}

function StaffAdmin() {
  const { user } = useAuth();
  const { data, error, reload } = useFetch<Staff[]>("/admin/staff");
  const [form, setForm] = useState({ email: "", name: "", role: "staff" as Staff["role"] });
  const [formError, setFormError] = useState<ApiError | null>(null);
  const [rowError, setRowError] = useState("");
  const [issued, setIssued] = useState<{ who: string; password: string } | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      const r = await api<{ staff: Staff; temporaryPassword: string }>("/admin/staff", { method: "POST", body: form });
      setIssued({ who: r.staff.name, password: r.temporaryPassword });
      setForm({ email: "", name: "", role: "staff" });
      reload();
    } catch (err) {
      setFormError(err as ApiError);
    }
  }

  async function update(s: Staff, body: Partial<Pick<Staff, "role" | "isActive" | "name">>) {
    setRowError("");
    try {
      await api(`/admin/staff/${s.id}`, { method: "PATCH", body });
      reload();
    } catch (err) {
      setRowError((err as ApiError).message);
    }
  }

  async function reset(s: Staff) {
    if (!window.confirm(`${s.name}님의 비밀번호를 리셋할까요? 지금 비밀번호로는 더 이상 로그인할 수 없어요.`)) return;
    setRowError("");
    try {
      const r = await api<{ temporaryPassword: string }>(`/admin/staff/${s.id}/reset-password`, { method: "POST" });
      setIssued({ who: s.name, password: r.temporaryPassword });
      reload();
    } catch (err) {
      setRowError((err as ApiError).message);
    }
  }

  return (
    <>
      <h1>직원 계정</h1>
      <p className="sub">직원은 회원가입이 없어요. 여기서 계정을 만들고, 고치고, 사용을 멈춰요.</p>
      {issued && <TemporaryPassword {...issued} onClose={() => setIssued(null)} />}
      {error && <Notice>{error}</Notice>}
      {rowError && <Notice>{rowError}</Notice>}

      {data && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>이름</th>
                <th>이메일</th>
                <th>역할</th>
                <th>상태</th>
                <th>만든 날</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map((s) => {
                const me = s.id === user!.id;
                return (
                  <tr key={s.id}>
                    <td>
                      {s.name} {me && <span className="tag">나</span>}
                    </td>
                    <td>{s.email}</td>
                    <td>
                      <select
                        value={s.role}
                        disabled={me}
                        onChange={(e) => update(s, { role: e.target.value as Staff["role"] })}
                        aria-label={`${s.name} 역할`}
                        style={{ width: "auto" }}
                      >
                        <option value="staff">{ROLE_LABEL.staff}</option>
                        <option value="admin">{ROLE_LABEL.admin}</option>
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${s.isActive ? "green" : "gray"}`}>{s.isActive ? "사용 중" : "사용 멈춤"}</span>
                      {s.mustChangePassword && <div className="small muted">비밀번호 변경 전</div>}
                    </td>
                    <td className="small">{dateTime(s.createdAt)}</td>
                    <td>
                      <div className="row wrap">
                        <button className="btn ghost sm" onClick={() => reset(s)}>
                          비밀번호 리셋
                        </button>
                        {!me && (
                          <button className="btn ghost sm" onClick={() => update(s, { isActive: !s.isActive })}>
                            {s.isActive ? "사용 멈추기" : "다시 사용"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="panel">
        <h2>새 직원 계정</h2>
        {formError && <Notice>{formError.message}</Notice>}
        <form onSubmit={create} noValidate>
          <div className="two">
            <Field label="이메일" error={formError?.errors.email}>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="이름" error={formError?.errors.name}>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
          </div>
          <Field label="역할" error={formError?.errors.role}>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Staff["role"] })}>
              <option value="staff">{ROLE_LABEL.staff}</option>
              <option value="admin">{ROLE_LABEL.admin}</option>
            </select>
          </Field>
          <button className="btn primary">계정 만들기</button>
        </form>
      </div>
    </>
  );
}

export default function StaffPage() {
  return (
    <Guard role="admin">
      <StaffAdmin />
    </Guard>
  );
}
