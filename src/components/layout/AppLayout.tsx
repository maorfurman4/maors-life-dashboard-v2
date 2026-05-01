import { useState } from "react";
import { Outlet } from "@tanstack/react-router";
import { DesktopSidebar } from "./DesktopSidebar";
import { TopBar } from "./TopBar";
import { SideNavDrawer } from "./SideNavDrawer";
import { RootLayout } from "./RootLayout";

export function AppLayout() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <RootLayout>
      <div className="flex min-h-screen w-full overflow-x-hidden" dir="rtl">
        <DesktopSidebar />
        <div className="flex-1 flex flex-col min-h-screen min-w-0">
          <TopBar onMenuOpen={() => setNavOpen(true)} />
          <main id="main-content" role="main" aria-label="תוכן ראשי" className="flex-1 p-3 md:p-6 pt-[104px] md:pt-[112px]">
            <Outlet />
          </main>
        </div>
        <SideNavDrawer open={navOpen} onClose={() => setNavOpen(false)} />
      </div>
    </RootLayout>
  );
}
