import RealtySearchPanel from "@/components/realty/RealtySearchPanel";

export default function MobileHomeSearch() {
  return (
    <section className="lg:hidden bg-muted/60 px-3 pt-[4.25rem] pb-3">
      <div className="mb-2.5">
        <h1 className="font-display text-xl font-bold text-foreground tracking-tight leading-snug">
          <span className="text-primary">Недвижимость</span> в Иркутске и
          области
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Купить, снять или посуточно — квартиры, дома, земля, офисы.
        </p>
      </div>
      <RealtySearchPanel preferPageMapAnchor />
    </section>
  );
}
