import type { SmartPickCriteria, SmartPickLite } from "@/lib/smartPick";
import { getEdgeFunctionUrl } from "@/lib/edgeFunctions";

export type AIPick = {
  id: string;
  fit_score: number;
  reason: string;
  highlights: string[];
};

export type AIResponse = {
  summary: string;
  picks: AIPick[];
};

const SELF_HOSTED_URL = getEdgeFunctionUrl(
  "ai-property-pick",
  "VITE_PROPERTY_PICK_API_URL",
);

const ANON_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc4ODQyOTQwLCJleHAiOjE5MzY1MjI5NDB9.uK1BksB1rl0vNAlUc2nVpkqECeiWD9CKx0rIfHUlyWA";

function pickEndpoint(): string {
  return SELF_HOSTED_URL;
}

export function criteriaToApiPayload(criteria: SmartPickCriteria) {
  return {
    catalog: criteria.catalog,
    deal: criteria.deal,
    type: criteria.type,
    activity: criteria.activity,
    location: criteria.location,
    district: criteria.location,
    budget_min: criteria.budgetMin,
    budget_max: criteria.budgetMax,
    area_min: criteria.areaMin,
    area_max: criteria.areaMax,
    rooms: criteria.rooms,
    market: criteria.market,
    property_class: criteria.propertyClass,
    condition: criteria.condition,
    features: criteria.features,
    notes: criteria.notes,
  };
}

/** Умный подбор через self-hosted Supabase (api.arendacity.com). */
export async function invokePropertyPick(
  criteria: SmartPickCriteria,
  properties: SmartPickLite[],
): Promise<AIResponse> {
  const url = pickEndpoint();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: ANON_KEY,
    Authorization: `Bearer ${ANON_KEY}`,
  };

  const resp = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      criteria: criteriaToApiPayload(criteria),
      properties,
    }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(
      data.error || data.msg || `Ошибка сервиса подбора (${resp.status})`,
    );
  }
  if (data?.error) throw new Error(data.error);
  if (
    data?.msg?.includes?.("InvalidWorkerCreation") ||
    data?.msg?.includes?.("entrypoint")
  ) {
    throw new Error(data.msg);
  }
  if (!data?.picks) throw new Error("Сервис подбора не вернул результаты");

  return data as AIResponse;
}
