import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, Loader2, Send, X, Plus, CheckSquare, Square, Timer } from "lucide-react";
import { getDeadlineInfo, formatCountdown } from "@/lib/deadline";
import TasksSidebar from "@/components/tasks/TasksSidebar";
import {
  useTask, useUpdateTask, useDeleteTask,
  useComments, useAddComment, useDeleteComment,
  useStaffMembers, useProjects,
  type TaskStatus, type TaskPriority, type ChecklistItem,
} from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";

const statusLabels: Record<TaskStatus, string> = { todo: "К выполнению", in_progress: "В работе", done: "Готово" };
const statusColors: Record<TaskStatus, string> = {
  todo: "bg-gray-100 text-gray-700", in_progress: "bg-blue-100 text-blue-700", done: "bg-green-100 text-green-700",
};

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: task, isLoading } = useTask(id);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { data: comments = [] } = useComments(id);
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();
  const { data: staff = [] } = useStaffMembers();
  const { data: projects = [] } = useProjects();

  const [commentText, setCommentText] = useState("");
  const [newCheckItem, setNewCheckItem] = useState("");
  const [newTag, setNewTag] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [countdown, setCountdown] = useState("");

  // Живой таймер обратного отсчёта
  useEffect(() => {
    if (!task?.due_date || task.status === "done") return;
    const update = () => setCountdown(formatCountdown(task.due_date!));
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [task?.due_date, task?.status]);

  if (isLoading || !task) return (
    <div className="flex min-h-screen bg-gray-50">
      <TasksSidebar />
      <main className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </main>
    </div>
  );

  const authorName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Аноним";

  // Чеклист
  const checklist: ChecklistItem[] = task.checklist || [];
  const toggleCheck = (itemId: string) => {
    const updated = checklist.map((c) => c.id === itemId ? { ...c, done: !c.done } : c);
    updateTask.mutate({ id: task.id, checklist: updated });
  };
  const addCheckItem = () => {
    if (!newCheckItem.trim()) return;
    const updated = [...checklist, { id: crypto.randomUUID(), text: newCheckItem.trim(), done: false }];
    updateTask.mutate({ id: task.id, checklist: updated });
    setNewCheckItem("");
  };
  const removeCheckItem = (itemId: string) => {
    updateTask.mutate({ id: task.id, checklist: checklist.filter((c) => c.id !== itemId) });
  };

  // Теги
  const tags: string[] = task.tags || [];
  const addTag = () => {
    const t = newTag.trim();
    if (!t || tags.includes(t)) { setNewTag(""); setShowTagInput(false); return; }
    updateTask.mutate({ id: task.id, tags: [...tags, t] });
    setNewTag(""); setShowTagInput(false);
  };
  const removeTag = (tag: string) => updateTask.mutate({ id: task.id, tags: tags.filter((t) => t !== tag) });

  const checkDone = checklist.filter((c) => c.done).length;
  const deadline = getDeadlineInfo(task.due_date, task.status);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <TasksSidebar />

      <main className="flex-1 overflow-y-auto pt-12 md:pt-0">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 md:py-6">
          {/* Навигация */}
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => navigate("/tasks")}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Назад к задачам
            </button>
            <button onClick={async () => { if (!confirm("Удалить задачу?")) return; await deleteTask.mutateAsync(task.id); navigate("/tasks"); }}
              className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-600 transition-colors">
              <Trash2 className="w-4 h-4" /> Удалить
            </button>
          </div>

          {/* Заголовок + статус */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            <div className="flex items-start gap-3 mb-4">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${statusColors[task.status]}`}>
                {statusLabels[task.status]}
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-3 leading-snug">{task.title}</h1>
            {task.description && <p className="text-sm text-gray-600 leading-relaxed">{task.description}</p>}

            {/* Теги */}
            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              {tags.map((tag) => (
                <span key={tag} className="group inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {showTagInput ? (
                <input autoFocus value={newTag} onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addTag(); if (e.key === "Escape") { setShowTagInput(false); setNewTag(""); } }}
                  onBlur={addTag}
                  placeholder="Тег..."
                  className="h-6 px-2 text-xs border border-indigo-300 rounded-full focus:outline-none w-24" />
              ) : (
                <button onClick={() => setShowTagInput(true)}
                  className="text-xs text-gray-400 hover:text-indigo-600 flex items-center gap-0.5 px-1.5 py-0.5 hover:bg-indigo-50 rounded-full transition-colors">
                  <Plus className="w-3 h-3" /> Тег
                </button>
              )}
            </div>
          </div>

          {/* Таймер дедлайна */}
          {deadline && task.status !== "done" && (
            <div className={`rounded-xl border p-4 mb-4 flex items-center gap-3 md:gap-4 ${
              deadline.state === "overdue"  ? "bg-red-50 border-red-200" :
              deadline.state === "critical" ? "bg-orange-50 border-orange-200" :
              deadline.state === "warning"  ? "bg-yellow-50 border-yellow-200" :
                                              "bg-gray-50 border-gray-200"
            }`}>
              <div className="text-3xl leading-none select-none">
                {deadline.state === "overdue" ? "🔥" : deadline.state === "critical" ? "⚠️" : deadline.state === "warning" ? "⏰" : "📅"}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-semibold uppercase tracking-wide mb-0.5 ${
                  deadline.state === "overdue" ? "text-red-500" :
                  deadline.state === "critical" ? "text-orange-500" :
                  deadline.state === "warning" ? "text-yellow-700" : "text-gray-500"
                }`}>
                  {deadline.state === "overdue" ? "Задача просрочена" :
                   deadline.state === "critical" ? "Срок истекает сегодня" :
                   deadline.state === "warning" ? "Срок скоро" : "Срок выполнения"}
                </div>
                <div className={`text-xl font-bold font-mono ${
                  deadline.state === "overdue" ? "text-red-700" :
                  deadline.state === "critical" ? "text-orange-700" :
                  deadline.state === "warning" ? "text-yellow-800" : "text-gray-800"
                }`}>
                  {countdown || deadline.label}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  Дедлайн: {new Date(task.due_date!).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                </div>
              </div>
              {deadline.state === "overdue" && (
                <div className="text-[11px] font-semibold text-red-500 bg-red-100 px-2.5 py-1.5 rounded-lg text-center shrink-0">
                  ПРОСРОЧЕНО<br />
                  <span className="text-xs font-normal">{deadline.label}</span>
                </div>
              )}
            </div>
          )}

          {/* Поля */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Детали задачи</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">Статус</label>
                <select value={task.status} onChange={(e) => updateTask.mutate({ id: task.id, status: e.target.value as TaskStatus })}
                  className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
                  <option value="todo">К выполнению</option>
                  <option value="in_progress">В работе</option>
                  <option value="done">Готово</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">Приоритет</label>
                <select value={task.priority} onChange={(e) => updateTask.mutate({ id: task.id, priority: e.target.value as TaskPriority })}
                  className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
                  <option value="low">Низкий</option>
                  <option value="medium">Средний</option>
                  <option value="high">Высокий</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">Исполнители</label>
                <div className="border border-gray-200 rounded-lg p-2 flex flex-wrap gap-1.5 min-h-[36px]">
                  {(task.assignees || []).map((name) => (
                    <span key={name} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                      {name}
                      <button onClick={() => updateTask.mutate({ id: task.id, assignees: (task.assignees || []).filter(a => a !== name) })}
                        className="hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                  <select
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val || (task.assignees || []).includes(val)) return;
                      updateTask.mutate({ id: task.id, assignees: [...(task.assignees || []), val] });
                    }}
                    className="h-6 px-1 text-xs border-0 bg-transparent text-gray-400 focus:outline-none focus:text-gray-700 cursor-pointer"
                  >
                    <option value="">+ добавить</option>
                    {staff.filter(s => !(task.assignees || []).includes(s.full_name || s.email || "")).map((s) => (
                      <option key={s.id} value={s.full_name || s.email || s.id}>{s.full_name || s.email}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">Срок</label>
                <input type="date" value={task.due_date || ""}
                  onChange={(e) => updateTask.mutate({ id: task.id, due_date: e.target.value || undefined })}
                  className={`w-full h-9 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 ${deadline?.state === "overdue" ? "border-red-300 bg-red-50 text-red-700" : "border-gray-200"}`} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">Проект</label>
                <select value={task.project_id || ""} onChange={(e) => updateTask.mutate({ id: task.id, project_id: e.target.value || null })}
                  className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900">
                  <option value="">— Без проекта —</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Чеклист */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5" /> Чеклист
                {checklist.length > 0 && (
                  <span className="text-gray-400 font-normal">{checklist.filter(c=>c.done).length}/{checklist.length}</span>
                )}
              </h3>
            </div>

            {checklist.length > 0 && (
              <div className="mb-3">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${checklist.length ? (checkDone / checklist.length) * 100 : 0}%` }} />
                </div>
                <div className="space-y-1.5">
                  {checklist.map((item) => (
                    <div key={item.id} className="flex items-center gap-2.5 group">
                      <button onClick={() => toggleCheck(item.id)} className="shrink-0 text-gray-400 hover:text-green-600 transition-colors">
                        {item.done ? <CheckSquare className="w-4 h-4 text-green-500" /> : <Square className="w-4 h-4" />}
                      </button>
                      <span className={`text-sm flex-1 ${item.done ? "line-through text-gray-400" : "text-gray-700"}`}>{item.text}</span>
                      <button onClick={() => removeCheckItem(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <input value={newCheckItem} onChange={(e) => setNewCheckItem(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCheckItem()}
                placeholder="Добавить пункт..."
                className="flex-1 h-8 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              <button onClick={addCheckItem} disabled={!newCheckItem.trim()}
                className="h-8 px-3 bg-gray-900 text-white text-xs rounded-lg hover:bg-gray-800 disabled:opacity-40 transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Комментарии */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Комментарии · {comments.length}
            </h3>

            <div className="space-y-3 mb-4">
              {comments.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Комментариев пока нет</p>
              )}
              {comments.map((c) => (
                <div key={c.id} className="flex gap-3 group">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold shrink-0">
                    {(c.author_name || "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-800">{c.author_name || "Аноним"}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(c.created_at).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                  </div>
                  <button onClick={() => deleteComment.mutate({ id: c.id, taskId: task.id })}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all shrink-0 mt-1">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Ввод комментария */}
            <div className="flex gap-3 items-start">
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-bold shrink-0">
                {authorName[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submitComment(); } }}
                  placeholder="Написать комментарий... (Ctrl+Enter для отправки)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
                <div className="flex justify-end mt-2">
                  <button onClick={submitComment} disabled={!commentText.trim() || addComment.isPending}
                    className="flex items-center gap-1.5 h-8 px-4 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 disabled:opacity-40 transition-colors">
                    <Send className="w-3.5 h-3.5" /> Отправить
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  function submitComment() {
    if (!commentText.trim()) return;
    addComment.mutate({ task_id: task!.id, content: commentText.trim(), author_name: authorName });
    setCommentText("");
  }
}
