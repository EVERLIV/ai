import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminReplySupportTicketApi,
  adminUpdateSupportTicketStatusApi,
  createSupportTicketApi,
  fetchAdminSupportTicketMessagesApi,
  fetchAdminSupportTicketsApi,
  fetchMySupportTicketsApi,
  fetchSupportTicketMessagesApi,
  type SupportTicket,
} from "@/lib/supportApi";

export const supportTicketsQueryKey = ["support-tickets"] as const;
export const supportTicketMessagesKey = (ticketId: string) =>
  ["support-ticket-messages", ticketId] as const;

export function useMySupportTickets() {
  return useQuery({
    queryKey: supportTicketsQueryKey,
    queryFn: fetchMySupportTicketsApi,
    retry: false,
  });
}

export function useSupportTicketMessages(ticketId: string | null) {
  return useQuery({
    queryKey: supportTicketMessagesKey(ticketId || ""),
    queryFn: () => fetchSupportTicketMessagesApi(ticketId!),
    enabled: !!ticketId,
  });
}

export function useCreateSupportTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      category,
      message,
    }: {
      category: string;
      message: string;
    }) => createSupportTicketApi(category, message),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: supportTicketsQueryKey });
    },
  });
}

export function useAdminSupportTickets() {
  return useQuery({
    queryKey: ["admin-support-tickets"],
    queryFn: fetchAdminSupportTicketsApi,
    refetchInterval: 30_000,
  });
}

export function useAdminSupportTicketMessages(ticketId: string | null) {
  return useQuery({
    queryKey: ["admin-support-ticket-messages", ticketId],
    queryFn: () => fetchAdminSupportTicketMessagesApi(ticketId!),
    enabled: !!ticketId,
  });
}

export function useAdminReplySupportTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      body,
      staffId,
    }: {
      ticketId: string;
      body: string;
      staffId?: string | null;
    }) => adminReplySupportTicketApi(ticketId, body, staffId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-support-tickets"] });
      qc.invalidateQueries({
        queryKey: ["admin-support-ticket-messages", vars.ticketId],
      });
    },
  });
}

export function useAdminUpdateSupportTicketStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      ticketId,
      status,
    }: {
      ticketId: string;
      status: string;
    }) => adminUpdateSupportTicketStatusApi(ticketId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-support-tickets"] });
    },
  });
}

export function formatSupportTicketDate(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function countOpenSupportTickets(tickets: SupportTicket[]): number {
  return tickets.filter((t) => t.status === "open").length;
}
