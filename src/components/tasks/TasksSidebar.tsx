import { Link, useLocation } from "react-router-dom";
import { CheckSquare, BarChart2, ArrowLeft } from "lucide-react";

const links = [
  { to: "/tasks", icon: CheckSquare, label: "Задачи" },
  { to: "/reports", icon: BarChart2, label: "Отчёты" },
];

export default function TasksSidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="w-56 min-h-screen bg-gray-900 flex flex-col shrink-0">
      {/* Лого */}
      <div className="px-5 py-5 border-b border-gray-800">
        <span className="text-white font-bold text-sm tracking-wide">АРЕНДА СИТИ</span>
        <p className="text-gray-500 text-[11px] mt-0.5">Управление задачами</p>
      </div>

      {/* Навигация */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, icon: Icon, label }) => {
          const active = pathname === to || pathname.startsWith(to + "/");
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Назад на сайт */}
      <div className="px-3 py-4 border-t border-gray-800">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          На сайт
        </Link>
      </div>
    </aside>
  );
}
