import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Mail,
  RefreshCw,
  Send,
  ListPlus,
  Play,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
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
import { cn } from "@/lib/utils";

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

function statusBadge(status: string) {
  const map: Record<
    string,
    { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
  > = {
    queued: { label: "В очереди", variant: "secondary" },
    sending: { label: "Отправка", variant: "default" },
    sent: { label: "Отправлено", variant: "secondary" },
    failed: { label: "Ошибка", variant: "destructive" },
    partial: { label: "Частично", variant: "outline" },
    draft: { label: "Черновик", variant: "outline" },
    pending: { label: "Ожидает", variant: "secondary" },
    processing: { label: "В работе", variant: "default" },
  };
  const item = map[status] || { label: status, variant: "outline" as const };
  return <Badge variant={item.variant}>{item.label}</Badge>;
}

function templateLabel(key?: string | null) {
  return NEWSLETTER_TEMPLATES.find((t) => t.key === key)?.label || "—";
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
    "Кратко расскажите о предложении и пригласите скачать презентацию.",
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

  const refreshAll = () => {
    subscribersQ.refetch();
    activeCountQ.refetch();
    campaignsQ.refetch();
    queueStatusQ.refetch();
    queueRowsQ.refetch();
    settingsQ.refetch();
  };

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
      toast.success(`Добавлено в очередь: ${data.queued ?? 0}`);
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
      toast.success(data.sendingEnabled ? "Рассылка включена" : "Рассылка выключена");
      qc.invalidateQueries({ queryKey: ["newsletter-settings"] });
      qc.invalidateQueries({ queryKey: ["newsletter-queue-status"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const drainMut = useMutation({
    mutationFn: () => processNewsletterQueue(),
    onSuccess: (data) => {
      if (data.skipped === "disabled") {
        toast.message("Сначала включите рассылку");
      } else {
        toast.success(
          `Отправлено ${data.sent ?? 0}${data.failed ? `, ошибок ${data.failed}` : ""}`,
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
      const raw = newEmail.trim();
      if (!raw) throw new Error("Добавьте хотя бы один email");

      const parts = raw
        .split(/[,;\n\r\t]+/)
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const unique: string[] = [];
      const seen = new Set<string>();
      const invalid: string[] = [];

      for (const p of parts) {
        if (!emailRe.test(p)) {
          invalid.push(p);
          continue;
        }
        if (seen.has(p)) continue;
        seen.add(p);
        unique.push(p);
      }

      if (unique.length === 0) {
        throw new Error("Нет корректных адресов");
      }

      const name = newName.trim();
      const rows = unique.map((email) => ({
        email,
        full_name: unique.length === 1 ? name : name || "",
        marketing_opt_in: true,
        unsubscribed_at: null,
        source: "admin",
      }));

      for (let i = 0; i < rows.length; i += 100) {
        const chunk = rows.slice(i, i + 100);
        await serviceFetch("newsletter_subscribers?on_conflict=email", {
          method: "POST",
          headers: {
            Prefer: "resolution=merge-duplicates,return=minimal",
          },
          body: JSON.stringify(chunk),
        });
      }

      return { added: unique.length, invalid: invalid.length };
    },
    onSuccess: (data) => {
      toast.success(
        data.added === 1
          ? "Адрес добавлен"
          : `Добавлено адресов: ${data.added}`,
      );
      setNewEmail("");
      setNewName("");
      qc.invalidateQueries({ queryKey: ["newsletter-subscribers"] });
      qc.invalidateQueries({ queryKey: ["newsletter-active-count"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Mail className="size-5 text-primary" />
            Рассылки
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Получатели {activeCount}</Badge>
            <Badge variant={pendingCount ? "default" : "outline"}>
              Очередь {pendingCount}
            </Badge>
            {processingCount > 0 ? (
              <Badge>В работе {processingCount}</Badge>
            ) : null}
            <Badge variant={sendingEnabled ? "default" : "outline"}>
              {sendingEnabled ? "Отправка вкл." : "Отправка выкл."}
            </Badge>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={refreshAll}>
          <RefreshCw data-icon="inline-start" />
          Обновить
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-row items-center justify-between gap-4 py-4">
          <CardTitle className="text-base">Автоотправка</CardTitle>
          <div className="flex items-center gap-3">
            <Switch
              checked={sendingEnabled}
              disabled={toggleMut.isPending || settingsQ.isLoading}
              onCheckedChange={(v) => toggleMut.mutate(v)}
              aria-label="Автоотправка"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={drainMut.isPending}
              onClick={() => drainMut.mutate()}
            >
              {drainMut.isPending ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : (
                <Play data-icon="inline-start" />
              )}
              Отправить пачку
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Письмо</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Шаблон</Label>
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                className="flex flex-wrap justify-start"
                value={templateKey}
                onValueChange={(v) => {
                  if (!v) return;
                  const key = v as NewsletterTemplateKey;
                  setTemplateKey(key);
                  if (key === "partner_kp") {
                    setCtaLabel("Скачать презентацию");
                  }
                }}
              >
                {NEWSLETTER_TEMPLATES.map((t) => (
                  <ToggleGroupItem key={t.key} value={t.key} className="px-3">
                    {t.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="nl-subject">Тема</Label>
              <Input
                id="nl-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="nl-headline-red">Заголовок</Label>
                <Input
                  id="nl-headline-red"
                  value={headlineRed}
                  onChange={(e) => setHeadlineRed(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="nl-headline">Продолжение</Label>
                <Input
                  id="nl-headline"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="nl-intro">Вступление</Label>
              <Textarea
                id="nl-intro"
                rows={3}
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="nl-body">Основной текст</Label>
              <Textarea
                id="nl-body"
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            {offerType === "kp" ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="nl-kp-url">Ссылка на презентацию</Label>
                <Input
                  id="nl-kp-url"
                  placeholder="https://"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="nl-cta-label">Текст кнопки</Label>
                  <Input
                    id="nl-cta-label"
                    value={ctaLabel}
                    onChange={(e) => setCtaLabel(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="nl-cta-url">Ссылка кнопки</Label>
                  <Input
                    id="nl-cta-url"
                    placeholder="https://"
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="nl-hero">Изображение (URL)</Label>
              <Input
                id="nl-hero"
                placeholder="Необязательно"
                value={heroImageUrl}
                onChange={(e) => setHeroImageUrl(e.target.value)}
              />
            </div>

            <Separator />

            <div className="flex flex-wrap items-end gap-2">
              <div className="flex min-w-[180px] flex-1 flex-col gap-2">
                <Label htmlFor="nl-test">Тестовый адрес</Label>
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
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                ) : (
                  <Send data-icon="inline-start" />
                )}
                Тест
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={previewMut.isPending}
                onClick={() => previewMut.mutate()}
              >
                {previewMut.isPending ? (
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                ) : null}
                Превью
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="button"
              className="w-full"
              disabled={enqueueMut.isPending || activeCount === 0}
              onClick={() => {
                if (
                  !confirm(
                    `Добавить письмо в очередь для ${activeCount} получателей?`,
                  )
                ) {
                  return;
                }
                enqueueMut.mutate();
              }}
            >
              {enqueueMut.isPending ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : (
                <ListPlus data-icon="inline-start" />
              )}
              В очередь · {activeCount}
            </Button>
          </CardFooter>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">Превью</CardTitle>
          </CardHeader>
          <CardContent>
            {previewHtml ? (
              <iframe
                title="newsletter-preview"
                className="h-[560px] w-full rounded-md border bg-background"
                srcDoc={previewHtml}
              />
            ) : (
              <div
                className={cn(
                  "flex h-[560px] items-center justify-center rounded-md border border-dashed",
                  "text-sm text-muted-foreground",
                )}
              >
                Нажмите «Превью»
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Получатели</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nl-emails">Адреса</Label>
            <Textarea
              id="nl-emails"
              rows={3}
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="a@mail.ru, b@mail.ru"
            />
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex min-w-[160px] flex-col gap-2">
              <Label htmlFor="nl-name">Имя</Label>
              <Input
                id="nl-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Необязательно"
              />
            </div>
            <Button
              type="button"
              disabled={addSubMut.isPending || !newEmail.trim()}
              onClick={() => addSubMut.mutate()}
            >
              {addSubMut.isPending ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : null}
              Добавить
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Имя</TableHead>
                  <TableHead>Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(subscribersQ.data || []).slice(0, 50).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {s.full_name || "—"}
                    </TableCell>
                    <TableCell>
                      {s.unsubscribed_at ? (
                        <Badge variant="outline">Отписан</Badge>
                      ) : s.marketing_opt_in ? (
                        <Badge variant="secondary">Активен</Badge>
                      ) : (
                        <Badge variant="outline">Неактивен</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!subscribersQ.data?.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="py-8 text-center text-muted-foreground"
                    >
                      Список пуст
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Очередь</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(queueRowsQ.data || []).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.email}</TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(r.created_at).toLocaleString("ru-RU")}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!queueRowsQ.data?.length ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="py-8 text-center text-muted-foreground"
                      >
                        Очередь пуста
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">История</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Тема</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Отправлено</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(campaignsQ.data || []).map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="truncate font-medium">{c.subject}</span>
                          <span className="text-xs text-muted-foreground">
                            {templateLabel(c.template_key)} ·{" "}
                            {new Date(c.created_at).toLocaleString("ru-RU")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{statusBadge(c.status)}</TableCell>
                      <TableCell>
                        {c.sent_count}/{c.recipient_count}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!campaignsQ.data?.length ? (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="py-8 text-center text-muted-foreground"
                      >
                        Пока нет кампаний
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
