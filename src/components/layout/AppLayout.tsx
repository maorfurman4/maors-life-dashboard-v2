import { Outlet } from "@tanstack/react-router";
import { DesktopSidebar } from "./DesktopSidebar";
import { BottomNav } from "./BottomNav";
import { TopBar } from "./TopBar";

export function AppLayout() {
  return (
    <div className="flex min-h-screen w-full overflow-x-hidden" dir="rtl">
      <DesktopSidebar />
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <TopBar />
        <main id="main-content" role="main" aria-label="תוכן ראשי" className="flex-1 p-3 md:p-6 pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
