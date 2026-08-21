import { useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  useAgencyManagerMutations,
  useAgencyManagers,
  useMyAgency,
} from "@/hooks/useAgency";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Plus, Trash2 } from "lucide-react";

export default function AgencyManagersTab() {
  const { toast } = useToast();
  const { data } = useMyAgency();
  const agencyId = data?.agency.id;
  const { data: managers = [], isLoading } = useAgencyManagers(agencyId);
  const { create, update, remove, uploadPhoto } = useAgencyManagerMutations(agencyId);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setFullName("");
    setPhone("");
    setPhotoUrl(null);
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
    try {
      await create.mutateAsync({
        full_name: fullName.trim(),
        phone: phone.trim(),
        photo_url: photoUrl,
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
    return <p className="text-sm text-muted-foreground py-6">Сначала заполните профиль агентства.</p>;
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold">Менеджеры</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Контактные карточки с фото и телефоном — их можно прикреплять к объектам.
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
              <img src={photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPhoto} />
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
        <Button onClick={onCreate} disabled={create.isPending || uploadPhoto.isPending}>
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
          {managers.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-3 py-3 bg-card">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-muted shrink-0">
                {m.photo_url ? (
                  <img src={m.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {m.full_name?.[0] || "?"}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{m.full_name}</div>
                <div className="text-xs text-muted-foreground">{m.phone}</div>
                {!m.is_active && (
                  <div className="text-[10px] text-amber-600">Неактивен</div>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  try {
                    await update.mutateAsync({ id: m.id, payload: { is_active: !m.is_active } });
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
