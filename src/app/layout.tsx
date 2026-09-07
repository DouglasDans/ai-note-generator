import type { Metadata } from "next";
import { Open_Sans, Inter } from "next/font/google";
import "./globals.css";
import ThemeRegistry from "@/theme/theme-registry";
import { Box } from "@mui/joy";
import { Analytics } from "@vercel/analytics/react"
import Navbar from "@/components/navbar";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const openSans = Open_Sans({
  variable: "--font-geist-sans",
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
    <html lang="pt-BR" data-color-scheme="dark" suppressHydrationWarning={true} className={cn("font-sans", inter.variable)}>
      <body className={`${openSans.variable}`}>
        <Analytics />
        <ThemeRegistry>
          <Box bgcolor={'background.level1'} className="main-container">
            <Navbar />
            {children}
          </Box>
        </ThemeRegistry>
      </body>
    </html>
  );
}
