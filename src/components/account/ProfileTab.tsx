import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  useProfile,
  useUpdateProfile,
  useRequestVerification,
  ACCOUNT_TYPE_LABELS,
  VERIFICATION_LABELS,
  isProfileVerified,
} from "@/hooks/useProfile";
import VerifiedBadge from "@/components/VerifiedBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ShieldCheck, ShieldAlert, Clock, Loader2 } from "lucide-react";

export default function ProfileTab() {
  const { toast } = useToast();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const requestVerification = useRequestVerification();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [agencyStaffCount, setAgencyStaffCount] = useState("");
  const [agencyAbout, setAgencyAbout] = useState("");

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name || "");
    setEmail(profile.email || "");
    setPhone(profile.phone || "");
    setAgencyName(profile.agency_name || "");
    setAgencyStaffCount(profile.agency_staff_count != null ? String(profile.agency_staff_count) : "");
    setAgencyAbout(profile.agency_about || "");
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        agency_name: agencyName.trim(),
        agency_staff_count: agencyStaffCount ? Number(agencyStaffCount) : null,
        agency_about: agencyAbout.trim(),
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

  const handleRequestVerification = async () => {
    try {
      await updateProfile.mutateAsync({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        agency_name: agencyName.trim(),
        agency_staff_count: agencyStaffCount ? Number(agencyStaffCount) : null,
        agency_about: agencyAbout.trim(),
      });
      await requestVerification.mutateAsync();
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Загрузка...
      </div>
    );
  }

  const isRealtor = profile?.account_type === "realtor";
  const verified = isProfileVerified(profile?.verification_status);
  const pending = profile?.verification_status === "pending";
  const rejected = profile?.verification_status === "rejected";
  const canRequest = !verified && !pending;

  const inputClass =
    "w-full h-10 px-3 bg-background border border-border text-sm text-foreground focus:outline-none focus:border-primary transition-colors";

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-xl font-bold text-foreground">Мои данные</h2>
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
              {VERIFICATION_LABELS[profile?.verification_status || "unverified"]}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {pending
                ? "Заявка на проверке. Обычно это занимает 1–2 рабочих дня."
                : rejected
                  ? "Заявка отклонена. Проверьте данные и подайте повторно."
                  : "Заполните профиль и подайте заявку на верификацию — после проверки появится золотая отметка в каталоге."}
            </p>
            {canRequest && (
              <Button
                size="sm"
                className="mt-3 gap-1.5"
                onClick={handleRequestVerification}
                disabled={requestVerification.isPending || updateProfile.isPending}
              >
                <ShieldCheck className="w-4 h-4" />
                {requestVerification.isPending ? "Отправка..." : "Подать на верификацию"}
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="bg-card border border-border p-6 space-y-4">
        <div>
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
            Тип аккаунта
          </label>
          <div className="h-10 px-3 bg-muted border border-border flex items-center text-sm text-foreground">
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

        {isRealtor && (
          <>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
                Название агентства (по документам)
              </label>
              <input
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                className={inputClass}
                placeholder="ООО «Название»"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
                Количество сотрудников
              </label>
              <input
                type="number"
                min={1}
                value={agencyStaffCount}
                onChange={(e) => setAgencyStaffCount(e.target.value)}
                className={inputClass}
                placeholder="5"
              />
            </div>
          </>
        )}

        <div>
          <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide block mb-1.5">
            {isRealtor ? "Об агентстве" : "О себе"}
          </label>
          <Textarea
            value={agencyAbout}
            onChange={(e) => setAgencyAbout(e.target.value)}
            rows={4}
            className="text-sm resize-none"
            placeholder={
              isRealtor
                ? "Расскажите об агентстве, специализации, опыте..."
                : "Расскажите о себе как о собственнике..."
            }
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            onClick={handleSave}
            disabled={updateProfile.isPending}
            variant="outline"
          >
            {updateProfile.isPending ? "Сохранение..." : "Сохранить"}
          </Button>
          {canRequest && (
            <Button
              onClick={handleRequestVerification}
              disabled={requestVerification.isPending || updateProfile.isPending}
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
