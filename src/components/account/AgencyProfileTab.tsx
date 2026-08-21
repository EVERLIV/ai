import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  useMyAgency,
  useRequestAgencyVerification,
  useUpdateAgency,
  useUploadAgencyLogo,
} from "@/hooks/useAgency";
import { VERIFICATION_LABELS, isProfileVerified } from "@/hooks/useProfile";
import VerifiedBadge from "@/components/VerifiedBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Clock, ExternalLink, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { ensureAgencyForUserApi } from "@/lib/agencyApi";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useQueryClient } from "@tanstack/react-query";

export default function AgencyProfileTab() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data, isLoading, refetch } = useMyAgency();
  const updateAgency = useUpdateAgency();
  const requestVerification = useRequestAgencyVerification();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const agency = data?.agency;
  const uploadLogo = useUploadAgencyLogo(agency?.id);

  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [openedAt, setOpenedAt] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [ensuring, setEnsuring] = useState(false);

  useEffect(() => {
    if (!agency) return;
    setName(agency.name || "");
    setAbout(agency.about || "");
    setOpenedAt(agency.opened_at || "");
    setWorkingHours(agency.working_hours || "");
  }, [agency]);

  useEffect(() => {
    if (!user || isLoading || data || ensuring) return;
    if (profile?.account_type !== "agency" && profile?.account_type !== "realtor") return;
    setEnsuring(true);
    ensureAgencyForUserApi(user.id, {
      name: profile.agency_name || undefined,
      about: profile.agency_about || undefined,
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
  }, [user, isLoading, data, ensuring, profile, queryClient, refetch, toast]);

  const save = async () => {
    if (!agency) return;
    try {
      await updateAgency.mutateAsync({
        agencyId: agency.id,
        payload: {
          name: name.trim(),
          about: about.trim(),
          opened_at: openedAt || null,
          working_hours: workingHours.trim(),
        },
      });
      toast({ title: "Данные агентства сохранены" });
    } catch (err) {
      toast({
        title: "Ошибка сохранения",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      });
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
    }
  };

  if (isLoading || ensuring) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
        <Loader2 className="w-4 h-4 animate-spin" /> Загрузка агентства…
      </div>
    );
  }

  if (!agency) {
    return (
      <p className="text-sm text-muted-foreground py-6">
        Агентство не найдено. Зарегистрируйтесь как агентство или обратитесь в поддержку.
      </p>
    );
  }

  const verified = isProfileVerified(agency.verification_status);
  const status = agency.verification_status;

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Профиль агентства</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Эти данные видны на публичной странице агентства.
          </p>
        </div>
        <Link
          to={`/agentstvo/${agency.id}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          Открыть страницу <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative w-20 h-20 rounded-xl border border-border overflow-hidden bg-muted flex items-center justify-center"
        >
          {agency.logo_url ? (
            <img src={agency.logo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <Camera className="w-5 h-5 text-muted-foreground" />
          )}
          {uploadLogo.isPending && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onLogo} />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{VERIFICATION_LABELS[status]}</span>
            {verified && <VerifiedBadge />}
          </div>
          {(status === "unverified" || status === "rejected") && (
            <Button
              size="sm"
              variant="outline"
              disabled={requestVerification.isPending}
              onClick={async () => {
                try {
                  await requestVerification.mutateAsync(agency.id);
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
              {requestVerification.isPending ? (
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

      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Название</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Описание</span>
        <Textarea value={about} onChange={(e) => setAbout(e.target.value)} rows={4} />
      </label>

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Дата открытия</span>
          <input
            type="date"
            value={openedAt}
            onChange={(e) => setOpenedAt(e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Часы работы</span>
          <input
            value={workingHours}
            onChange={(e) => setWorkingHours(e.target.value)}
            placeholder="Пн–Пт 10:00–19:00"
            className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm"
          />
        </label>
      </div>

      <Button onClick={save} disabled={updateAgency.isPending}>
        {updateAgency.isPending && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
        Сохранить
      </Button>
    </div>
  );
}
