import ResidentialCategoryPage from "./ResidentialCategoryPage";

export default function HousesPage() {
  return (
    <ResidentialCategoryPage
      title="Дома и коттеджи в Иркутске"
      description="Дома, коттеджи и таунхаусы в аренду и продажу в Иркутске и области. Жилой каталог ArendaCity для частных домов."
      badge="Дома и коттеджи"
      type="Дом"
      pageUrl="/zhilaya/doma"
      heroTitle="Дома, коттеджи и таунхаусы"
      heroText="Подбор частных домов и загородной жилой недвижимости по площади, стоимости и району Иркутской области."
      features={[
        "Дома для длительной аренды и покупки",
        "Таунхаусы и коттеджи в одном разделе",
        "Бесплатное размещение для собственников",
      ]}
    />
  );
}
