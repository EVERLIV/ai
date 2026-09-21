import { Navigate } from "react-router-dom";
import { buildCatalogUrl } from "@/lib/catalogPaths";

/** Раздел участков → каталог земли */
export default function PlotsPage() {
  return (
    <Navigate
      to={buildCatalogUrl({ segment: "land", types: "Участок" })}
      replace
    />
  );
}
