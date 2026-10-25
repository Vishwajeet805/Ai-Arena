import type { Metadata } from "next";
import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "AI Arena — Break it. Measure it. Defend it.",
  description: "A focused AI security evaluation workspace for testing adversarial cases and comparing baseline and defended outcomes with inspectable evidence.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={cn("dark", geist.variable, geistMono.variable)}>
      <body>{children}</body>
    </html>
  );
}
