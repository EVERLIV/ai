import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  Pencil,
  Plus,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CatalogTreeNode } from "@/lib/catalogLocations";
import type { DictionaryItem } from "@/hooks/useDictionaries";
import { cn } from "@/lib/utils";

type Props = {
  tree: CatalogTreeNode[];
  search: string;
  onEdit: (item: DictionaryItem) => void;
  onAddChild: (parent: DictionaryItem) => void;
  onToggleActive: (item: DictionaryItem) => void;
};

export default function LocationTreePanel({
  tree,
  search,
  onEdit,
  onAddChild,
  onToggleActive,
}: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const filtered = useMemo(() => filterTree(tree, search), [tree, search]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (filtered.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        {search ? "Ничего не найдено" : "Нет записей — добавьте локацию"}
      </div>
    );
  }

  return (
    <ul className="space-y-0.5">
      {filtered.map((node) => (
        <TreeNode
          key={node.item.id}
          node={node}
          depth={0}
          expanded={expanded}
          onToggle={toggle}
          onEdit={onEdit}
          onAddChild={onAddChild}
          onToggleActive={onToggleActive}
        />
      ))}
    </ul>
  );
}

function TreeNode({
  node,
  depth,
  expanded,
  onToggle,
  onEdit,
  onAddChild,
  onToggleActive,
}: {
  node: CatalogTreeNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onEdit: (item: DictionaryItem) => void;
  onAddChild: (parent: DictionaryItem) => void;
  onToggleActive: (item: DictionaryItem) => void;
}) {
  const { item, children } = node;
  const hasKids = children.length > 0;
  const isOpen = expanded.has(item.id);
  const kind =
    typeof item.metadata?.kind === "string" ? item.metadata.kind : null;

  return (
    <li>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md py-1 pr-1 hover:bg-muted/50",
          !item.is_active && "opacity-50",
        )}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        <button
          type="button"
          className="shrink-0 p-0.5 text-muted-foreground"
          onClick={() => hasKids && onToggle(item.id)}
          aria-label={isOpen ? "Свернуть" : "Развернуть"}
        >
          {hasKids ? (
            isOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )
          ) : (
            <span className="w-4 h-4 inline-block" />
          )}
        </button>

        <button
          type="button"
          className="flex-1 text-left text-sm truncate"
          onClick={() => onEdit(item)}
        >
          {item.value}
          {kind && (
            <Badge variant="outline" className="ml-2 text-[10px] py-0">
              {kind}
            </Badge>
          )}
        </button>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onToggleActive(item)}
            title={item.is_active ? "Отключить" : "Включить"}
          >
            {item.is_active ? (
              <Eye className="w-3.5 h-3.5" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onAddChild(item)}
            title="Добавить дочерний"
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(item)}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {hasKids && isOpen && (
        <ul>
          {children.map((child) => (
            <TreeNode
              key={child.item.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              onEdit={onEdit}
              onAddChild={onAddChild}
              onToggleActive={onToggleActive}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function filterTree(
  nodes: CatalogTreeNode[],
  query: string,
): CatalogTreeNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return nodes;

  const walk = (node: CatalogTreeNode): CatalogTreeNode | null => {
    const selfMatch =
      node.item.value.toLowerCase().includes(q) ||
      (node.item.label ?? "").toLowerCase().includes(q) ||
      (node.item.slug ?? "").toLowerCase().includes(q);

    const kids = node.children
      .map(walk)
      .filter((n): n is CatalogTreeNode => n !== null);

    if (selfMatch || kids.length > 0) {
      return { item: node.item, children: kids.length ? kids : node.children };
    }
    return null;
  };

  return nodes.map(walk).filter((n): n is CatalogTreeNode => n !== null);
}
