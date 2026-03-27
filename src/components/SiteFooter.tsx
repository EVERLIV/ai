const cols = [
  {
    title: "Разделы",
    links: ["Офисы", "Торговые площади", "Склады", "Земельные участки", "Готовый бизнес"],
  },
  {
    title: "Регионы",
    links: ["Москва", "Санкт-Петербург", "Екатеринбург", "Новосибирск", "Казань"],
  },
  {
    title: "Контакты",
    links: ["+7 (495) 123-45-67", "info@arendacity.ru", "Москва, Пресненская наб., 12"],
  },
];

export default function SiteFooter() {
  return (
    <footer className="bg-foreground text-background/70">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">А</span>
              </div>
              <span className="font-display text-lg font-semibold text-background">
                АРЕНДА<span className="text-primary">СИТИ</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              Умная платформа коммерческой недвижимости с ИИ-поиском и аналитикой рынка.
            </p>
          </div>

          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-background mb-4">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm hover:text-background transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-background/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs">© 2025 АрендаСити. Все права защищены.</p>
          <div className="flex gap-4 text-xs">
            <a href="#" className="hover:text-background transition-colors">Политика конфиденциальности</a>
            <a href="#" className="hover:text-background transition-colors">Условия использования</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
