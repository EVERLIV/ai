import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import TasksSidebar from "@/components/tasks/TasksSidebar";
import { useTasks, type Task, type TaskStatus } from "@/hooks/useTasks";

const statusLabels: Record<TaskStatus, string> = {
  todo: "К выполнению", in_progress: "В работе", done: "Готово",
};
const statusColors: Record<TaskStatus, string> = {
  todo: "bg-gray-100 text-gray-600",
  in_progress: "bg-blue-100 text-blue-700",
  done: "bg-green-100 text-green-700",
};
const priorityLabels: Record<string, string> = {
  low: "Низкий", medium: "Средний", high: "Высокий",
};

export default function TaskReportsPage() {
  const { data: tasks = [], isLoading } = useTasks();
  const [filterAssignee, setFilterAssignee] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const assignees = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.assignee).filter(Boolean) as string[])).sort(),
    [tasks]
  );

  const filtered = useMemo(() => {
    let result = [...tasks];
    if (filterAssignee) result = result.filter((t) => t.assignee === filterAssignee);
    if (dateFrom) result = result.filter((t) => t.due_date && t.due_date >= dateFrom);
    if (dateTo)   result = result.filter((t) => t.due_date && t.due_date <= dateTo);
    return result;
  }, [tasks, filterAssignee, dateFrom, dateTo]);

  // Статистика по исполнителям
  const stats = useMemo(() => {
    const map: Record<string, Record<TaskStatus, number>> = {};
    filtered.forEach((t) => {
      const key = t.assignee || "—";
      if (!map[key]) map[key] = { todo: 0, in_progress: 0, done: 0 };
      map[key][t.status]++;
    });
    return Object.entries(map).map(([name, counts]) => ({ name, ...counts }));
  }, [filtered]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <TasksSidebar />

      <main className="flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-lg font-bold text-gray-900">Отчёты</h1>
          <p className="text-xs text-gray-500 mt-0.5">Статистика по задачам сотрудников</p>
        </div>

        {/* Фильтры */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 flex flex-wrap gap-3">
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Исполнитель</label>
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="h-9 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white min-w-[160px]"
            >
              <option value="">Все</option>
              {assignees.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Срок от</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Срок до</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="h-9 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          {(filterAssignee || dateFrom || dateTo) && (
            <div className="flex items-end">
              <button onClick={() => { setFilterAssignee(""); setDateFrom(""); setDateTo(""); }}
                className="h-9 px-3 text-sm text-gray-500 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Сбросить
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {/* Статистика по сотрудникам */}
            {stats.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
                <h2 className="text-sm font-bold text-gray-800 mb-4">По исполнителям</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {stats.map((s) => (
                    <div key={s.name} className="border border-gray-200 rounded-lg p-3">
                      <p className="text-sm font-semibold text-gray-800 mb-2">{s.name}</p>
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                          К выполнению: {s.todo}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                          В работе: {s.in_progress}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                          Готово: {s.done}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Таблица задач */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-800">Задачи</h2>
                <span className="text-xs text-gray-500">{filtered.length} записей</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Название</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Исполнитель</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Статус</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Приоритет</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Срок</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">Нет задач</td>
                      </tr>
                    ) : filtered.map((task) => (
                      <tr key={task.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <Link to={`/tasks/${task.id}`} className="font-medium text-gray-900 hover:text-gray-600 transition-colors">
                            {task.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{task.assignee || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[task.status]}`}>
                            {statusLabels[task.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{priorityLabels[task.priority]}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">
                          {task.due_date ? new Date(task.due_date).toLocaleDateString("ru-RU") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
