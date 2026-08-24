import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  COMPARE_CHANGED_EVENT,
  COMPARE_MAX,
  type ComparePropertyInput,
  type CompareStoredState,
  emptyCompareState,
  getCompareCategoryKey,
  getCompareCategoryLabel,
  readCompareState,
  writeCompareState,
} from "@/lib/propertyCompare";

export type ToggleCompareResult =
  | { ok: true; inCompare: boolean }
  | { ok: false; reason: "auth" | "category" | "full" };

export function useCompareProperties(propertyId?: string) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<CompareStoredState>(() =>
    readCompareState(),
  );

  useEffect(() => {
    const sync = () => setState(readCompareState());
    window.addEventListener("storage", sync);
    window.addEventListener(COMPARE_CHANGED_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(COMPARE_CHANGED_EVENT, sync);
    };
  }, []);

  const isCompared = useCallback(
    (id: string) => state.ids.includes(id),
    [state.ids],
  );

  const removeFromCompare = useCallback((id: string) => {
    const current = readCompareState();
    const ids = current.ids.filter((x) => x !== id);
    const next =
      ids.length === 0
        ? emptyCompareState()
        : { ...current, ids };
    writeCompareState(next);
    setState(next);
  }, []);

  const clearCompare = useCallback(() => {
    const next = emptyCompareState();
    writeCompareState(next);
    setState(next);
  }, []);

  const toggleCompare = useCallback(
    (property: ComparePropertyInput): ToggleCompareResult => {
      if (!user) {
        navigate(
          `/auth?redirect=${encodeURIComponent(
            window.location.pathname + window.location.search,
          )}`,
        );
        return { ok: false, reason: "auth" };
      }

      const current = readCompareState();
      const id = property.id;

      if (current.ids.includes(id)) {
        const ids = current.ids.filter((x) => x !== id);
        const next =
          ids.length === 0 ? emptyCompareState() : { ...current, ids };
        writeCompareState(next);
        setState(next);
        toast("Убрано из сравнения");
        return { ok: true, inCompare: false };
      }

      const categoryKey = getCompareCategoryKey(property);
      const categoryLabel = getCompareCategoryLabel(property);

      if (current.ids.length > 0 && current.categoryKey !== categoryKey) {
        toast.error("Сравнивать можно только объекты одной категории", {
          description: `Сейчас в сравнении: ${current.categoryLabel || "другая категория"}`,
        });
        return { ok: false, reason: "category" };
      }

      if (current.ids.length >= COMPARE_MAX) {
        toast.error(`Можно сравнить не более ${COMPARE_MAX} объектов`);
        return { ok: false, reason: "full" };
      }

      const next: CompareStoredState = {
        categoryKey,
        categoryLabel,
        ids: [...current.ids, id],
      };
      writeCompareState(next);
      setState(next);
      toast.success("Добавлено к сравнению", {
        description:
          next.ids.length >= 2
            ? `${next.ids.length} объекта · ${categoryLabel}`
            : `Добавьте ещё объекты категории «${categoryLabel}»`,
        action:
          next.ids.length >= 2
            ? {
                label: "Сравнить",
                onClick: () => navigate("/compare"),
              }
            : undefined,
      });
      return { ok: true, inCompare: true };
    },
    [navigate, user],
  );

  const inCompare = propertyId ? isCompared(propertyId) : false;

  return {
    compareIds: state.ids,
    categoryLabel: state.categoryLabel,
    categoryKey: state.categoryKey,
    count: state.ids.length,
    isCompared,
    inCompare,
    toggleCompare,
    removeFromCompare,
    clearCompare,
    max: COMPARE_MAX,
  };
}
