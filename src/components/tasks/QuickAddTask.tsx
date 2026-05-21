import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useCreateTask, type TaskStatus } from "@/hooks/useTasks";

interface Props {
  status: TaskStatus;
  projectId?: string | null;
}

export default function QuickAddTask({ status, projectId }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const createTask = useCreateTask();

  const submit = async () => {
    if (!title.trim()) return;
    await createTask.mutateAsync({
      title: title.trim(),
      status,
      priority: "medium",
      project_id: projectId || null,
    });
    setTitle("");
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 w-full px-2 py-1.5 text-xs text-gray-400 hover:text-gray-600 hover:bg-white/60 rounded-lg transition-colors mt-1"
      >
        <Plus className="w-3.5 h-3.5" /> Добавить задачу
      </button>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-2.5 shadow-sm mt-1">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Название задачи..."
        className="w-full text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none mb-2"
      />
      <div className="flex gap-1.5">
        <button
          onClick={submit}
          disabled={!title.trim() || createTask.isPending}
          className="h-7 px-3 bg-gray-900 text-white text-xs font-medium rounded-md hover:bg-gray-800 disabled:opacity-40 transition-colors"
        >
          Добавить
        </button>
        <button
          onClick={() => { setOpen(false); setTitle(""); }}
          className="h-7 w-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
