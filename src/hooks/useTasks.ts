import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabaseAdmin } from "@/integrations/supabase/adminClient";
import { getEdgeFunctionUrl } from "@/lib/edgeFunctions";

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  assignee: string | null;
  assignees: string[];
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

function dbError(error: unknown): never {
  const msg =
    typeof error === "object" && error && "message" in error
      ? String((error as { message: string }).message)
      : JSON.stringify(error);
  throw new Error(msg || "Database error");
}

function mapTask(t: Record<string, unknown>): Task {
  return {
    ...(t as Task),
    tags: (t.tags as string[]) || [],
    checklist: (t.checklist as ChecklistItem[]) || [],
  };
}

// ── Projects ──
export function useProjects() {
  return useQuery({
    queryKey: ["task-projects"],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin.db.select(
        "task_projects",
        "select=*&order=created_at.asc",
      );
      if (error) dbError(error);
      return (data || []) as TaskProject[];
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; color: string }) => {
      const { data, error } = await supabaseAdmin.db.insert(
        "task_projects",
        input,
      );
      if (error) dbError(error);
      return data as TaskProject;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["task-projects"] }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseAdmin.db.delete(
        "task_projects",
        `id=eq.${id}`,
      );
      if (error) dbError(error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task-projects"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

// ── Tasks ──
export function useTasks(projectId?: string) {
  return useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      const query = projectId
        ? `select=*&project_id=eq.${projectId}&order=created_at.desc`
        : "select=*&order=created_at.desc";
      const { data, error } = await supabaseAdmin.db.select("tasks", query);
      if (error) dbError(error);
      return ((data || []) as Record<string, unknown>[]).map(mapTask);
    },
  });
}

export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: ["task", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabaseAdmin.db.select(
        "tasks",
        `select=*&id=eq.${id}`,
      );
      if (error) dbError(error);
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) throw new Error("Task not found");
      return mapTask(row as Record<string, unknown>);
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Task>) => {
      const { data, error } = await supabaseAdmin.db.insert("tasks", input);
      if (error) dbError(error);
      return mapTask(data as Record<string, unknown>);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Task> & { id: string }) => {
      const { data, error } = await supabaseAdmin.db.update(
        "tasks",
        `id=eq.${id}`,
        input,
      );
      if (error) dbError(error);
      return mapTask(data as Record<string, unknown>);
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
      const { error } = await supabaseAdmin.db.delete("tasks", `id=eq.${id}`);
      if (error) dbError(error);
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
      const { data, error } = await supabaseAdmin.db.select(
        "task_comments",
        `select=*&task_id=eq.${taskId}&order=created_at.asc`,
      );
      if (error) dbError(error);
      return (data || []) as TaskComment[];
    },
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      task_id: string;
      content: string;
      author_name: string;
    }) => {
      const { data, error } = await supabaseAdmin.db.insert(
        "task_comments",
        input,
      );
      if (error) dbError(error);
      return data as TaskComment;
    },
    onSuccess: (c) =>
      qc.invalidateQueries({ queryKey: ["task-comments", c.task_id] }),
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, taskId }: { id: string; taskId: string }) => {
      const { error } = await supabaseAdmin.db.delete(
        "task_comments",
        `id=eq.${id}`,
      );
      if (error) dbError(error);
      return taskId;
    },
    onSuccess: (taskId) =>
      qc.invalidateQueries({ queryKey: ["task-comments", taskId] }),
  });
}

// ── AI Reports ──
export interface AIReport {
  id: string;
  report_date: string;
  summary: string;
  insights: {
    type: "warning" | "success" | "info" | "critical";
    title: string;
    text: string;
    emoji: string;
  }[];
  generated_at: string;
}

export function useAIReports() {
  return useQuery({
    queryKey: ["ai-reports"],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin.db.select(
        "task_ai_reports",
        "select=*&order=report_date.desc&limit=30",
      );
      if (error) dbError(error);
      return (data || []) as AIReport[];
    },
  });
}

export function useGenerateAIReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (force = false) => {
      const resp = await fetch(getEdgeFunctionUrl("task-ai-report"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(
          typeof data === "object" && data && "error" in data
            ? String((data as { error: string }).error)
            : `HTTP ${resp.status}`,
        );
      }
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ai-reports"] }),
  });
}

// ── Staff ──
export function useStaffMembers() {
  return useQuery({
    queryKey: ["staff-members"],
    queryFn: async () => {
      const { data: roles, error: rolesError } = await supabaseAdmin.db.select(
        "user_roles",
        "select=user_id&role=in.(admin,staff,manager)",
      );
      if (rolesError) dbError(rolesError);
      if (!roles?.length) return [] as StaffMember[];
      const ids = [...new Set(roles.map((r: { user_id: string }) => r.user_id))];
      const { data: profiles, error: profilesError } =
        await supabaseAdmin.db.select(
          "profiles",
          `select=id,full_name,email&id=in.(${ids.join(",")})&order=full_name.asc`,
        );
      if (profilesError) dbError(profilesError);
      return (profiles || []) as StaffMember[];
    },
  });
}
