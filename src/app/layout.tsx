import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sangpo Account Tracking System",
  description: "Track supplier invoices, payments, and claim certificates",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
