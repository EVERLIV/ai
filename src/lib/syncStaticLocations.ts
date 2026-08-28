import { supabaseAdmin } from "@/integrations/supabase/adminClient";
import {
  getLocationById,
  IRKUTSK_LOCATION_NODES,
  IRKUTSK_REGION_ID,
} from "@/lib/locations";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-z0-9а-я]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parentNameForNode(nodeId: string): string | null {
  const node = getLocationById(nodeId);
  if (!node?.parentId) return null;
  const parent = getLocationById(node.parentId);
  return parent?.name ?? null;
}

export type SyncStaticLocationsResult = {
  inserted: number;
  updated: number;
  parentLinks: number;
};

/**
 * Импорт статического справочника IRKUTSK_LOCATION_NODES в dictionaries (category=district).
 * Двухпроходный: сначала upsert записей, затем parent_id.
 */
export async function syncStaticLocationsToCatalog(): Promise<SyncStaticLocationsResult> {
  const nodes = [...IRKUTSK_LOCATION_NODES];
  const valueToId = new Map<string, string>();
  let inserted = 0;
  let updated = 0;

  const { data: existing, error: loadErr } = await supabaseAdmin.db.select(
    "dictionaries",
    "select=id,value&category=eq.district",
  );
  if (loadErr) {
    throw new Error(
      typeof loadErr === "object" && loadErr && "message" in loadErr
        ? String((loadErr as { message?: string }).message)
        : "Не удалось загрузить справочник локаций",
    );
  }

  for (const row of (existing || []) as { id: string; value: string }[]) {
    valueToId.set(row.value, row.id);
  }

  let sortOrder = 0;
  for (const node of nodes) {
    sortOrder += 1;
    const parentName =
      node.parentId === IRKUTSK_REGION_ID
        ? null
        : parentNameForNode(node.id);

    const payload = {
      category: "district",
      value: node.name,
      label: node.name,
      parent: parentName,
      sort_order: sortOrder,
      is_active: true,
      slug: slugify(node.id.replace(/:/g, "-")),
      metadata: {
        kind: node.kind,
        static_id: node.id,
        ...(node.lat != null ? { lat: node.lat } : {}),
        ...(node.lng != null ? { lng: node.lng } : {}),
        ...(node.aliases?.length ? { aliases: node.aliases } : {}),
      },
    };

    const existingId = valueToId.get(node.name);
    if (existingId) {
      const { error } = await supabaseAdmin.db.update(
        "dictionaries",
        `id=eq.${existingId}`,
        payload,
      );
      if (error) throw new Error("Не удалось обновить локацию");
      updated += 1;
    } else {
      const { data, error } = await supabaseAdmin.db.insert(
        "dictionaries",
        payload,
      );
      if (error) throw new Error("Не удалось добавить локацию");
      if (data?.id) valueToId.set(node.name, data.id);
      inserted += 1;
    }
  }

  let parentLinks = 0;
  for (const node of nodes) {
    if (!node.parentId) continue;
    const parent = getLocationById(node.parentId);
    if (!parent) continue;
    const childId = valueToId.get(node.name);
    const parentId = valueToId.get(parent.name);
    if (!childId || !parentId) continue;

    const { error } = await supabaseAdmin.db.update(
      "dictionaries",
      `id=eq.${childId}`,
      { parent_id: parentId, parent: parent.name },
    );
    if (!error) parentLinks += 1;
  }

  return { inserted, updated, parentLinks };
}
