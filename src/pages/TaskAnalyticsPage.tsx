import { useState } from "react";
import { Loader2, Sparkles, RefreshCw, Calendar, TrendingUp, AlertTriangle, CheckCircle, Info } from "lucide-react";
import TasksSidebar from "@/components/tasks/TasksSidebar";
import { useAIReports, useGenerateAIReport, useTasks, type AIReport } from "@/hooks/useTasks";

const insightColors: Record<string, { bg: string; border: string; icon: React.ElementType; text: string }> = {
  critical: { bg: "bg-red-50",    border: "border-red-200",    icon: AlertTriangle,  text: "text-red-700" },
  warning:  { bg: "bg-yellow-50", border: "border-yellow-200", icon: AlertTriangle,  text: "text-yellow-700" },
  success:  { bg: "bg-green-50",  border: "border-green-200",  icon: CheckCircle,    text: "text-green-700" },
  info:     { bg: "bg-blue-50",   border: "border-blue-200",   icon: Info,           text: "text-blue-700" },
};

function ReportCard({ report, isToday }: { report: AIReport; isToday: boolean }) {
  const [expanded, setExpanded] = useState(isToday);

  return (
    <div className={`bg-white rounded-xl border transition-all ${isToday ? "border-indigo-200 shadow-md" : "border-gray-200"}`}>
      {/* Заголовок */}
      <button className="w-full flex items-center justify-between px-5 py-4 text-left"
        onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          {isToday && <span className="text-xs font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">Сегодня</span>}
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-800">
                {new Date(report.report_date).toLocaleDateString("ru-RU", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric"
                })}
              </span>
            </div>
            {!expanded && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 max-w-xl">{report.summary}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-gray-400">
            {new Date(report.generated_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <span className={`text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}>▾</span>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
          {/* Резюме */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">ИИ-резюме дня</span>
            </div>
            <p className="text-sm text-indigo-900 leading-relaxed">{report.summary}</p>
          </div>

          {/* Инсайты */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {report.insights?.map((insight, i) => {
              const style = insightColors[insight.type] || insightColors.info;
              const Icon = style.icon;
              return (
                <div key={i} className={`rounded-xl border p-3.5 ${style.bg} ${style.border}`}>
                  <div className="flex items-start gap-2.5">
                    <span className="text-xl shrink-0">{insight.emoji}</span>
                    <div>
                      <div className={`text-xs font-bold mb-1 ${style.text}`}>{insight.title}</div>
                      <p className={`text-xs leading-relaxed ${style.text} opacity-80`}>{insight.text}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TaskAnalyticsPage() {
  const { data: reports = [], isLoading } = useAIReports();
  const { data: tasks = [] } = useTasks();
  const generate = useGenerateAIReport();

  const today = new Date().toISOString().split("T")[0];
  const todayReport = reports.find(r => r.report_date === today);

  // Быстрая статистика
  const total = tasks.length;
  const done = tasks.filter(t => t.status === "done").length;
  const inProgress = tasks.filter(t => t.status === "in_progress").length;
  const overdue = tasks.filter(t => t.due_date && t.status !== "done" && new Date(t.due_date) < new Date()).length;
  const doneToday = tasks.filter(t => t.status === "done" && t.updated_at?.startsWith(today)).length;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <TasksSidebar />

      <main className="flex-1 overflow-y-auto pt-12 md:pt-0">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 md:py-6">

          {/* Шапка */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" /> ИИ-аналитика
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">Ежедневный дайджест формируется в 22:00</p>
            </div>
            <button
              onClick={() => generate.mutate(true)}
              disabled={generate.isPending}
              className="flex items-center justify-center gap-2 px-4 h-9 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors w-full sm:w-auto"
            >
              {generate.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Анализирую...</>
                : <><RefreshCw className="w-4 h-4" /> Сгенерировать сейчас</>
              }
            </button>
          </div>

          {/* Быстрые метрики */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Всего задач", value: total, color: "text-gray-800", bg: "bg-white" },
              { label: "В работе", value: inProgress, color: "text-blue-700", bg: "bg-blue-50" },
              { label: "Просрочено", value: overdue, color: "text-red-700", bg: "bg-red-50" },
              { label: "Закрыто сегодня", value: doneToday, color: "text-green-700", bg: "bg-green-50" },
            ].map((s) => (
              <div key={s.label} className={`${s.bg} rounded-xl border border-gray-200 p-4 text-center`}>
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Если нет отчёта за сегодня */}
          {!todayReport && !isLoading && (
            <div className="bg-white border border-dashed border-indigo-300 rounded-xl p-8 text-center mb-6">
              <Sparkles className="w-10 h-10 text-indigo-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-700 mb-1">Отчёт за сегодня ещё не сформирован</p>
              <p className="text-xs text-gray-400 mb-4">Автоматически генерируется в 22:00 или нажмите кнопку выше</p>
              <button onClick={() => generate.mutate(false)} disabled={generate.isPending}
                className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors">
                {generate.isPending ? "Анализирую..." : "Сформировать отчёт"}
              </button>
            </div>
          )}

          {/* Список отчётов */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} isToday={report.report_date === today} />
              ))}
              {reports.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-8">Отчётов пока нет</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
