import {
  ArrowUp,
  Check,
  Loader2,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import BrandMark from "@/components/BrandMark";
import LocationPickerModal from "@/components/LocationPickerModal";
import SmartListingPreview from "@/components/smart-listing/SmartListingPreview";
import TypingText from "@/components/smart-listing/TypingText";
import SeoHead from "@/components/SeoHead";
import { absoluteUrl } from "@/config/site";
import type { PropertySegment } from "@/config/propertySegments";
import { useAgencyManagers, useMyAgency } from "@/hooks/useAgency";
import { useAuth } from "@/hooks/useAuth";
import { useAllDictionaryValues } from "@/hooks/useDictionaries";
import { useMyDeveloper } from "@/hooks/useDeveloper";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { processPropertyPhotoFile } from "@/lib/processPropertyPhoto";
import { buildDeveloperListingExtras } from "@/lib/developerListing";
import { invokeListingAi } from "@/lib/listingAi";
import {
  applyListingDraftPatch,
  listingFormReadyForPhotos,
  listingPayloadOptions,
  type ListingAiPhase,
} from "@/lib/listingAiDraft";
import {
  type AccountRoleKind,
  type ListingFlowOpts,
  type LocationScope,
  buildWelcomeMessage,
  createAiListingForm,
  enrichSuggestions,
  firstNameFromFullName,
  isManagerSkipped,
  missingKeysFromForm,
  tryQuickApplyChip,
  chipsForField,
  nextListingField,
  promptForField,
  resolveLandlordType,
} from "@/lib/listingAiFlow";
import { IRKUTSK_CITY_DISTRICTS } from "@/lib/irkutskLocations";
import {
  listPropertyAiPath,
  listPropertyPath,
  loginToSmartListingPath,
} from "@/lib/listPropertyLinks";
import { buildPropertyPayload } from "@/lib/propertyFormMapper";
import {
  insertMyPropertyApi,
  updateMyPropertyApi,
  uploadMyPropertyPhotoApi,
} from "@/lib/userPropertyApi";
import { cn } from "@/lib/utils";

type ChatBubble = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  reasonedMs?: number;
  /** Печать как в мессенджере */
  animate?: boolean;
};

type Props = {
  segment?: PropertySegment;
};

