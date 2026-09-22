import { Navigate, useLocation, useParams } from "react-router-dom";
import Catalog from "@/pages/Catalog";
import NotFound from "@/pages/NotFound";
import {
  isCatalogDealSlug,
  getCategoryBySlug,
  CATALOG_CATEGORIES,
  isDealAllowedForCategory,
} from "@/config/catalogTaxonomy";
import { legacyCatalogRedirect, parseCatalogPath } from "@/lib/catalogPaths";

/** Каталог по Avito-path: /kupit/kvartiry, /snyat/kommercheskaya/ofisy */
export default function CatalogByPath() {
  const { deal, category } = useParams<{
    deal: string;
    category: string;
    subtype?: string;
  }>();
  const location = useLocation();

  if (!deal || !category || !isCatalogDealSlug(deal)) {
    return <NotFound />;
  }

  // Если category — это вложенная (novostroyki/vtorichka), редиректим на новый URL
  const nestedMatch = CATALOG_CATEGORIES.find(
    (c) => c.slug === category && c.parentCategorySlug,
  );
  if (nestedMatch?.parentCategorySlug) {
    return (
      <Navigate
        to={`/${deal}/${nestedMatch.parentCategorySlug}/${category}${location.search}`}
        replace
      />
    );
  }

  const cat = getCategoryBySlug(category);
  if (!cat || !isDealAllowedForCategory(deal, cat)) {
    return <NotFound />;
  }

  const parsed = parseCatalogPath(location.pathname);
  if (!parsed) {
    return <NotFound />;
  }

  return (
    <Catalog
      segment={parsed.segment}
      categoryId={parsed.categoryId}
      dealSlug={parsed.dealSlug}
      pathTypes={parsed.types}
      marketPreset={parsed.marketPreset}
      subtypeSlug={parsed.subtypeSlug}
      showSuggestions={parsed.categoryId === "kommercheskaya"}
    />
  );
}

/** Редирект со старых /catalog, /zhilaya/*, /offices и т.п. */
export function LegacyCatalogRedirect() {
  const location = useLocation();
  const target =
    legacyCatalogRedirect(location.pathname, location.search) ||
    "/snyat/kommercheskaya";
  return <Navigate to={target} replace />;
}
