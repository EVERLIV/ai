import {
  Check,
  Eye,
  EyeOff,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  DICTIONARY_CATEGORIES,
  type DictionaryItem,
  useDictionaries,
} from "@/hooks/useDictionaries";

const PROPERTY_TYPE_PARENTS = [
  { value: "commercial", label: "Коммерческая" },
  { value: "residential", label: "Жилая" },
  { value: "land", label: "Земля" },
] as const;

function isPropertyTypeCategory(key: string) {
  return key === "property_type";
}

function propertyTypeParentLabel(parent: string | null | undefined): string {
  const key = (parent || "").trim().toLowerCase();
  if (key === "residential") return "Жилая";
  if (key === "land" || key === "земля") return "Земля";
  if (key === "commercial" || !key) return "Коммерческая";
  return parent || "—";
}

function normalizePropertyTypeParent(raw: string): string {
  const key = raw.trim().toLowerCase();
  if (key === "residential" || key === "жилая") return "residential";
  if (key === "land" || key === "земля") return "land";
  return "commercial";
}

function ParentField({
  categoryKey,
  value,
  onChange,
  className,
}: {
  categoryKey: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  if (isPropertyTypeCategory(categoryKey)) {
    return (
      <select
        className={
          className ||
          "h-8 text-xs w-36 rounded-md border border-input bg-background px-2"
        }
        value={normalizePropertyTypeParent(value)}
        onChange={(e) => onChange(e.target.value)}
      >
        {PROPERTY_TYPE_PARENTS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
    );
  }
  return (
    <Input
      className={className || "h-8 text-xs w-32"}
      placeholder="Город / группа"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export default function DictionariesTab() {
  const [activeCategory, setActiveCategory] = useState(
    DICTIONARY_CATEGORIES[0].key,
  );
  const categoryMeta = DICTIONARY_CATEGORIES.find(
    (c) => c.key === activeCategory,
  )!;
  const { items, isLoading, add, update, remove, isAdding } =
    useDictionaries(activeCategory);
  const { toast } = useToast();

  const [newValue, setNewValue] = useState("");
  const [newParent, setNewParent] = useState(
    isPropertyTypeCategory(DICTIONARY_CATEGORIES[0].key) ? "commercial" : "",
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editParent, setEditParent] = useState("");

  const maxOrder =
    items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) : 0;

  const handleAdd = async () => {
    const trimmed = newValue.trim();
    if (!trimmed) return;
    try {
      let parent: string | undefined;
      if (categoryMeta.hasParent) {
        parent = isPropertyTypeCategory(activeCategory)
          ? normalizePropertyTypeParent(newParent)
          : newParent.trim() || undefined;
      }
      await add({
        category: activeCategory,
        value: trimmed,
        parent,
        sort_order: maxOrder + 1,
      });
      setNewValue("");
      setNewParent(
        isPropertyTypeCategory(activeCategory) ? "commercial" : "",
      );
      toast({ title: "Добавлено" });
    } catch (err: unknown) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось добавить",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async (item: DictionaryItem) => {
    const trimmed = editValue.trim();
    if (!trimmed) return;
    try {
      let parent: string | null = item.parent;
      if (categoryMeta.hasParent) {
        parent = isPropertyTypeCategory(activeCategory)
          ? normalizePropertyTypeParent(editParent)
          : editParent.trim() || null;
      }
      await update({
        id: item.id,
        value: trimmed,
        parent,
      });
      setEditingId(null);
      toast({ title: "Обновлено" });
    } catch (err: unknown) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось обновить",
        variant: "destructive",
      });
    }
  };

  const handleToggle = async (item: DictionaryItem) => {
    try {
      await update({ id: item.id, is_active: !item.is_active });
    } catch {
      toast({ title: "Ошибка", variant: "destructive" });
    }
  };

  const handleDelete = async (item: DictionaryItem) => {
    if (!confirm(`Удалить «${item.value}»?`)) return;
    try {
      await remove(item.id);
      toast({ title: "Удалено" });
    } catch (err: unknown) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось удалить",
        variant: "destructive",
      });
    }
  };

  const startEdit = (item: DictionaryItem) => {
    setEditingId(item.id);
    setEditValue(item.value);
    setEditParent(
      isPropertyTypeCategory(activeCategory)
        ? normalizePropertyTypeParent(item.parent || "")
        : item.parent || "",
    );
  };

  const parentGroups = categoryMeta.hasParent
    ? (Array.from(
        new Set(items.map((i) => i.parent).filter(Boolean)),
      ) as string[])
    : [];

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Справочники</h2>

      <div className="flex flex-wrap gap-1.5">
        {DICTIONARY_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => {
              setActiveCategory(cat.key);
              setEditingId(null);
              setNewValue("");
              setNewParent(
                isPropertyTypeCategory(cat.key) ? "commercial" : "",
              );
            }}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              activeCategory === cat.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border hover:border-primary/40"
            }`}
          >
            {cat.title}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium">
            {categoryMeta.title} ({items.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex items-center gap-2 px-4 py-2 border-b bg-muted/30">
            {categoryMeta.hasParent && (
              <ParentField
                categoryKey={activeCategory}
                value={newParent}
                onChange={setNewParent}
              />
            )}
            <Input
              className="h-8 text-xs flex-1"
              placeholder="Новое значение..."
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={handleAdd}
              disabled={isAdding || !newValue.trim()}
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Добавить
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Загрузка...
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Нет записей
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  {categoryMeta.hasParent && (
                    <TableHead className="w-36">
                      {isPropertyTypeCategory(activeCategory)
                        ? "Сегмент"
                        : "Группа"}
                    </TableHead>
                  )}
                  <TableHead>Значение</TableHead>
                  <TableHead className="w-20">Статус</TableHead>
                  <TableHead className="w-24 text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(categoryMeta.hasParent
                  ? sortByParent(items, parentGroups)
                  : items
                ).map((item, idx) => (
                  <TableRow
                    key={item.id}
                    className={!item.is_active ? "opacity-50" : ""}
                  >
                    <TableCell className="text-xs text-muted-foreground">
                      <GripVertical className="w-3 h-3 inline mr-1 opacity-30" />
                      {idx + 1}
                    </TableCell>
                    {categoryMeta.hasParent && (
                      <TableCell className="text-xs">
                        {editingId === item.id ? (
                          <ParentField
                            categoryKey={activeCategory}
                            value={editParent}
                            onChange={setEditParent}
                            className="h-7 text-xs w-32 rounded-md border border-input bg-background px-2"
                          />
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            {isPropertyTypeCategory(activeCategory)
                              ? propertyTypeParentLabel(item.parent)
                              : item.parent || "—"}
                          </Badge>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="text-xs">
                      {editingId === item.id ? (
                        <div className="flex items-center gap-1">
                          <Input
                            className="h-7 text-xs flex-1"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleUpdate(item);
                              if (e.key === "Escape") setEditingId(null);
                            }}
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleUpdate(item)}
                          >
                            <Check className="w-3.5 h-3.5 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <span
                          className="cursor-pointer hover:text-primary"
                          onClick={() => startEdit(item)}
                        >
                          {item.value}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleToggle(item)}
                        className="text-xs"
                      >
                        {item.is_active ? (
                          <Badge
                            variant="default"
                            className="text-[10px] cursor-pointer"
                          >
                            <Eye className="w-3 h-3 mr-0.5" />
                            Вкл
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] cursor-pointer"
                          >
                            <EyeOff className="w-3 h-3 mr-0.5" />
                            Выкл
                          </Badge>
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => startEdit(item)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleDelete(item)}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function sortByParent(
  items: DictionaryItem[],
  groups: string[],
): DictionaryItem[] {
  const result: DictionaryItem[] = [];
  const noParent = items.filter((i) => !i.parent);
  result.push(...noParent);
  for (const g of groups) {
    result.push(...items.filter((i) => i.parent === g));
  }
  return result;
}
