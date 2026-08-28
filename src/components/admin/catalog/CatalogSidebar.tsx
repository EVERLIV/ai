import {
  CATALOG_CATEGORIES,
  CATALOG_GROUPS,
  categoriesInGroup,
  type CatalogCategoryConfig,
} from "@/lib/catalogRegistry";
import { cn } from "@/lib/utils";

type Props = {
  activeCategory: string;
  onSelect: (key: string) => void;
  className?: string;
};

export default function CatalogSidebar({
  activeCategory,
  onSelect,
  className,
}: Props) {
  return (
    <nav className={cn("space-y-4", className)}>
      {CATALOG_GROUPS.map((group) => {
        const cats = categoriesInGroup(group.id);
        if (cats.length === 0) return null;
        return (
          <div key={group.id}>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground px-2 mb-1.5">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {cats.map((cat) => (
                <CategoryButton
                  key={cat.key}
                  cat={cat}
                  active={activeCategory === cat.key}
                  onSelect={() => onSelect(cat.key)}
                />
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function CategoryButton({
  cat,
  active,
  onSelect,
}: {
  cat: CatalogCategoryConfig;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "w-full text-left rounded-md px-2 py-1.5 text-sm transition-colors",
          active
            ? "bg-primary text-primary-foreground"
            : "hover:bg-muted text-foreground",
        )}
      >
        {cat.title}
      </button>
    </li>
  );
}

export function CatalogCategorySelect({
  activeCategory,
  onSelect,
  className,
}: Props) {
  return (
    <select
      className={cn(
        "h-9 w-full rounded-md border border-input bg-background px-2 text-sm",
        className,
      )}
      value={activeCategory}
      onChange={(e) => onSelect(e.target.value)}
    >
      {CATALOG_CATEGORIES.map((cat) => (
        <option key={cat.key} value={cat.key}>
          {cat.title}
        </option>
      ))}
    </select>
  );
}
