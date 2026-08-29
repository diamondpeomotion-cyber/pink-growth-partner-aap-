// Real Support Ticket data layer for the Growth Partner app.
//
// Reads/writes `support_tickets` and `ticket_messages` (see
// supabase/migrations/001_gp_pwa_schema_and_rls.sql). All access goes through
// the shared anon client + the signed-in user's JWT and is scoped server-side
// by RLS to `recipient_user_id = auth.uid()`. No service_role anywhere.

import type { SupabaseClient } from '@supabase/supabase-js';

export interface SupportTicket {
  id: string;
  subject: string;
  description: string | null;
  category: string | null;
  priority: string;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  senderUserId: string | null;
  message: string;
  createdAt: string | null;
}

const isMissingRelationError = (error: { code?: string; message?: string } | null): boolean => {
  if (!error) return false;
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    /could not find a (table|schema)|relation .* does not exist/i.test(error.message || '')
  );
};

/** List the signed-in user's support tickets, newest first. */
export async function fetchMyTickets(
  client: SupabaseClient,
  userId: string,
): Promise<SupportTicket[]> {
  const { data, error } = await client
    .from('support_tickets')
    .select('id, subject, description, category, priority, status, created_at, updated_at')
    .eq('recipient_user_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    if (isMissingRelationError(error)) return [];
    throw error;
  }
  return ((data ?? []) as any[]).map((r) => ({
    id: String(r.id),
    subject: String(r.subject ?? ''),
    description: r.description ? String(r.description) : null,
    category: r.category ? String(r.category) : null,
    priority: String(r.priority ?? 'medium'),
    status: String(r.status ?? 'open'),
    createdAt: r.created_at ? String(r.created_at) : null,
    updatedAt: r.updated_at ? String(r.updated_at) : null,
  }));
}

/** Fetch a single ticket, only if it belongs to the given user. */
export async function fetchTicketById(
  client: SupabaseClient,
  userId: string,
  ticketId: string,
): Promise<SupportTicket | null> {
  const { data, error } = await client
    .from('support_tickets')
    .select('id, subject, description, category, priority, status, created_at, updated_at')
    .eq('id', ticketId)
    .eq('recipient_user_id', userId)
    .maybeSingle();
  if (error) {
    if (isMissingRelationError(error)) return null;
    throw error;
  }
  if (!data) return null;
  return {
    id: String(data.id),
    subject: String(data.subject ?? ''),
    description: data.description ? String(data.description) : null,
    category: data.category ? String(data.category) : null,
    priority: String(data.priority ?? 'medium'),
    status: String(data.status ?? 'open'),
    createdAt: data.created_at ? String(data.created_at) : null,
    updatedAt: data.updated_at ? String(data.updated_at) : null,
  };
}

/** Create a new support ticket owned by the given user. Returns the new id. */
export async function createSupportTicket(
  client: SupabaseClient,
  input: {
    userId: string;
    subject: string;
    description?: string;
    category?: string;
    priority?: string;
  },
): Promise<{ id: string }> {
  const { data, error } = await client
    .from('support_tickets')
    .insert({
      recipient_user_id: input.userId,
      subject: input.subject.trim(),
      description: input.description?.trim() || null,
      category: input.category?.trim() || null,
      priority: input.priority || 'medium',
      status: 'open',
    })
    .select('id')
    .single();
  if (error) throw error;
  return { id: String(data.id) };
}

/** Fetch all messages for a ticket (RLS restricts to the ticket owner). */
export async function fetchTicketMessages(
  client: SupabaseClient,
  ticketId: string,
): Promise<SupportMessage[]> {
  const { data, error } = await client
    .from('ticket_messages')
    .select('id, ticket_id, sender_user_id, message, created_at')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });
  if (error) {
    if (isMissingRelationError(error)) return [];
    throw error;
  }
  return ((data ?? []) as any[]).map((r) => ({
    id: String(r.id),
    ticketId: String(r.ticket_id),
    senderUserId: r.sender_user_id ? String(r.sender_user_id) : null,
    message: String(r.message ?? ''),
    createdAt: r.created_at ? String(r.created_at) : null,
  }));
}

/** Append a message from the signed-in user to a ticket. */
export async function createTicketMessage(
  client: SupabaseClient,
  input: { ticketId: string; userId: string; message: string },
): Promise<SupportMessage> {
  const { data, error } = await client
    .from('ticket_messages')
    .insert({
      ticket_id: input.ticketId,
      sender_user_id: input.userId,
      message: input.message.trim(),
    })
    .select('id, ticket_id, sender_user_id, message, created_at')
    .single();
  if (error) throw error;
  return {
    id: String(data.id),
    ticketId: String(data.ticket_id),
    senderUserId: data.sender_user_id ? String(data.sender_user_id) : null,
    message: String(data.message ?? ''),
    createdAt: data.created_at ? String(data.created_at) : null,
  };
}
