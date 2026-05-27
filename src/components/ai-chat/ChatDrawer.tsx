import { useEffect, useRef } from "react";
import { X, Trash2 } from "lucide-react";
import { useAiChat } from "@/hooks/useAiChat";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

interface ChatDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function ChatDrawer({ open, onClose }: ChatDrawerProps) {
  const { messages, sendMessage, isLoading, clearHistory, isLoadingHistory } = useAiChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Handle Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={[
          "fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm",
          "transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={[
          "fixed bottom-0 inset-x-0 z-[160]",
          "flex flex-col",
          "bg-[#0f0f1a] border-t border-white/10 rounded-t-3xl",
          "shadow-2xl shadow-black/60",
          "transition-transform duration-300 ease-out",
          "h-[85vh] md:h-[70vh] md:max-w-lg md:left-auto md:right-4 md:rounded-2xl md:bottom-24 md:border md:border-white/10",
          open ? "translate-y-0" : "translate-y-full",
        ].join(" ")}
        role="dialog"
        aria-modal="true"
        aria-label="עוזר אישי"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <div>
              <h2 className="text-sm font-bold text-white">עוזר אישי</h2>
              <p className="text-[10px] text-white/40">מופעל על ידי AI</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm("למחוק את כל ההיסטוריה?")) clearHistory();
                }}
                aria-label="מחק היסטוריה"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="סגור"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scroll-smooth"
        >
          {isLoadingHistory ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center" dir="rtl">
              <span className="text-4xl">🤖</span>
              <p className="text-white/60 text-sm">שלום! אני כאן לעזור לך.</p>
              <p className="text-white/30 text-xs">שאל אותי על כל דבר — ספורט, תזונה, כסף ועוד.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                role={msg.role}
                content={msg.content}
                timestamp={msg.created_at}
              />
            ))
          )}
          {isLoading && (
            <div className="flex items-start gap-2" dir="rtl">
              <div className="bg-white/10 border border-white/10 rounded-2xl rounded-tr-sm px-4 py-2.5">
                <div className="flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <ChatInput onSend={sendMessage} isLoading={isLoading} />
      </div>
    </>
  );
}
