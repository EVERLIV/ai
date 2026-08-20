import ResidentialCategoryPage from "./ResidentialCategoryPage";

export default function ApartmentsPage() {
  return (
    <ResidentialCategoryPage
      title="Квартиры в Иркутске"
      description="Квартиры в аренду и продажу в Иркутске и области. Студии, 1–4-комнатные квартиры и новостройки в жилом каталоге ArendaCity."
      badge="Квартиры"
      type="Квартира"
      pageUrl="/zhilaya/kvartiry"
      heroTitle="Квартиры в аренду и продажу в Иркутске"
      heroText="От студий до семейных квартир. Удобный жилой каталог с фильтрами по комнатам, району, площади и стоимости."
      features={[
        "Студии и квартиры с любым числом комнат",
        "Объекты от собственников и агентств",
        "Отдельный жилой каталог на том же домене",
      ]}
    />
  );
}
