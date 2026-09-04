import Catalog from "@/pages/Catalog";

/** Офисы — сразу каталог с сайдбаром и фильтром типа */
export default function OfficesPage() {
  return <Catalog initialTypes={["Офис"]} />;
}
