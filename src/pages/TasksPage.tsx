import { useState } from "react";
import { Link } from "react-router-dom";
import {
  DndContext, DragEndEvent, DragOverlay,
  PointerSensor, useSensor, useSensors, closestCorners,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, Loader2, Filter, X, FolderPlus, ChevronLeft, ChevronRight } from "lucide-react";
import TasksSidebar from "@/components/tasks/TasksSidebar";
import TaskCard from "@/components/tasks/TaskCard";
import QuickAddTask from "@/components/tasks/QuickAddTask";
import {
  useTasks, useUpdateTask, useProjects, useCreateProject, useDeleteProject, useDeleteTask,
  type Task, type TaskStatus,
} from "@/hooks/useTasks";
import { useStaffMembers } from "@/hooks/useTasks";

const COLUMNS: { id: TaskStatus; label: string; dot: string; headerColor: string }[] = [
  { id: "todo",        label: "К выполнению", dot: "bg-gray-400",  headerColor: "text-gray-600" },
  { id: "in_progress", label: "В работе",     dot: "bg-blue-500",  headerColor: "text-blue-700" },
  { id: "done",        label: "Готово",        dot: "bg-green-500", headerColor: "text-green-700" },
];

const COL_BG: Record<TaskStatus, string> = {
  todo: "bg-gray-50 border-gray-200",
  in_progress: "bg-blue-50 border-blue-200",
  done: "bg-green-50 border-green-200",
};

const PRIORITY_COLORS: Record<string, string> = {
  all: "bg-gray-100 text-gray-700", high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700", low: "bg-gray-100 text-gray-500",
};

