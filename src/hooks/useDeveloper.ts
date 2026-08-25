import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  adminSetDeveloperVerificationApi,
  createConstructionStageApi,
  createDeveloperDocumentApi,
  createDeveloperProjectApi,
  createOutboundWebhookApi,
  createPhaseApi,
  createProjectMediaApi,
  createUnitTypeApi,
  deleteConstructionStageApi,
  deleteDeveloperProjectApi,
  deleteOutboundWebhookApi,
  deletePhaseApi,
  deleteProjectMediaApi,
  deleteUnitTypeApi,
  fetchAllDevelopersAdminApi,
  fetchConstructionStagesApi,
  fetchDeveloperByIdApi,
  fetchDeveloperDocumentsApi,
  fetchDeveloperEventStatsApi,
  fetchDeveloperProjectsApi,
  fetchDeveloperPropertiesApi,
  fetchMyDeveloperApi,
  fetchOutboundWebhooksApi,
  fetchPhasesApi,
  fetchProjectByIdApi,
  fetchProjectMediaApi,
  fetchPublicProjectsApi,
  fetchUnitTypesApi,
  fetchVerifiedDevelopersApi,
  publishDeveloperProjectApi,
  requestDeveloperVerificationApi,
  reviewDeveloperDocumentApi,
  trackDeveloperEventApi,
  updateConstructionStageApi,
  updateDeveloperApi,
  updateDeveloperProjectApi,
  updatePhaseApi,
  updateUnitTypeApi,
  uploadDeveloperAssetApi,
} from "@/lib/developerApi";
import type {
  ConstructionStage,
  Developer,
  DeveloperAnalyticsEvent,
  DeveloperProject,
  DeveloperSubtype,
  ProjectPhase,
  ProjectUnitType,
} from "@/lib/developerTypes";

export function useMyDeveloper() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-developer", user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: () => fetchMyDeveloperApi(user!.id),
  });
}

export function useVerifiedDevelopers(params?: {
  subtype?: DeveloperSubtype | null;
  q?: string | null;
}) {
  return useQuery({
    queryKey: ["developers-verified", params?.subtype ?? null, params?.q ?? ""],
    staleTime: 60_000,
    queryFn: () => fetchVerifiedDevelopersApi(params),
  });
}

export function usePublicDeveloperProjects(params?: {
  subtype?: DeveloperSubtype | null;
  status?: string | null;
  q?: string | null;
}) {
  return useQuery({
    queryKey: [
      "developer-projects-public",
      params?.subtype ?? null,
      params?.status ?? null,
      params?.q ?? "",
    ],
    staleTime: 60_000,
    queryFn: () => fetchPublicProjectsApi(params),
  });
}

export function useDeveloperPublic(id: string | undefined) {
  return useQuery({
    queryKey: ["developer-public", id],
    enabled: !!id,
    queryFn: () => fetchDeveloperByIdApi(id!),
  });
}

export function useDeveloperPublicProjects(developerId: string | undefined) {
  return useQuery({
    queryKey: ["developer-projects", developerId, "public"],
    enabled: !!developerId,
    queryFn: () => fetchDeveloperProjectsApi(developerId!),
  });
}

export function useDeveloperPublicProperties(
  developerId: string | undefined,
  projectId?: string | null,
) {
  return useQuery({
    queryKey: ["developer-properties", developerId, projectId ?? null],
    enabled: !!developerId,
    staleTime: 60_000,
    queryFn: () => fetchDeveloperPropertiesApi(developerId!, projectId),
  });
}

export function useMyDeveloperProjects() {
  const { data: developer } = useMyDeveloper();
  return useQuery({
    queryKey: ["developer-projects", developer?.id, "mine"],
    enabled: !!developer?.id,
    queryFn: () =>
      fetchDeveloperProjectsApi(developer!.id, { includeDrafts: true }),
  });
}

export function useProjectPublic(id: string | undefined) {
  return useQuery({
    queryKey: ["developer-project", id],
    enabled: !!id,
    queryFn: () => fetchProjectByIdApi(id!),
  });
}

export function useProjectUnitTypes(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project-unit-types", projectId],
    enabled: !!projectId,
    queryFn: () => fetchUnitTypesApi(projectId!),
  });
}

export function useProjectPhases(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project-phases", projectId],
    enabled: !!projectId,
    queryFn: () => fetchPhasesApi(projectId!),
  });
}

export function useProjectConstructionStages(
  projectId: string | undefined,
  publishedOnly = false,
) {
  return useQuery({
    queryKey: ["construction-stages", projectId, publishedOnly],
    enabled: !!projectId,
    queryFn: () =>
      fetchConstructionStagesApi(projectId!, { publishedOnly }),
  });
}

export function useProjectMedia(projectId: string | undefined) {
  return useQuery({
    queryKey: ["project-media", projectId],
    enabled: !!projectId,
    queryFn: () => fetchProjectMediaApi(projectId!),
  });
}

export function useMyDeveloperDocuments() {
  const { data: developer } = useMyDeveloper();
  return useQuery({
    queryKey: ["developer-documents", developer?.id],
    enabled: !!developer?.id,
    queryFn: () => fetchDeveloperDocumentsApi(developer!.id),
  });
}

export function useDeveloperEventStats() {
  const { data: developer } = useMyDeveloper();
  return useQuery({
    queryKey: ["developer-event-stats", developer?.id],
    enabled: !!developer?.id,
    staleTime: 30_000,
    queryFn: () => fetchDeveloperEventStatsApi(developer!.id),
  });
}

export function useMyOutboundWebhooks() {
  const { data: developer } = useMyDeveloper();
  return useQuery({
    queryKey: ["outbound-webhooks", developer?.id],
    enabled: !!developer?.id,
    queryFn: () => fetchOutboundWebhooksApi(developer!.id),
  });
}

