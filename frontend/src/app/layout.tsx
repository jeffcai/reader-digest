import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import ClientNavbar from "@/components/ClientNavbar";
import HealthCheck from "@/components/HealthCheck";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Reader Digest - Track Your Reading Journey",
  description: "Keep track of what you read and create weekly digests of your reading journey",
  other: {
    'application/rss+xml': `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/rss/articles.xml`,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link 
          rel="alternate" 
          type="application/rss+xml" 
          title="Reader Digest - Public Articles" 
          href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/rss/articles.xml`}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <ClientNavbar />
            <main className="flex-1">
              {children}
            </main>
            <HealthCheck />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
