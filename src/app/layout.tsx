import type { Metadata, Viewport } from "next";
import { Inter, Sora, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const sora = Sora({ 
  subsets: ["latin"],
  variable: "--font-sora",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export const viewport: Viewport = {
  themeColor: "#1a1a2e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_TITLE || "Mission Control",
  description: process.env.NEXT_PUBLIC_AGENT_DESCRIPTION || "Your AI co-pilot, powered by OpenClaw",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" className="dark">
      <body 
        className={`${inter.variable} ${sora.variable} ${jetbrainsMono.variable} font-sans`}
        style={{ 
          backgroundColor: 'var(--background)', 
          color: 'var(--foreground)',
          fontFamily: 'var(--font-body)'
        }}
      >
        {children}
      </body>
    </html>
  );
}
