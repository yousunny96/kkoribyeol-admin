"use client";

import { useState } from "react";
import { api, ApiError, type Reservation } from "@/lib/api";
import { today, won } from "@/lib/format";

/** 예약 상태에 맞는 버튼만 보여 준다: 예약됨 → 입실 / 취소, 입실 → 퇴실 */
export function Actions({ r, onChange }: { r: Reservation; onChange: () => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(action: "check-in" | "check-out" | "cancel") {
    if (action === "cancel") {
      const refund = r.refundIfCancelledToday!;
      const noShow = today() >= r.checkIn;
      const ok = window.confirm(
        `예약 #${r.id}을 ${noShow ? "노쇼로 " : ""}취소할까요?\n환불: ${won(refund.amount)} (${Math.round(refund.rate * 100)}%)`,
      );
      if (!ok) return;
    }
    setBusy(true);
    setError("");
    try {
      await api(`/admin/reservations/${r.id}/${action}`, { method: "POST" });
      onChange();
    } catch (err) {
      setError((err as ApiError).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="row wrap">
        {r.status === "booked" && (
          <>
            <button className="btn primary sm" disabled={busy} onClick={() => run("check-in")}>
              입실 처리
            </button>
            <button className="btn ghost sm" disabled={busy} onClick={() => run("cancel")}>
              {today() >= r.checkIn ? "노쇼·취소" : "취소"}
            </button>
          </>
        )}
        {r.status === "checked_in" && (
          <button className="btn primary sm" disabled={busy} onClick={() => run("check-out")}>
            퇴실 처리
          </button>
        )}
      </div>
      {error && <p className="small warn" style={{ margin: "6px 0 0" }}>{error}</p>}
    </div>
  );
}
