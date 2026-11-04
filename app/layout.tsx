import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "꼬리별 어드민",
  description: "꼬리별 반려동물 호텔 직원용 관리 화면",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* 디자인(nol.md)의 서체 Pretendard */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <Nav />
          <main>{children}</main>
        </AuthProvider>
        <footer className="foot">꼬리별 직원 전용 화면이에요. 모든 이름·연락처는 가상 데이터예요.</footer>
      </body>
    </html>
  );
}
