import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function getUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

// ─── Task Projects ────────────────────────────────────────────────────────────

export function useTaskProjects() {
  return useQuery({
    queryKey: ["task-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_projects")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddTaskProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { name: string; color: string; icon?: string }) => {
      const userId = await getUserId();
      const { error } = await supabase.from("task_projects").insert({
        user_id: userId,
        name: p.name,
        color: p.color,
        icon: p.icon ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["task-projects"] }),
  });
}

export function useDeleteTaskProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("task_projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task-projects"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export function useTasks() {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*, task_projects(name, color, icon)")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: {
      title: string;
      description?: string;
      priority?: string;
      project_id?: string | null;
      due_date?: string | null;
    }) => {
      const userId = await getUserId();
      const { error } = await supabase.from("tasks").insert({
        user_id: userId,
        title: t.title,
        description: t.description ?? null,
        priority: t.priority ?? "medium",
        project_id: t.project_id ?? null,
        due_date: t.due_date ?? null,
        status: "todo",
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; title?: string; priority?: string; due_date?: string | null; project_id?: string | null; completed_at?: string | null }) => {
      const { error } = await supabase.from("tasks").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}
