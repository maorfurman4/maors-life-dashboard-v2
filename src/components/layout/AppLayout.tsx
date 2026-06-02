import { memo, useState } from "react";
import { Outlet, useLocation } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { DesktopSidebar } from "./DesktopSidebar";
import { TopBar } from "./TopBar";
import { SideNavDrawer } from "./SideNavDrawer";
import { FloatingChatButton } from "@/components/ai-chat/FloatingChatButton";
import { XPBar } from "@/components/gamification/XPBar";
import { NotificationPermission } from "@/components/shared/NotificationPermission";
import { PWAInstallPrompt } from "@/components/shared/PWAInstallPrompt";

// Memoized so only this subtree re-renders on navigation, not the entire AppLayout shell
const AnimatedOutlet = memo(function AnimatedOutlet() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
});

export function AppLayout() {
  const [navOpen, setNavOpen] = useState(false);
  // No useLocation() here — only AnimatedOutlet subscribes to navigation changes

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-background" dir="rtl">
      <DesktopSidebar />
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <TopBar onMenuOpen={() => setNavOpen(true)} xpBar={<XPBar />} />
        <main id="main-content" role="main" aria-label="תוכן ראשי" className="flex-1 p-3 md:p-6 pt-[104px] md:pt-[112px] flex flex-col">
          <AnimatedOutlet />
        </main>
      </div>
      <SideNavDrawer open={navOpen} onClose={() => setNavOpen(false)} />
      <FloatingChatButton />
      <NotificationPermission />
      <PWAInstallPrompt />
    </div>
  );
}
