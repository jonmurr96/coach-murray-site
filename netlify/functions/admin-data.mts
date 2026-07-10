import type { Context } from "@netlify/functions";
import type { AdminPayload } from "../../shared/contracts";
import {
  centsToUnits,
  errorResponse,
  getSupabaseAdmin,
  HttpError,
  json,
  requireCoach,
  requireMethod,
} from "./_shared.mts";

export default async function handler(request: Request, _context: Context) {
  try {
    requireMethod(request, "GET");
    const coach = await requireCoach(request);
    const supabase = getSupabaseAdmin();
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const [
      clientsResult,
      checkInsResult,
      messagesResult,
      leadsResult,
      programsResult,
      paymentsResult,
    ] = await Promise.all([
      supabase
        .from("client_profiles")
        .select(
          "id,first_name,last_name,email,primary_goal,status,week_number,total_weeks,adherence,last_active_at"
        )
        .order("last_name")
        .limit(500),
      supabase
        .from("check_ins")
        .select("id,client_id,submitted_at,adherence,energy,reviewed_at")
        .order("submitted_at", { ascending: false })
        .limit(100),
      supabase
        .from("messages")
        .select("id,client_id,body,sent_at,read_at")
        .eq("sender_role", "client")
        .order("sent_at", { ascending: false })
        .limit(100),
      supabase
        .from("leads")
        .select("id,first_name,last_name,email,source,status,created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("programs")
        .select("id,client_id,title,status,updated_at")
        .order("updated_at", { ascending: false })
        .limit(200),
      supabase
        .from("purchases")
        .select("id,email,amount_total,currency,payment_status,purchased_at")
        .gte("purchased_at", monthStart.toISOString())
        .order("purchased_at", { ascending: false })
        .limit(500),
    ]);
    const failure = [
      clientsResult,
      checkInsResult,
      messagesResult,
      leadsResult,
      programsResult,
      paymentsResult,
    ].find(result => result.error);
    if (failure?.error)
      throw new HttpError(500, "Coach OS data could not be loaded.");

    const clients = clientsResult.data ?? [];
    const clientMap = new Map(
      clients.map(client => [
        client.id,
        `${client.first_name} ${client.last_name}`.trim(),
      ])
    );
    const emailMap = new Map(
      clients.map(client => [
        client.email.toLowerCase(),
        `${client.first_name} ${client.last_name}`.trim(),
      ])
    );
    const checkIns = checkInsResult.data ?? [];
    const messages = messagesResult.data ?? [];
    const programs = programsResult.data ?? [];
    const payments = paymentsResult.data ?? [];
    const payload: AdminPayload = {
      preview: false,
      coach: {
        firstName: String(coach.user_metadata?.first_name ?? "Coach"),
        role: String(coach.app_metadata?.role ?? "coach"),
      },
      metrics: {
        activeClients: clients.filter(client => client.status === "active")
          .length,
        pendingPlans: clients.filter(client => client.status === "plan pending")
          .length,
        dueCheckIns: clients.filter(client => client.status === "check-in due")
          .length,
        unreadMessages: messages.filter(message => !message.read_at).length,
        monthlyRevenue: payments
          .filter(payment => payment.payment_status === "paid")
          .reduce(
            (sum, payment) => sum + centsToUnits(payment.amount_total),
            0
          ),
      },
      clients: clients.map(client => ({
        id: client.id,
        name: `${client.first_name} ${client.last_name}`.trim(),
        email: client.email,
        goal: client.primary_goal ?? "Not set",
        status: client.status,
        weekNumber: client.week_number ?? 0,
        totalWeeks: client.total_weeks ?? 12,
        adherence: client.adherence ?? undefined,
        lastActive: client.last_active_at
          ? new Date(client.last_active_at).toLocaleDateString("en-US")
          : undefined,
      })),
      checkIns: checkIns.map(row => ({
        id: row.id,
        clientId: row.client_id,
        clientName: clientMap.get(row.client_id) ?? "Unknown client",
        submittedAt: row.submitted_at,
        adherence: row.adherence,
        energy: row.energy,
        reviewed: Boolean(row.reviewed_at),
      })),
      messages: messages.map(row => ({
        id: row.id,
        clientId: row.client_id,
        clientName: clientMap.get(row.client_id) ?? "Unknown client",
        body: row.body,
        sentAt: row.sent_at,
        read: Boolean(row.read_at),
      })),
      leads: (leadsResult.data ?? []).map(row => ({
        id: row.id,
        name:
          `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || row.email,
        email: row.email,
        source: row.source ?? "Website",
        status: row.status,
        createdAt: row.created_at,
      })),
      programs: programs.map(row => ({
        id: row.id,
        clientId: row.client_id,
        clientName: clientMap.get(row.client_id) ?? "Unknown client",
        title: row.title,
        status: row.status,
        updatedAt: row.updated_at,
      })),
      payments: payments.map(row => ({
        id: row.id,
        clientName: emailMap.get(row.email.toLowerCase()) ?? row.email,
        amount: centsToUnits(row.amount_total),
        currency: row.currency.toUpperCase(),
        status: row.payment_status,
        createdAt: row.purchased_at,
      })),
    };
    return json(200, payload);
  } catch (error) {
    return errorResponse(error);
  }
}
