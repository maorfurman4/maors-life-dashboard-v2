interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const isUser = role === "user";

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div
      className={["flex flex-col gap-0.5 animate-in fade-in slide-in-from-bottom-2 duration-200", isUser ? "items-end" : "items-start"].join(" ")}
      dir="rtl"
    >
      <div
        className={[
          "max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
          isUser
            ? "bg-blue-600 text-white rounded-tl-sm"
            : "bg-white/10 border border-white/10 text-white/90 rounded-tr-sm",
        ].join(" ")}
      >
        {content}
      </div>
      {formattedTime && (
        <span className="text-[10px] text-white/30 px-1">{formattedTime}</span>
      )}
    </div>
  );
}
