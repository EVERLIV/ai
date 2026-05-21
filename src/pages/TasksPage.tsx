import { useState } from "react";
import { Link } from "react-router-dom";
import {
  DndContext, DragEndEvent, DragOverEvent, DragOverlay,
  PointerSensor, useSensor, useSensors, closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Loader2 } from "lucide-react";
import TasksSidebar from "@/components/tasks/TasksSidebar";
import TaskCard from "@/components/tasks/TaskCard";
import { useTasks, useUpdateTask, type Task, type TaskStatus } from "@/hooks/useTasks";

const COLUMNS: { id: TaskStatus; label: string; color: string; dot: string }[] = [
  { id: "todo",        label: "К выполнению", color: "bg-gray-50 border-gray-200",   dot: "bg-gray-400" },
  { id: "in_progress", label: "В работе",     color: "bg-blue-50 border-blue-200",   dot: "bg-blue-500" },
  { id: "done",        label: "Готово",        color: "bg-green-50 border-green-200", dot: "bg-green-500" },
];

export default function TasksPage() {
  const { data: tasks = [], isLoading } = useTasks();
  const updateTask = useUpdateTask();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

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

  const handleDragOver = (event: DragOverEvent) => {
    const { active } = event;
    setActiveTask(tasks.find((t) => t.id === active.id) ?? null);
  };

  const byStatus = (status: TaskStatus) => tasks.filter((t) => t.status === status);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <TasksSidebar />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Шапка */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Задачи</h1>
            <p className="text-xs text-gray-500 mt-0.5">Всего задач: {tasks.length}</p>
          </div>
          <Link
            to="/tasks/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Новая задача
          </Link>
        </div>

        {/* Kanban */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="flex-1 p-6 overflow-x-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div className="flex gap-4 min-w-[680px]">
                {COLUMNS.map((col) => {
                  const colTasks = byStatus(col.id);
                  return (
                    <div key={col.id} className="flex-1 min-w-[220px]">
                      {/* Заголовок колонки */}
                      <div className="flex items-center gap-2 mb-3 px-1">
                        <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
                        <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                        <span className="ml-auto text-xs text-gray-400 font-medium">{colTasks.length}</span>
                      </div>

                      {/* Дроп-зона */}
                      <SortableContext
                        id={col.id}
                        items={colTasks.map((t) => t.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div
                          className={`min-h-[400px] rounded-xl border-2 border-dashed p-2.5 space-y-2 transition-colors ${col.color}`}
                          data-id={col.id}
                        >
                          {colTasks.map((task) => (
                            <TaskCard key={task.id} task={task} />
                          ))}
                          {colTasks.length === 0 && (
                            <p className="text-center text-xs text-gray-400 pt-8">Нет задач</p>
                          )}
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
