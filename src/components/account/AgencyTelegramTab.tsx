import { Bell, Loader2, MessageCircle, Unplug } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  useConnectAgencyTelegramChat,
  useDisconnectAgencyTelegram,
  useMyAgency,
  useUpdateAgencyTelegramSettings,
} from "@/hooks/useAgency";
import { cn } from "@/lib/utils";

const BOT_USERNAME =
  import.meta.env.VITE_AGENCY_BOT_USERNAME || "ArendaCityAgencyBot";

export default function AgencyTelegramTab() {
  const { toast } = useToast();
  const { data, isLoading, refetch } = useMyAgency();
  const connectChat = useConnectAgencyTelegramChat();
  const updateSettings = useUpdateAgencyTelegramSettings();
  const disconnect = useDisconnectAgencyTelegram();

  const agency = data?.agency;
  const membership = data?.membership;
  const isAdmin = membership?.role === "owner" || membership?.role === "admin";

  const [chatIdInput, setChatIdInput] = useState("");
  const [chatTitleInput, setChatTitleInput] = useState("");

  const connected = !!agency?.telegram_chat_id;

  const patchSettings = async (
    patch: Parameters<typeof updateSettings.mutateAsync>[0]["settings"],
  ) => {
    if (!agency) return;
    try {
      await updateSettings.mutateAsync({
        agencyId: agency.id,
        settings: patch,
      });
    } catch (e) {
      toast({
        title: "Ошибка",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    }
  };

  const handleSaveChat = async () => {
    if (!agency) return;
    try {
      await connectChat.mutateAsync({
        agencyId: agency.id,
        chatId: chatIdInput,
        chatTitle: chatTitleInput || null,
      });
      toast({
        title: "Чат сохранён",
        description: "Добавьте бота в группу и включите уведомления ниже",
      });
      setChatIdInput("");
      refetch();
    } catch (e) {
      toast({
        title: "Ошибка",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = async () => {
    if (!agency || !confirm("Отключить Telegram-чат от агентства?")) return;
    try {
      await disconnect.mutateAsync(agency.id);
      setChatTitleInput("");
      toast({ title: "Telegram отключён" });
      refetch();
    } catch (e) {
      toast({
        title: "Ошибка",
        description: e instanceof Error ? e.message : "",
        variant: "destructive",
      });
    }
  };

  if (isLoading || !agency) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="bg-card p-8 text-center text-sm text-muted-foreground">
        Настройки Telegram доступны владельцу и администратору агентства.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          Telegram-уведомления
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Укажите ID группы или канала, добавьте бота — заявки и просмотры по
          вашим объектам будут приходить туда.
        </p>
      </div>

      <div className="bg-card border border-border/60 rounded-lg p-4 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Статус</p>
            {connected ? (
              <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-0.5">
                ID чата:{" "}
                <span className="font-mono">{agency.telegram_chat_id}</span>
                {agency.telegram_chat_title && (
                  <> · {agency.telegram_chat_title}</>
                )}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-0.5">
                Чат не указан
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Label
              htmlFor="tg-enabled"
              className="text-xs text-muted-foreground"
            >
              Вкл.
            </Label>
            <Switch
              id="tg-enabled"
              checked={!!agency.telegram_enabled}
              disabled={!connected || updateSettings.isPending}
              onCheckedChange={(v) =>
                void patchSettings({ telegram_enabled: v })
              }
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="tg-chat-id" className="text-xs">
              ID группы или канала
            </Label>
            <Input
              id="tg-chat-id"
              inputMode="numeric"
              placeholder={
                connected ? String(agency.telegram_chat_id) : "-1001234567890"
              }
              value={chatIdInput}
              onChange={(e) => setChatIdInput(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Обычно начинается с <code className="bg-muted px-1">-100</code>.
              Узнать ID: добавьте в группу бота{" "}
              <a
                href="https://t.me/getmyid_bot"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                @getmyid_bot
              </a>{" "}
              или посмотрите в getUpdates после сообщения в группе.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tg-chat-title" className="text-xs">
              Название (необязательно)
            </Label>
            <Input
              id="tg-chat-title"
              placeholder="Рабочая группа агентства"
              value={chatTitleInput}
              onChange={(e) => setChatTitleInput(e.target.value)}
            />
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => void handleSaveChat()}
            disabled={connectChat.isPending || !chatIdInput.trim()}
          >
            {connectChat.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : null}
            Сохранить ID чата
          </Button>
        </div>

        <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground space-y-1.5 leading-relaxed">
          <p className="font-medium text-foreground text-sm">
            После сохранения
          </p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Добавьте @{BOT_USERNAME} в эту группу или канал</li>
            <li>
              Сделайте бота{" "}
              <strong className="text-foreground">администратором</strong>{" "}
              (иначе не сможет писать)
            </li>
            <li>Включите переключатель «Вкл.» и типы уведомлений ниже</li>
          </ol>
        </div>

        {connected && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => void handleDisconnect()}
            disabled={disconnect.isPending}
          >
            <Unplug className="w-4 h-4 mr-1" />
            Отключить
          </Button>
        )}
      </div>

      <div
        className={cn(
          "bg-card border border-border/60 rounded-lg p-4 space-y-4",
          !connected && "opacity-60 pointer-events-none",
        )}
      >
        <p className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Bell className="w-4 h-4" /> Что присылать
        </p>

        {[
          {
            key: "telegram_notify_leads" as const,
            label: "Новые заявки",
            desc: "Формы на ваших объектах",
          },
          {
            key: "telegram_notify_views" as const,
            label: "Просмотры",
            desc: "Когда открывают карточку объекта",
          },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <Switch
              checked={!!agency[key]}
              disabled={updateSettings.isPending}
              onCheckedChange={(v) => void patchSettings({ [key]: v })}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
