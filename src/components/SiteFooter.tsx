const cols = [
  {
    title: "Разделы",
    links: ["Офисы", "Торговые площади", "Склады", "Земельные участки", "Жилая аренда"],
  },
  {
    title: "Города",
    links: ["Иркутск", "Ангарск", "Шелехов", "Усолье-Сибирское", "Братск"],
  },
  {
    title: "Контакты",
    links: ["+7 (3952) 55-12-34", "info@arendacity-irk.ru", "Иркутск, ул. Ленина, 18, оф. 401"],
  },
];

export default function SiteFooter() {
  return (
    <footer className="bg-foreground text-background/70">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-base tracking-tight">А</span>
              </div>
              <span className="flex flex-col leading-none">
                <span className="font-sans text-[17px] font-bold tracking-tight text-background">
                  АРЕНДА<span className="text-primary">СИТИ</span>
                </span>
                <span className="text-[10px] font-medium tracking-wide text-background/60 mt-0.5 uppercase">
                  Коммерческая недвижимость и реклама
                </span>
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              Агентство коммерческой недвижимости в Иркутске и Иркутской области. Профессиональный подбор и управление объектами.
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

        <div className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs">© 2025 АрендаСити Иркутск. Все права защищены.</p>
          <div className="flex gap-4 text-xs">
            <a href="#" className="hover:text-background transition-colors">Политика конфиденциальности</a>
            <a href="#" className="hover:text-background transition-colors">Условия использования</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
