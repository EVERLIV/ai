import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import TasksSidebar from "@/components/tasks/TasksSidebar";
import { useCreateTask, useStaffMembers, useProjects, type TaskPriority, type TaskStatus } from "@/hooks/useTasks";

const schema = z.object({
  title:       z.string().min(1, "Название обязательно"),
  description: z.string().optional(),
  assignee:    z.string().optional(),
  priority:    z.enum(["low", "medium", "high"]),
  status:      z.enum(["todo", "in_progress", "done"]),
  due_date:    z.string().optional(),
  project_id:  z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function TaskNewPage() {
  const navigate = useNavigate();
  const createTask = useCreateTask();
  const { data: staff = [] } = useStaffMembers();
  const { data: projects = [] } = useProjects();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: "medium", status: "todo" },
  });

  const onSubmit = async (data: FormData) => {
    await createTask.mutateAsync({
      title:       data.title,
      description: data.description || undefined,
      assignee:    data.assignee || undefined,
      priority:    data.priority as TaskPriority,
      status:      data.status as TaskStatus,
      due_date:    data.due_date || undefined,
      project_id:  data.project_id || null,
    });
    navigate("/tasks");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <TasksSidebar />

      <main className="flex-1 p-8 max-w-2xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Назад
        </button>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h1 className="text-lg font-bold text-gray-900 mb-6">Новая задача</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Название */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Название *
              </label>
              <input
                {...register("title")}
                placeholder="Что нужно сделать?"
                className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>

            {/* Описание */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                Описание
              </label>
              <textarea
                {...register("description")}
                rows={3}
                placeholder="Подробное описание задачи..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Исполнитель */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  Исполнитель
                </label>
                <select
                  {...register("assignee")}
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
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  Срок
                </label>
                <input
                  type="date"
                  {...register("due_date")}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              {/* Приоритет */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  Приоритет
                </label>
                <select
                  {...register("priority")}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                >
                  <option value="low">Низкий</option>
                  <option value="medium">Средний</option>
                  <option value="high">Высокий</option>
                </select>
              </div>

              {/* Статус */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  Статус
                </label>
                <select
                  {...register("status")}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                >
                  <option value="todo">К выполнению</option>
                  <option value="in_progress">В работе</option>
                  <option value="done">Готово</option>
                </select>
              </div>
            </div>

            {/* Проект */}
            {projects.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Проект / Доска</label>
                <select {...register("project_id")}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white">
                  <option value="">— Без проекта —</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={createTask.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                {createTask.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Создать задачу
              </button>
              <button
                type="button"
                onClick={() => navigate("/tasks")}
                className="px-5 py-2.5 border border-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
