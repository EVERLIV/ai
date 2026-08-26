import { useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  Clock,
  ExternalLink,
  Loader2,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import StorageImage from "@/components/StorageImage";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import VerifiedBadge from "@/components/VerifiedBadge";
import { useToast } from "@/hooks/use-toast";
import {
  useMyAgency,
  useRequestAgencyVerification,
  useUpdateAgency,
  useUploadAgencyLogo,
} from "@/hooks/useAgency";
import { useAuth } from "@/hooks/useAuth";
import {
  ACCOUNT_TYPE_LABELS,
  isProfileVerified,
  useProfile,
  useRequestVerification,
  useUpdateProfile,
  VERIFICATION_LABELS,
} from "@/hooks/useProfile";
import { ensureAgencyForUserApi } from "@/lib/agencyApi";
import {
  useMyDeveloper,
  useRequestDeveloperVerification,
  useUpdateDeveloper,
  useUploadDeveloperLogo,
} from "@/hooks/useDeveloper";
import {
  DEVELOPER_SUBTYPE_LABELS,
  type DeveloperSubtype,
} from "@/lib/developerTypes";

const inputClass =
  "w-full h-7 px-3 rounded bg-background border border-border text-sm text-foreground focus:outline-none focus:border-primary transition-colors";

/**
 * Единый профиль:
 * — собственник / риелтор / ищущий: личные данные
 * — агентство: название агентства + ответственный + публичные данные агентства
 * — застройщик: компания + subtype + верификация
 */
export default function ProfileTab() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const requestOwnerVerification = useRequestVerification();

  const isAgencyAccount = profile?.account_type === "agency";
  const isDeveloperAccount = profile?.account_type === "developer";
  const { data: agencyData, isLoading: agencyLoading, refetch } = useMyAgency();
  const { data: developer, isLoading: developerLoading } = useMyDeveloper();
  const updateAgency = useUpdateAgency();
  const updateDeveloper = useUpdateDeveloper();
  const requestAgencyVerification = useRequestAgencyVerification();
  const requestDeveloperVerification = useRequestDeveloperVerification();
  const agency = agencyData?.agency;
  const uploadLogo = useUploadAgencyLogo(agency?.id);
  const uploadDeveloperLogo = useUploadDeveloperLogo(developer?.id);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [aboutSelf, setAboutSelf] = useState("");
  const [devName, setDevName] = useState("");
  const [devAbout, setDevAbout] = useState("");
  const [devCity, setDevCity] = useState("");
  const [devPhone, setDevPhone] = useState("");
  const [devWebsite, setDevWebsite] = useState("");
  const [devSubtype, setDevSubtype] =
    useState<DeveloperSubtype>("apartment_developer");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [agencyName, setAgencyName] = useState("");
  const [agencyAbout, setAgencyAbout] = useState("");
  const [openedAt, setOpenedAt] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [ensuring, setEnsuring] = useState(false);
  const [aiConsultantEnabled, setAiConsultantEnabled] = useState(false);
  const [aiConsultantSaving, setAiConsultantSaving] = useState(false);

  const avatarRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name || "");
    setEmail(profile.email || "");
    setPhone(profile.phone || "");
    setAboutSelf(profile.agency_about || "");
    setAvatarUrl(profile.avatar_url || null);
    if (!agency) {
      setAgencyName(profile.agency_name || "");
      setAiConsultantEnabled(!!profile.ai_consultant_enabled);
    }
  }, [profile, agency]);

  useEffect(() => {
    if (!agency) return;
    setAgencyName(agency.name || "");
    setAgencyAbout(agency.about || "");
    setOpenedAt(agency.opened_at || "");
    setWorkingHours(agency.working_hours || "");
    setAiConsultantEnabled(!!agency.ai_consultant_enabled);
  }, [agency]);

  useEffect(() => {
    if (!developer) return;
    setDevName(developer.name || "");
    setDevAbout(developer.about || "");
    setDevCity(developer.city || "");
    setDevPhone(developer.phone || "");
    setDevWebsite(developer.website || "");
    setDevSubtype(developer.subtype);
  }, [developer]);

  useEffect(() => {
    if (!user || !isAgencyAccount || agencyLoading || agencyData || ensuring)
      return;
    setEnsuring(true);
    ensureAgencyForUserApi(user.id, {
      name: profile?.agency_name || undefined,
      about: profile?.agency_about || undefined,
    })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["my-agency", user.id] });
        refetch();
      })
      .catch((err) => {
        toast({
          title: "Не удалось создать агентство",
          description: err instanceof Error ? err.message : "",
          variant: "destructive",
        });
      })
      .finally(() => setEnsuring(false));
  }, [
    user,
    isAgencyAccount,
    agencyLoading,
    agencyData,
    ensuring,
    profile,
    queryClient,
    refetch,
    toast,
  ]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Файл слишком большой",
        description: "Максимум 2 МБ",
        variant: "destructive",
      });
      return;
    }
    setAvatarUploading(true);
    try {
      const canvas = document.createElement("canvas");
      const img = new Image();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        img.onload = () => {
          const size = 256;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d")!;
          const min = Math.min(img.width, img.height);
          const sx = (img.width - min) / 2;
          const sy = (img.height - min) / 2;
          ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });
      await updateProfile.mutateAsync({ avatar_url: dataUrl });
      setAvatarUrl(dataUrl);
      toast({ title: "Фото обновлено" });
    } catch (err) {
      toast({
        title: "Не удалось загрузить фото",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  const onLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !agency) return;
    try {
      await uploadLogo.mutateAsync(file);
      toast({ title: "Логотип обновлён" });
    } catch (err) {
      toast({
        title: "Не удалось загрузить логотип",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      });
    } finally {
      e.target.value = "";
    }
  };

  const onDeveloperLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !developer) return;
    try {
      await uploadDeveloperLogo.mutateAsync(file);
      toast({ title: "Логотип обновлён" });
    } catch (err) {
      toast({
        title: "Не удалось загрузить логотип",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      });
    } finally {
      e.target.value = "";
    }
  };

  const handleAiConsultantToggle = async (checked: boolean) => {
    const prev = aiConsultantEnabled;
    setAiConsultantEnabled(checked);
    setAiConsultantSaving(true);
    try {
      if (isAgencyAccount && agency) {
        await updateAgency.mutateAsync({
          agencyId: agency.id,
          payload: { ai_consultant_enabled: checked },
        });
      } else {
        await updateProfile.mutateAsync({
          ai_consultant_enabled: checked,
        });
      }
      toast({
        title: checked
          ? "ИИ-консультант включён"
          : "ИИ-консультант выключен",
      });
      void queryClient.invalidateQueries({ queryKey: ["ai-consultant-access"] });
      void queryClient.invalidateQueries({ queryKey: ["my-agency"] });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch (err) {
      setAiConsultantEnabled(prev);
      toast({
        title: "Не удалось сохранить",
        description: err instanceof Error ? err.message : "Попробуйте позже",
        variant: "destructive",
      });
    } finally {
      setAiConsultantSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      if (isAgencyAccount) {
        await updateProfile.mutateAsync({
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          agency_name: agencyName.trim(),
        });
        if (agency) {
          await updateAgency.mutateAsync({
            agencyId: agency.id,
            payload: {
              name: agencyName.trim(),
              about: agencyAbout.trim(),
              opened_at: openedAt || null,
              working_hours: workingHours.trim(),
            },
          });
        }
        toast({ title: "Данные сохранены" });
        return;
      }

      await updateProfile.mutateAsync({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        agency_about: aboutSelf.trim(),
      });
      toast({ title: "Данные сохранены" });
    } catch (err) {
      toast({
        title: "Ошибка сохранения",
        description: err instanceof Error ? err.message : "Попробуйте позже",
        variant: "destructive",
      });
    }
  };

  const handleRequestOwnerVerification = async () => {
    try {
      await updateProfile.mutateAsync({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        agency_about: aboutSelf.trim(),
      });
      await requestOwnerVerification.mutateAsync();
      toast({
        title: "Заявка отправлена",
        description: "Мы проверим данные и свяжемся с вами",
      });
    } catch (err) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Попробуйте позже",
        variant: "destructive",
      });
    }
  };

  const saving =
    updateProfile.isPending ||
    updateAgency.isPending ||
    updateDeveloper.isPending ||
    uploadDeveloperLogo.isPending ||
    avatarUploading;

  if (
    profileLoading ||
    (isAgencyAccount && (agencyLoading || ensuring)) ||
    (isDeveloperAccount && developerLoading)
  ) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Загрузка...
      </div>
    );
  }

  if (isDeveloperAccount && !developer) {
    return (
      <p className="text-sm text-muted-foreground py-6">
        Профиль застройщика не найден. Обратитесь в поддержку.
      </p>
    );
  }

  if (isDeveloperAccount && developer) {
    const verified = isProfileVerified(developer.verification_status);
    const status = developer.verification_status;
    return (
      <div className="space-y-6 max-w-xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              Профиль застройщика
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Публичные данные компании
            </p>
          </div>
          <Link
            to={`/zastroyshchik/${developer.id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Открыть страницу <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-card border border-border/60 rounded-lg p-5 space-y-4">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => logoRef.current?.click()}
              className="relative w-20 h-20 rounded-xl border border-border overflow-hidden bg-muted flex items-center justify-center shrink-0"
            >
              {developer.logo_url ? (
                <StorageImage
                  src={developer.logo_url}
                  alt=""
                  className="w-full h-full object-cover"
                  fallback={<Camera className="w-5 h-5 text-muted-foreground" />}
                />
              ) : (
                <Camera className="w-5 h-5 text-muted-foreground" />
              )}
              {uploadDeveloperLogo.isPending && (
                <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              )}
            </button>
            <input
              ref={logoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onDeveloperLogo}
            />
            <div className="space-y-2 min-w-0">
              <p className="text-xs text-muted-foreground">Логотип компании</p>
              <div className="flex flex-wrap items-center gap-2">
                {verified ? (
                  <VerifiedBadge />
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {VERIFICATION_LABELS[status]}
                  </span>
                )}
              </div>
              {(status === "unverified" || status === "rejected") && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={requestDeveloperVerification.isPending}
                  onClick={async () => {
                    await requestDeveloperVerification.mutateAsync(developer.id);
                    toast({ title: "Заявка на верификацию отправлена" });
                  }}
                >
                  Запросить верификацию
                </Button>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Название
            </label>
            <input
              className={inputClass}
              value={devName}
              onChange={(e) => setDevName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Тип
            </label>
            <select
              className={inputClass}
              value={devSubtype}
              onChange={(e) =>
                setDevSubtype(e.target.value as DeveloperSubtype)
              }
            >
              {(
                Object.keys(DEVELOPER_SUBTYPE_LABELS) as DeveloperSubtype[]
              ).map((k) => (
                <option key={k} value={k}>
                  {DEVELOPER_SUBTYPE_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              О компании
            </label>
            <Textarea
              value={devAbout}
              onChange={(e) => setDevAbout(e.target.value)}
              rows={4}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Город
              </label>
              <input
                className={inputClass}
                value={devCity}
                onChange={(e) => setDevCity(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Телефон
              </label>
              <input
                className={inputClass}
                value={devPhone}
                onChange={(e) => setDevPhone(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Сайт
            </label>
            <input
              className={inputClass}
              value={devWebsite}
              onChange={(e) => setDevWebsite(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Ответственный (ФИО)
            </label>
            <input
              className={inputClass}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <Button
            type="button"
            disabled={saving}
            onClick={async () => {
              try {
                await updateDeveloper.mutateAsync({
                  developerId: developer.id,
                  patch: {
                    name: devName.trim(),
                    about: devAbout.trim(),
                    city: devCity.trim(),
                    phone: devPhone.trim(),
                    website: devWebsite.trim() || null,
                    subtype: devSubtype,
                  },
                });
                await updateProfile.mutateAsync({
                  full_name: fullName.trim(),
                  phone: phone.trim() || null,
                });
                toast({ title: "Сохранено" });
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
            Сохранить
          </Button>
        </div>
      </div>
    );
  }

  if (isAgencyAccount && !agency) {
    return (
      <p className="text-sm text-muted-foreground py-6">
        Агентство не найдено. Обратитесь в поддержку.
      </p>
    );
  }

  /* ─── Agency unified profile ─── */
  if (isAgencyAccount && agency) {
    const verified = isProfileVerified(agency.verification_status);
    const status = agency.verification_status;

    return (
      <div className="space-y-6 max-w-xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              Профиль агентства
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Данные аккаунта и публичной страницы агентства
            </p>
          </div>
          <Link
            to={`/agentstvo/${agency.id}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Открыть страницу <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <div className="bg-card border border-border/60 rounded-lg p-5 space-y-5">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => logoRef.current?.click()}
              className="relative w-20 h-20 rounded-xl border border-border overflow-hidden bg-muted flex items-center justify-center shrink-0"
            >
              {agency.logo_url ? (
                <StorageImage
                  src={agency.logo_url}
                  alt=""
                  className="w-full h-full object-cover"
                  fallback={<Camera className="w-5 h-5 text-muted-foreground" />}
                />
              ) : (
                <Camera className="w-5 h-5 text-muted-foreground" />
              )}
              {uploadLogo.isPending && (
                <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              )}
            </button>
            <input
              ref={logoRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onLogo}
            />
            <div className="space-y-2 min-w-0">
              <p className="text-xs text-muted-foreground">Логотип агентства</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">
                  {VERIFICATION_LABELS[status]}
                </span>
                {verified && <VerifiedBadge />}
              </div>
              {(status === "unverified" || status === "rejected") && (
                <Button
                  size="sm"
                  className="rounded-md"
                  disabled={requestAgencyVerification.isPending}
                  onClick={async () => {
                    try {
                      await requestAgencyVerification.mutateAsync(agency.id);
                      toast({ title: "Заявка на верификацию отправлена" });
                    } catch (err) {
                      toast({
                        title: "Не удалось отправить",
                        description: err instanceof Error ? err.message : "",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  {requestAgencyVerification.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  ) : status === "rejected" ? (
                    <ShieldAlert className="w-3.5 h-3.5 mr-1" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  )}
                  Запросить верификацию
                </Button>
              )}
              {status === "pending" && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> На проверке у модераторов
                </p>
              )}
            </div>
          </div>

          <div className="pt-1 border-t border-border/60">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Агентство
            </p>
            <div className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Название агентства
                </span>
                <input
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  placeholder="ООО «АрендаСити»"
                  className={inputClass}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Описание
                </span>
                <Textarea
                  value={agencyAbout}
                  onChange={(e) => setAgencyAbout(e.target.value)}
                  rows={4}
                  placeholder="О компании, специализации, районах работы…"
                />
              </label>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    Дата открытия
                  </span>
                  <input
                    type="date"
                    value={openedAt}
                    onChange={(e) => setOpenedAt(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    Часы работы
                  </span>
                  <input
                    value={workingHours}
                    onChange={(e) => setWorkingHours(e.target.value)}
                    placeholder="Пн–Пт 10:00–19:00"
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="flex items-start justify-between gap-4 rounded-lg border border-border/60 bg-muted/30 px-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    ИИ-консультант
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">
                    Чат и голосовой звонок на ваших объектах. Рекомендует только
                    объявления вашего агентства.
                  </p>
                </div>
                <Switch
                  checked={aiConsultantEnabled}
                  disabled={aiConsultantSaving || updateAgency.isPending}
                  onCheckedChange={handleAiConsultantToggle}
                />
              </div>
            </div>
          </div>

          <div className="pt-1 border-t border-border/60">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Ответственный за аккаунт
            </p>
            <div className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Имя ответственного
                </span>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Иван Иванов"
                  className={inputClass}
                />
                <p className="text-[11px] text-muted-foreground">
                  Кто регистрировал и управляет этим аккаунтом
                </p>
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Email
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Телефон
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (999) 000-00-00"
                  className={inputClass}
                />
              </label>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
            Сохранить
          </Button>
        </div>
      </div>
    );
  }

  /* ─── Owner / realtor / seeker ─── */
  const verified = isProfileVerified(profile?.verification_status);
  const pending = profile?.verification_status === "pending";
  const rejected = profile?.verification_status === "rejected";
  const canRequest =
    !verified &&
    !pending &&
    profile?.account_type !== "realtor" &&
    profile?.account_type !== "agency";

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-xl font-bold text-foreground">
          Мои данные
        </h2>
        {verified && <VerifiedBadge size="md" />}
      </div>

      {!verified && (
        <div
          className={`mb-5 p-4 border rounded-lg flex items-start gap-3 ${
            pending
              ? "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
              : rejected
                ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
                : "bg-muted/50 border-border"
          }`}
        >
          {pending ? (
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {
                VERIFICATION_LABELS[
                  profile?.verification_status || "unverified"
                ]
              }
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {pending
                ? "Заявка на проверке. Обычно это занимает 1–2 рабочих дня."
                : rejected
                  ? "Заявка отклонена. Проверьте данные и подайте повторно."
                  : "Заполните профиль и подайте заявку на верификацию — после проверки появится зелёная отметка в каталоге."}
            </p>
            {canRequest && (
              <Button
                size="sm"
                className="mt-3 gap-1.5"
                onClick={handleRequestOwnerVerification}
                disabled={
                  requestOwnerVerification.isPending || updateProfile.isPending
                }
              >
                <ShieldCheck className="w-4 h-4" />
                {requestOwnerVerification.isPending
                  ? "Отправка..."
                  : "Подать на верификацию"}
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="bg-card p-6 space-y-4">
        <div className="flex items-center gap-4 pb-4">
          <button
            type="button"
            onClick={() => avatarRef.current?.click()}
            className="relative w-16 h-16 rounded-full bg-muted shrink-0 overflow-hidden group"
            disabled={avatarUploading}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Аватар"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-lg font-bold">
                {(profile?.full_name || "?")[0]?.toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {avatarUploading ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-white" />
              )}
            </div>
          </button>
          <input
            ref={avatarRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
          <div>
            <p className="text-sm font-medium text-foreground">Фото профиля</p>
            <p className="text-xs text-muted-foreground">
              Нажмите чтобы загрузить
            </p>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
            Тип аккаунта
          </label>
          <div className="h-10 px-3 bg-muted border border-border flex items-center text-sm text-foreground rounded-md">
            {ACCOUNT_TYPE_LABELS[profile?.account_type || "owner"]}
          </div>
        </div>

        <div>
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
            Имя и фамилия
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputClass}
            placeholder="Иван Иванов"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
            Телефон
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
            placeholder="+7 (999) 000-00-00"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
            О себе
          </label>
          <Textarea
            value={aboutSelf}
            onChange={(e) => setAboutSelf(e.target.value)}
            rows={4}
            className="text-sm resize-none"
            placeholder="Расскажите о себе..."
          />
        </div>

        {(profile?.account_type === "owner" ||
          profile?.account_type === "realtor") && (
          <div className="flex items-start justify-between gap-4 rounded-lg border border-border/60 bg-muted/30 px-3 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                ИИ-консультант
              </p>
              <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">
                Чат и голосовой звонок на ваших объявлениях. Рекомендует только
                ваши объекты.
              </p>
            </div>
            <Switch
              checked={aiConsultantEnabled}
              disabled={aiConsultantSaving || updateProfile.isPending}
              onCheckedChange={handleAiConsultantToggle}
            />
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          <Button onClick={handleSave} disabled={saving} variant="outline">
            {saving ? "Сохранение..." : "Сохранить"}
          </Button>
          {canRequest && (
            <Button
              onClick={handleRequestOwnerVerification}
              disabled={
                requestOwnerVerification.isPending || updateProfile.isPending
              }
              className="gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              Подать на верификацию
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
