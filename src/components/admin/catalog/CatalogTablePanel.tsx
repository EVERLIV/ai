import { Eye, EyeOff, Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import { AdminTableHead } from "@/components/admin/AdminDataTable";
import { formatParentLabel } from "@/components/admin/catalog/CatalogItemForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DictionaryItem } from "@/hooks/useDictionaries";
import {
  compareDates,
  compareValues,
  nextSortState,
  type SortDir,
} from "@/lib/adminTableSort";
import { getCatalogCategory } from "@/lib/catalogRegistry";

type Props = {
  category: string;
  items: DictionaryItem[];
  onEdit: (item: DictionaryItem) => void;
  onToggleActive: (item: DictionaryItem) => void;
};

export default function CatalogTablePanel({
  category,
  items,
  onEdit,
  onToggleActive,
}: Props) {
  const cat = getCatalogCategory(category);
  const hasParent = cat?.hasParent ?? false;
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (field: string) => {
    const next = nextSortState(sortField, sortDir, field);
    setSortField(next.field);
    setSortDir(next.dir);
  };

  const sorted = useMemo(() => {
    if (!sortField) return items;
    return [...items].sort((a, b) => {
      if (sortField === "updated_at") {
        return compareDates(a.updated_at, b.updated_at, sortDir);
      }
      if (sortField === "sort_order") {
        return compareValues(a.sort_order, b.sort_order, sortDir);
      }
      return compareValues(
        (a as Record<string, unknown>)[sortField],
        (b as Record<string, unknown>)[sortField],
        sortDir,
      );
    });
  }, [items, sortField, sortDir]);

  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Нет записей
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <AdminTableHead
            label="#"
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
            className="w-12"
            sortable={false}
          />
          {hasParent && (
            <AdminTableHead
              label={cat?.parentLabel ?? "Группа"}
              field="parent"
              sortable
              sortField={sortField}
              sortDir={sortDir}
              onSort={handleSort}
              className="w-36"
            />
          )}
          <AdminTableHead
            label="Значение"
            field="value"
            sortable
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
          />
          <AdminTableHead
            label="Порядок"
            field="sort_order"
            sortable
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
            className="w-24"
          />
          <AdminTableHead
            label="Обновлено"
            field="updated_at"
            sortable
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
            className="w-28"
          />
          <AdminTableHead
            label="Статус"
            field="is_active"
            sortable
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
            className="w-24"
          />
          <AdminTableHead
            label="Действия"
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
            className="w-20 text-right"
          />
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((item, idx) => (
          <TableRow
            key={item.id}
            className={!item.is_active ? "opacity-50" : undefined}
          >
            <TableCell className="text-xs text-muted-foreground py-1.5">
              {idx + 1}
            </TableCell>
            {hasParent && (
              <TableCell className="text-xs py-1.5">
                <Badge variant="outline" className="text-[10px]">
                  {formatParentLabel(category, item.parent)}
                </Badge>
              </TableCell>
            )}
            <TableCell className="py-1.5">
              <button
                type="button"
                className="text-sm text-left hover:text-primary"
                onClick={() => onEdit(item)}
              >
                {item.value}
                {item.label && item.label !== item.value && (
                  <span className="text-muted-foreground text-xs ml-1">
                    ({item.label})
                  </span>
                )}
              </button>
            </TableCell>
            <TableCell className="text-xs py-1.5">{item.sort_order}</TableCell>
            <TableCell className="text-xs py-1.5 whitespace-nowrap">
              {item.updated_at
                ? new Date(item.updated_at).toLocaleDateString("ru-RU")
                : "—"}
            </TableCell>
            <TableCell className="py-1.5">
              <button type="button" onClick={() => onToggleActive(item)}>
                {item.is_active ? (
                  <Badge variant="default" className="text-[10px] cursor-pointer">
                    <Eye className="w-3 h-3 mr-0.5" />
                    Вкл
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] cursor-pointer">
                    <EyeOff className="w-3 h-3 mr-0.5" />
                    Выкл
                  </Badge>
                )}
              </button>
            </TableCell>
            <TableCell className="text-right py-1.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onEdit(item)}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
