import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import adminLibrary, {
  loadLibraryResources,
} from "../netlify/functions/admin-library.mts";
import {
  createLibraryResource,
  deleteLibraryResource,
  setLibraryResourceAssignment,
  updateLibraryResource,
} from "../netlify/functions/admin-action.mts";

const context = {} as never;
const resourceId = "00000000-0000-4000-8000-000000000021";
const clientId = "00000000-0000-4000-8000-000000000022";
const resource = {
  title: "Training warm-up",
  kind: "training" as const,
  url: "https://resources.example.org/warm-up",
};

function writeClient(result: { data: unknown; error: object | null }) {
  const builder = {
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    upsert: vi.fn(),
    eq: vi.fn(),
    select: vi.fn(),
    single: vi.fn(async () => result),
    maybeSingle: vi.fn(async () => result),
  };
  builder.insert.mockReturnValue(builder);
  builder.update.mockReturnValue(builder);
  builder.delete.mockReturnValue(builder);
  builder.upsert.mockReturnValue(builder);
  builder.eq.mockReturnValue(builder);
  builder.select.mockReturnValue(builder);
  const client = {
    from: vi.fn(() => builder),
  } as unknown as SupabaseClient;
  return { client, builder };
}

describe("Coach OS resource library", () => {
  it("keeps the library read boundary coach-only", async () => {
    const response = await adminLibrary(
      new Request("https://coach.example/.netlify/functions/admin-library"),
      context
    );
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Sign in is required.",
    });
  });

  it("paginates past the first 500 resources instead of silently truncating", async () => {
    const firstPage = Array.from({ length: 500 }, (_, index) => ({
      id: `resource-${index}`,
      title: `Resource ${index}`,
      kind: "guide",
      url: `https://resources.example.org/${index}`,
      updated_at: "2026-07-12T20:00:00.000Z",
      assignments: [],
    }));
    const lastPage = [
      {
        id: "resource-500",
        title: "Resource 500",
        kind: "guide",
        url: "https://resources.example.org/500",
        updated_at: "2026-07-12T20:00:00.000Z",
        assignments: [],
      },
    ];
    const builder = {
      select: vi.fn(),
      order: vi.fn(),
      range: vi.fn(async (from: number) => ({
        data: from === 0 ? firstPage : lastPage,
        error: null,
      })),
    };
    builder.select.mockReturnValue(builder);
    builder.order.mockReturnValue(builder);
    const client = {
      from: vi.fn(() => builder),
    } as unknown as SupabaseClient;

    await expect(loadLibraryResources(client)).resolves.toHaveLength(501);
    expect(builder.range).toHaveBeenNthCalledWith(1, 0, 499);
    expect(builder.range).toHaveBeenNthCalledWith(2, 500, 999);
  });

  it("creates a validated URL resource and confirms its identifier", async () => {
    const fake = writeClient({ data: { id: resourceId }, error: null });
    await expect(createLibraryResource(fake.client, resource)).resolves.toBe(
      resourceId
    );
    expect(fake.builder.insert).toHaveBeenCalledWith(resource);
  });

  it("rejects a stale optimistic update", async () => {
    const fake = writeClient({ data: null, error: null });
    await expect(
      updateLibraryResource(fake.client, {
        kind: "update-resource",
        resourceId,
        expectedUpdatedAt: "2026-07-12T20:00:00.000Z",
        resource,
      })
    ).rejects.toMatchObject({ status: 409 });
    expect(fake.builder.eq).toHaveBeenCalledWith("id", resourceId);
    expect(fake.builder.eq).toHaveBeenCalledWith(
      "updated_at",
      "2026-07-12T20:00:00.000Z"
    );
  });

  it("deletes resources and sets composite client assignments", async () => {
    const deletion = writeClient({ data: { id: resourceId }, error: null });
    await expect(
      deleteLibraryResource(deletion.client, resourceId)
    ).resolves.toBeUndefined();

    const assignment = writeClient({
      data: { resource_id: resourceId },
      error: null,
    });
    await expect(
      setLibraryResourceAssignment(
        assignment.client,
        resourceId,
        clientId,
        true
      )
    ).resolves.toBeUndefined();
    expect(assignment.builder.upsert).toHaveBeenCalledWith(
      { client_id: clientId, resource_id: resourceId },
      { onConflict: "client_id,resource_id" }
    );
  });
});
