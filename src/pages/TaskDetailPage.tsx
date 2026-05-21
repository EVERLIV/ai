import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, Loader2, Save } from "lucide-react";
import TasksSidebar from "@/components/tasks/TasksSidebar";
import { useTask, useUpdateTask, useDeleteTask, useStaffMembers, type TaskStatus, type TaskPriority } from "@/hooks/useTasks";

const statusLabels: Record<TaskStatus, string> = {
  todo: "К выполнению", in_progress: "В работе", done: "Готово",
};
const priorityLabels: Record<TaskPriority, string> = {
  low: "Низкий", medium: "Средний", high: "Высокий",
};

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: task, isLoading } = useTask(id);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { data: staff = [] } = useStaffMembers();
  const [notes, setNotes] = useState<string>("");
  const [notesSaved, setNotesSaved] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <TasksSidebar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </main>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <TasksSidebar />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Задача не найдена</p>
        </main>
      </div>
    );
  }

  const handleSaveNotes = async () => {
    await updateTask.mutateAsync({ id: task.id, notes });
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  const handleDelete = async () => {
    if (!confirm("Удалить задачу?")) return;
    await deleteTask.mutateAsync(task.id);
    navigate("/tasks");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <TasksSidebar />

      <main className="flex-1 p-8 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/tasks")}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Назад к задачам
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Удалить
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h1 className="text-xl font-bold text-gray-900">{task.title}</h1>

          {task.description && (
            <p className="text-sm text-gray-600 leading-relaxed">{task.description}</p>
          )}

          {/* Поля */}
          <div className="grid grid-cols-2 gap-4">
            {/* Статус */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Статус</label>
              <select
                value={task.status}
                onChange={(e) => updateTask.mutate({ id: task.id, status: e.target.value as TaskStatus })}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value="todo">К выполнению</option>
                <option value="in_progress">В работе</option>
                <option value="done">Готово</option>
              </select>
            </div>

            {/* Приоритет */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Приоритет</label>
              <select
                value={task.priority}
                onChange={(e) => updateTask.mutate({ id: task.id, priority: e.target.value as TaskPriority })}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value="low">Низкий</option>
                <option value="medium">Средний</option>
                <option value="high">Высокий</option>
              </select>
            </div>

            {/* Исполнитель */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Исполнитель</label>
              <select
                value={task.assignee || ""}
                onChange={(e) => updateTask.mutate({ id: task.id, assignee: e.target.value || undefined })}
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              >
                <option value="">— Не назначен —</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.full_name || s.email || s.id}>
                    {s.full_name || s.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Срок */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Срок</label>
              <p className="text-sm text-gray-700 py-2.5 px-3 bg-gray-50 rounded-lg">
                {task.due_date ? new Date(task.due_date).toLocaleDateString("ru-RU") : "—"}
              </p>
            </div>
          </div>

          {/* Заметки */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Заметки / Комментарии
            </label>
            <textarea
              value={notes || task.notes || ""}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="Добавьте заметки или комментарии..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
            />
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={handleSaveNotes}
                disabled={updateTask.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {updateTask.isPending
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Save className="w-3.5 h-3.5" />
                }
                Сохранить заметки
              </button>
              {notesSaved && <span className="text-xs text-green-600 font-medium">Сохранено ✓</span>}
            </div>
          </div>

          {/* Мета */}
          <div className="pt-2 border-t border-gray-100 flex gap-6 text-xs text-gray-400">
            <span>Создана: {new Date(task.created_at).toLocaleDateString("ru-RU")}</span>
            <span>Обновлена: {new Date(task.updated_at).toLocaleDateString("ru-RU")}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
