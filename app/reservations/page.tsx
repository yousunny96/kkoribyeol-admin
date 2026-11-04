"use client";

import Link from "next/link";
import { useState } from "react";
import { Actions } from "@/components/Actions";
import { Notice, StatusBadge } from "@/components/ui";
import type { Reservation, Status } from "@/lib/api";
import { Guard } from "@/lib/auth";
import { day, STATUS_LABEL, won } from "@/lib/format";
import { useFetch } from "@/lib/useFetch";

function Reservations() {
  const [status, setStatus] = useState<Status | "">("");
  const [date, setDate] = useState("");
  const query = new URLSearchParams({ ...(status && { status }), ...(date && { date }) }).toString();
  const { data, error, loading, reload } = useFetch<Reservation[]>(`/admin/reservations${query ? `?${query}` : ""}`);

  return (
    <>
      <h1>예약 목록</h1>
      <p className="sub">모든 보호자의 예약이에요. 날짜를 고르면 그날 밤 묵는 예약만 보여요.</p>
      <div className="filters">
        <select value={status} onChange={(e) => setStatus(e.target.value as Status | "")} aria-label="상태">
          <option value="">전체 상태</option>
          {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="묵는 날짜" />
        {(status || date) && (
          <button
            className="btn ghost sm"
            onClick={() => {
              setStatus("");
              setDate("");
            }}
          >
            필터 지우기
          </button>
        )}
      </div>
      {error && <Notice>{error}</Notice>}
      {loading && !data && <p className="muted">불러오는 중…</p>}
      {data?.length === 0 && <div className="empty">조건에 맞는 예약이 없어요.</div>}
      {!!data?.length && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>기간</th>
                <th>객실</th>
                <th>보호자</th>
                <th>아이</th>
                <th className="num">합계</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/reservations/${r.id}`} className="link">
                      {r.id}
                    </Link>
                  </td>
                  <td className="small">
                    {day(r.checkIn)} → {day(r.checkOut)}
                  </td>
                  <td>
                    {r.room.typeName} {r.room.roomNo}
                  </td>
                  <td>
                    {r.guardian.name}
                    <div className="small muted">{r.guardian.phone}</div>
                  </td>
                  <td>{r.pets.map((p) => p.name).join(", ")}</td>
                  <td className="num">
                    {won(r.charges.total)}
                    {r.refund && <div className="small muted">환불 {won(r.refund.amount)}</div>}
                  </td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td>
                    <Actions r={r} onChange={reload} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export default function ReservationsPage() {
  return (
    <Guard>
      <Reservations />
    </Guard>
  );
}
