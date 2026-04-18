import type { Metadata } from "next";
import { Outfit, Fira_Code } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ScrollToTop } from "@/components/shared/ScrollToTop";
import { Suspense } from "react";
import Loading from "./loading";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PDF Tools - Online PDF Editor",
  description: "Edit, merge, and convert PDF files easily online.",
  keywords: ["PDF", "editor", "merge", "convert", "tools"],
  authors: [{ name: "Your Name", url: "https://yourwebsite.com" }],
  openGraph: {
    title: "PDF Tools - Online PDF Editor",
    description: "Edit, merge, and convert PDF files easily online.",
    url: "https://yourwebsite.com",
    siteName: "PDFTools",
    images: [
      {
        url: "https://yourwebsite.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "PDFTools Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${firaCode.variable} antialiased`}
      >
        <Suspense fallback={<Loading />}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <ScrollToTop />
          </ThemeProvider>
        </Suspense>
      </body>
    </html>
  );
}
