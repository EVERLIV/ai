import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = "https://api.arendacity.com";
const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc4ODQyOTQwLCJleHAiOjE5MzY1MjI5NDB9.uK1BksB1rl0vNAlUc2nVpkqECeiWD9CKx0rIfHUlyWA";

/** REST GET: если user JWT даёт 401 — повторить с anon (без принудительного signOut). */
const restWithAnonFallback: typeof fetch = async (input, init) => {
  const res = await fetch(input, init);
  const url = String(input);
  const method = (init?.method || "GET").toUpperCase();
  if (res.status !== 401 || !url.includes("/rest/")) return res;

  if (method !== "GET") return res;

  const headers = new Headers(init?.headers);
  headers.set("apikey", SUPABASE_PUBLISHABLE_KEY);
  headers.set("Authorization", `Bearer ${SUPABASE_PUBLISHABLE_KEY}`);
  return fetch(input, { ...init, headers });
};

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      storageKey: "sb-api-auth-token",
    },
    global: { fetch: restWithAnonFallback },
  },
);

const memoryStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const supabasePublic = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: memoryStorage,
      storageKey: "ac-anon-only",
    },
    global: { fetch: restWithAnonFallback },
  },
);
