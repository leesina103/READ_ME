import type { Metadata } from "next";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-sans",
  weight: "variable",
  subsets: ["latin"],
  display: "swap"
});

const notoSerifKr = Noto_Serif_KR({
  variable: "--font-serif",
  weight: "variable",
  subsets: ["latin"],
  display: "swap"
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "READ ME — Read books. Read yourself.", template: "%s | READ ME" },
  description: "책을 읽고, 질문하고, 함께 사유하는 독서모임 READ ME.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "READ ME — Read books. Read yourself.",
    description: "책을 읽고, 질문하고, 함께 사유하는 독서모임 READ ME.",
    url: "/",
    siteName: "READ ME",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/remi-brand-sheet.png",
        width: 1254,
        height: 1254,
        alt: "책을 읽으며 질문을 건네는 READ ME의 안내자 리미"
      }
    ]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko" className={`${notoSansKr.variable} ${notoSerifKr.variable}`}><body><Header />{children}<Footer /></body></html>;
}
