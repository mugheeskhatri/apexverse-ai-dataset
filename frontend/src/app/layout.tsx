import type { Metadata } from "next";
import { Syne, Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { PubNav } from "@/components/layout/PubNav";
import { AuthProvider } from "@/lib/auth";

const syne = Syne({ variable: "--font-syne", subsets: ["latin"] });
const inter = Inter({ variable: "--font-dm-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-dm-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Apexverse | Web Data Ingestion for Enterprise AI",
  description: "Crawl websites, extract structured content, chunk it for retrieval, and sync directly to your vector database.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${inter.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <ToastProvider>
            <PubNav />
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
