import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClubProvider } from "@/context/ClubContext";
import Navbar from "@/components/Navbar";
import RouteGuard from "@/components/RouteGuard";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "ShuttlePulse — Badminton Club",
  description: "Badminton club sessions, token wallet, and rankings.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ShuttlePulse",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans min-h-screen bg-[#f2f7f5] text-slate-900 antialiased selection:bg-emerald-600 selection:text-white pb-safe-nav md:pb-8`}
      >
        <ClubProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <RouteGuard>
              <main className="flex-1">{children}</main>
            </RouteGuard>
            <footer className="py-4 text-center text-[11px] text-slate-400">
              Developed by{" "}
              <a
                href="https://www.linkedin.com/in/snbappy/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-emerald-700 hover:underline"
              >
                Md. Sabbir Hossain Bappy
              </a>{" "}
              at <span className="font-medium text-slate-500">CyberSecurity Lab</span>
            </footer>
          </div>
        </ClubProvider>
      </body>
    </html>
  );
}
