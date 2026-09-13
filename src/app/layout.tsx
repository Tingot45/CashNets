import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import type { ReactNode } from "react";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Home Advantage — Sweet-Spot Analytics",
  description:
    "Global football predictive analytics. Home-win sweet spots, fan sentiment indices and odds-filtered fixtures, tuned to Eastern African Time.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <div className="app-canvas min-h-full flex-1">{children}</div>
      </body>
    </html>
  );
}