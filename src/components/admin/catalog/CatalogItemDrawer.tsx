import { Loader2, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import CatalogItemForm, {
  type CatalogFormState,
  emptyCatalogForm,
  formToInsert,
  itemToForm,
} from "@/components/admin/catalog/CatalogItemForm";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { DictionaryItem } from "@/hooks/useDictionaries";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: string;
  item: DictionaryItem | null;
  initialForm?: Partial<CatalogFormState>;
  parentOptions?: DictionaryItem[];
  maxSortOrder: number;
  onSave: (payload: ReturnType<typeof formToInsert>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  isSaving?: boolean;
};

export default function CatalogItemDrawer({
  open,
  onOpenChange,
  category,
  item,
  initialForm,
  parentOptions,
  maxSortOrder,
  onSave,
  onDelete,
  isSaving,
}: Props) {
  const [form, setForm] = useState<CatalogFormState>(() =>
    item
      ? itemToForm(item)
      : emptyCatalogForm({
          sort_order: maxSortOrder + 1,
          ...initialForm,
        }),
  );

  useEffect(() => {
    if (!open) return;
    setForm(
      item
        ? itemToForm(item)
        : emptyCatalogForm({
            sort_order: maxSortOrder + 1,
            ...initialForm,
          }),
    );
  }, [open, item, maxSortOrder, initialForm]);

  const handleSave = async () => {
    if (!form.value.trim()) return;
    await onSave(formToInsert(category, form));
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!item || !onDelete) return;
    if (!confirm(`Удалить «${item.value}»?`)) return;
    await onDelete(item.id);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {item ? `Редактировать: ${item.value}` : "Новая запись"}
          </SheetTitle>
          {item && (
            <p className="text-xs text-muted-foreground">
              Создано: {formatTs(item.created_at)}
              {item.updated_at
                ? ` · Обновлено: ${formatTs(item.updated_at)}`
                : ""}
            </p>
          )}
        </SheetHeader>

        <div className="mt-6">
          <CatalogItemForm
            category={category}
            form={form}
            onChange={setForm}
            parentOptions={parentOptions}
          />
        </div>

        <SheetFooter className="mt-6 flex-row gap-2 sm:justify-between">
          {item && onDelete ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isSaving}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Удалить
            </Button>
          ) : (
            <span />
          )}
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !form.value.trim()}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-1" />
            )}
            Сохранить
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function formatTs(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
