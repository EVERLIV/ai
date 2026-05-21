import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface ChecklistItem { id: string; text: string; done: boolean; }

export interface Task {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  assignee: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  project_id: string | null;
  tags: string[];
  checklist: ChecklistItem[];
  created_at: string;
  updated_at: string;
}

export interface TaskProject {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_name: string | null;
  content: string;
  created_at: string;
}

export interface StaffMember {
  id: string;
  full_name: string | null;
  email: string | null;
}

// ── Projects ──
export function useProjects() {
  return useQuery({
    queryKey: ["task-projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("task_projects").select("*").order("created_at");
      if (error) throw error;
      return data as TaskProject[];
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; color: string }) => {
      const { data, error } = await supabase.from("task_projects").insert(input).select().single();
      if (error) throw error;
      return data as TaskProject;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["task-projects"] }),
  });
}

// ── Tasks ──
export function useTasks(projectId?: string) {
  return useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      let q = supabase.from("tasks").select("*").order("created_at", { ascending: false });
      if (projectId) q = q.eq("project_id", projectId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map((t) => ({
        ...t,
        tags: t.tags || [],
        checklist: t.checklist || [],
      })) as Task[];
    },
  });
}

export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: ["task", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*").eq("id", id!).single();
      if (error) throw error;
      return { ...data, tags: data.tags || [], checklist: data.checklist || [] } as Task;
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Task>) => {
      const { data, error } = await supabase.from("tasks").insert(input).select().single();
      if (error) throw error;
      return data as Task;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Task> & { id: string }) => {
      const { data, error } = await supabase.from("tasks").update(input).eq("id", id).select().single();
      if (error) throw error;
      return data as Task;
    },
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["task", task.id] });
    },
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

// ── Comments ──
export function useComments(taskId: string | undefined) {
  return useQuery({
    queryKey: ["task-comments", taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_comments").select("*").eq("task_id", taskId!).order("created_at");
      if (error) throw error;
      return data as TaskComment[];
    },
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { task_id: string; content: string; author_name: string }) => {
      const { data, error } = await supabase.from("task_comments").insert(input).select().single();
      if (error) throw error;
      return data as TaskComment;
    },
    onSuccess: (c) => qc.invalidateQueries({ queryKey: ["task-comments", c.task_id] }),
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, taskId }: { id: string; taskId: string }) => {
      await supabase.from("task_comments").delete().eq("id", id);
      return taskId;
    },
    onSuccess: (taskId) => qc.invalidateQueries({ queryKey: ["task-comments", taskId] }),
  });
}

// ── Staff ──
export function useStaffMembers() {
  return useQuery({
    queryKey: ["staff-members"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").in("role", ["admin", "staff", "manager"]);
      if (!roles?.length) return [] as StaffMember[];
      const ids = [...new Set(roles.map((r: any) => r.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", ids).order("full_name");
      return (profiles || []) as StaffMember[];
    },
  });
}
