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

type PickCriteria = {
  deal: string;
  type: string;
  activity: string;
  district: string;
  budget_min: number | null;
  budget_max: number | null;
  area_min: number | null;
  area_max: number | null;
  property_class: string;
  condition: string;
  features: string[];
  notes: string;
};

type PropertyLite = {
  id: string;
  type: string;
  deal_type: string;
  district: string;
  address: string;
  price: number;
  price_per_m2: number;
  area: number;
  class: string;
  condition: string | null;
  features: string[] | null;
  floor: string | null;
  total_floors: string | null;
  ceiling_height: number | null;
};

const SELF_HOSTED_URL = "https://api.arendacity.com/functions/v1/ai-property-pick";

const ANON_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc4ODQyOTQwLCJleHAiOjE5MzY1MjI5NDB9.uK1BksB1rl0vNAlUc2nVpkqECeiWD9CKx0rIfHUlyWA";

function pickEndpoint(): string {
  return import.meta.env.VITE_PROPERTY_PICK_API_URL || SELF_HOSTED_URL;
}

/** ИИ-подбор через self-hosted Supabase (api.arendacity.com). */
export async function invokePropertyPick(
  criteria: PickCriteria,
  properties: PropertyLite[],
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
    body: JSON.stringify({ criteria, properties }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data.error || data.msg || `Ошибка ИИ-сервиса (${resp.status})`);
  }
  if (data?.error) throw new Error(data.error);
  if (data?.msg?.includes?.("InvalidWorkerCreation") || data?.msg?.includes?.("entrypoint")) {
    throw new Error(data.msg);
  }
  if (!data?.picks) throw new Error("ИИ не вернул результаты подбора");

  return data as AIResponse;
}
