import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckSquare, BarChart2, ArrowLeft, Sparkles, Menu, X } from "lucide-react";

const links = [
  { to: "/tasks",     icon: CheckSquare, label: "Задачи" },
  { to: "/reports",   icon: BarChart2,   label: "Отчёты" },
  { to: "/analytics", icon: Sparkles,    label: "ИИ-аналитика" },
];

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { pathname } = useLocation();
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-gray-800 flex items-center justify-between">
        <div>
          <span className="text-white font-bold text-sm tracking-wide">АРЕНДА СИТИ</span>
          <p className="text-gray-500 text-[11px] mt-0.5">Управление задачами</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors md:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, icon: Icon, label }) => {
          const active = pathname === to || pathname.startsWith(to + "/");
          return (
            <Link key={to} to={to} onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? "bg-gray-800 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}>
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-800">
        <Link to="/" onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
          <ArrowLeft className="w-4 h-4 shrink-0" />
          На сайт
        </Link>
      </div>
    </div>
  );
}

export default function TasksSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Десктоп — фиксированный сайдбар */}
      <aside className="hidden md:flex w-56 min-h-screen bg-gray-900 flex-col shrink-0">
        <SidebarContent />
      </aside>

      {/* Мобильный — топ-бар с hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-gray-900 flex items-center justify-between px-4 h-12 shrink-0">
        <span className="text-white font-bold text-sm">АРЕНДА СИТИ</span>
        <button onClick={() => setMobileOpen(true)} className="text-gray-300 hover:text-white p-1">
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Мобильный drawer */}
      {mobileOpen && (
        <>
          <div className="md:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setMobileOpen(false)} />
          <aside className="md:hidden fixed left-0 top-0 bottom-0 w-64 bg-gray-900 z-50 flex flex-col">
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </aside>
        </>
      )}
    </>
  );
}
