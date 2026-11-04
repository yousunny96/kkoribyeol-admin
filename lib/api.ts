export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// 코어 웹과 다른 키를 써서, 같은 브라우저에서 고객·직원으로 따로 로그인해도 섞이지 않게 한다
const TOKEN_KEY = "kkoribyeol_admin_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  errors: Record<string, string>;
  status: number;
  code?: string;
  constructor(message: string, errors: Record<string, string> = {}, status = 0, code?: string) {
    super(message);
    this.errors = errors;
    this.status = status;
    this.code = code;
  }
}

export async function api<T>(path: string, init?: { method?: string; body?: unknown }): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (init?.body) headers["content-type"] = "application/json";
  if (token) headers.authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API}${path}`, {
      method: init?.method ?? "GET",
      headers,
      body: init?.body ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError("서버에 연결할 수 없어요. 잠시 뒤에 다시 시도해 주세요. (서버가 잠들어 있으면 1분쯤 걸려요)");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    // 출입증이 만료됐거나 계정 사용이 멈추면 로그아웃 처리한다
    if (res.status === 401 && token) {
      setToken(null);
      window.dispatchEvent(new Event("kb-admin-logout"));
    }
    // 임시 비밀번호 상태면 비밀번호 변경 화면으로 보낸다
    if (data?.code === "MUST_CHANGE_PASSWORD") window.dispatchEvent(new Event("kb-must-change"));
    throw new ApiError(data?.message ?? "문제가 생겼어요. 잠시 뒤에 다시 시도해 주세요.", data?.errors ?? {}, res.status, data?.code);
  }
  return data as T;
}

export interface User {
  kind: "guardian" | "staff";
  id: number;
  email: string;
  name: string;
  role: "guardian" | "staff" | "admin";
  mustChangePassword: boolean;
}

export interface Staff {
  id: number;
  email: string;
  name: string;
  role: "staff" | "admin";
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}

export interface RoomType {
  id: number;
  name: string;
  minWeight: number;
  maxWeight: number | null;
  weekdayPrice: number;
  weekendPrice: number;
  total: number;
  occupied: number;
  available: number;
}

export type Status = "booked" | "checked_in" | "checked_out" | "cancelled";

export interface Refund {
  rate: number;
  amount: number;
}

export interface Reservation {
  id: number;
  status: Status;
  checkIn: string;
  checkOut: string;
  room: { id: number; roomNo: string; typeId: number; typeName: string };
  guardian: { id: number; name: string; email: string; phone: string; emergencyName: string; emergencyPhone: string };
  pets: { id: number; name: string; species: string; weightKg: number; food: string | null; allergy: string | null }[];
  services: { serviceId: number; name: string; quantity: number; unitPrice: number; amount: number }[];
  charges: {
    weekdayNights: number;
    weekendNights: number;
    weekdayRate: number;
    weekendRate: number;
    lodging: number;
    services: number;
    total: number;
  };
  checkedInAt: string | null;
  checkedOutAt: string | null;
  cancelledOn: string | null;
  createdAt: string;
  refund: Refund | null;
  refundIfCancelledToday: Refund | null;
}

export interface Sales {
  month: string;
  from: string;
  to: string;
  rows: { roomTypeId: number; name: string; nights: number; lodging: number; services: number; penalty: number; total: number }[];
  total: number;
}
