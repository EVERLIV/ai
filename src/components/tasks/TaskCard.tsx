import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Link } from "react-router-dom";
import { User, Calendar, Flag } from "lucide-react";
import type { Task } from "@/hooks/useTasks";

const priorityStyles: Record<string, string> = {
  low:    "bg-gray-100 text-gray-600",
  medium: "bg-yellow-100 text-yellow-700",
  high:   "bg-red-100 text-red-700",
};

const priorityLabels: Record<string, string> = {
  low: "Низкий", medium: "Средний", high: "Высокий",
};

interface Props { task: Task; }

export default function TaskCard({ task }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <Link
        to={`/tasks/${task.id}`}
        onClick={(e) => e.stopPropagation()}
        className="block"
      >
        <p className="text-sm font-semibold text-gray-900 mb-2 leading-snug">{task.title}</p>

        <div className="flex items-center justify-between gap-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${priorityStyles[task.priority]}`}>
            {priorityLabels[task.priority]}
          </span>
        </div>

        <div className="mt-2.5 flex items-center gap-3 text-[11px] text-gray-500">
          {task.assignee && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {task.assignee}
            </span>
          )}
          {task.due_date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(task.due_date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
