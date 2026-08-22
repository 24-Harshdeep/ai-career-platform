import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import { SessionProvider, AuthGuard } from "@/lib/auth";
import ThemeProvider from "@/components/layout/ThemeProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "CareerOS - AI Career Intelligence Dashboard",
  description: "Accelerate your career journey with AI-driven resume scoring, roadmaps, and coaching.",
  metadataBase: new URL("https://careeros.dev"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="h-full bg-background text-foreground">
        <SessionProvider>
          <AuthGuard>
            <ThemeProvider>
              <div className="flex min-h-screen">
                {/* Left Sidebar */}
                <Sidebar />

                {/* Main Area */}
                <div className="flex-1 flex flex-col min-w-0">
                  {/* Navbar Header */}
                  <Navbar />

                  {/* Page Content */}
                  <div
                    id="main-scroll-container"
                    className="flex-1 overflow-y-auto custom-scrollbar"
                  >
                    <main className="p-4 md:p-8 max-w-7xl w-full mx-auto relative">
                      {children}
                    </main>
                  </div>
                </div>
              </div>
            </ThemeProvider>
          </AuthGuard>
        </SessionProvider>
      </body>
    </html>
  );
}
