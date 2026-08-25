import { Navigate } from "react-router-dom";
import { SEGMENT_ROUTES } from "@/config/propertySegments";
import { buildCatalogUrl } from "@/lib/catalogLinks";

/** Старый /land → каталог земли */
export default function LandPage() {
  return <Navigate to={SEGMENT_ROUTES.land.catalog} replace />;
}
