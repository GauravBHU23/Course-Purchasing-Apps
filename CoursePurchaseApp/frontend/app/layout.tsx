import type { Metadata } from "next";

import { ToastProvider } from "@/components/ToastProvider";

import "./globals.css";

export const metadata: Metadata = {
  title: "Course Purchase App",
  description: "Secure course purchase platform"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
