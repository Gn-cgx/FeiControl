"use client";

import { usePathname } from "next/navigation";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Dock, TopBar, StatusBar } from "@/components/TenacitOS";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isOffice = pathname === "/office";
  const isMobile = useIsMobile();

  return (
    <div className="tenacios-shell" style={{ minHeight: "100vh" }}>
      <Dock />
      {!isOffice && <TopBar />}

      <main
        style={{
          marginLeft: isMobile ? 0 : "68px",
          marginTop: isOffice ? 0 : "48px",
          marginBottom: isOffice ? 0 : isMobile ? "64px" : "32px",
          minHeight: isOffice ? "100vh" : isMobile ? "calc(100vh - 48px - 64px)" : "calc(100vh - 48px - 32px)",
          padding: isOffice ? 0 : isMobile ? "16px" : "24px",
        }}
      >
        {children}
      </main>

      {!isOffice && !isMobile && <StatusBar />}
    </div>
  );
}
