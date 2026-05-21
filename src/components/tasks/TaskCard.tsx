import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Link } from "react-router-dom";
import { User, CheckSquare, Trash2 } from "lucide-react";
import type { Task } from "@/hooks/useTasks";
import { useDeleteTask } from "@/hooks/useTasks";
import { getDeadlineInfo } from "@/lib/deadline";

const priorityStyles: Record<string, string> = {
  low:    "bg-gray-100 text-gray-500",
  medium: "bg-yellow-100 text-yellow-700",
  high:   "bg-red-100 text-red-700",
};
const priorityLabels: Record<string, string> = {
  low: "Низкий", medium: "Средний", high: "Высокий",
};

const tagColors = [
  "bg-purple-100 text-purple-700", "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",   "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
];

function tagColor(tag: string) {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = tag.charCodeAt(i) + ((h << 5) - h);
  return tagColors[Math.abs(h) % tagColors.length];
}

interface Props { task: Task; }

export default function TaskCard({ task }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });
  const deleteTask = useDeleteTask();

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  const checklist = task.checklist || [];
  const checkDone = checklist.filter((c) => c.done).length;
  const checkTotal = checklist.length;
  const deadline = getDeadlineInfo(task.due_date, task.status);

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className="relative bg-white rounded-xl border border-gray-200 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md hover:border-gray-300 transition-all group">

      {/* Кнопка удаления */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!confirm("Удалить задачу?")) return;
          deleteTask.mutate(task.id);
        }}
        className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
        title="Удалить задачу"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      <Link to={`/tasks/${task.id}`} onClick={(e) => e.stopPropagation()} className="block p-3">

        {/* Теги */}
        {task.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {task.tags.slice(0, 3).map((tag) => (
              <span key={tag} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${tagColor(tag)}`}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Заголовок */}
        <p className="text-sm font-semibold text-gray-900 leading-snug mb-2.5 group-hover:text-gray-700 transition-colors">
          {task.title}
        </p>

        {/* Чеклист прогресс */}
        {checkTotal > 0 && (
          <div className="mb-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <CheckSquare className="w-3 h-3" /> {checkDone}/{checkTotal}
              </span>
            </div>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${checkTotal ? (checkDone / checkTotal) * 100 : 0}%` }} />
            </div>
          </div>
        )}

        {/* Нижняя строка */}
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${priorityStyles[task.priority]}`}>
            {priorityLabels[task.priority]}
          </span>
          <div className="flex items-center gap-2">
            {task.assignee && (
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <User className="w-3 h-3" />
                {task.assignee.split(" ")[0]}
              </span>
            )}
            {deadline && (
              <span className={`flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${deadline.colorClass} ${deadline.bgClass}`}>
                {deadline.emoji && <span>{deadline.emoji}</span>}
                {deadline.label}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
