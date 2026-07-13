import type { Context } from "@netlify/functions";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminLibraryPayload } from "../../shared/contracts";
import {
  errorResponse,
  getSupabaseAdmin,
  HttpError,
  json,
  requireCoach,
  requireMethod,
} from "../lib/shared.mts";

type ResourceRow = {
  id: string;
  title: string;
  kind: AdminLibraryPayload["resources"][number]["kind"];
  url: string;
  updated_at: string;
  assignments: Array<{ client_id: string }> | null;
};

type ClientRow = {
  id: string;
  first_name: string;
  last_name: string;
  status: string;
};

const PAGE_SIZE = 500;
const MAX_ROWS = 20_000;

export async function loadLibraryResources(supabase: SupabaseClient) {
  const rows: ResourceRow[] = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE_SIZE) {
    const result = await supabase
      .from("library_resources")
      .select(
        "id,title,kind,url,updated_at,assignments:client_resources(client_id)"
      )
      .order("title")
      .range(from, from + PAGE_SIZE - 1);
    if (result.error)
      throw new HttpError(500, "The resource library could not be loaded.");
    const page = (result.data ?? []) as ResourceRow[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
  throw new HttpError(500, "The resource library is too large to load safely.");
}

export async function loadLibraryClients(supabase: SupabaseClient) {
  const rows: ClientRow[] = [];
  for (let from = 0; from < MAX_ROWS; from += PAGE_SIZE) {
    const result = await supabase
      .from("client_profiles")
      .select("id,first_name,last_name,status")
      .order("last_name")
      .order("first_name")
      .range(from, from + PAGE_SIZE - 1);
    if (result.error)
      throw new HttpError(500, "The resource library could not be loaded.");
    const page = (result.data ?? []) as ClientRow[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
  throw new HttpError(500, "The client roster is too large to load safely.");
}

export function buildAdminLibraryPayload(
  resources: ResourceRow[],
  clients: ClientRow[]
): AdminLibraryPayload {
  return {
    resources: resources.map(row => ({
      id: row.id,
      title: row.title,
      kind: row.kind,
      url: row.url,
      updatedAt: row.updated_at,
      assignedClientIds: (row.assignments ?? []).map(
        assignment => assignment.client_id
      ),
    })),
    clients: clients.map(row => ({
      id: row.id,
      name: `${row.first_name} ${row.last_name}`.trim(),
      status: row.status,
    })),
  };
}

export default async function handler(request: Request, _context: Context) {
  try {
    requireMethod(request, "GET");
    await requireCoach(request);

    const supabase = getSupabaseAdmin();
    const [resources, clients] = await Promise.all([
      loadLibraryResources(supabase),
      loadLibraryClients(supabase),
    ]);
    const payload = buildAdminLibraryPayload(resources, clients);

    return json(200, payload);
  } catch (error) {
    return errorResponse(error);
  }
}
