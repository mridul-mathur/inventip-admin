import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import React from "react";
import AppSidebar from "./appsidebar";

import { SidebarProvider } from "../components/ui/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Admin Invent IP",
  description: "Admin Invent IP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased w-screen`}
      >
        <SidebarProvider>
          <AppSidebar />
          <main className="relative flex flex-col h-screen w-full px-12 py-4">
            {children}
          </main>
        </SidebarProvider>
      </body>
    </html>
  );
}
