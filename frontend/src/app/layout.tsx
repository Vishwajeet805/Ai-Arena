import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Arena — AI Security Workspace",
  description: "A focused red-team workspace for controlled AI application security evaluations, case evidence, and repeatable defense comparisons.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
