"use client";

import { useState } from "react";
import { Notice } from "@/components/ui";
import type { Sales } from "@/lib/api";
import { Guard } from "@/lib/auth";
import { today, won } from "@/lib/format";
import { useFetch } from "@/lib/useFetch";

function SalesView() {
  const [month, setMonth] = useState(today().slice(0, 7));
  const { data, error } = useFetch<Sales>(`/admin/sales?month=${month}`);

  return (
    <>
      <div className="row between wrap">
        <div>
          <h1>객실 종류별 매출</h1>
          <p className="sub">숙박비는 그 달에 실제로 묵은 밤, 추가 서비스는 체크인한 달, 위약금은 취소한 달로 셈해요.</p>
        </div>
        <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} style={{ width: "auto" }} aria-label="월" />
      </div>
      {error && <Notice>{error}</Notice>}
      {data && (
        <>
          <div className="tiles">
            <div className="tile">
              <div className="muted small">
                {data.from} ~ {data.to} 합계
              </div>
              <div className="num">{won(data.total)}</div>
            </div>
            <div className="tile">
              <div className="muted small">묵은 밤 (객실 수 × 박)</div>
              <div className="num">{data.rows.reduce((s, r) => s + r.nights, 0)}</div>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>객실 종류</th>
                  <th className="num">묵은 밤</th>
                  <th className="num">숙박비</th>
                  <th className="num">추가 서비스</th>
                  <th className="num">취소 위약금</th>
                  <th className="num">합계</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r.roomTypeId}>
                    <td>{r.name}</td>
                    <td className="num">{r.nights}</td>
                    <td className="num">{won(r.lodging)}</td>
                    <td className="num">{won(r.services)}</td>
                    <td className="num">{won(r.penalty)}</td>
                    <td className="num">
                      <strong>{won(r.total)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>합계</td>
                  <td className="num">{data.rows.reduce((s, r) => s + r.nights, 0)}</td>
                  <td className="num">{won(data.rows.reduce((s, r) => s + r.lodging, 0))}</td>
                  <td className="num">{won(data.rows.reduce((s, r) => s + r.services, 0))}</td>
                  <td className="num">{won(data.rows.reduce((s, r) => s + r.penalty, 0))}</td>
                  <td className="num">{won(data.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </>
  );
}

export default function SalesPage() {
  return (
    <Guard>
      <SalesView />
    </Guard>
  );
}