export default function TasksPage() {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [showNewProject, setShowNewProject] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  // Мобильный: текущая колонка
  const [mobileColIdx, setMobileColIdx] = useState(0);

  const { data: projects = [] } = useProjects();
  const { data: tasks = [], isLoading } = useTasks(activeProjectId || undefined);
  const { data: staff = [] } = useStaffMembers();
  const updateTask = useUpdateTask();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const filtered = tasks.filter((t) => {
    if (filterAssignee && t.assignee !== filterAssignee) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    return true;
  });

  const byStatus = (status: TaskStatus) => filtered.filter((t) => t.status === status);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;
    const overId = over.id as string;
    const colId = COLUMNS.find((c) => c.id === overId)?.id
      ?? tasks.find((t) => t.id === overId)?.status;
    if (!colId) return;
    const dragged = tasks.find((t) => t.id === active.id);
    if (dragged && dragged.status !== colId)
      updateTask.mutate({ id: dragged.id, status: colId as TaskStatus });
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    const colors = ["#6366f1","#f59e0b","#10b981","#ef4444","#8b5cf6","#06b6d4"];
    const color = colors[projects.length % colors.length];
    const p = await createProject.mutateAsync({ name: newProjectName.trim(), color });
    setActiveProjectId(p.id);
    setNewProjectName(""); setShowNewProject(false);
  };

  const activeFilters = [filterAssignee, filterPriority !== "all"].filter(Boolean).length;
  const mobileCol = COLUMNS[mobileColIdx];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <TasksSidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden pt-12 md:pt-0">

        {/* ── Шапка ── */}
        <div className="bg-white border-b border-gray-200 px-3 md:px-5 py-2 md:py-3">
          {/* Доски */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide mb-2 md:mb-0 md:inline-flex">
            <button onClick={() => setActiveProjectId(null)}
              className={`shrink-0 px-2.5 py-1 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                !activeProjectId ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
              }`}>
              Все
            </button>
            {projects.map((p) => (
              <div key={p.id} className="relative group/proj shrink-0">
                <button onClick={() => setActiveProjectId(p.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 pr-6 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                    activeProjectId === p.id ? "text-white" : "text-gray-600 hover:bg-gray-100"
                  }`}
                  style={activeProjectId === p.id ? { backgroundColor: p.color } : {}}>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: activeProjectId === p.id ? "rgba(255,255,255,0.7)" : p.color }} />
                  {p.name}
                </button>
                <button onClick={(e) => {
                  e.stopPropagation();
                  if (!confirm(`Удалить доску «${p.name}»?`)) return;
                  deleteProject.mutate(p.id);
                  if (activeProjectId === p.id) setActiveProjectId(null);
                }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/proj:opacity-100 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {showNewProject ? (
              <div className="flex items-center gap-1 shrink-0">
                <input autoFocus value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreateProject(); if (e.key === "Escape") setShowNewProject(false); }}
                  placeholder="Название..." className="h-7 px-2 border border-gray-300 rounded-lg text-xs focus:outline-none w-28" />
                <button onClick={handleCreateProject} className="h-7 px-2 bg-gray-900 text-white text-xs rounded-lg">ОК</button>
                <button onClick={() => setShowNewProject(false)} className="w-7 h-7 flex items-center justify-center text-gray-400">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button onClick={() => setShowNewProject(true)}
                className="shrink-0 flex items-center gap-1 px-2 py-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg text-xs transition-colors">
                <FolderPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Доска</span>
              </button>
            )}
          </div>

          {/* Правая часть — на мобильном в той же строке что и доски */}
          <div className="flex items-center justify-between md:hidden">
            {/* Мобильный навигатор колонок */}
            <div className="flex items-center gap-2">
              <button onClick={() => setMobileColIdx(i => Math.max(0, i - 1))} disabled={mobileColIdx === 0}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${mobileCol.dot}`} />
                <span className={`text-sm font-semibold ${mobileCol.headerColor}`}>{mobileCol.label}</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                  {byStatus(mobileCol.id).length}
                </span>
              </div>
              <button onClick={() => setMobileColIdx(i => Math.min(COLUMNS.length - 1, i + 1))} disabled={mobileColIdx === COLUMNS.length - 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1 h-7 px-2 rounded-lg text-xs transition-colors ${
                  showFilters || activeFilters > 0 ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-600"
                }`}>
                <Filter className="w-3 h-3" />
                {activeFilters > 0 && <span className="w-3.5 h-3.5 bg-white text-gray-900 rounded-full text-[9px] font-bold flex items-center justify-center">{activeFilters}</span>}
              </button>
              <Link to="/tasks/new"
                className="flex items-center gap-1 h-7 px-2.5 bg-gray-900 text-white text-xs font-medium rounded-lg">
                <Plus className="w-3.5 h-3.5" /> Задача
              </Link>
            </div>
          </div>

          {/* Десктоп: правая часть */}
          <div className="hidden md:flex items-center justify-end gap-2 mt-2">
            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm transition-colors ${
                showFilters || activeFilters > 0 ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}>
              <Filter className="w-3.5 h-3.5" /> Фильтры
              {activeFilters > 0 && <span className="w-4 h-4 bg-white text-gray-900 rounded-full text-[10px] font-bold flex items-center justify-center">{activeFilters}</span>}
            </button>
            <Link to="/tasks/new"
              className="flex items-center gap-1.5 h-8 px-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800">
              <Plus className="w-4 h-4" /> Задача
            </Link>
          </div>
        </div>

        {/* Фильтры */}
        {showFilters && (
          <div className="bg-white border-b border-gray-200 px-3 md:px-5 py-2.5 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Исполнитель</label>
              <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}
                className="h-7 px-2 border border-gray-200 rounded-md text-xs focus:outline-none bg-white">
                <option value="">Все</option>
                {staff.map((s) => <option key={s.id} value={s.full_name || s.email || ""}>{s.full_name || s.email}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[["all","Все"],["high","🔴"],["medium","🟡"],["low","⬜"]].map(([v,l]) => (
                <button key={v} onClick={() => setFilterPriority(v)}
                  className={`px-2 py-0.5 text-xs font-medium rounded-full transition-colors ${
                    filterPriority === v ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}>
                  {l}
                </button>
              ))}
            </div>
            {activeFilters > 0 && (
              <button onClick={() => { setFilterAssignee(""); setFilterPriority("all"); }}
                className="text-xs text-red-500 ml-auto">Сбросить</button>
            )}
          </div>
        )}

        {/* ── Kanban ── */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCorners}
            onDragStart={(e) => setActiveTask(tasks.find((t) => t.id === e.active.id) ?? null)}
            onDragEnd={handleDragEnd}>

            {/* Мобильный: одна колонка */}
            <div className="md:hidden flex-1 overflow-y-auto p-3">
              {/* Точки-индикаторы */}
              <div className="flex justify-center gap-1.5 mb-3">
                {COLUMNS.map((col, i) => (
                  <button key={col.id} onClick={() => setMobileColIdx(i)}
                    className={`transition-all ${i === mobileColIdx ? "w-6 h-2 rounded-full " + col.dot : "w-2 h-2 rounded-full bg-gray-200"}`} />
                ))}
              </div>

              <SortableContext
                id={mobileCol.id}
                items={byStatus(mobileCol.id).map(t => t.id)}
                strategy={verticalListSortingStrategy}>
                <div className={`min-h-[60vh] rounded-xl border-2 border-dashed p-3 flex flex-col gap-2 ${COL_BG[mobileCol.id]}`}>
                  {byStatus(mobileCol.id).map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                  {byStatus(mobileCol.id).length === 0 && (
                    <p className="text-center text-xs text-gray-400 pt-8">Нет задач</p>
                  )}
                  <QuickAddTask status={mobileCol.id} projectId={activeProjectId} />
                </div>
              </SortableContext>
            </div>

            {/* Десктоп: три колонки */}
            <div className="hidden md:flex flex-1 overflow-auto p-5 gap-4">
              {COLUMNS.map((col) => {
                const colTasks = byStatus(col.id);
                return (
                  <div key={col.id} className="flex-1 min-w-[220px] flex flex-col">
                    <div className="flex items-center gap-2 mb-2.5 px-1">
                      <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                      <span className={`text-sm font-semibold ${col.headerColor}`}>{col.label}</span>
                      <span className="ml-auto text-xs font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{colTasks.length}</span>
                    </div>
                    <SortableContext id={col.id} items={colTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                      <div className={`flex-1 min-h-[200px] rounded-xl border-2 border-dashed p-2.5 flex flex-col gap-2 ${COL_BG[col.id]}`}>
                        {colTasks.map((task) => <TaskCard key={task.id} task={task} />)}
                        {colTasks.length === 0 && (
                          <p className="text-center text-xs text-gray-400 pt-8">Нет задач</p>
                        )}
                        <QuickAddTask status={col.id} projectId={activeProjectId} />
                      </div>
                    </SortableContext>
                  </div>
                );
              })}
            </div>

            <DragOverlay>
              {activeTask ? <TaskCard task={activeTask} /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </main>
    </div>
  );
}
