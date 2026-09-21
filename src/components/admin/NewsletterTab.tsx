import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, RefreshCw, Send, ListPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import {
  SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from "@/integrations/supabase/adminClient";
import {
  NEWSLETTER_TEMPLATES,
  enqueueNewsletterCampaign,
  getNewsletterQueueStatus,
  getNewsletterSettings,
  previewNewsletter,
  processNewsletterQueue,
  sendNewsletterTest,
  setNewsletterSettings,
  type NewsletterPayload,
  type NewsletterTemplateKey,
} from "@/lib/newsletterApi";

type Subscriber = {
  id: string;
  email: string;
  full_name: string | null;
  marketing_opt_in: boolean;
  unsubscribed_at: string | null;
  created_at: string;
};

type Campaign = {
  id: string;
  subject: string;
  status: string;
  template_key?: string | null;
  recipient_count: number;
  sent_count: number;
  fail_count: number;
  created_at: string;
  finished_at: string | null;
};

type QueueRow = {
  id: string;
  email: string;
  status: string;
  created_at: string;
  campaign_id: string;
};

const serviceHeaders = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

async function serviceFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { ...serviceHeaders, ...(init?.headers || {}) },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: string }).message)
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

export default function NewsletterTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [templateKey, setTemplateKey] =
    useState<NewsletterTemplateKey>("partner_kp");
  const [subject, setSubject] = useState(
    "Ваши объекты — на новом агрегаторе ДАДАТУТ",
  );
  const [headlineRed, setHeadlineRed] = useState("Ваши объекты —");
  const [headline, setHeadline] = useState(
    "на новом агрегаторе недвижимости",
  );
  const [intro, setIntro] = useState(
    "Портал аренды и недвижимости в Иркутске и области — чтобы жители региона находили объекты бесплатно, без переплат на агрегаторах и без лишних комиссий.",
  );
  const [body, setBody] = useState(
    "Тут текст из нескольких предложений а потом ссылка на скачивание КП. Отредактируйте текст перед отправкой кампании.",
  );
  const [ctaLabel, setCtaLabel] = useState("Скачать презентацию");
  const [ctaUrl, setCtaUrl] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [testTo, setTestTo] = useState(user?.email || "");
  const [previewHtml, setPreviewHtml] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");

  const offerType = templateKey === "partner_kp" ? "kp" : "custom";

  const payload: NewsletterPayload = useMemo(
    () => ({
      subject: subject.trim(),
      headlineRed: headlineRed.trim(),
      headline: headline.trim(),
      intro: intro.trim(),
      body: body.trim(),
      ctaLabel:
        offerType === "kp" ? "Скачать презентацию" : ctaLabel.trim(),
      ctaUrl: ctaUrl.trim() || "https://dadatut.ru/",
      heroImageUrl: heroImageUrl.trim() || null,
      templateKey,
      createdBy: user?.id || null,
    }),
    [
      subject,
      headlineRed,
      headline,
      intro,
      body,
      offerType,
      ctaLabel,
      ctaUrl,
      heroImageUrl,
      templateKey,
      user?.id,
    ],
  );

  const subscribersQ = useQuery({
    queryKey: ["newsletter-subscribers"],
    queryFn: () =>
      serviceFetch<Subscriber[]>(
        "newsletter_subscribers?select=id,email,full_name,marketing_opt_in,unsubscribed_at,created_at&order=created_at.desc&limit=200",
      ),
  });

  const activeCountQ = useQuery({
    queryKey: ["newsletter-active-count"],
    queryFn: async () => {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/newsletter_subscribers?select=id&marketing_opt_in=eq.true&unsubscribed_at=is.null`,
        {
          headers: {
            ...serviceHeaders,
            Prefer: "count=exact",
            Range: "0-0",
          },
        },
      );
      const range = res.headers.get("content-range") || "";
      const total = Number(range.split("/")[1] || "0");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Number.isFinite(total) ? total : 0;
    },
  });

  const campaignsQ = useQuery({
    queryKey: ["newsletter-campaigns"],
    queryFn: () =>
      serviceFetch<Campaign[]>(
        "newsletter_campaigns?select=id,subject,status,template_key,recipient_count,sent_count,fail_count,created_at,finished_at&order=created_at.desc&limit=20",
      ),
  });

  const queueRowsQ = useQuery({
    queryKey: ["newsletter-queue-rows"],
    queryFn: () =>
      serviceFetch<QueueRow[]>(
        "newsletter_sends?select=id,email,status,created_at,campaign_id&status=in.(pending,processing)&order=created_at.asc&limit=50",
      ),
    refetchInterval: 30_000,
  });

  const settingsQ = useQuery({
    queryKey: ["newsletter-settings"],
    queryFn: getNewsletterSettings,
  });

  const queueStatusQ = useQuery({
    queryKey: ["newsletter-queue-status"],
    queryFn: getNewsletterQueueStatus,
    refetchInterval: 30_000,
  });

  const activeCount = activeCountQ.data ?? 0;
  const sendingEnabled = Boolean(settingsQ.data?.sendingEnabled);
  const pendingCount = queueStatusQ.data?.pending ?? 0;
  const processingCount = queueStatusQ.data?.processing ?? 0;

  const previewMut = useMutation({
    mutationFn: () => previewNewsletter(payload),
    onSuccess: (data) => {
      setPreviewHtml(String(data.html || ""));
      toast.success("Превью обновлено");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const testMut = useMutation({
    mutationFn: () => sendNewsletterTest(payload, testTo.trim()),
    onSuccess: () => toast.success(`Тест отправлен на ${testTo.trim()}`),
    onError: (e: Error) => toast.error(e.message),
  });

  const enqueueMut = useMutation({
    mutationFn: () => enqueueNewsletterCampaign(payload),
    onSuccess: (data) => {
      toast.success(
        `В очередь: ${data.queued ?? 0} писем. Включите автоотправку, чтобы cron начал слать.`,
      );
      qc.invalidateQueries({ queryKey: ["newsletter-campaigns"] });
      qc.invalidateQueries({ queryKey: ["newsletter-queue-status"] });
      qc.invalidateQueries({ queryKey: ["newsletter-queue-rows"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: (enabled: boolean) =>
      setNewsletterSettings({ sendingEnabled: enabled }),
    onSuccess: (data) => {
      toast.success(
        data.sendingEnabled
          ? "Автоотправка включена — cron шлёт из очереди"
          : "Автоотправка выключена",
      );
      qc.invalidateQueries({ queryKey: ["newsletter-settings"] });
      qc.invalidateQueries({ queryKey: ["newsletter-queue-status"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const drainMut = useMutation({
    mutationFn: () => processNewsletterQueue(),
    onSuccess: (data) => {
      if (data.skipped === "disabled") {
        toast.message("Автоотправка выключена — пачка не ушла");
      } else {
        toast.success(
          `Пачка: отправлено ${data.sent ?? 0}, ошибок ${data.failed ?? 0}`,
        );
      }
      qc.invalidateQueries({ queryKey: ["newsletter-campaigns"] });
      qc.invalidateQueries({ queryKey: ["newsletter-queue-status"] });
      qc.invalidateQueries({ queryKey: ["newsletter-queue-rows"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addSubMut = useMutation({
    mutationFn: async () => {
      const email = newEmail.trim().toLowerCase();
      if (!email || !email.includes("@")) {
        throw new Error("Укажите корректный email");
      }
      await serviceFetch("newsletter_subscribers?on_conflict=email", {
        method: "POST",
        headers: {
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify({
          email,
          full_name: newName.trim(),
          marketing_opt_in: true,
          unsubscribed_at: null,
          source: "admin",
        }),
      });
    },
    onSuccess: () => {
      toast.success("Подписчик добавлен (opt-in)");
      setNewEmail("");
      setNewName("");
      qc.invalidateQueries({ queryKey: ["newsletter-subscribers"] });
      qc.invalidateQueries({ queryKey: ["newsletter-active-count"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Рассылки
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Очередь + cron каждые 5 мин · opt-in: <strong>{activeCount}</strong>
            {" · "}в очереди: <strong>{pendingCount}</strong>
            {processingCount ? ` (в работе ${processingCount})` : ""}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            subscribersQ.refetch();
            activeCountQ.refetch();
            campaignsQ.refetch();
            queueStatusQ.refetch();
            queueRowsQ.refetch();
            settingsQ.refetch();
          }}
        >
          <RefreshCw className="w-4 h-4 mr-1" /> Обновить
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Автоотправка очереди</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm">
              Включается вручную. Пока выключено — письма лежат в очереди.
            </p>
            <p className="text-xs text-muted-foreground">
              Cron на VPS:{" "}
              <code className="text-[11px]">
                */5 * * * * newsletter-queue-cron.sh
              </code>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={sendingEnabled}
              disabled={toggleMut.isPending || settingsQ.isLoading}
              onCheckedChange={(v) => toggleMut.mutate(v)}
            />
            <span className="text-sm font-medium">
              {sendingEnabled ? "Включена" : "Выключена"}
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={drainMut.isPending}
              onClick={() => drainMut.mutate()}
            >
              {drainMut.isPending ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : null}
              Слать пачку сейчас
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Письмо</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Шаблон</Label>
              <div className="flex flex-wrap gap-2">
                {NEWSLETTER_TEMPLATES.map((t) => (
                  <Button
                    key={t.key}
                    type="button"
                    size="sm"
                    variant={templateKey === t.key ? "default" : "outline"}
                    onClick={() => {
                      setTemplateKey(t.key);
                      if (t.key === "partner_kp") {
                        setCtaLabel("Скачать презентацию");
                      }
                    }}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {
                  NEWSLETTER_TEMPLATES.find((t) => t.key === templateKey)
                    ?.description
                }
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nl-subject">Тема</Label>
              <Input
                id="nl-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="nl-headline-red">Заголовок (красная часть)</Label>
                <Input
                  id="nl-headline-red"
                  value={headlineRed}
                  onChange={(e) => setHeadlineRed(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nl-headline">Заголовок (остаток)</Label>
                <Input
                  id="nl-headline"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nl-intro">Вступление</Label>
              <Textarea
                id="nl-intro"
                rows={3}
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nl-body">Текст после «Добрый день!»</Label>
              <Textarea
                id="nl-body"
                rows={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>
            {offerType === "kp" ? (
              <div className="space-y-1.5">
                <Label htmlFor="nl-kp-url">Ссылка на файл КП</Label>
                <Input
                  id="nl-kp-url"
                  placeholder="https://… (файл добавите позже)"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="nl-cta-label">Кнопка</Label>
                  <Input
                    id="nl-cta-label"
                    value={ctaLabel}
                    onChange={(e) => setCtaLabel(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nl-cta-url">Ссылка кнопки</Label>
                  <Input
                    id="nl-cta-url"
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                  />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="nl-hero">Картинка mockup (URL, опционально)</Label>
              <Input
                id="nl-hero"
                placeholder="По умолчанию /email/newsletter/phone-mockup.png"
                value={heroImageUrl}
                onChange={(e) => setHeroImageUrl(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                disabled={previewMut.isPending}
                onClick={() => previewMut.mutate()}
              >
                {previewMut.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : null}
                Превью
              </Button>
            </div>

            <div className="flex flex-wrap items-end gap-2 pt-2 border-t">
              <div className="space-y-1.5 flex-1 min-w-[180px]">
                <Label htmlFor="nl-test">Тест на email</Label>
                <Input
                  id="nl-test"
                  value={testTo}
                  onChange={(e) => setTestTo(e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={testMut.isPending || !testTo.trim()}
                onClick={() => testMut.mutate()}
              >
                {testMut.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-1" />
                )}
                Тест
              </Button>
            </div>

            <Button
              type="button"
              className="w-full"
              disabled={enqueueMut.isPending || activeCount === 0}
              onClick={() => {
                if (
                  !confirm(
                    `Поставить в очередь ${activeCount} писем? Отправка начнётся только при включённой автоотправке (или «Слать пачку сейчас»).`,
                  )
                ) {
                  return;
                }
                enqueueMut.mutate();
              }}
            >
              {enqueueMut.isPending ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <ListPlus className="w-4 h-4 mr-1" />
              )}
              В очередь ({activeCount})
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Превью HTML</CardTitle>
          </CardHeader>
          <CardContent>
            {previewHtml ? (
              <iframe
                title="newsletter-preview"
                className="w-full h-[520px] rounded-md border bg-white"
                srcDoc={previewHtml}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Нажмите «Превью», чтобы увидеть письмо.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Очередь отправки (pending / processing)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Статус</th>
                  <th className="px-3 py-2 font-medium">В очереди с</th>
                </tr>
              </thead>
              <tbody>
                {(queueRowsQ.data || []).map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-3 py-2">{r.email}</td>
                    <td className="px-3 py-2">{r.status}</td>
                    <td className="px-3 py-2">
                      {new Date(r.created_at).toLocaleString("ru-RU")}
                    </td>
                  </tr>
                ))}
                {!queueRowsQ.data?.length && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-6 text-center text-muted-foreground"
                    >
                      Очередь пуста. Нажмите «В очередь».
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Подписчики (opt-in)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 items-end">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="client@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Имя</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Иван"
              />
            </div>
            <Button
              type="button"
              disabled={addSubMut.isPending}
              onClick={() => addSubMut.mutate()}
            >
              Добавить с согласием
            </Button>
          </div>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Имя</th>
                  <th className="px-3 py-2 font-medium">Статус</th>
                </tr>
              </thead>
              <tbody>
                {(subscribersQ.data || []).slice(0, 50).map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="px-3 py-2">{s.email}</td>
                    <td className="px-3 py-2">{s.full_name || "—"}</td>
                    <td className="px-3 py-2">
                      {s.unsubscribed_at
                        ? "отписан"
                        : s.marketing_opt_in
                          ? "opt-in"
                          : "без согласия"}
                    </td>
                  </tr>
                ))}
                {!subscribersQ.data?.length && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-3 py-6 text-center text-muted-foreground"
                    >
                      Пока пусто. Добавьте email с согласием.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Последние кампании</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Тема</th>
                  <th className="px-3 py-2 font-medium">Шаблон</th>
                  <th className="px-3 py-2 font-medium">Статус</th>
                  <th className="px-3 py-2 font-medium">Отправлено</th>
                  <th className="px-3 py-2 font-medium">Дата</th>
                </tr>
              </thead>
              <tbody>
                {(campaignsQ.data || []).map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="px-3 py-2">{c.subject}</td>
                    <td className="px-3 py-2">{c.template_key || "—"}</td>
                    <td className="px-3 py-2">{c.status}</td>
                    <td className="px-3 py-2">
                      {c.sent_count}/{c.recipient_count}
                      {c.fail_count ? ` (−${c.fail_count})` : ""}
                    </td>
                    <td className="px-3 py-2">
                      {new Date(c.created_at).toLocaleString("ru-RU")}
                    </td>
                  </tr>
                ))}
                {!campaignsQ.data?.length && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-6 text-center text-muted-foreground"
                    >
                      Кампаний ещё не было.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
