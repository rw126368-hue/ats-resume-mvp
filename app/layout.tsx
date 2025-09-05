import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientLayout } from "./client-layout";
import { ResumesProvider } from "@/hooks/useResumesContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ATS Resume Generator",
  description: "AI-powered ATS Resume Generator for job seekers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <ClientLayout className={inter.className}>
        <ResumesProvider>
          {children}
        </ResumesProvider>
      </ClientLayout>
    </html>
  );
}