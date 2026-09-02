import { Edit, QrCode, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  AdminDataTable,
  AdminTableEmptyRow,
  AdminTableHead,
  AdminTableLoadingRow,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/admin/AdminDataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import PropertyQrBlock from "@/components/property/PropertyQrBlock";
import type { AdminColumnDef } from "@/hooks/useAdminTableState";
import { useAdminTableState } from "@/hooks/useAdminTableState";
import {
  filterProperties,
  sortProperties,
  type DashboardProperty,
} from "@/lib/propertiesAdminSort";
import { getPropertyTypes } from "@/lib/propertyTypes";
import { cn } from "@/lib/utils";

export type PropertyColKey =
  | "photo"
  | "type"
  | "address"
  | "district"
  | "area"
  | "price"
  | "price_per_m2"
  | "deal_type"
  | "floor"
  | "ceiling_height"
  | "parking"
  | "condition"
  | "layout"
  | "deposit"
  | "contract_term"
  | "features"
  | "photos_count"
  | "views_count"
  | "manager"
  | "client"
  | "status"
  | "published_date"
  | "actions";

export const PROPERTY_COLUMNS: AdminColumnDef<PropertyColKey>[] = [
  { key: "photo", label: "Фото", defaultOn: false, sortable: false },
  { key: "type", label: "Тип", defaultOn: true },
  { key: "address", label: "Адрес", defaultOn: true },
  { key: "district", label: "Район", defaultOn: true },
  { key: "area", label: "Площадь", defaultOn: true },
  { key: "price", label: "Цена", defaultOn: true },
  { key: "price_per_m2", label: "₽/м²", defaultOn: false },
  { key: "deal_type", label: "Сделка", defaultOn: true },
  { key: "floor", label: "Этаж", defaultOn: false, sortable: false },
  { key: "ceiling_height", label: "Потолки", defaultOn: false },
  { key: "parking", label: "Парковка", defaultOn: false, sortable: false },
  { key: "condition", label: "Состояние", defaultOn: false, sortable: false },
  { key: "layout", label: "Планировка", defaultOn: false, sortable: false },
  { key: "deposit", label: "Залог", defaultOn: false, sortable: false },
  { key: "contract_term", label: "Срок", defaultOn: false, sortable: false },
  { key: "features", label: "Особенности", defaultOn: false, sortable: false },
  { key: "photos_count", label: "Кол-во фото", defaultOn: false },
  { key: "views_count", label: "Просмотры", defaultOn: false },
  { key: "published_date", label: "Дата", defaultOn: false },
  { key: "manager", label: "Менеджер", defaultOn: true },
  { key: "client", label: "Клиент", defaultOn: true },
  { key: "status", label: "Статус", defaultOn: true },
  { key: "actions", label: "Действия", defaultOn: true, sortable: false },
];

type Props = {
  properties: DashboardProperty[];
  isLoading?: boolean;
  isFetching?: boolean;
  onEdit: (p: DashboardProperty) => void;
  onDelete: (id: string) => void;
  highlightId?: string | null;
};

export default function PropertiesAdminTable({
  properties,
  isLoading,
  isFetching,
  onEdit,
  onDelete,
}: Props) {
  const table = useAdminTableState<PropertyColKey>(
    "admin-properties-cols",
    PROPERTY_COLUMNS,
  );

  const rows = useMemo(() => {
    const filtered = filterProperties(properties, table.search);
    return sortProperties(filtered, table.sortField, table.sortDir);
  }, [properties, table.search, table.sortField, table.sortDir]);

  const colSpan = table.visibleCols.size;

  return (
    <AdminDataTable
      title="Список объектов"
      count={rows.length}
      totalCount={properties.length}
      search={table.search}
      onSearchChange={table.setSearch}
      searchPlaceholder="Поиск по адресу, району, типу..."
      columns={PROPERTY_COLUMNS}
      visibleCols={table.visibleCols}
      onToggleCol={table.toggleCol}
      sortField={table.sortField}
      sortDir={table.sortDir}
      onSort={table.handleSort}
      isLoading={isLoading}
      isFetching={isFetching}
      colSpan={colSpan}
    >
      {/* Mobile compact list — без фото */}
      <div className="lg:hidden divide-y divide-border">
        {isLoading && properties.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Загрузка...
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Нет объектов
          </div>
        ) : (
          rows.map((p) => (
            <div
              key={p.id}
              data-row-id={p.id}
              className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/40"
              onClick={() => onEdit(p)}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-1 mb-0.5">
                  {getPropertyTypes(p).map((t) => (
                    <Badge
                      key={t}
                      variant="secondary"
                      className="text-[10px] py-0"
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs font-medium truncate">{p.address}</p>
                <p className="text-[11px] text-muted-foreground">
                  {p.district} · {p.area} м² ·{" "}
                  {Number(p.price).toLocaleString()} ₽
                  {p.deal_type === "Аренда" ? "/мес" : ""}
                </p>
              </div>
              <Badge
                variant={p.is_active ? "default" : "outline"}
                className="text-[10px] shrink-0"
              >
                {p.is_active ? "Вкл" : "Скрыт"}
              </Badge>
            </div>
          ))
        )}
      </div>

      <div className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {table.visibleCols.has("photo") && (
                <AdminTableHead
                  label="Фото"
                  sortField={table.sortField}
                  sortDir={table.sortDir}
                  onSort={table.handleSort}
                  className="w-12"
                />
              )}
              {table.visibleCols.has("type") && (
                <AdminTableHead
                  label="Тип"
                  field="type"
                  sortable
                  sortField={table.sortField}
                  sortDir={table.sortDir}
                  onSort={table.handleSort}
                />
              )}
              {table.visibleCols.has("address") && (
                <AdminTableHead
                  label="Адрес"
                  field="address"
                  sortable
                  sortField={table.sortField}
                  sortDir={table.sortDir}
                  onSort={table.handleSort}
                />
              )}
              {table.visibleCols.has("district") && (
                <AdminTableHead
                  label="Район"
                  field="district"
                  sortable
                  sortField={table.sortField}
                  sortDir={table.sortDir}
                  onSort={table.handleSort}
                />
              )}
              {table.visibleCols.has("area") && (
                <AdminTableHead
                  label="Площадь"
                  field="area"
                  sortable
                  sortField={table.sortField}
                  sortDir={table.sortDir}
                  onSort={table.handleSort}
                />
              )}
              {table.visibleCols.has("price") && (
                <AdminTableHead
                  label="Цена"
                  field="price"
                  sortable
                  sortField={table.sortField}
                  sortDir={table.sortDir}
                  onSort={table.handleSort}
                />
              )}
              {table.visibleCols.has("price_per_m2") && (
                <AdminTableHead
                  label="₽/м²"
                  field="price_per_m2"
                  sortable
                  sortField={table.sortField}
                  sortDir={table.sortDir}
                  onSort={table.handleSort}
                />
              )}
              {table.visibleCols.has("deal_type") && (
                <AdminTableHead
                  label="Сделка"
                  field="deal_type"
                  sortable
                  sortField={table.sortField}
                  sortDir={table.sortDir}
                  onSort={table.handleSort}
                />
              )}
              {table.visibleCols.has("floor") && (
                <AdminTableHead
                  label="Этаж"
                  sortField={table.sortField}
                  sortDir={table.sortDir}
                  onSort={table.handleSort}
                />
              )}
              {table.visibleCols.has("ceiling_height") && (
                <AdminTableHead
                  label="Потолки"
                  field="ceiling_height"
                  sortable
                  sortField={table.sortField}
                  sortDir={table.sortDir}
                  onSort={table.handleSort}
                />
              )}
              {table.visibleCols.has("parking") && (
                <AdminTableHead
                  label="Парковка"
                  sortField={table.sortField}
                  sortDir={table.sortDir}
                  onSort={table.handleSort}
                />
              )}
              {table.visibleCols.has("condition") && (
                <AdminTableHead
                  label="Состояние"
                  sortField={table.sortField}
                  sortDir={table.sortDir}
                  onSort={table.handleSort}
                />
              )}
              {table.visibleCols.has("layout") && (
                <AdminTableHead
                  label="Планировка"
                  sortField={table.sortField}
                  sortDir={table.sortDir}
                  onSort={table.handleSort}
                />
              )}
              {table.visibleCols.has("deposit") && (
                <AdminTableHead
                  label="Залог"
                  sortField={table.sortField}
                  sortDir={table.sortDir}
                  onSort={table.handleSort}
                />
              )}
              {table.visibleCols.has("contract_term") && (
                <AdminTableHead
                  label="Срок"
                  sortField={table.sortField}
                  sortDir={table.sortDir}
                  onSort={table.handleSort}
                />
              )}
              {table.visibleCols.has("features") && (
                <AdminTableHead
                  label="Особенности"
                  sortField={table.sortField}
                  sortDir={table.sortDir}
                  onSort={table.handleSort}
                />
              )}
              {table.visibleCols.has("photos_count") && (
                <AdminTableHead
                  label="Фото"
                  field="photos_count"
                  sortable
                  sortField={table.sortField}
                  sortDir={table.sortDir}
                  onSort={table.handleSort}
                />
              )}
              {table.visibleCols.has("views_count") && (
                <AdminTableHead
                  label="Просм."
                  field="views_count"
                  sortable
                  sortField={table.sortField}
                  sortDir={table.sortDir}
                  onSort={table.handleSort}
                />
              )}
              {table.visibleCols.has("published_date") && (
                <AdminTableHead
                  label="Дата"
                  field="published_date"
                  sortable
                  sortField={table.sortField}
                  sortDir={table.sortDir}
                  onSort={table.handleSort}
                />
              )}
              {table.visibleCols.has("manager") && (
                <AdminTableHead
                  label="Менеджер"
                  field="manager"
                  sortable
                  sortField={table.sortField}
                  sortDir={table.sortDir}
                  onSort={table.handleSort}
                />
              )}
              {table.visibleCols.has("client") && (
                <AdminTableHead
                  label="Клиент"
                  field="client"
                  sortable
                  sortField={table.sortField}
                  sortDir={table.sortDir}
                  onSort={table.handleSort}
                />
              )}
              {table.visibleCols.has("status") && (
                <AdminTableHead
                  label="Статус"
                  field="is_active"
                  sortable
                  sortField={table.sortField}
                  sortDir={table.sortDir}
                  onSort={table.handleSort}
                />
              )}
              {table.visibleCols.has("actions") && (
                <AdminTableHead
                  label="Действия"
                  sortField={table.sortField}
                  sortDir={table.sortDir}
                  onSort={table.handleSort}
                  className="text-right"
                />
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && properties.length === 0 ? (
              <AdminTableLoadingRow colSpan={colSpan} />
            ) : rows.length === 0 ? (
              <AdminTableEmptyRow colSpan={colSpan} message="Нет объектов" />
            ) : (
              rows.map((p, idx) => (
                <TableRow
                  key={p.id}
                  data-row-id={p.id}
                  className={cn(
                    "text-xs cursor-pointer hover:bg-muted/40",
                    idx % 2 === 1 && "bg-muted/20",
                  )}
                  onClick={() => onEdit(p)}
                >
                  {table.visibleCols.has("photo") && (
                    <TableCell className="py-1.5" onClick={(e) => e.stopPropagation()}>
                      <span className="text-muted-foreground">—</span>
                    </TableCell>
                  )}
                  {table.visibleCols.has("type") && (
                    <TableCell className="py-1.5">
                      <div className="flex flex-wrap gap-1">
                        {getPropertyTypes(p).map((t) => (
                          <Badge
                            key={t}
                            variant="secondary"
                            className="text-[10px] py-0"
                          >
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  )}
                  {table.visibleCols.has("address") && (
                    <TableCell className="py-1.5 whitespace-normal min-w-[200px] max-w-[280px]">
                      {p.address}
                    </TableCell>
                  )}
                  {table.visibleCols.has("district") && (
                    <TableCell className="py-1.5">{p.district || "—"}</TableCell>
                  )}
                  {table.visibleCols.has("area") && (
                    <TableCell className="py-1.5 whitespace-nowrap">
                      {p.area} м²
                    </TableCell>
                  )}
                  {table.visibleCols.has("price") && (
                    <TableCell className="py-1.5 font-medium whitespace-nowrap">
                      {Number(p.price).toLocaleString()} ₽
                      {p.deal_type === "Аренда" ? "/мес" : ""}
                    </TableCell>
                  )}
                  {table.visibleCols.has("price_per_m2") && (
                    <TableCell className="py-1.5">
                      {Number(p.price_per_m2).toLocaleString()} ₽
                    </TableCell>
                  )}
                  {table.visibleCols.has("deal_type") && (
                    <TableCell className="py-1.5">{p.deal_type}</TableCell>
                  )}
                  {table.visibleCols.has("floor") && (
                    <TableCell className="py-1.5">
                      {p.floor || "—"}
                      {p.total_floors ? `/${p.total_floors}` : ""}
                    </TableCell>
                  )}
                  {table.visibleCols.has("ceiling_height") && (
                    <TableCell className="py-1.5">
                      {p.ceiling_height ? `${p.ceiling_height} м` : "—"}
                    </TableCell>
                  )}
                  {table.visibleCols.has("parking") && (
                    <TableCell className="py-1.5">{p.parking || "—"}</TableCell>
                  )}
                  {table.visibleCols.has("condition") && (
                    <TableCell className="py-1.5">{p.condition || "—"}</TableCell>
                  )}
                  {table.visibleCols.has("layout") && (
                    <TableCell className="py-1.5">{p.layout || "—"}</TableCell>
                  )}
                  {table.visibleCols.has("deposit") && (
                    <TableCell className="py-1.5">{p.deposit || "—"}</TableCell>
                  )}
                  {table.visibleCols.has("contract_term") && (
                    <TableCell className="py-1.5">
                      {p.contract_term || "—"}
                    </TableCell>
                  )}
                  {table.visibleCols.has("features") && (
                    <TableCell className="py-1.5 max-w-[140px] truncate">
                      {(p.features || []).join(", ") || "—"}
                    </TableCell>
                  )}
                  {table.visibleCols.has("photos_count") && (
                    <TableCell className="py-1.5">
                      {p.photos_count || p.photos?.length || 0}
                    </TableCell>
                  )}
                  {table.visibleCols.has("views_count") && (
                    <TableCell className="py-1.5">{p.views_count || 0}</TableCell>
                  )}
                  {table.visibleCols.has("published_date") && (
                    <TableCell className="py-1.5 whitespace-nowrap">
                      {p.published_date
                        ? new Date(p.published_date).toLocaleDateString("ru-RU")
                        : "—"}
                    </TableCell>
                  )}
                  {table.visibleCols.has("manager") && (
                    <TableCell className="py-1.5">
                      {p.manager?.full_name || "—"}
                    </TableCell>
                  )}
                  {table.visibleCols.has("client") && (
                    <TableCell className="py-1.5">
                      {p.client?.full_name || "—"}
                    </TableCell>
                  )}
                  {table.visibleCols.has("status") && (
                    <TableCell className="py-1.5">
                      <Badge
                        variant={p.is_active ? "default" : "outline"}
                        className="text-[10px]"
                      >
                        {p.is_active ? "Активен" : "Скрыт"}
                      </Badge>
                    </TableCell>
                  )}
                  {table.visibleCols.has("actions") && (
                    <TableCell
                      className="py-1.5 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end gap-0.5">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="QR-код"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-[min(100vw-2rem,360px)]"
                            align="end"
                          >
                            <PropertyQrBlock
                              propertyId={p.id}
                              compact
                            />
                          </PopoverContent>
                        </Popover>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onEdit(p)}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            if (confirm("Удалить объект?")) onDelete(p.id);
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AdminDataTable>
  );
}
