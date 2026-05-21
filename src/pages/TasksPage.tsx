import { useState } from "react";
import { Link } from "react-router-dom";
import {
  DndContext, DragEndEvent, DragOverlay,
  PointerSensor, useSensor, useSensors, closestCorners,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, Loader2, ChevronDown, Filter, X, FolderPlus } from "lucide-react";
import TasksSidebar from "@/components/tasks/TasksSidebar";
import TaskCard from "@/components/tasks/TaskCard";
import QuickAddTask from "@/components/tasks/QuickAddTask";
import {
  useTasks, useUpdateTask, useProjects, useCreateProject,
  type Task, type TaskStatus, type TaskProject,
} from "@/hooks/useTasks";
import { useStaffMembers } from "@/hooks/useTasks";

const COLUMNS: { id: TaskStatus; label: string; color: string; dot: string; header: string }[] = [
  { id: "todo",        label: "К выполнению", color: "bg-gray-50 border-gray-200",   dot: "bg-gray-400",  header: "text-gray-600" },
  { id: "in_progress", label: "В работе",     color: "bg-blue-50 border-blue-200",   dot: "bg-blue-500",  header: "text-blue-700" },
  { id: "done",        label: "Готово",        color: "bg-green-50 border-green-200", dot: "bg-green-500", header: "text-green-700" },
];

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

  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: tasks = [], isLoading } = useTasks(activeProjectId || undefined);
  const { data: staff = [] } = useStaffMembers();
  const updateTask = useUpdateTask();
  const createProject = useCreateProject();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // Фильтрация
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
    if (dragged && dragged.status !== colId) {
      updateTask.mutate({ id: dragged.id, status: colId as TaskStatus });
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    const colors = ["#6366f1","#f59e0b","#10b981","#ef4444","#8b5cf6","#06b6d4"];
    const color = colors[projects.length % colors.length];
    const p = await createProject.mutateAsync({ name: newProjectName.trim(), color });
    setActiveProjectId(p.id);
    setNewProjectName("");
    setShowNewProject(false);
  };

  const activeFilters = [filterAssignee, filterPriority !== "all"].filter(Boolean).length;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <TasksSidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Шапка */}
        <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {/* Все задачи */}
            <button onClick={() => setActiveProjectId(null)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                !activeProjectId ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
              }`}>
              Все задачи
            </button>

            {/* Проекты */}
            {projects.map((p) => (
              <button key={p.id} onClick={() => setActiveProjectId(p.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeProjectId === p.id ? "text-white" : "text-gray-600 hover:bg-gray-100"
                }`}
                style={activeProjectId === p.id ? { backgroundColor: p.color } : {}}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: activeProjectId === p.id ? "rgba(255,255,255,0.7)" : p.color }} />
                {p.name}
              </button>
            ))}

            {/* Новый проект */}
            {showNewProject ? (
              <div className="flex items-center gap-1.5 shrink-0">
                <input autoFocus value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreateProject(); if (e.key === "Escape") setShowNewProject(false); }}
                  placeholder="Название доски..."
                  className="h-8 px-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 w-36" />
                <button onClick={handleCreateProject} className="h-8 px-2.5 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-800">ОК</button>
                <button onClick={() => setShowNewProject(false)} className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button onClick={() => setShowNewProject(true)}
                className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg text-sm transition-colors">
                <FolderPlus className="w-3.5 h-3.5" /> Новая доска
              </button>
            )}
          </div>

          {/* Правая часть */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Фильтры */}
            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm transition-colors ${
                showFilters || activeFilters > 0 ? "bg-gray-900 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}>
              <Filter className="w-3.5 h-3.5" />
              Фильтры
              {activeFilters > 0 && <span className="w-4 h-4 bg-white text-gray-900 rounded-full text-[10px] font-bold flex items-center justify-center">{activeFilters}</span>}
            </button>

            <Link to="/tasks/new"
              className="flex items-center gap-1.5 h-8 px-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">
              <Plus className="w-4 h-4" /> Задача
            </Link>
          </div>
        </div>

        {/* Панель фильтров */}
        {showFilters && (
          <div className="bg-white border-b border-gray-200 px-5 py-2.5 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Исполнитель</label>
              <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}
                className="h-7 px-2 border border-gray-200 rounded-md text-xs focus:outline-none bg-white">
                <option value="">Все</option>
                {staff.map((s) => <option key={s.id} value={s.full_name || s.email || ""}>{s.full_name || s.email}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Приоритет</label>
              <div className="flex gap-1">
                {[["all","Все"],["high","Высокий"],["medium","Средний"],["low","Низкий"]].map(([v,l]) => (
                  <button key={v} onClick={() => setFilterPriority(v)}
                    className={`px-2 py-0.5 text-xs font-medium rounded-full transition-colors ${
                      filterPriority === v ? PRIORITY_COLORS[v] + " ring-1 ring-current" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            {activeFilters > 0 && (
              <button onClick={() => { setFilterAssignee(""); setFilterPriority("all"); }}
                className="text-xs text-red-500 hover:text-red-700 ml-auto">
                Сбросить
              </button>
            )}
          </div>
        )}

        {/* Kanban */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="flex-1 overflow-auto p-5">
            <DndContext sensors={sensors} collisionDetection={closestCorners}
              onDragStart={(e) => setActiveTask(tasks.find((t) => t.id === e.active.id) ?? null)}
              onDragEnd={handleDragEnd}>
              <div className="flex gap-4 min-w-[680px] h-full">
                {COLUMNS.map((col) => {
                  const colTasks = byStatus(col.id);
                  return (
                    <div key={col.id} className="flex-1 min-w-[220px] flex flex-col">
                      <div className="flex items-center gap-2 mb-2.5 px-1">
                        <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                        <span className={`text-sm font-semibold ${col.header}`}>{col.label}</span>
                        <span className="ml-auto text-xs font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">{colTasks.length}</span>
                      </div>

                      <SortableContext id={col.id} items={colTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                        <div className={`flex-1 min-h-[200px] rounded-xl border-2 border-dashed p-2.5 flex flex-col gap-2 transition-colors ${col.color}`}>
                          {colTasks.map((task) => <TaskCard key={task.id} task={task} />)}

                          {/* Быстрое добавление */}
                          <QuickAddTask
                            status={col.id}
                            projectId={activeProjectId}
                          />
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
          </div>
        )}
      </main>
    </div>
  );
}
