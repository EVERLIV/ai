import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { supabaseAdmin } from "@/integrations/supabase/adminClient";

export type NewsPost = {
  id: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  cover_url: string | null;
  category: string;
  tags: string[];
  status: string;
  author_name: string;
  views: number;
};

export function useNewsPosts(category?: string) {
  return useQuery({
    queryKey: ["news", category],
    retry: false,
    queryFn: async () => {
      let q = supabase
        .from("news_posts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      if (category && category !== "Все") q = q.eq("category", category);
      const { data, error } = await q;
      if (error) return [] as NewsPost[];
      return (data ?? []) as NewsPost[];
    },
  });
}

export function useNewsPost(slug: string) {
  return useQuery({
    queryKey: ["news", slug],
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_posts")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) return null as unknown as NewsPost;
      return data as NewsPost;
    },
    enabled: !!slug,
  });
}

export function useAllNewsPosts() {
  return useQuery({
    queryKey: ["news_admin"],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin.db.select("news_posts", "select=*&order=created_at.desc");
      if (error) throw error;
      return (data ?? []) as NewsPost[];
    },
  });
}

export function useUpsertNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (post: Partial<NewsPost> & { title: string; slug: string }) => {
      const row = { ...post, updated_at: new Date().toISOString() };
      const { data, error } = post.id
        ? await supabaseAdmin.db.update("news_posts", `id=eq.${post.id}`, row)
        : await supabaseAdmin.db.upsert("news_posts", { ...row, created_at: new Date().toISOString() });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["news"] });
      qc.invalidateQueries({ queryKey: ["news_admin"] });
    },
  });
}

export function useDeleteNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseAdmin.db.delete("news_posts", `id=eq.${id}`);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["news"] });
      qc.invalidateQueries({ queryKey: ["news_admin"] });
    },
  });
}
