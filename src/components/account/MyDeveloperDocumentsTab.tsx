import { ExternalLink, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateDeveloperDocument,
  useCreateOutboundWebhook,
  useDeleteOutboundWebhook,
  useMyDeveloper,
  useMyDeveloperDocuments,
  useMyOutboundWebhooks,
} from "@/hooks/useDeveloper";

export default function MyDeveloperDocumentsTab() {
  const { toast } = useToast();
  const { data: developer, isLoading: devLoading } = useMyDeveloper();
  const { data: docs = [], isLoading } = useMyDeveloperDocuments();
  const create = useCreateDeveloperDocument();
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState("license");
  const [fileUrl, setFileUrl] = useState("");

  if (devLoading || isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" /> Загрузка…
      </div>
    );
  }

  if (!developer) {
    return (
      <p className="text-sm text-muted-foreground py-8">
        Профиль застройщика не найден.
      </p>
    );
  }

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-foreground mb-5">
        Документы
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        Лицензии, разрешения на строительство и другие документы. После
        загрузки статус — «на проверке»; администратор подтвердит.
      </p>

      <form
        className="mb-6 space-y-3 p-4 border border-border rounded-lg bg-card"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!title.trim() || !fileUrl.trim()) return;
          try {
            await create.mutateAsync({
              developer_id: developer.id,
              title: title.trim(),
              file_url: fileUrl.trim(),
              doc_type: docType,
            });
            toast({ title: "Документ отправлен на проверку" });
            setTitle("");
            setFileUrl("");
          } catch (err) {
            toast({
              title: "Ошибка",
              description:
                err instanceof Error ? err.message : "Не удалось сохранить",
              variant: "destructive",
            });
          }
        }}
      >
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Тип
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full h-10 px-3 border border-border bg-background text-sm rounded-md"
            >
              <option value="license">Лицензия</option>
              <option value="rns">Разрешение на строительство</option>
              <option value="other">Другое</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Название *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full h-10 px-3 border border-border bg-background text-sm rounded-md"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">
            Ссылка на файл *
          </label>
          <input
            type="url"
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            required
            placeholder="https://…"
            className="w-full h-10 px-3 border border-border bg-background text-sm rounded-md"
          />
        </div>
        <button
          type="submit"
          disabled={create.isPending}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          Добавить
        </button>
      </form>

      {docs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Документов пока нет.</p>
      ) : (
        <ul className="space-y-2">
          {docs.map((d) => (
            <li
              key={d.id}
              className="flex items-center justify-between gap-3 p-3 border border-border/60 rounded-lg bg-card text-sm"
            >
              <div className="min-w-0">
                <div className="font-medium truncate">{d.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {d.doc_type} ·{" "}
                  {d.status === "approved"
                    ? "Одобрен"
                    : d.status === "rejected"
                      ? "Отклонён"
                      : "На проверке"}
                </div>
              </div>
              <a
                href={d.file_url}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-primary"
                aria-label="Открыть"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function MyDeveloperWebhooksTab() {
  const { toast } = useToast();
  const { data: developer } = useMyDeveloper();
  const { data: hooks = [], isLoading } = useMyOutboundWebhooks();
  const create = useCreateOutboundWebhook();
  const remove = useDeleteOutboundWebhook();
  const [url, setUrl] = useState("");

  if (!developer) return null;

  return (
    <div>
      <h2 className="font-display text-xl font-bold text-foreground mb-2">
        Webhooks
      </h2>
      <p className="text-xs text-muted-foreground mb-5">
        Задел под исходящие события (lead_submit, view_project). Доставка
        воркером — позже; сейчас сохраняется только конфигурация.
      </p>

      <form
        className="flex flex-wrap gap-2 mb-5"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!url.trim()) return;
          try {
            await create.mutateAsync({
              developer_id: developer.id,
              url: url.trim(),
            });
            setUrl("");
            toast({ title: "Webhook добавлен" });
          } catch (err) {
            toast({
              title: "Ошибка",
              description: err instanceof Error ? err.message : "Ошибка",
              variant: "destructive",
            });
          }
        }}
      >
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/hook"
          required
          className="h-9 px-3 border border-border rounded-md text-sm bg-background flex-1 min-w-[12rem]"
        />
        <button
          type="submit"
          disabled={create.isPending}
          className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-xs font-semibold"
        >
          Добавить
        </button>
      </form>

      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      ) : hooks.length === 0 ? (
        <p className="text-sm text-muted-foreground">Нет webhook&apos;ов.</p>
      ) : (
        <ul className="space-y-2">
          {hooks.map((h) => (
            <li
              key={h.id}
              className="flex items-center justify-between gap-3 p-3 border border-border/60 rounded-lg text-sm"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{h.url}</div>
                <div className="text-xs text-muted-foreground">
                  {(h.events || []).join(", ")} ·{" "}
                  {h.is_active ? "активен" : "выкл"}
                </div>
              </div>
              <button
                type="button"
                className="text-destructive text-xs"
                onClick={() => remove.mutate(h.id)}
              >
                Удалить
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
