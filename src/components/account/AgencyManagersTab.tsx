import { Camera, Loader2, Plus, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  useAgencyManagerMutations,
  useAgencyManagers,
  useMyAgency,
  useMyAgencyProperties,
} from "@/hooks/useAgency";
import { useAllDictionaryValues } from "@/hooks/useDictionaries";

/** Старые URL без /public/ на self-hosted отдают 401/CORS */
function publicAssetUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.replace(
    /\/storage\/v1\/object\/(?!public\/)/,
    "/storage/v1/object/public/",
  );
}

function TypeChips({
  types,
  selected,
  onToggle,
  disabled,
}: {
  types: string[];
  selected: string[];
  onToggle: (type: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {types.map((type) => {
        const on = selected.includes(type);
        return (
          <button
            key={type}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(type)}
            className={`rounded-md border px-2 py-1 text-[11px] transition-colors ${
              on
                ? "border-primary/40 bg-primary/10 text-foreground"
                : "border-border bg-background text-muted-foreground hover:border-primary/30"
            }`}
          >
            {type}
          </button>
        );
      })}
    </div>
  );
}

export default function AgencyManagersTab() {
  const { toast } = useToast();
  const { data } = useMyAgency();
  const agencyId = data?.agency.id;
  const { data: managers = [], isLoading } = useAgencyManagers(agencyId);
  const { data: agencyProperties = [] } = useMyAgencyProperties(agencyId);
  const { create, update, remove, uploadPhoto } =
    useAgencyManagerMutations(agencyId);
  const { propertyTypes: typesFromDict } = useAllDictionaryValues();
  const typeOptions = useMemo(() => {
    const commercial = typesFromDict("commercial");
    const residential = typesFromDict("residential");
    const land = typesFromDict("land");
    return [
      ...commercial,
      ...residential.filter((t) => !commercial.includes(t)),
      ...land.filter((t) => !commercial.includes(t) && !residential.includes(t)),
    ];
  }, [typesFromDict]);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const listingCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of agencyProperties as {
      listing_manager_id?: string | null;
    }[]) {
      const mid = p.listing_manager_id;
      if (!mid) continue;
      map.set(mid, (map.get(mid) || 0) + 1);
    }
    return map;
  }, [agencyProperties]);

  const resetForm = () => {
    setFullName("");
    setPhone("");
    setPhotoUrl(null);
    setPropertyTypes([]);
  };

  const toggleType = (type: string) => {
    setPropertyTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const onPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !agencyId) return;
    try {
      const url = await uploadPhoto.mutateAsync(file);
      setPhotoUrl(url);
    } catch (err) {
      toast({
        title: "Не удалось загрузить фото",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      });
    }
  };

  const onCreate = async () => {
    if (!fullName.trim() || !phone.trim()) {
      toast({ title: "Укажите имя и телефон", variant: "destructive" });
      return;
    }
    if (propertyTypes.length === 0) {
      toast({ title: "Выберите типы объектов", variant: "destructive" });
      return;
    }
    try {
      await create.mutateAsync({
        full_name: fullName.trim(),
        phone: phone.trim(),
        photo_url: photoUrl,
        property_types: propertyTypes,
      });
      toast({ title: "Менеджер добавлен" });
      resetForm();
    } catch (err) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      });
    }
  };

  if (!agencyId) {
    return (
      <p className="text-sm text-muted-foreground py-6">
        Сначала заполните профиль агентства.
      </p>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold">Менеджеры</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Контактные карточки с фото, телефоном и типами объектов — их можно
          прикреплять к объявлениям.
        </p>
      </div>

      <div className="rounded-lg border border-border p-4 space-y-3">
        <div className="text-sm font-medium flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Новый менеджер
        </div>
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-16 h-16 rounded-full border border-border bg-muted overflow-hidden flex items-center justify-center shrink-0"
          >
            {photoUrl ? (
              <img
                src={publicAssetUrl(photoUrl) || photoUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <Camera className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPhoto}
          />
          <div className="flex-1 grid sm:grid-cols-2 gap-2">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Имя"
              className="h-10 px-3 rounded-md border border-border bg-background text-sm"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Телефон"
              className="h-10 px-3 rounded-md border border-border bg-background text-sm"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-muted-foreground">
            С какими типами работает
          </div>
          <TypeChips
            types={typeOptions}
            selected={propertyTypes}
            onToggle={toggleType}
          />
        </div>
        <Button
          onClick={onCreate}
          disabled={create.isPending || uploadPhoto.isPending}
        >
          {(create.isPending || uploadPhoto.isPending) && (
            <Loader2 className="w-4 h-4 animate-spin mr-1" />
          )}
          Добавить
        </Button>
      </div>

      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      ) : managers.length === 0 ? (
        <p className="text-sm text-muted-foreground">Пока нет менеджеров.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
          {managers.map((m) => {
            const count = listingCounts.get(m.id) || 0;
            const types = m.property_types ?? [];
            return (
              <li key={m.id} className="px-3 py-3 bg-card space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-muted shrink-0">
                    {m.photo_url ? (
                      <img
                        src={publicAssetUrl(m.photo_url) || m.photo_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">
                        {m.full_name?.[0] || "?"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {m.full_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {m.phone}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      В управлении: {count}{" "}
                      {count === 1
                        ? "объект"
                        : count >= 2 && count <= 4
                          ? "объекта"
                          : "объектов"}
                    </div>
                    {!m.is_active && (
                      <div className="text-[10px] text-amber-600">
                        Неактивен
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      try {
                        await update.mutateAsync({
                          id: m.id,
                          payload: { is_active: !m.is_active },
                        });
                      } catch (err) {
                        toast({
                          title: "Ошибка",
                          description: err instanceof Error ? err.message : "",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    {m.is_active ? "Скрыть" : "Показать"}
                  </Button>
                  <button
                    type="button"
                    className="p-1.5 text-muted-foreground hover:text-destructive"
                    onClick={async () => {
                      try {
                        await remove.mutateAsync(m.id);
                        toast({ title: "Удалено" });
                      } catch (err) {
                        toast({
                          title: "Ошибка",
                          description: err instanceof Error ? err.message : "",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <TypeChips
                  types={typeOptions}
                  selected={types}
                  disabled={update.isPending}
                  onToggle={async (type) => {
                    const next = types.includes(type)
                      ? types.filter((t) => t !== type)
                      : [...types, type];
                    try {
                      await update.mutateAsync({
                        id: m.id,
                        payload: { property_types: next },
                      });
                    } catch (err) {
                      toast({
                        title: "Не удалось обновить типы",
                        description: err instanceof Error ? err.message : "",
                        variant: "destructive",
                      });
                    }
                  }}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
