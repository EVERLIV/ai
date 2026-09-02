import { supabase } from "@/integrations/supabase/client";
import { supabaseAdmin } from "@/integrations/supabase/adminClient";
import type { Database } from "@/integrations/supabase/types";

export type SupportTicket =
  Database["public"]["Tables"]["support_tickets"]["Row"];

export type SupportTicketMessage =
  Database["public"]["Tables"]["support_ticket_messages"]["Row"];

export type SupportTicketWithProfile = SupportTicket & {
  profiles?: { email: string | null; full_name: string | null } | null;
};

function rpcErrorMessage(error: { message?: string } | null): string {
  return error?.message || "Ошибка запроса";
}

export async function createSupportTicketApi(
  category: string,
  message: string,
): Promise<SupportTicket> {
  const { data, error } = await supabase.rpc("create_support_ticket", {
    p_category: category,
    p_message: message,
  });
  if (error) throw new Error(rpcErrorMessage(error));
  return data as SupportTicket;
}

export async function fetchMySupportTicketsApi(): Promise<SupportTicket[]> {
  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(rpcErrorMessage(error));
  return (data || []) as SupportTicket[];
}

export async function fetchSupportTicketMessagesApi(
  ticketId: string,
): Promise<SupportTicketMessage[]> {
  const { data, error } = await supabase
    .from("support_ticket_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(rpcErrorMessage(error));
  return (data || []) as SupportTicketMessage[];
}

export async function fetchAdminSupportTicketsApi(): Promise<
  SupportTicketWithProfile[]
> {
  const { data: tickets, error } = await supabaseAdmin.db.select(
    "support_tickets",
    "select=*&order=created_at.desc&limit=300",
  );
  if (error) throw new Error(rpcErrorMessage(error as { message?: string }));
  const rows = (tickets || []) as SupportTicket[];

  const userIds = [...new Set(rows.map((t) => t.user_id))];
  const profilesById = new Map<
    string,
    { email: string | null; full_name: string | null }
  >();

  if (userIds.length > 0) {
    const idFilter = userIds.map((id) => `"${id}"`).join(",");
    const { data: profiles } = await supabaseAdmin.db.select(
      "profiles",
      `select=id,email,full_name&id=in.(${idFilter})`,
    );
    for (const p of (profiles || []) as {
      id: string;
      email: string | null;
      full_name: string | null;
    }[]) {
      profilesById.set(p.id, {
        email: p.email,
        full_name: p.full_name,
      });
    }
  }

  return rows.map((t) => ({
    ...t,
    profiles: profilesById.get(t.user_id) || null,
  }));
}

export async function fetchAdminSupportTicketMessagesApi(
  ticketId: string,
): Promise<SupportTicketMessage[]> {
  const { data, error } = await supabaseAdmin.db.select(
    "support_ticket_messages",
    `select=*&ticket_id=eq.${ticketId}&order=created_at.asc`,
  );
  if (error) throw new Error(rpcErrorMessage(error as { message?: string }));
  return (data || []) as SupportTicketMessage[];
}

/** Admin panel uses service role (direct DB, not RPC). */
export async function adminReplySupportTicketApi(
  ticketId: string,
  body: string,
  staffId?: string | null,
): Promise<void> {
  const text = body.trim();
  if (text.length < 2) throw new Error("Напишите ответ подробнее");

  const { error: msgError } = await supabaseAdmin.db.insert(
    "support_ticket_messages",
    {
      ticket_id: ticketId,
      author_type: "staff",
      author_id: staffId || null,
      body: text,
    },
  );
  if (msgError) throw new Error(rpcErrorMessage(msgError as { message?: string }));

  const { error: statusError } = await supabaseAdmin.db.update(
    "support_tickets",
    `id=eq.${ticketId}`,
    { status: "answered" },
  );
  if (statusError) {
    throw new Error(rpcErrorMessage(statusError as { message?: string }));
  }
}

export async function adminUpdateSupportTicketStatusApi(
  ticketId: string,
  status: string,
): Promise<void> {
  const { error } = await supabaseAdmin.db.update(
    "support_tickets",
    `id=eq.${ticketId}`,
    { status },
  );
  if (error) throw new Error(rpcErrorMessage(error as { message?: string }));
}
