import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/react";
import Navbar from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";
import { IngestionJobsProvider } from "@/components/ingestion-jobs-provider";

const openSans = Open_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Note Generator",
  description: "✨ Um Assistente de IA para transcrever aulas e gerar resumos estruturados em markdown",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={openSans.variable}>
      <body>
        <Analytics />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <IngestionJobsProvider>
            <div className="main-container">
              <Navbar />
              {children}
            </div>
            <Toaster />
          </IngestionJobsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
