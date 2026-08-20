import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: { default: "READ ME — Read books. Read yourself.", template: "%s | READ ME" },
  description: "책을 읽고, 질문하고, 함께 사유하는 독서모임 READ ME."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body><Header />{children}<Footer /></body></html>;
}
