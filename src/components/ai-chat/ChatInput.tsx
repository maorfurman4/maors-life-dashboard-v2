import { useState, useRef, type KeyboardEvent } from "react";
import { Send } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  return (
    <div
      className="flex items-end gap-2 p-3 border-t border-white/10 bg-black/20"
      dir="rtl"
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder="שאל אותי כל שאלה..."
        disabled={isLoading}
        rows={1}
        className={[
          "flex-1 resize-none bg-white/8 border border-white/15 rounded-xl",
          "px-3 py-2 text-sm text-white placeholder:text-white/35",
          "focus:outline-none focus:border-white/30",
          "min-h-[40px] max-h-[120px] overflow-y-auto",
          "transition-colors leading-relaxed",
          isLoading ? "opacity-50 cursor-not-allowed" : "",
        ].join(" ")}
        style={{ direction: "rtl" }}
      />
      <button
        onClick={handleSend}
        disabled={!value.trim() || isLoading}
        aria-label="שלח הודעה"
        className={[
          "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
          "transition-all duration-200",
          value.trim() && !isLoading
            ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg"
            : "bg-white/8 text-white/25 cursor-not-allowed",
        ].join(" ")}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
