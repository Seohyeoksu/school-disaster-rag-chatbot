import { Geist, Geist_Mono } from "next/font/google";
import type { Metadata } from "next";
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
  metadataBase: new URL('https://school-disaster-rag-chatbot.vercel.app'),
  title: "학교 재난 대응 도우미",
  description: "학교현장 재난유형별 교육훈련 매뉴얼을 기반으로 한 AI 재난 대응 상담 서비스",
  keywords: "학교 재난, 재난 대응, 안전 교육, 응급처치, 대피 훈련",
  authors: [{ name: "School Safety Team" }],
  creator: "School Safety Team",
  publisher: "경상북도교육청",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "학교 재난 대응 도우미",
    description: "학교현장 재난유형별 교육훈련 매뉴얼 기반 AI 재난 대응 상담 서비스",
    url: "https://school-disaster-rag-chatbot.vercel.app",
    siteName: "학교 재난 대응 도우미",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "학교 재난 대응 도우미",
    description: "학교현장 재난유형별 교육훈련 매뉴얼 기반 AI 재난 대응 상담 서비스",
  },
  icons: {
    icon: "/favicon.ico",
  },
  verification: {
    google: "",
    yandex: "",
    yahoo: "",
  },
  alternates: {
    canonical: "https://school-disaster-rag-chatbot.vercel.app",
  },
}

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
