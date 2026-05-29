import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";

import { ApiDebugPanel } from "@/components/ApiDebugPanel";
import { AuthProvider } from "@/components/AuthProvider";
import { ToastProvider } from "@/components/ToastProvider";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
});

const poppins = Poppins({
  subsets: ["latin"],
  display: "swap",
  weight: ["500", "600", "700", "800", "900"],
  variable: "--font-poppins"
});

export const metadata: Metadata = {
  title: "CourseStack — Secure Course Marketplace",
  description: "Buy focused, project-first courses securely. JWT-protected, fast, and responsive."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body>
        <ToastProvider>
          <AuthProvider>
            {children}
            <ApiDebugPanel />
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