export function useAdminDevelopers() {
  return useQuery({
    queryKey: ["developers-admin"],
    staleTime: 30_000,
    queryFn: fetchAllDevelopersAdminApi,
  });
}

export function useUpdateDeveloper() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({
      developerId,
      patch,
    }: {
      developerId: string;
      patch: Partial<Developer>;
    }) => updateDeveloperApi(developerId, patch),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-developer", user?.id] });
      void qc.invalidateQueries({ queryKey: ["developers-verified"] });
      void qc.invalidateQueries({ queryKey: ["developer-public"] });
    },
  });
}

export function useUploadDeveloperLogo(developerId: string | undefined) {
  const updateDeveloper = useUpdateDeveloper();
  return useMutation({
    mutationFn: async (file: File) => {
      const url = await uploadDeveloperAssetApi(developerId!, file);
      await updateDeveloper.mutateAsync({
        developerId: developerId!,
        patch: { logo_url: url },
      });
      return url;
    },
  });
}

export function useRequestDeveloperVerification() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (developerId: string) =>
      requestDeveloperVerificationApi(developerId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-developer", user?.id] });
    },
  });
}

export function useAdminSetDeveloperVerification() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({
      developerId,
      status,
    }: {
      developerId: string;
      status: "verified" | "rejected";
    }) =>
      adminSetDeveloperVerificationApi(developerId, status, user!.id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["developers-admin"] });
      void qc.invalidateQueries({ queryKey: ["developers-verified"] });
    },
  });
}

export function useCreateDeveloperProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createDeveloperProjectApi,
    onSuccess: (row) => {
      void qc.invalidateQueries({
        queryKey: ["developer-projects", row.developer_id],
      });
    },
  });
}

export function useUpdateDeveloperProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      patch,
    }: {
      projectId: string;
      patch: Partial<DeveloperProject>;
    }) => updateDeveloperProjectApi(projectId, patch),
    onSuccess: (row) => {
      void qc.invalidateQueries({
        queryKey: ["developer-projects", row.developer_id],
      });
      void qc.invalidateQueries({ queryKey: ["developer-project", row.id] });
    },
  });
}

export function usePublishDeveloperProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: publishDeveloperProjectApi,
    onSuccess: (row) => {
      void qc.invalidateQueries({
        queryKey: ["developer-projects", row.developer_id],
      });
    },
  });
}

export function useDeleteDeveloperProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDeveloperProjectApi,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["developer-projects"] });
    },
  });
}

export function useCreateUnitType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createUnitTypeApi,
    onSuccess: (row) => {
      void qc.invalidateQueries({
        queryKey: ["project-unit-types", row.project_id],
      });
    },
  });
}

export function useUpdateUnitType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<ProjectUnitType>;
    }) => updateUnitTypeApi(id, patch),
    onSuccess: (row) => {
      void qc.invalidateQueries({
        queryKey: ["project-unit-types", row.project_id],
      });
    },
  });
}

export function useDeleteUnitType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteUnitTypeApi,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["project-unit-types"] });
    },
  });
}

export function useCreatePhase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPhaseApi,
    onSuccess: (row: ProjectPhase) => {
      void qc.invalidateQueries({ queryKey: ["project-phases", row.project_id] });
    },
  });
}

export function useUpdatePhase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<ProjectPhase> }) =>
      updatePhaseApi(id, patch),
    onSuccess: (row) => {
      void qc.invalidateQueries({ queryKey: ["project-phases", row.project_id] });
    },
  });
}

export function useDeletePhase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePhaseApi,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["project-phases"] });
    },
  });
}

export function useCreateConstructionStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createConstructionStageApi,
    onSuccess: (row: ConstructionStage) => {
      void qc.invalidateQueries({
        queryKey: ["construction-stages", row.project_id],
      });
    },
  });
}

export function useUpdateConstructionStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<ConstructionStage>;
    }) => updateConstructionStageApi(id, patch),
    onSuccess: (row) => {
      void qc.invalidateQueries({
        queryKey: ["construction-stages", row.project_id],
      });
    },
  });
}

export function useDeleteConstructionStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteConstructionStageApi,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["construction-stages"] });
    },
  });
}

export function useCreateProjectMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createProjectMediaApi,
    onSuccess: (row) => {
      void qc.invalidateQueries({ queryKey: ["project-media", row.project_id] });
    },
  });
}

export function useDeleteProjectMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteProjectMediaApi,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["project-media"] });
    },
  });
}

export function useCreateDeveloperDocument() {
  const qc = useQueryClient();
  const { data: developer } = useMyDeveloper();
  return useMutation({
    mutationFn: createDeveloperDocumentApi,
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ["developer-documents", developer?.id],
      });
    },
  });
}

export function useReviewDeveloperDocument() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "approved" | "rejected";
    }) => reviewDeveloperDocumentApi(id, status, user!.id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["developer-documents"] });
      void qc.invalidateQueries({ queryKey: ["developers-admin"] });
    },
  });
}

export function useCreateOutboundWebhook() {
  const qc = useQueryClient();
  const { data: developer } = useMyDeveloper();
  return useMutation({
    mutationFn: createOutboundWebhookApi,
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ["outbound-webhooks", developer?.id],
      });
    },
  });
}

export function useDeleteOutboundWebhook() {
  const qc = useQueryClient();
  const { data: developer } = useMyDeveloper();
  return useMutation({
    mutationFn: deleteOutboundWebhookApi,
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: ["outbound-webhooks", developer?.id],
      });
    },
  });
}

export function useTrackDeveloperEvent() {
  return useMutation({
    mutationFn: (event: DeveloperAnalyticsEvent) =>
      trackDeveloperEventApi(event),
  });
}
