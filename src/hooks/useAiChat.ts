import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export function useAiChat() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id;
  const [isLoading, setIsLoading] = useState(false);
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>([]);

  // Fetch last 20 messages
  const messagesQuery = useQuery({
    queryKey: ["ai-chat-messages", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("ai_chat_messages")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .limit(20);
      if (error) throw error;
      return (data as ChatMessage[]) || [];
    },
  });

  const persistedMessages = messagesQuery.data ?? [];

  // Merge persisted + optimistic (dedup by id)
  const persistedIds = new Set(persistedMessages.map((m) => m.id));
  const extraOptimistic = optimisticMessages.filter((m) => !persistedIds.has(m.id));
  const messages: ChatMessage[] = [...persistedMessages, ...extraOptimistic];

  const sendMessage = useCallback(
    async (content: string) => {
      if (!userId || !content.trim() || isLoading) return;

      const tempUserMsgId = `temp-user-${Date.now()}`;
      const tempAiMsgId = `temp-ai-${Date.now()}`;

      // Optimistically add user message
      const userMsg: ChatMessage = {
        id: tempUserMsgId,
        role: "user",
        content: content.trim(),
        created_at: new Date().toISOString(),
      };
      setOptimisticMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        // Persist user message to DB
        const { data: savedUserMsg, error: userErr } = await (supabase as any)
          .from("ai_chat_messages")
          .insert({ user_id: userId, role: "user", content: content.trim() })
          .select("*")
          .single();
        if (userErr) throw userErr;

        // Build history for context (last 10 messages)
        const historyMessages = [
          ...persistedMessages.slice(-10),
          savedUserMsg as ChatMessage,
        ].map((m) => ({ role: m.role, content: m.content }));

        // Call the edge function
        const { data, error } = await supabase.functions.invoke("ai-chat", {
          body: { messages: historyMessages },
        });
        if (error) throw new Error(error.message);
        if (data?.error) throw new Error(data.error);

        const reply: string = data?.reply ?? "מצטער, לא הצלחתי לענות";

        // Optimistically show AI response
        const aiOptMsg: ChatMessage = {
          id: tempAiMsgId,
          role: "assistant",
          content: reply,
          created_at: new Date().toISOString(),
        };
        setOptimisticMessages((prev) => [...prev, aiOptMsg]);

        // Persist AI message to DB
        await (supabase as any)
          .from("ai_chat_messages")
          .insert({ user_id: userId, role: "assistant", content: reply });

        // Refresh messages list
        await qc.invalidateQueries({ queryKey: ["ai-chat-messages", userId] });
        // Clear optimistic messages once persisted
        setOptimisticMessages([]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "שגיאה לא ידועה";
        console.error("[useAiChat] sendMessage error:", err);
        // Remove the optimistic user message (avoid duplication) and show a toast
        setOptimisticMessages((prev) => prev.filter((m) => m.id !== tempUserMsgId));
        toast.error(`שגיאה בשליחת הודעה — ${msg}. נסה שוב`);
      } finally {
        setIsLoading(false);
      }
    },
    [userId, isLoading, persistedMessages, qc]
  );

  const clearHistory = useCallback(async () => {
    if (!userId) return;
    await (supabase as any)
      .from("ai_chat_messages")
      .delete()
      .eq("user_id", userId);
    setOptimisticMessages([]);
    await qc.invalidateQueries({ queryKey: ["ai-chat-messages", userId] });
  }, [userId, qc]);

  return {
    messages,
    sendMessage,
    isLoading,
    clearHistory,
    isLoadingHistory: messagesQuery.isLoading,
  };
}
