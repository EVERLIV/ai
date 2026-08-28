import { ArrowDown, ArrowUp, ArrowUpDown, Search, Settings2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminColumnDef } from "@/hooks/useAdminTableState";
import type { SortDir } from "@/lib/adminTableSort";
import { cn } from "@/lib/utils";

type Props<T extends string> = {
  title: string;
  count: number;
  totalCount?: number;
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  columns: AdminColumnDef<T>[];
  visibleCols: Set<T>;
  onToggleCol: (key: T) => void;
  sortField: string | null;
  sortDir: SortDir;
  onSort: (field: string) => void;
  isLoading?: boolean;
  isFetching?: boolean;
  emptyMessage?: string;
  toolbarExtra?: ReactNode;
  children: ReactNode;
  colSpan?: number;
};

export function SortIcon({
  field,
  sortField,
  sortDir,
}: {
  field: string;
  sortField: string | null;
  sortDir: SortDir;
}) {
  if (sortField !== field)
    return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
  return sortDir === "asc" ? (
    <ArrowUp className="w-3 h-3 ml-1" />
  ) : (
    <ArrowDown className="w-3 h-3 ml-1" />
  );
}

export function AdminDataTable<T extends string>({
  title,
  count,
  totalCount,
  search,
  onSearchChange,
  searchPlaceholder = "Поиск…",
  columns,
  visibleCols,
  onToggleCol,
  sortField,
  sortDir,
  onSort,
  isLoading,
  emptyMessage = "Нет записей",
  toolbarExtra,
  children,
  colSpan,
}: Props<T>) {
  const span = colSpan ?? visibleCols.size;

  return (
    <Card>
      <CardHeader className="py-3 px-4 flex-row items-center justify-between gap-3 flex-wrap">
        <CardTitle className="text-sm font-medium">
          {title}
          <span className="text-muted-foreground font-normal ml-1">
            ({count}
            {totalCount != null && totalCount !== count
              ? ` из ${totalCount}`
              : ""}
            )
          </span>
        </CardTitle>
        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {toolbarExtra}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-8 h-8 text-xs"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                <Settings2 className="w-3.5 h-3.5" /> Столбцы
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 max-h-80 overflow-y-auto"
            >
              {columns
                .filter((c) => c.key !== ("actions" as T))
                .map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.key}
                    checked={visibleCols.has(col.key)}
                    onCheckedChange={() => onToggleCol(col.key)}
                  >
                    {col.label}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">{children}</div>
      </CardContent>
    </Card>
  );
}

export function AdminTableHead({
  label,
  field,
  sortable,
  sortField,
  sortDir,
  onSort,
  className,
}: {
  label: string;
  field?: string;
  sortable?: boolean;
  sortField: string | null;
  sortDir: SortDir;
  onSort: (field: string) => void;
  className?: string;
}) {
  if (!sortable || !field) {
    return <TableHead className={cn("text-xs", className)}>{label}</TableHead>;
  }
  return (
    <TableHead
      className={cn(
        "cursor-pointer select-none text-xs whitespace-nowrap",
        className,
      )}
      onClick={() => onSort(field)}
    >
      <span className="flex items-center">
        {label}
        <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
      </span>
    </TableHead>
  );
}

export function AdminTableLoadingRow({
  colSpan,
}: {
  colSpan: number;
}) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="text-center py-8 text-sm text-muted-foreground"
      >
        Загрузка...
      </TableCell>
    </TableRow>
  );
}

export function AdminTableEmptyRow({
  colSpan,
  message,
}: {
  colSpan: number;
  message: string;
}) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="text-center py-8 text-sm text-muted-foreground"
      >
        {message}
      </TableCell>
    </TableRow>
  );
}

export {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
};