export default function SmartListingPage({
  segment = "commercial",
}: Props) {
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: myAgency, isLoading: agencyLoading } = useMyAgency();
  const agencyId = myAgency?.agency?.id;
  const { data: agencyManagers = [] } = useAgencyManagers(agencyId, true);
  const { data: myDeveloper, isLoading: developerLoading } = useMyDeveloper();
  const { all: dictionaryAll } = useAllDictionaryValues();
  const catalogDistricts = useMemo(
    () => dictionaryAll.filter((i) => i.category === "district"),
    [dictionaryAll],
  );
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [phase, setPhase] = useState<ListingAiPhase>("intake");
  const [form, setForm] = useState(() => createAiListingForm(segment));
  const [segmentChosen, setSegmentChosen] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatBubble[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [enhanceBadge, setEnhanceBadge] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [readyForPhotos, setReadyForPhotos] = useState(false);
  const [readyToCommit, setReadyToCommit] = useState(false);
  const [typingBusy, setTypingBusy] = useState(false);
  const [photosSkipped, setPhotosSkipped] = useState(false);
  const [locationScope, setLocationScope] = useState<LocationScope>(null);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);

  const aiPath = listPropertyAiPath(form.segment || segment);

  const accountRole: AccountRoleKind = useMemo(() => {
    if (agencyId) return "agency";
    if (myDeveloper && !agencyId) return "developer";
    return "owner";
  }, [agencyId, myDeveloper]);

  const firstName = useMemo(() => {
    return (
      firstNameFromFullName(profile?.full_name) ||
      firstNameFromFullName(
        (user?.user_metadata as { full_name?: string } | undefined)?.full_name,
      )
    );
  }, [profile?.full_name, user?.user_metadata]);

  const companyName = useMemo(() => {
    if (accountRole === "agency") return myAgency?.agency?.name || "";
    if (accountRole === "developer") return myDeveloper?.name || "";
    return "";
  }, [accountRole, myAgency?.agency?.name, myDeveloper?.name]);

  const flowOpts: ListingFlowOpts = useMemo(
    () => ({
      photoCount: photoFiles.length,
      segmentChosen,
      firstName,
      accountRole,
      companyName,
      isAgency: accountRole === "agency",
      isDeveloper: accountRole === "developer",
      locationScope,
      photosSkipped,
      catalogDistricts,
      managers: agencyManagers.map((m) => ({
        id: m.id,
        full_name: m.full_name,
        phone: m.phone,
        photo_url: m.photo_url,
      })),
    }),
    [
      photoFiles.length,
      segmentChosen,
      firstName,
      accountRole,
      companyName,
      agencyManagers,
      locationScope,
      photosSkipped,
      catalogDistricts,
    ],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    return () => {
      for (const u of photoUrls) URL.revokeObjectURL(u);
    };
  }, [photoUrls]);

  const applyAiResult = useCallback(
    (res: Awaited<ReturnType<typeof invokeListingAi>>) => {
      setSessionId(res.sessionId);
      setPhase(res.phase);
      setForm((prev) => {
        const merged = applyListingDraftPatch(prev, res.draft);
        setMissingFields(
          res.missingFields?.length
            ? res.missingFields
            : missingKeysFromForm(merged, flowOpts),
        );
        setSuggestions(
          enrichSuggestions(merged, res.suggestedQuestions, flowOpts),
        );
        return merged;
      });
      setReadyForPhotos(res.readyForPhotos);
      setReadyToCommit(res.readyToCommit);
      setTypingBusy(true);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: res.reply,
          reasonedMs: res.reasonedMs,
          animate: true,
        },
      ]);
    },
    [flowOpts],
  );

  useEffect(() => {
    if (authLoading || profileLoading || agencyLoading || developerLoading) return;
    if (!user || bootstrapped) return;
    const blank = createAiListingForm(segment);
    const opts: ListingFlowOpts = {
      photoCount: 0,
      segmentChosen: false,
      firstName,
      accountRole,
      companyName,
      isAgency: accountRole === "agency",
      isDeveloper: accountRole === "developer",
      managers: [],
    };
    const field = nextListingField(blank, opts);
    setBootstrapped(true);
    setSegmentChosen(false);
    setSessionId(
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `local-${Date.now()}`,
    );
    setPhase("intake");
    setForm(blank);
    setMissingFields(missingKeysFromForm(blank, opts));
    setSuggestions(chipsForField(field, blank, opts));
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `${buildWelcomeMessage(opts)}\n\nАссистент в режиме бета-теста — учится и может ошибаться.`,
        animate: true,
      },
    ]);
    setTypingBusy(true);
    setPhotosSkipped(false);
    setLocationScope(null);
  }, [
    authLoading,
    profileLoading,
    agencyLoading,
    developerLoading,
    user,
    bootstrapped,
    segment,
    firstName,
    accountRole,
    companyName,
  ]);

  const applyQuick = (q: string, userText: string) => {
    const quick = tryQuickApplyChip(q, form, flowOpts);
    if (!quick) return false;
    setTypingBusy(true);
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content: userText },
      {
        id: `a-${Date.now() + 1}`,
        role: "assistant",
        content: quick.ack,
        animate: true,
      },
    ]);
    setForm(quick.form);
    if (quick.segmentChosen) setSegmentChosen(true);
    if (quick.locationScope !== undefined) setLocationScope(quick.locationScope);
    if (quick.photosSkipped) {
      setPhotosSkipped(true);
      setReadyForPhotos(false);
      setReadyToCommit(true);
    }
    setPhase(quick.phase);
    const nextOpts = {
      ...flowOpts,
      segmentChosen: quick.segmentChosen ?? segmentChosen,
      photosSkipped: quick.photosSkipped ?? photosSkipped,
      locationScope:
        quick.locationScope !== undefined
          ? quick.locationScope
          : locationScope,
    };
    setMissingFields(missingKeysFromForm(quick.form, nextOpts));
    setSuggestions(quick.suggestions);
    if (quick.nextField === "photos" && !quick.photosSkipped) {
      setReadyForPhotos(true);
    }
    if (quick.nextField === "done") setReadyToCommit(true);
    if (quick.openLocationPicker) {
      // Открыть каталог после короткой печати сообщения
      window.setTimeout(() => setLocationPickerOpen(true), 350);
    }
    return true;
  };

  const applyLocationFromCatalog = (location: string) => {
    const loc = location.trim();
    if (!loc || loc === "Все") {
      setLocationPickerOpen(false);
      return;
    }
    const isIrkutskDistrict = IRKUTSK_CITY_DISTRICTS.some(
      (d) => d.toLowerCase() === loc.toLowerCase(),
    );
    const addressHint = isIrkutskDistrict ? `г. Иркутск, ${loc}` : loc;
    const nextForm = {
      ...form,
      district: loc,
      address: form.address.trim() ? form.address : addressHint,
    };
    setForm(nextForm);
    setLocationScope(null);
    setLocationPickerOpen(false);
    const nextOpts: ListingFlowOpts = {
      ...flowOpts,
      locationScope: null,
      segmentChosen: true,
    };
    const nf = nextListingField(nextForm, nextOpts);
    setMissingFields(missingKeysFromForm(nextForm, nextOpts));
    setSuggestions(chipsForField(nf, nextForm, nextOpts));
    setPhase(nf === "photos" ? "photos" : "clarify");
    if (nf === "photos") setReadyForPhotos(true);
    if (nf === "done") setReadyToCommit(true);
    setTypingBusy(true);
    setMessages((prev) => [
      ...prev,
      {
        id: `a-loc-${Date.now()}`,
        role: "assistant",
        content: `Записал локацию: ${loc}. ${promptForField(nf, nextForm, nextOpts)}`,
        animate: true,
      },
    ]);
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy || committing) return;

    if (applyQuick(trimmed, trimmed)) {
      setInput("");
      return;
    }

    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content: trimmed },
    ]);
    setBusy(true);
    try {
      const history = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));
      const res = await invokeListingAi({
        sessionId,
        message: trimmed,
        segmentHint: form.segment,
        phase,
        messages: history,
        clientDraft: {
          segment: form.segment,
          types: form.types,
          deal_type: form.deal_type,
          area: form.area,
          price: form.price,
          description: form.description,
          address: form.address,
          district: form.district,
          rooms: form.rooms,
          land_use: form.land_use,
          floor: form.floor,
          condition: form.condition,
          parking: form.parking,
        },
      });
      applyAiResult(res);
    } catch (e) {
      toast({
        title: "Ошибка ответа ИИ",
        description: e instanceof Error ? e.message : "Попробуйте ещё раз",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const onPickPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const nextFiles: File[] = [];
    const nextUrls: string[] = [];
    for (const file of Array.from(files).slice(0, 12)) {
      if (!file.type.startsWith("image/")) continue;
      try {
        const processed = await processPropertyPhotoFile(file);
        nextFiles.push(processed);
        nextUrls.push(URL.createObjectURL(processed));
      } catch {
        nextFiles.push(file);
        nextUrls.push(URL.createObjectURL(file));
      }
    }
    setPhotoFiles((prev) => [...prev, ...nextFiles].slice(0, 12));
    setPhotoUrls((prev) => {
      const merged = [...prev, ...nextUrls].slice(0, 12);
      return merged;
    });
    setPhase("enhance");
    setMessages((prev) => [
      ...prev,
      {
        id: `sys-photos-${Date.now()}`,
        role: "assistant",
        content: `Добавлено фото: ${nextFiles.length}. Улучшить снимки перед черновиком? (пока тест)`,
      },
    ]);
    setSuggestions(["Да, улучшить", "Оставить как есть", "Создать черновик"]);
    setMissingFields([]);
    setReadyForPhotos(false);
    setReadyToCommit(true);
  };

  const runEnhanceStub = async () => {
    setEnhancing(true);
    setMessages((prev) => [
      ...prev,
      {
        id: `u-enhance-${Date.now()}`,
        role: "user",
        content: "Да, улучшить",
      },
    ]);
    await new Promise((r) => setTimeout(r, 1400));
    setEnhanceBadge(true);
    setEnhancing(false);
    setPhase("preview");
    setReadyToCommit(true);
    setMessages((prev) => [
      ...prev,
      {
        id: `a-enhance-${Date.now()}`,
        role: "assistant",
        content:
          "Пока это тестовый режим — фото оставлены как есть, скоро подключим реальное улучшение. Так выглядит ваше объявление. Всё верно? Создать черновик?",
        reasonedMs: 900,
      },
    ]);
    setSuggestions(["Создать черновик", "Изменить описание", "Добавить ещё фото"]);
    toast({
      title: "Улучшение фото — в тесте",
      description: "Реальный AI-enhance скоро. Черновик можно создать сейчас.",
    });
  };

  const skipEnhance = () => {
    setPhase("preview");
    setReadyToCommit(true);
    setMessages((prev) => [
      ...prev,
      { id: `u-skip-${Date.now()}`, role: "user", content: "Оставить как есть" },
      {
        id: `a-skip-${Date.now()}`,
        role: "assistant",
        content:
          "Отлично. Превью справа — так карточка будет выглядеть в каталоге. Создать черновик?",
      },
    ]);
    setSuggestions(["Создать черновик", "Добавить ещё фото"]);
  };

  const commitDraft = async () => {
    if (!user || committing) return;
    if (!listingFormReadyForPhotos(form) && form.description.length < 10) {
      toast({
        title: "Не хватает данных",
        description: "Укажите тип, площадь, цену, адрес и описание.",
        variant: "destructive",
      });
      return;
    }
    setCommitting(true);
    try {
      const withLandlord = {
        ...form,
        landlord_type:
          form.landlord_type || resolveLandlordType(flowOpts),
      };
      const payload = buildPropertyPayload(
        withLandlord,
        user.id,
        listingPayloadOptions(withLandlord),
      );
      const selectedManager = agencyManagers.find(
        (m) => m.id === form.listing_manager_id,
      );
      let extras = {
        ...((payload.extras as Record<string, unknown>) || {}),
      };
      if (accountRole === "agency" && agencyId) {
        extras = {
          ...extras,
          ...(selectedManager && !isManagerSkipped(selectedManager.id)
            ? {
                agent_name: selectedManager.full_name,
                agent_phone: selectedManager.phone,
                agent_avatar_url: selectedManager.photo_url || "",
                listing_manager_id: selectedManager.id,
              }
            : form.listing_manager_id &&
                !isManagerSkipped(form.listing_manager_id)
              ? { listing_manager_id: form.listing_manager_id }
              : { listing_manager_id: "" }),
          agency_id: agencyId,
          agent_account_type: "agency",
          agent_company: myAgency?.agency?.name || "",
        };
      }
      if (accountRole === "developer" && myDeveloper) {
        extras = {
          ...extras,
          ...buildDeveloperListingExtras(myDeveloper, {
            ownerUserId: user.id,
          }),
        };
      }
      (payload as { extras: Record<string, unknown> }).extras = extras;

      const developerId =
        accountRole === "developer" ? myDeveloper?.id : null;
      const row = await insertMyPropertyApi(
        user.id,
        payload,
        agencyId || null,
        developerId || null,
      );
      const urls: string[] = [];
      for (const file of photoFiles) {
        const publicUrl = await uploadMyPropertyPhotoApi(row.id, file);
        if (publicUrl) urls.push(publicUrl);
      }
      if (urls.length > 0) {
        await updateMyPropertyApi(
          user.id,
          row.id,
          {
            photos: urls,
            cover_photo: urls[0],
            photos_count: urls.length,
          },
          agencyId || null,
          developerId || null,
        );
      }
      setCreatedId(row.id);
      setPhase("done");
      setMessages((prev) => [
        ...prev,
        {
          id: `a-done-${Date.now()}`,
          role: "assistant",
          content:
            "Черновик создан. Можете открыть кабинет, доработать карточку и отправить на модерацию.",
        },
      ]);
      setSuggestions([]);
      toast({ title: "Черновик сохранён" });
    } catch (e) {
      toast({
        title: "Не удалось сохранить",
        description: e instanceof Error ? e.message : "Ошибка",
        variant: "destructive",
      });
    } finally {
      setCommitting(false);
    }
  };

  const onSuggestion = (q: string) => {
    const lower = q.toLowerCase();
    if (lower.includes("загрузить фото") || lower === "фото") {
      fileRef.current?.click();
      return;
    }
    if (lower.includes("улучш")) {
      void runEnhanceStub();
      return;
    }
    if (lower.includes("оставить") || lower.includes("как есть")) {
      skipEnhance();
      return;
    }
    if (
      lower.includes("создать черновик") ||
      lower.includes("выглядит хорошо")
    ) {
      if (phase === "enhance" && photoFiles.length > 0) {
        skipEnhance();
        return;
      }
      if (readyToCommit || phase === "preview" || phase === "commit") {
        void commitDraft();
        return;
      }
    }
    if (lower.includes("ещё фото") || lower.includes("добавить фото")) {
      fileRef.current?.click();
      return;
    }
    if (lower.includes("каталог")) {
      setLocationPickerOpen(true);
    }

    if (applyQuick(q, q)) return;
    void sendMessage(q);
  };

  const primaryCta = useMemo(() => {
    if (phase === "done" && createdId) {
      return {
        label: "Перейти в кабинет",
        onClick: () => navigate("/account#properties"),
      };
    }
    if (
      !photosSkipped &&
      (phase === "photos" || (readyForPhotos && photoFiles.length === 0))
    ) {
      return {
        label: "Загрузить фото",
        onClick: () => fileRef.current?.click(),
      };
    }
    if (phase === "enhance" && photoFiles.length > 0) {
      return {
        label: enhancing ? "Улучшаем…" : "Создать черновик",
        onClick: () => void commitDraft(),
        disabled: enhancing || committing,
      };
    }
    if (
      readyToCommit ||
      photosSkipped ||
      phase === "preview" ||
      phase === "commit"
    ) {
      return {
        label: committing ? "Сохраняем…" : "Создать черновик",
        onClick: () => void commitDraft(),
        disabled: committing,
      };
    }
    return null;
  }, [
    phase,
    createdId,
    readyForPhotos,
    photoFiles.length,
    readyToCommit,
    photosSkipped,
    enhancing,
    committing,
    navigate,
  ]);

  /** Не дублировать розовую CTA в чипах */
  const visibleSuggestions = useMemo(() => {
    const cta = primaryCta?.label?.toLowerCase() || "";
    return suggestions.filter((s) => {
      const t = s.trim().toLowerCase();
      if (!t) return false;
      if (cta && (t === cta || t.includes(cta) || cta.includes(t))) return false;
      if (cta.includes("загрузить") && t.includes("загрузить")) return false;
      if (cta.includes("создать черновик") && t.includes("создать черновик"))
        return false;
      return true;
    });
  }, [suggestions, primaryCta]);

  if (authLoading || profileLoading || agencyLoading || developerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Загрузка…
      </div>
    );
  }

  if (!user) {
    return <Navigate to={loginToSmartListingPath(segment)} replace />;
  }

  return (
    <div className="h-[100dvh] max-h-[100dvh] bg-background flex flex-col overflow-hidden">
      <SeoHead
        title="Умное создание объявления"
        description="Создайте объявление в диалоге с ИИ — заполним карточку и сохраним черновик."
        url={absoluteUrl(aiPath)}
        noindex
      />

      <header className="sticky top-0 z-40 shrink-0 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto w-full max-w-6xl px-3 sm:px-4 h-12 sm:h-14 flex items-center justify-between gap-2 sm:gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 sm:gap-2.5 min-w-0 shrink-0"
            aria-label="АрендаСити"
          >
            <BrandMark className="hidden md:block h-7 w-7" />
            <span className="flex flex-col leading-none min-w-0">
              <span className="font-display text-[13px] sm:text-[14px] font-bold tracking-tight text-foreground md:hidden">
                АРЕНДА<span className="text-primary">СИТИ</span>
              </span>
              <span className="hidden md:inline font-display text-sm font-semibold text-foreground truncate">
                Умный ассистент
              </span>
              <span className="text-[10px] text-muted-foreground md:hidden">
                Ассистент
              </span>
            </span>
            <span className="shrink-0 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30">
              Бета-тест
            </span>
          </Link>
          <Link
            to="/account"
            className="text-xs sm:text-sm text-muted-foreground hover:text-foreground shrink-0 whitespace-nowrap"
          >
            <span className="sm:hidden">Кабинет</span>
            <span className="hidden sm:inline">Вернуться в личный кабинет</span>
          </Link>
        </div>
      </header>

      {/* Мобильное компакт-превью */}
      <div className="lg:hidden shrink-0 px-3 pt-2 pb-1 border-b border-border/40 bg-background">
        <SmartListingPreview
          form={form}
          photoUrls={photoUrls}
          missingFields={missingFields}
          enhanceBadge={enhanceBadge}
          variant="compact"
        />
      </div>

      <div className="flex-1 min-h-0 mx-auto w-full max-w-6xl grid lg:grid-cols-[minmax(0,1fr)_min(380px,36%)] lg:gap-8 lg:px-4 lg:pt-5 lg:pb-4">
        {/* Чат */}
        <div className="flex flex-col min-h-0 min-w-0 h-full">
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex flex-col gap-1 max-w-[95%] sm:max-w-[88%]",
                  m.role === "user" ? "ml-auto items-end" : "items-start",
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl px-3.5 sm:px-4 py-2.5 text-[13px] sm:text-sm leading-relaxed whitespace-pre-wrap",
                    m.role === "user"
                      ? "bg-muted text-foreground rounded-br-md"
                      : "bg-transparent text-foreground border border-border/50 rounded-bl-md",
                  )}
                >
                  {m.role === "assistant" ? (
                    <TypingText
                      text={m.content}
                      animate={Boolean(m.animate)}
                      onDone={
                        m.animate
                          ? () => {
                              setTypingBusy(false);
                              setMessages((prev) =>
                                prev.map((x) =>
                                  x.id === m.id ? { ...x, animate: false } : x,
                                ),
                              );
                            }
                          : undefined
                      }
                    />
                  ) : (
                    m.content
                  )}
                </div>
                {m.role === "assistant" && (
                  <div className="flex gap-2 px-1 text-muted-foreground">
                    <ThumbsUp className="w-3.5 h-3.5 opacity-40" />
                    <ThumbsDown className="w-3.5 h-3.5 opacity-40" />
                  </div>
                )}
              </div>
            ))}
            {(busy || enhancing) && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {enhancing ? "Улучшаем фото…" : "Думаю…"}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div
            className={cn(
              "shrink-0 border-t border-border/60 bg-background/95 backdrop-blur",
              "px-3 sm:px-4 pt-2.5",
              "pb-[max(0.75rem,env(safe-area-inset-bottom))]",
            )}
          >
            {primaryCta && (
              <button
                type="button"
                disabled={primaryCta.disabled}
                onClick={primaryCta.onClick}
                className="mb-2.5 w-full sm:w-auto sm:min-w-[200px] h-11 px-5 rounded-full bg-[#ff5c85] hover:bg-[#ff4574] text-white text-sm font-semibold disabled:opacity-60 transition-colors"
              >
                {primaryCta.label}
              </button>
            )}

            {visibleSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2.5 max-h-[5.5rem] overflow-y-auto">
                {visibleSuggestions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={busy || committing || enhancing || typingBusy}
                    onClick={() => onSuggestion(q)}
                    className="h-9 px-3.5 rounded-full border border-border bg-card text-xs sm:text-sm text-foreground hover:bg-muted hover:border-foreground/20 transition-colors disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            <form
              className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm"
              onSubmit={(e) => {
                e.preventDefault();
                void sendMessage(input);
              }}
            >
              <Check className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:block" />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ваш ответ…"
                disabled={busy || committing || phase === "done" || typingBusy}
                className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground py-2.5"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-xs text-muted-foreground hover:text-foreground px-2 shrink-0"
                title="Фото"
              >
                Фото
              </button>
              <button
                type="submit"
                disabled={!input.trim() || busy || typingBusy}
                className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center disabled:opacity-40 shrink-0"
                aria-label="Отправить"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </form>
            {phase === "done" && createdId ? (
              <Link
                to="/account#properties"
                className="mt-2 lg:hidden flex items-center justify-center h-10 rounded-full bg-foreground text-background text-sm font-medium"
              >
                Открыть черновик в кабинете
              </Link>
            ) : (
              <p className="text-[10px] text-muted-foreground mt-2 px-1">
                Ответы ИИ могут быть неточными.{" "}
                <Link to={listPropertyPath(segment)} className="underline">
                  Обычное размещение
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* ПК: превью справа */}
        <aside className="hidden lg:flex flex-col gap-3 min-h-0 overflow-y-auto sticky top-0 self-start max-h-[calc(100dvh-5.5rem)]">
          <SmartListingPreview
            form={form}
            photoUrls={photoUrls}
            missingFields={missingFields}
            enhanceBadge={enhanceBadge}
          />
          {phase === "done" && createdId && (
            <Link
              to="/account#properties"
              className="flex items-center justify-center h-10 rounded-full bg-foreground text-background text-sm font-medium"
            >
              Открыть черновик в кабинете
            </Link>
          )}
        </aside>
      </div>

      <LocationPickerModal
        open={locationPickerOpen}
        onOpenChange={setLocationPickerOpen}
        value={form.district}
        elevated
        onSelect={applyLocationFromCatalog}
      />

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void onPickPhotos(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
