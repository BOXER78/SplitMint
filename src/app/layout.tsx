import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "SplitMint — Split Expenses Smarter",
  description:
    "Track shared expenses, split bills, and settle debts effortlessly with SplitMint. Powered by AI for seamless expense management.",
  keywords: ["expense splitting", "bill sharing", "group expenses", "SplitMint"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="bg-[#0a0d14] text-white antialiased min-h-screen font-sans">{children}</body>
    </html>
  );
}
