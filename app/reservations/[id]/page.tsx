"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Actions } from "@/components/Actions";
import { Notice, StatusBadge } from "@/components/ui";
import type { Reservation } from "@/lib/api";
import { Guard } from "@/lib/auth";
import { dateTime, day, won } from "@/lib/format";
import { useFetch } from "@/lib/useFetch";

const percent = (rate: number) => `${Math.round(rate * 100)}%`;

function Detail() {
  const { id } = useParams<{ id: string }>();
  const { data: r, error, reload } = useFetch<Reservation>(`/admin/reservations/${id}`);

  if (error) return <Notice>{error}</Notice>;
  if (!r) return <p className="muted">불러오는 중…</p>;
  const c = r.charges;

  return (
    <>
      <Link href="/reservations" className="back">
        ← 예약 목록
      </Link>
      <div className="row between wrap">
        <h1>예약 #{r.id}</h1>
        <div className="row">
          <StatusBadge status={r.status} />
          <Actions r={r} onChange={reload} />
        </div>
      </div>

      <div className="two">
        <div className="panel">
          <h2>숙박</h2>
          <dl className="facts">
            <div>
              <dt>기간</dt>
              <dd>
                {day(r.checkIn)} → {day(r.checkOut)} ({c.weekdayNights + c.weekendNights}박)
              </dd>
            </div>
            <div>
              <dt>객실</dt>
              <dd>
                {r.room.typeName} {r.room.roomNo}
              </dd>
            </div>
            <div>
              <dt>예약한 시각</dt>
              <dd>{dateTime(r.createdAt)}</dd>
            </div>
            <div>
              <dt>입실 시각</dt>
              <dd>{r.checkedInAt ? dateTime(r.checkedInAt) : "-"}</dd>
            </div>
            <div>
              <dt>퇴실 시각</dt>
              <dd>{r.checkedOutAt ? dateTime(r.checkedOutAt) : "-"}</dd>
            </div>
            {r.cancelledOn && (
              <div>
                <dt>취소한 날</dt>
                <dd>{day(r.cancelledOn)}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="panel">
          <h2>보호자</h2>
          <dl className="facts">
            <div>
              <dt>이름</dt>
              <dd>{r.guardian.name}</dd>
            </div>
            <div>
              <dt>연락처</dt>
              <dd>{r.guardian.phone}</dd>
            </div>
            <div>
              <dt>비상 연락처</dt>
              <dd>
                {r.guardian.emergencyName} {r.guardian.emergencyPhone}
              </dd>
            </div>
            <div>
              <dt>이메일</dt>
              <dd>{r.guardian.email}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="panel">
        <h2>맡긴 아이</h2>
        <div className="grid">
          {r.pets.map((p) => (
            <div key={p.id} className="card">
              <strong>{p.name}</strong>
              <span className="small muted">
                {p.species} · {p.weightKg}kg
              </span>
              <span className="small">사료: {p.food || "-"}</span>
              <span className={`small ${p.allergy ? "warn" : "muted"}`}>알레르기: {p.allergy || "없음"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2>금액</h2>
        <div className="sum">
          {c.weekdayNights > 0 && (
            <div>
              <span>
                평일 {c.weekdayNights}박 × {won(c.weekdayRate)}
              </span>
              <span>{won(c.weekdayNights * c.weekdayRate)}</span>
            </div>
          )}
          {c.weekendNights > 0 && (
            <div>
              <span>
                주말(금·토 밤) {c.weekendNights}박 × {won(c.weekendRate)}
              </span>
              <span>{won(c.weekendNights * c.weekendRate)}</span>
            </div>
          )}
          {r.services.map((s) => (
            <div key={s.serviceId}>
              <span>
                {s.name} {s.quantity}회 × {won(s.unitPrice)}
              </span>
              <span>{won(s.amount)}</span>
            </div>
          ))}
          <div className="total">
            <span>합계</span>
            <span>{won(c.total)}</span>
          </div>
          {r.refund && (
            <div>
              <span>환불 ({percent(r.refund.rate)})</span>
              <strong>{won(r.refund.amount)}</strong>
            </div>
          )}
          {r.refundIfCancelledToday && (
            <div className="small muted">
              <span>오늘 취소하면 환불</span>
              <span>
                {won(r.refundIfCancelledToday.amount)} ({percent(r.refundIfCancelledToday.rate)})
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function ReservationDetailPage() {
  return (
    <Guard>
      <Detail />
    </Guard>
  );
}
