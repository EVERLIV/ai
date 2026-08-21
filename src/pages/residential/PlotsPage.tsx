import ResidentialCategoryPage from "./ResidentialCategoryPage";

export default function PlotsPage() {
  return (
    <ResidentialCategoryPage
      title="Земельные участки в Иркутске"
      description="Участки и земля в Иркутске и области: ИЖС, дача, коммерция и под застройку. В разделе — жилые участки и вся коммерческая земля с портала."
      badge="Участки"
      type="Участок"
      pageUrl="/zhilaya/uchastki"
      heroTitle="Земельные участки"
      heroText="Жилые участки и коммерческая земля в одном разделе. Ищите по району, площади и виду использования."
      features={[
        "Участки ИЖС, дача и под строительство",
        "Вся коммерческая земля из раздела «Земля»",
        "Бесплатное размещение для собственников",
      ]}
    />
  );
}
