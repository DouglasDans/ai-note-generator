import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.scss";
import ThemeRegistry from "@/theme/theme-registry";
import { Box } from "@mui/joy";
import { Analytics } from "@vercel/analytics/react"

const openSans = Open_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Starlight Project",
  description: "✨ Um Assistente de IA para transcrever aulas e gerar resumos estruturados em markdown",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" data-color-scheme="dark" suppressHydrationWarning={true}>
      <body className={`${openSans.variable}`}>
        <Analytics />
        <ThemeRegistry>
          <Box bgcolor={'background.level1'} className="main-container">
            {children}
          </Box>
        </ThemeRegistry>
      </body>
    </html>
  );
}
