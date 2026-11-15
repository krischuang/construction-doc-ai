import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Construction Document AI",
  description: "Turns construction invoices and tenders into structured, validated data",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
