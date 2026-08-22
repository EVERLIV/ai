import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  createAgencyInviteApi,
  createAgencyManagerApi,
  deleteAgencyInviteApi,
  deleteAgencyManagerApi,
  fetchAgencyByIdApi,
  fetchAgencyInvitesApi,
  fetchAgencyManagersApi,
  fetchAgencyMembersApi,
  fetchAgencyPropertiesApi,
  fetchMyAgencyApi,
  fetchMyAgencyPropertiesApi,
  fetchVerifiedAgenciesApi,
  removeAgencyMemberApi,
  requestAgencyVerificationApi,
  updateAgencyApi,
  updateAgencyManagerApi,
  updateAgencyMemberRoleApi,
  uploadAgencyAssetApi,
  connectAgencyTelegramByChatIdApi,
  updateAgencyTelegramSettingsApi,
  disconnectAgencyTelegramApi,
  type Agency,
  type AgencyMemberRole,
  type AgencyManager,
} from "@/lib/agencyApi";

export function useVerifiedAgencies() {
  return useQuery({
    queryKey: ["agencies-verified"],
    staleTime: 5 * 60_000,
    queryFn: fetchVerifiedAgenciesApi,
  });
}

export function useMyAgency() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-agency", user?.id],
    enabled: !!user,
    queryFn: () => fetchMyAgencyApi(user!.id),
  });
}

export function useAgencyPublic(agencyId: string | undefined) {
  return useQuery({
    queryKey: ["agency-public", agencyId],
    enabled: !!agencyId,
    queryFn: () => fetchAgencyByIdApi(agencyId!),
  });
}

export function useAgencyManagers(agencyId: string | undefined, activeOnly = false) {
  return useQuery({
    queryKey: ["agency-managers", agencyId, activeOnly],
    enabled: !!agencyId,
    queryFn: () => fetchAgencyManagersApi(agencyId!, activeOnly),
  });
}

export function useAgencyMembers(agencyId: string | undefined) {
  return useQuery({
    queryKey: ["agency-members", agencyId],
    enabled: !!agencyId,
    queryFn: () => fetchAgencyMembersApi(agencyId!),
  });
}

export function useAgencyInvites(agencyId: string | undefined) {
  return useQuery({
    queryKey: ["agency-invites", agencyId],
    enabled: !!agencyId,
    queryFn: () => fetchAgencyInvitesApi(agencyId!),
  });
}

export function useAgencyPublicProperties(agencyId: string | undefined) {
  return useQuery({
    queryKey: ["agency-properties-public", agencyId],
    enabled: !!agencyId,
    queryFn: () => fetchAgencyPropertiesApi(agencyId!),
  });
}

export function useMyAgencyProperties(agencyId: string | undefined) {
  return useQuery({
    queryKey: ["agency-properties-mine", agencyId],
    enabled: !!agencyId,
    queryFn: () => fetchMyAgencyPropertiesApi(agencyId!),
  });
}

export function useUpdateAgency() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ agencyId, payload }: { agencyId: string; payload: Partial<Agency> }) =>
      updateAgencyApi(agencyId, payload),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["my-agency", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["agency-public", vars.agencyId] });
    },
  });
}

export function useRequestAgencyVerification() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (agencyId: string) => requestAgencyVerificationApi(agencyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-agency", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-agencies"] });
    },
  });
}

export function useAgencyManagerMutations(agencyId: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["agency-managers", agencyId] });
  };

  const create = useMutation({
    mutationFn: (payload: {
      full_name: string;
      phone: string;
      photo_url?: string | null;
      property_types?: string[];
    }) => createAgencyManagerApi(agencyId!, payload),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<AgencyManager> }) =>
      updateAgencyManagerApi(id, payload),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteAgencyManagerApi(id),
    onSuccess: invalidate,
  });

  const uploadPhoto = useMutation({
    mutationFn: (file: File) => uploadAgencyAssetApi(agencyId!, file, "manager"),
  });

  return { create, update, remove, uploadPhoto };
}

export function useAgencyTeamMutations(agencyId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["agency-members", agencyId] });
    queryClient.invalidateQueries({ queryKey: ["agency-invites", agencyId] });
  };

  const invite = useMutation({
    mutationFn: ({ email, role }: { email: string; role: AgencyMemberRole }) =>
      createAgencyInviteApi(agencyId!, email, role, user!.id),
    onSuccess: invalidate,
  });

  const revokeInvite = useMutation({
    mutationFn: (inviteId: string) => deleteAgencyInviteApi(inviteId),
    onSuccess: invalidate,
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) => removeAgencyMemberApi(agencyId!, userId),
    onSuccess: invalidate,
  });

  const setRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: AgencyMemberRole }) =>
      updateAgencyMemberRoleApi(agencyId!, userId, role),
    onSuccess: invalidate,
  });

  return { invite, revokeInvite, removeMember, setRole };
}

export function useUploadAgencyLogo(agencyId: string | undefined) {
  const updateAgency = useUpdateAgency();
  return useMutation({
    mutationFn: async (file: File) => {
      const url = await uploadAgencyAssetApi(agencyId!, file, "logo");
      await updateAgency.mutateAsync({ agencyId: agencyId!, payload: { logo_url: url } });
      return url;
    },
  });
}

export function useConnectAgencyTelegramChat() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({
      agencyId,
      chatId,
      chatTitle,
    }: {
      agencyId: string;
      chatId: string;
      chatTitle?: string | null;
    }) => connectAgencyTelegramByChatIdApi(agencyId, chatId, chatTitle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-agency", user?.id] });
    },
  });
}

export function useUpdateAgencyTelegramSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({
      agencyId,
      settings,
    }: {
      agencyId: string;
      settings: Parameters<typeof updateAgencyTelegramSettingsApi>[1];
    }) => updateAgencyTelegramSettingsApi(agencyId, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-agency", user?.id] });
    },
  });
}

export function useDisconnectAgencyTelegram() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (agencyId: string) => disconnectAgencyTelegramApi(agencyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-agency", user?.id] });
    },
  });
}
