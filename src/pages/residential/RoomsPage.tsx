import ResidentialCategoryPage from "./ResidentialCategoryPage";

export default function RoomsPage() {
  return (
    <ResidentialCategoryPage
      title="Комнаты в Иркутске"
      description="Комнаты в аренду и продажу в Иркутске и области. Отдельный раздел жилой недвижимости на ArendaCity."
      badge="Комнаты"
      type="Комната"
      pageUrl="/zhilaya/komnaty"
      heroTitle="Комнаты в аренду и продажу"
      heroText="Быстрый поиск комнат для студентов, молодых специалистов и семей с фильтрами по цене и району."
      features={[
        "Комнаты в квартирах и общежитиях",
        "Подбор по району и бюджету",
        "Публикация и модерация через общий кабинет",
      ]}
    />
  );
}
