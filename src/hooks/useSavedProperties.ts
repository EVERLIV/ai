import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const STORAGE_KEY = "saved_properties";

function readSavedIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

function writeSavedIds(ids: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function useSavedProperties(propertyId?: string) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [savedIds, setSavedIds] = useState<string[]>(() => readSavedIds());

  useEffect(() => {
    const sync = () => setSavedIds(readSavedIds());
    window.addEventListener("storage", sync);
    window.addEventListener("saved-properties-changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("saved-properties-changed", sync);
    };
  }, []);

  const isSaved = useCallback(
    (id: string) => savedIds.includes(id),
    [savedIds],
  );

  const toggleSaved = useCallback(
    (id: string, options?: { requireAuth?: boolean }) => {
      const requireAuth = options?.requireAuth ?? true;
      if (requireAuth && !user) {
        navigate(
          `/auth?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`,
        );
        return false;
      }
      const current = readSavedIds();
      const next = current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id];
      writeSavedIds(next);
      setSavedIds(next);
      window.dispatchEvent(new CustomEvent("saved-properties-changed"));
      return next.includes(id);
    },
    [navigate, user],
  );

  const saved = propertyId ? isSaved(propertyId) : false;

  return { savedIds, isSaved, toggleSaved, saved };
}
