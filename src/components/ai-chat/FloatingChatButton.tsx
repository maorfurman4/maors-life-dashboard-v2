import { useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { ChatDrawer } from "./ChatDrawer";

export function FloatingChatButton() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Hide on login route
  if (location.pathname === "/login") return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="פתח עוזר אישי"
        className={[
          "fixed z-[140] bottom-20 right-4",
          "w-12 h-12 rounded-full",
          "bg-gradient-to-br from-blue-600 to-purple-600",
          "shadow-lg shadow-blue-900/50",
          "flex items-center justify-center",
          "text-xl",
          "border border-blue-400/30",
          "transition-transform duration-200 hover:scale-110 active:scale-95",
          // Pulse ring animation
          "after:absolute after:inset-0 after:rounded-full after:border-2 after:border-blue-400/40",
          "after:animate-ping after:opacity-0",
        ].join(" ")}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        🤖
      </button>

      <ChatDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
