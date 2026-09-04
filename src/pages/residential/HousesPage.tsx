import Catalog from "@/pages/Catalog";

export default function HousesPage() {
  return (
    <Catalog
      segment="residential"
      initialTypes={["Дом", "Коттедж", "Дача", "Таунхаус"]}
    />
  );
}
