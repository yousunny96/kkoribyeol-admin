"use client";

import Link from "next/link";
import { useState } from "react";
import { Actions } from "@/components/Actions";
import { Notice, StatusBadge } from "@/components/ui";
import type { Reservation, RoomType } from "@/lib/api";
import { Guard } from "@/lib/auth";
import { dateTime, day, today, weightRange } from "@/lib/format";
import { useFetch } from "@/lib/useFetch";

/** 오늘 들어오는 아이·나가는 아이. 사료·알레르기와 보호자·비상 연락처를 함께 보여 준다 */
function TodayTable({ title, rows, reload, empty }: { title: string; rows: Reservation[]; reload: () => void; empty: string }) {
  return (
    <>
      <h2>
        {title} <span className="muted">{rows.length}건</span>
      </h2>
      {rows.length === 0 ? (
        <div className="empty" style={{ marginBottom: 18 }}>
          {empty}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>객실</th>
                <th>아이 · 사료 · 알레르기</th>
                <th>보호자 · 비상 연락처</th>
                <th>기간</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/reservations/${r.id}`} className="link">
                      {r.room.roomNo}
                    </Link>
                    <div className="small muted">#{r.id}</div>
                  </td>
                  <td>
                    {r.pets.map((p) => (
                      <div key={p.id}>
                        <strong>{p.name}</strong> <span className="small muted">{p.species} {p.weightKg}kg</span>
                        <div className="small">사료: {p.food || "-"}</div>
                        <div className={`small ${p.allergy ? "warn" : "muted"}`}>알레르기: {p.allergy || "없음"}</div>
                      </div>
                    ))}
                  </td>
                  <td>
                    {r.guardian.name} {r.guardian.phone}
                    <div className="small muted">
                      비상: {r.guardian.emergencyName} {r.guardian.emergencyPhone}
                    </div>
                  </td>
                  <td className="small">
                    {day(r.checkIn)} → {day(r.checkOut)}
                    {r.checkedInAt && <div className="muted">입실 {dateTime(r.checkedInAt)}</div>}
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

function Today() {
  const todayData = useFetch<{ date: string; checkIns: Reservation[]; checkOuts: Reservation[] }>("/admin/today");
  const [date, setDate] = useState(today());
  const availability = useFetch<{ date: string; roomTypes: RoomType[] }>(`/admin/availability?date=${date}`);
  const reload = () => {
    todayData.reload();
    availability.reload();
  };
  const t = todayData.data;

  return (
    <>
      <h1>오늘 현황</h1>
      <p className="sub">{day(today())}</p>
      {todayData.error && <Notice>{todayData.error}</Notice>}

      <div className="tiles">
        <div className="tile">
          <div className="muted small">입실 예정</div>
          <div className="num">{t ? t.checkIns.filter((r) => r.status === "booked").length : "-"}</div>
        </div>
        <div className="tile">
          <div className="muted small">퇴실 예정</div>
          <div className="num">{t ? t.checkOuts.filter((r) => r.status === "checked_in").length : "-"}</div>
        </div>
      </div>

      {t && (
        <>
          <TodayTable title="오늘 입실" rows={t.checkIns} reload={reload} empty="오늘 들어오는 아이가 없어요." />
          <TodayTable title="오늘 퇴실" rows={t.checkOuts} reload={reload} empty="오늘 나가는 아이가 없어요." />
        </>
      )}

      <div className="row between wrap">
        <h2>객실 종류별 빈 방</h2>
        <label className="row">
          <span className="small muted">날짜</span>
          <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} style={{ width: "auto" }} />
        </label>
      </div>
      {availability.error && <Notice>{availability.error}</Notice>}
      <div className="tiles">
        {availability.data?.roomTypes.map((rt) => (
          <div key={rt.id} className="tile">
            <div className="row between">
              <strong>{rt.name}</strong>
              <span className="small muted">{weightRange(rt)}</span>
            </div>
            <div className="num">
              {rt.available}
              <span className="small muted"> / {rt.total}개 빈 방</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function TodayPage() {
  return (
    <Guard>
      <Today />
    </Guard>
  );
}
