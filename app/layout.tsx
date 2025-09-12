import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "학교 재난 대응 도우미 | School Emergency Response Assistant",
  description: "학교현장 재난유형별 교육훈련 매뉴얼을 기반으로 한 AI 재난 대응 상담 서비스. 화재, 지진, 폭우, 산불 등 각종 재난 상황에 대한 전문적인 대응 방법을 제공합니다.",
  keywords: ["학교 재난", "재난 대응", "안전 교육", "응급처치", "대피 훈련", "화재 안전", "지진 대비", "school emergency", "disaster response"],
  authors: [{ name: "School Safety Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
