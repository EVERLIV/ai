import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateConstructionStage,
  useCreateDeveloperProject,
  useCreatePhase,
  useCreateProjectMedia,
  useCreateUnitType,
  useDeleteConstructionStage,
  useDeleteDeveloperProject,
  useDeletePhase,
  useDeleteProjectMedia,
  useDeleteUnitType,
  useMyDeveloper,
  useMyDeveloperProjects,
  useProjectConstructionStages,
  useProjectMedia,
  useProjectPhases,
  useProjectUnitTypes,
  usePublishDeveloperProject,
  useUpdateConstructionStage,
  useUpdateDeveloperProject,
} from "@/hooks/useDeveloper";
import {
  DEVELOPER_PROJECT_KIND_LABELS,
  DEVELOPER_PROJECT_STATUS_LABELS,
  normalizeDeveloperSubtype,
  type DeveloperProjectStatus,
  type DeveloperSubtype,
} from "@/lib/developerTypes";
import { developerAddListingCtaLabel } from "@/lib/developerListingRules";
import { WOODEN_HOUSE_CONFIGS } from "@/lib/woodenHouses";

const STATUS_OPTIONS: DeveloperProjectStatus[] = [
  "planned",
  "under_construction",
  "completed",
];

export default function MyDeveloperProjectsTab() {
  const { toast } = useToast();
  const { data: developer, isLoading: devLoading } = useMyDeveloper();
  const { data: projects = [], isLoading } = useMyDeveloperProjects();
  const createProject = useCreateDeveloperProject();
  const updateProject = useUpdateDeveloperProject();
  const publishProject = usePublishDeveloperProject();
  const deleteProject = useDeleteDeveloperProject();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<DeveloperProjectStatus>("planned");
  const [material, setMaterial] = useState("");
  const [housingClass, setHousingClass] = useState("");
  const [deliveryYear, setDeliveryYear] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (devLoading || isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
        <Loader2 className="w-4 h-4 animate-spin" /> Загрузка проектов…
      </div>
    );
  }

  if (!developer) {
    return (
      <p className="text-sm text-muted-foreground py-8">
        Профиль застройщика не найден. Обратитесь в поддержку.
      </p>
    );
  }

  const subtype = normalizeDeveloperSubtype(
    developer.subtype as DeveloperSubtype,
  );
  const isFrameBuilder = subtype === "frame_house_builder";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await createProject.mutateAsync({
        developer_id: developer.id,
        title: title.trim(),
        subtype,
        status,
        address: address.trim(),
        description: description.trim(),
        material: material.trim(),
        housing_class: housingClass.trim(),
        delivery_year:
          isFrameBuilder || !deliveryYear ? null : Number(deliveryYear),
      });
      toast({ title: "Проект создан" });
      setTitle("");
      setAddress("");
      setDescription("");
      setMaterial("");
      setHousingClass("");
      setDeliveryYear("");
      setShowForm(false);
    } catch (err) {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось создать",
        variant: "destructive",
      });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5">
        <h2 className="font-display text-xl font-bold text-foreground">
          Проекты
        </h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md bg-primary text-primary-foreground text-xs font-semibold"
        >
          <Plus className="w-3.5 h-3.5" />
          Новый проект
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 space-y-3 p-4 border border-border rounded-lg bg-card"
        >
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Название *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder={
                subtype === "frame_house_builder"
                  ? "Серия «Уют»"
                  : "ЖК «Северный»"
              }
              className="w-full h-10 px-3 border border-border bg-background text-sm rounded-md"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Статус
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as DeveloperProjectStatus)
                }
                className="w-full h-10 px-3 border border-border bg-background text-sm rounded-md"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {DEVELOPER_PROJECT_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            {!isFrameBuilder && (
              <div>
                <label className="text-xs text-muted-foreground block mb-1">
                  Год сдачи
                </label>
                <input
                  type="number"
                  value={deliveryYear}
                  onChange={(e) => setDeliveryYear(e.target.value)}
                  placeholder="2027"
                  className="w-full h-10 px-3 border border-border bg-background text-sm rounded-md"
                />
              </div>
            )}
            {isFrameBuilder && (
              <div className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground self-end">
                Дома строятся под заказ — очереди и год сдачи не используются.
              </div>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Материал / технология
              </label>
              {subtype === "frame_house_builder" ? (
                <select
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full h-10 px-3 border border-border bg-background text-sm rounded-md"
                >
                  <option value="">Выберите</option>
                  {WOODEN_HOUSE_CONFIGS.map((cfg) => (
                    <option key={cfg.id} value={cfg.buildingType}>
                      {cfg.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="Кирпич"
                  className="w-full h-10 px-3 border border-border bg-background text-sm rounded-md"
                />
              )}
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">
                Класс жилья
              </label>
              <input
                value={housingClass}
                onChange={(e) => setHousingClass(e.target.value)}
                placeholder="Комфорт"
                className="w-full h-10 px-3 border border-border bg-background text-sm rounded-md"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Адрес
            </label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full h-10 px-3 border border-border bg-background text-sm rounded-md"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">
              Описание
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-border bg-background text-sm rounded-md resize-y"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createProject.isPending}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
            >
              {createProject.isPending ? "Сохранение…" : "Создать"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="h-9 px-4 rounded-md border border-border text-xs"
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      {projects.length === 0 ? (
        <div className="bg-card p-10 text-center border border-border/60 rounded-lg">
          <p className="text-sm font-medium text-foreground mb-1">
            Пока нет проектов
          </p>
          <p className="text-xs text-muted-foreground">
            Создайте ЖК или серию домов — они появятся в каталоге после
            публикации.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {projects.map((p) => {
            const open = expandedId === p.id;
            return (
              <li
                key={p.id}
                className="border border-border/60 rounded-lg bg-card overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Link
                        to={`/proekt/${p.id}`}
                        className="text-sm font-semibold text-foreground hover:text-primary truncate"
                      >
                        {p.title}
                      </Link>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {DEVELOPER_PROJECT_STATUS_LABELS[p.status]}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {DEVELOPER_PROJECT_KIND_LABELS[p.project_kind]}
                      </span>
                      {p.is_published ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                          Опубликован
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700">
                          Черновик
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.address || "Адрес не указан"}
                      {!isFrameBuilder && p.delivery_year
                        ? ` · сдача ${p.delivery_year}`
                        : isFrameBuilder
                          ? " · под заказ"
                          : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 shrink-0">
                    {!p.is_published && (
                      <button
                        type="button"
                        className="h-8 px-2.5 text-[11px] font-medium rounded-md bg-primary text-primary-foreground"
                        disabled={publishProject.isPending}
                        onClick={async () => {
                          try {
                            await publishProject.mutateAsync(p.id);
                            toast({ title: "Проект опубликован" });
                          } catch (err) {
                            toast({
                              title: "Ошибка",
                              description:
                                err instanceof Error
                                  ? err.message
                                  : "Публикация не удалась",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        Опубликовать
                      </button>
                    )}
                    {p.is_published && (
                      <button
                        type="button"
                        className="h-8 px-2.5 text-[11px] font-medium rounded-md border border-border"
                        onClick={async () => {
                          await updateProject.mutateAsync({
                            projectId: p.id,
                            patch: {
                              is_published: false,
                              moderation_status: "draft",
                            },
                          });
                          toast({ title: "Снято с публикации" });
                        }}
                      >
                        Скрыть
                      </button>
                    )}
                    <button
                      type="button"
                      className="h-8 px-2.5 text-[11px] font-medium rounded-md border border-border inline-flex items-center gap-1"
                      onClick={() => setExpandedId(open ? null : p.id)}
                    >
                      {open ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                      Детали
                    </button>
                    <button
                      type="button"
                      className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border text-destructive"
                      onClick={async () => {
                        if (!confirm(`Удалить «${p.title}»?`)) return;
                        await deleteProject.mutateAsync(p.id);
                        toast({ title: "Удалено" });
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {open && (
                  <ProjectDetailsEditor
                    projectId={p.id}
                    developerId={developer.id}
                    subtype={subtype}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ProjectDetailsEditor({
  projectId,
  developerId,
  subtype,
}: {
  projectId: string;
  developerId: string;
  subtype: DeveloperSubtype;
}) {
  const isFrame = subtype === "frame_house_builder";
  return (
    <div className="border-t border-border/60 px-4 py-4 space-y-6 bg-muted/20">
      <UnitTypesBlock
        projectId={projectId}
        developerId={developerId}
        subtype={subtype}
      />
      {!isFrame && <PhasesBlock projectId={projectId} />}
      <StagesBlock projectId={projectId} />
      <MediaBlock projectId={projectId} />
    </div>
  );
}

function UnitTypesBlock({
  projectId,
  developerId,
  subtype,
}: {
  projectId: string;
  developerId: string;
  subtype: DeveloperSubtype;
}) {
  const { toast } = useToast();
  const { data: rows = [] } = useProjectUnitTypes(projectId);
  const create = useCreateUnitType();
  const remove = useDeleteUnitType();
  const [title, setTitle] = useState("");
  const [rooms, setRooms] = useState("");
  const [areaFrom, setAreaFrom] = useState("");
  const [priceFrom, setPriceFrom] = useState("");
  const [planFile, setPlanFile] = useState<File | null>(null);
  const isFrame = subtype === "frame_house_builder";
  const listingCta = developerAddListingCtaLabel(subtype);

  return (
    <section>
      <h3 className="text-sm font-semibold mb-2">
        {isFrame ? "Модели серии" : "Планировки"}
      </h3>
      <ul className="space-y-1.5 mb-3">
        {rows.map((u) => (
          <li
            key={u.id}
            className="flex items-center justify-between gap-2 text-xs bg-background border border-border/50 rounded-md px-3 py-2"
          >
            <span className="flex items-center gap-2 min-w-0">
              {u.plan_image_url && (
                <img
                  src={u.plan_image_url}
                  alt=""
                  className="w-8 h-8 rounded object-cover shrink-0"
                />
              )}
              <span className="truncate">
                {u.title}
                {u.rooms ? ` · ${u.rooms}` : ""}
                {u.area_from != null ? ` · от ${u.area_from} м²` : ""}
                {u.price_from != null
                  ? ` · от ${Number(u.price_from).toLocaleString("ru-RU")} ₽`
                  : ""}
              </span>
            </span>
            <span className="flex items-center gap-2 shrink-0">
              <Link
                to={`/account?project_id=${projectId}&unit_type_id=${u.id}#properties`}
                className="text-[11px] font-medium text-primary hover:underline whitespace-nowrap"
              >
                {listingCta}
              </Link>
              <button
                type="button"
                className="text-destructive"
                onClick={() => remove.mutate(u.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </span>
          </li>
        ))}
      </ul>
      <form
        className="flex flex-wrap gap-2 items-end"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!title.trim()) return;
          let plan_image_url: string | null = null;
          if (planFile) {
            const { uploadDeveloperAssetApi } = await import(
              "@/lib/developerApi"
            );
            plan_image_url = await uploadDeveloperAssetApi(
              developerId,
              planFile,
            );
          }
          await create.mutateAsync({
            project_id: projectId,
            title: title.trim(),
            rooms: rooms.trim(),
            area_from: areaFrom ? Number(areaFrom) : null,
            price_from: priceFrom ? Number(priceFrom) : null,
            plan_image_url,
          });
          setTitle("");
          setRooms("");
          setAreaFrom("");
          setPriceFrom("");
          setPlanFile(null);
          toast({ title: "Планировка добавлена" });
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Название"
          required
          className="h-8 px-2 border border-border rounded text-xs bg-background flex-1 min-w-[8rem]"
        />
        <input
          value={rooms}
          onChange={(e) => setRooms(e.target.value)}
          placeholder={isFrame ? "Этажи / зоны" : "Комнат"}
          className="h-8 px-2 border border-border rounded text-xs bg-background w-20"
        />
        <input
          value={areaFrom}
          onChange={(e) => setAreaFrom(e.target.value)}
          placeholder="м² от"
          type="number"
          className="h-8 px-2 border border-border rounded text-xs bg-background w-20"
        />
        <input
          value={priceFrom}
          onChange={(e) => setPriceFrom(e.target.value)}
          placeholder="Цена от"
          type="number"
          className="h-8 px-2 border border-border rounded text-xs bg-background w-28"
        />
        <label className="h-8 px-2 border border-border rounded text-[11px] bg-background inline-flex items-center cursor-pointer">
          {planFile ? planFile.name.slice(0, 18) : "План (фото)"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setPlanFile(e.target.files?.[0] || null)}
          />
        </label>
        <button
          type="submit"
          className="h-8 px-3 rounded bg-primary text-primary-foreground text-[11px] font-semibold"
        >
          Добавить
        </button>
      </form>
    </section>
  );
}

function PhasesBlock({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const { data: rows = [] } = useProjectPhases(projectId);
  const create = useCreatePhase();
  const remove = useDeletePhase();
  const [name, setName] = useState("");

  return (
    <section>
      <h3 className="text-sm font-semibold mb-2">Очереди / корпуса</h3>
      <ul className="space-y-1.5 mb-3">
        {rows.map((ph) => (
          <li
            key={ph.id}
            className="flex items-center justify-between gap-2 text-xs bg-background border border-border/50 rounded-md px-3 py-2"
          >
            <span>{ph.name}</span>
            <button type="button" onClick={() => remove.mutate(ph.id)}>
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </button>
          </li>
        ))}
      </ul>
      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          await create.mutateAsync({
            project_id: projectId,
            name: name.trim(),
            sort_order: rows.length,
          });
          setName("");
          toast({ title: "Очередь добавлена" });
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Корпус 1"
          className="h-8 px-2 border border-border rounded text-xs bg-background flex-1"
        />
        <button
          type="submit"
          className="h-8 px-3 rounded bg-primary text-primary-foreground text-[11px] font-semibold"
        >
          Добавить
        </button>
      </form>
    </section>
  );
}

function StagesBlock({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const { data: rows = [] } = useProjectConstructionStages(projectId);
  const create = useCreateConstructionStage();
  const update = useUpdateConstructionStage();
  const remove = useDeleteConstructionStage();
  const [title, setTitle] = useState("");

  return (
    <section>
      <h3 className="text-sm font-semibold mb-2">Ход строительства</h3>
      <ul className="space-y-1.5 mb-3">
        {rows.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between gap-2 text-xs bg-background border border-border/50 rounded-md px-3 py-2"
          >
            <span>
              {s.title}
              {s.is_published ? " · опубликовано" : " · черновик"}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                className="text-primary"
                onClick={() =>
                  update.mutate({
                    id: s.id,
                    patch: { is_published: !s.is_published },
                  })
                }
              >
                {s.is_published ? "Скрыть" : "Показать"}
              </button>
              <button type="button" onClick={() => remove.mutate(s.id)}>
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!title.trim()) return;
          await create.mutateAsync({
            project_id: projectId,
            title: title.trim(),
            sort_order: rows.length,
            is_published: true,
          });
          setTitle("");
          toast({ title: "Этап добавлен" });
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Фундамент готов"
          className="h-8 px-2 border border-border rounded text-xs bg-background flex-1"
        />
        <button
          type="submit"
          className="h-8 px-3 rounded bg-primary text-primary-foreground text-[11px] font-semibold"
        >
          Добавить
        </button>
      </form>
    </section>
  );
}

function MediaBlock({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const { data: rows = [] } = useProjectMedia(projectId);
  const create = useCreateProjectMedia();
  const remove = useDeleteProjectMedia();
  const [url, setUrl] = useState("");

  return (
    <section>
      <h3 className="text-sm font-semibold mb-2">Медиа (URL)</h3>
      <ul className="space-y-1.5 mb-3">
        {rows.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between gap-2 text-xs bg-background border border-border/50 rounded-md px-3 py-2"
          >
            <a
              href={m.url}
              target="_blank"
              rel="noreferrer"
              className="text-primary truncate hover:underline"
            >
              {m.kind}: {m.url}
            </a>
            <button type="button" onClick={() => remove.mutate(m.id)}>
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </button>
          </li>
        ))}
      </ul>
      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!url.trim()) return;
          await create.mutateAsync({
            project_id: projectId,
            url: url.trim(),
            kind: "photo",
            sort_order: rows.length,
          });
          setUrl("");
          toast({ title: "Медиа добавлено" });
        }}
      >
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          type="url"
          required
          className="h-8 px-2 border border-border rounded text-xs bg-background flex-1"
        />
        <button
          type="submit"
          className="h-8 px-3 rounded bg-primary text-primary-foreground text-[11px] font-semibold"
        >
          Добавить
        </button>
      </form>
    </section>
  );
}
