import { Navigate } from "react-router-dom";
import { buildCatalogUrl } from "@/lib/catalogLinks";

/** Раздел участков — жилой каталог с фильтром «Участок» (включая коммерческую землю). */
export default function PlotsPage() {
  return (
    <Navigate
      to={buildCatalogUrl({ segment: "residential", types: "Участок" })}
      replace
    />
  );
}
