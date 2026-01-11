import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ScrollToTop } from "@/components/shared/ScrollToTop";
import { Suspense } from "react";
import { LoadingOverlay } from "@/components/shared/LoadingOverlay";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Suspense fallback={<LoadingOverlay isVisible={true} />}>
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
