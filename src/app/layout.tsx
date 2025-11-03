import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/providers/providers";

// Force dynamic rendering for all pages to avoid useSearchParams issues
export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DocLatch AI",
  description:
    "AI-powered healthcare assistant automates document classification and task creation for medical practices",
  openGraph: {
    title: "DocLatch AI",
    description:
      "AI-powered healthcare assistant automates document classification and task creation for medical practices",
    url: "https://doclatch.com/",
    siteName: "DocLatch AI",
    images: [
      {
        url: "https://doclatch.com/logo.png",
        width: 1200,
        height: 630,
        alt: "DocLatch AI Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DocLatch AI",
    description:
      "AI-powered healthcare assistant automates document classification and task creation for medical practices",
    images: ["https://doclatch.com/logo.png"],
  },
  authors: [
    { name: "DocLatch AI Team", url: "https://doclatch.com" },
  ],
  creator: "@doclatchai",
  robots: {
    index: true,
    follow: true,
  },
  keywords: [
    "healthcare AI",
    "medical document processing",
    "task automation",
    "AI assistant",
    "healthcare workflow",
  ],
  generator: "v0.dev",
  icons: {
    icon: "/logo.png",
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
        <head>
          <link rel="icon" type="image/x-icon" href="/logo.png" />
        </head>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
