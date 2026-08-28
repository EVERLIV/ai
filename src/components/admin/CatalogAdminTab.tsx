import { Download, Loader2, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import CatalogItemDrawer from "@/components/admin/catalog/CatalogItemDrawer";
import CatalogSidebar, {
  CatalogCategorySelect,
} from "@/components/admin/catalog/CatalogSidebar";
import CatalogTablePanel from "@/components/admin/catalog/CatalogTablePanel";
import LocationTreePanel from "@/components/admin/catalog/LocationTreePanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useCatalogAdmin } from "@/hooks/useCatalogAdmin";
import type { DictionaryItem } from "@/hooks/useDictionaries";
import { getCatalogCategory } from "@/lib/catalogRegistry";
import type { CatalogFormState } from "@/components/admin/catalog/CatalogItemForm";

export default function CatalogAdminTab() {
  const [activeCategory, setActiveCategory] = useState("district");
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DictionaryItem | null>(null);
  const [initialForm, setInitialForm] = useState<Partial<CatalogFormState>>();

  const categoryMeta = getCatalogCategory(activeCategory)!;
  const {
    items,
    tree,
    filteredItems,
    isLoading,
    add,
    update,
    remove,
    isAdding,
    isUpdating,
    syncFromStatic,
    isSyncing,
  } = useCatalogAdmin(activeCategory);
  const { toast } = useToast();

  const displayItems = useMemo(
    () => filteredItems(search),
    [filteredItems, search, items],
  );

  const maxOrder =
    items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) : 0;

  const parentOptions = useMemo(() => {
    if (activeCategory !== "district") return items;
    return items.filter((i) => {
      const kind = i.metadata?.kind;
      return (
        !kind ||
        kind === "region" ||
        kind === "city" ||
        i.value === "Иркутская область"
      );
    });
  }, [items, activeCategory]);

  const openCreate = (parent?: DictionaryItem) => {
    setEditingItem(null);
    setInitialForm(
      parent
        ? {
            parent: parent.value,
            parent_id: parent.id,
            metadata: { kind: "district" },
          }
        : undefined,
    );
    setDrawerOpen(true);
  };

  const openEdit = (item: DictionaryItem) => {
    setEditingItem(item);
    setInitialForm(undefined);
    setDrawerOpen(true);
  };

  const handleSave = async (
    payload: Parameters<typeof add>[0] & { id?: string },
  ) => {
    try {
      if (editingItem) {
        await update({ id: editingItem.id, ...payload });
        toast({ title: "Сохранено" });
      } else {
        await add(payload);
        toast({ title: "Добавлено" });
      }
    } catch (err: unknown) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось сохранить",
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleToggle = async (item: DictionaryItem) => {
    try {
      await update({ id: item.id, is_active: !item.is_active });
    } catch {
      toast({ title: "Ошибка", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      toast({ title: "Удалено" });
    } catch (err: unknown) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось удалить",
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleSync = async () => {
    if (
      !confirm(
        "Импортировать все локации из встроенного справочника? Существующие записи будут обновлены.",
      )
    ) {
      return;
    }
    try {
      const result = await syncFromStatic();
      toast({
        title: "Импорт завершён",
        description: `Добавлено: ${result.inserted}, обновлено: ${result.updated}, связей: ${result.parentLinks}`,
      });
    } catch (err: unknown) {
      toast({
        title: "Ошибка импорта",
        description: err instanceof Error ? err.message : "Не удалось импортировать",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Справочники каталога</h2>
          <p className="text-xs text-muted-foreground">
            Управление локациями, типами объектов и полями карточек
          </p>
        </div>
        {activeCategory === "district" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-1" />
            )}
            Импорт из справочника
          </Button>
        )}
      </div>

      <div className="md:hidden">
        <CatalogCategorySelect
          activeCategory={activeCategory}
          onSelect={(key) => {
            setActiveCategory(key);
            setSearch("");
          }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-[200px_1fr]">
        <Card className="hidden md:block">
          <CardContent className="p-3">
            <CatalogSidebar
              activeCategory={activeCategory}
              onSelect={(key) => {
                setActiveCategory(key);
                setSearch("");
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-sm font-medium">
              {categoryMeta.title}
              <span className="text-muted-foreground font-normal ml-1">
                ({items.length})
              </span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  className="h-8 pl-7 text-xs w-40 sm:w-52"
                  placeholder="Поиск..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button
                type="button"
                size="sm"
                className="h-8 text-xs"
                onClick={() => openCreate()}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Добавить
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            {isLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                Загрузка...
              </div>
            ) : categoryMeta.view === "tree" ? (
              <div className="px-2">
                <LocationTreePanel
                  tree={tree}
                  search={search}
                  onEdit={openEdit}
                  onAddChild={openCreate}
                  onToggleActive={handleToggle}
                />
              </div>
            ) : (
              <CatalogTablePanel
                category={activeCategory}
                items={displayItems}
                onEdit={openEdit}
                onToggleActive={handleToggle}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <CatalogItemDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        category={activeCategory}
        item={editingItem}
        initialForm={initialForm}
        parentOptions={parentOptions}
        maxSortOrder={maxOrder}
        onSave={handleSave}
        onDelete={editingItem ? handleDelete : undefined}
        isSaving={isAdding || isUpdating}
      />
    </div>
  );
}
