import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, RefreshCw, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import {
  SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from "@/integrations/supabase/adminClient";
import {
  previewNewsletter,
  sendNewsletterCampaign,
  sendNewsletterTest,
  type NewsletterPayload,
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
  recipient_count: number;
  sent_count: number;
  fail_count: number;
  created_at: string;
  finished_at: string | null;
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
  /** КП предложение — CTA «Скачать презентацию» + ссылка на файл */
  const [offerType, setOfferType] = useState<"kp" | "custom">("kp");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [testTo, setTestTo] = useState(user?.email || "");
  const [previewHtml, setPreviewHtml] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");

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
        "newsletter_campaigns?select=id,subject,status,recipient_count,sent_count,fail_count,created_at,finished_at&order=created_at.desc&limit=20",
      ),
  });

  const activeCount = activeCountQ.data ?? 0;

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

  const campaignMut = useMutation({
    mutationFn: () => sendNewsletterCampaign(payload),
    onSuccess: (data) => {
      toast.success(
        `Кампания: отправлено ${data.sent ?? 0}, ошибок ${data.failed ?? 0}`,
      );
      qc.invalidateQueries({ queryKey: ["newsletter-campaigns"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addSubMut = useMutation({
    mutationFn: async () => {
      const email = newEmail.trim().toLowerCase();
      if (!email || !email.includes("@")) {
        throw new Error("Укажите корректный email");
      }
      await serviceFetch(
        "newsletter_subscribers?on_conflict=email",
        {
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
        },
      );
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
            SMTP Timeweb · только подписчики с marketing_opt_in. Активных:{" "}
            <strong>{activeCount}</strong>
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            subscribersQ.refetch();
            activeCountQ.refetch();
            campaignsQ.refetch();
          }}
        >
          <RefreshCw className="w-4 h-4 mr-1" /> Обновить
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Письмо</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
            <div className="space-y-1.5">
              <Label>Вложение / оффер</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={offerType === "kp" ? "default" : "outline"}
                  onClick={() => {
                    setOfferType("kp");
                    setCtaLabel("Скачать презентацию");
                  }}
                >
                  КП предложение
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={offerType === "custom" ? "default" : "outline"}
                  onClick={() => setOfferType("custom")}
                >
                  Своя кнопка
                </Button>
              </div>
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
                <p className="text-[11px] text-muted-foreground">
                  Кнопка в письме: «Скачать презентацию». URL можно вставить
                  позже — до отправки.
                </p>
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
              <Label htmlFor="nl-hero">Mockup телефона (URL, опционально)</Label>
              <Input
                id="nl-hero"
                placeholder="По умолчанию /email/newsletter/phone-mockup.png"
                value={heroImageUrl}
                onChange={(e) => setHeroImageUrl(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Макет Figma «Шаблон письма». Превью: /email/newsletter-campaign.html
              </p>
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
              disabled={campaignMut.isPending || activeCount === 0}
              onClick={() => {
                if (
                  !confirm(
                    `Отправить кампанию ${activeCount} подписчикам с согласием?`,
                  )
                ) {
                  return;
                }
                campaignMut.mutate();
              }}
            >
              {campaignMut.isPending ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-1" />
              )}
              Отправить кампанию ({activeCount})
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
                  <th className="px-3 py-2 font-medium">Статус</th>
                  <th className="px-3 py-2 font-medium">Отправлено</th>
                  <th className="px-3 py-2 font-medium">Дата</th>
                </tr>
              </thead>
              <tbody>
                {(campaignsQ.data || []).map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="px-3 py-2">{c.subject}</td>
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
                      colSpan={4}
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
