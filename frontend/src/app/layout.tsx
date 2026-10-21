import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Red-Team Arena | LogUnifyers",
  description: "Controlled, repeatable AI application security evaluation.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
