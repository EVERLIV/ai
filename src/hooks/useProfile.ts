import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ProfileAccountType = "owner" | "realtor";
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export interface UserProfile {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  account_type: ProfileAccountType;
  agency_name: string | null;
  agency_staff_count: number | null;
  agency_about: string | null;
  verification_status: VerificationStatus;
  verification_requested_at: string | null;
  verified_at: string | null;
}

export const ACCOUNT_TYPE_LABELS: Record<ProfileAccountType, string> = {
  owner: "Собственник",
  realtor: "Риелтор",
};

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  unverified: "Не верифицирован",
  pending: "На проверке",
  verified: "Верифицирован",
  rejected: "Отклонён",
};

export function isProfileVerified(status?: VerificationStatus | null): boolean {
  return status === "verified";
}

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data as UserProfile;
    },
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<UserProfile>) => {
      if (!user) throw new Error("Не авторизован");
      const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });
}

export function useRequestVerification() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Не авторизован");
      const { error } = await supabase
        .from("profiles")
        .update({ verification_status: "pending" })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["verification-users"] });
    },
  });
}
