import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  getCatalogCategory,
  isPropertyTypeCategory,
  normalizePropertyTypeParent,
  propertyTypeParentLabel,
  type MetadataFieldDef,
} from "@/lib/catalogRegistry";
import type {
  DictionaryInsert,
  DictionaryItem,
} from "@/hooks/useDictionaries";

export type CatalogFormState = {
  value: string;
  label: string;
  slug: string;
  description: string;
  parent: string;
  parent_id: string;
  sort_order: number;
  is_active: boolean;
  metadata: Record<string, unknown>;
};

export function emptyCatalogForm(
  partial?: Partial<CatalogFormState>,
): CatalogFormState {
  return {
    value: "",
    label: "",
    slug: "",
    description: "",
    parent: "",
    parent_id: "",
    sort_order: 0,
    is_active: true,
    metadata: {},
    ...partial,
  };
}

export function itemToForm(item: DictionaryItem): CatalogFormState {
  return {
    value: item.value,
    label: item.label ?? "",
    slug: item.slug ?? "",
    description: item.description ?? "",
    parent: item.parent ?? "",
    parent_id: item.parent_id ?? "",
    sort_order: item.sort_order,
    is_active: item.is_active,
    metadata: { ...(item.metadata ?? {}) },
  };
}

export function formToInsert(
  category: string,
  form: CatalogFormState,
): DictionaryInsert {
  const cat = getCatalogCategory(category);
  let parent: string | null = form.parent.trim() || null;
  if (cat?.hasParent && isPropertyTypeCategory(category)) {
    parent = normalizePropertyTypeParent(form.parent || "commercial");
  }

  return {
    category,
    value: form.value.trim(),
    label: form.label.trim() || null,
    slug: form.slug.trim() || null,
    description: form.description.trim() || null,
    parent,
    parent_id: form.parent_id.trim() || null,
    sort_order: form.sort_order,
    is_active: form.is_active,
    metadata: form.metadata,
  };
}

type Props = {
  category: string;
  form: CatalogFormState;
  onChange: (next: CatalogFormState) => void;
  parentOptions?: DictionaryItem[];
};

export default function CatalogItemForm({
  category,
  form,
  onChange,
  parentOptions = [],
}: Props) {
  const cat = getCatalogCategory(category);
  const fields = cat?.metadataFields ?? [];

  const set = (patch: Partial<CatalogFormState>) =>
    onChange({ ...form, ...patch });

  const setMeta = (key: string, value: unknown) =>
    onChange({
      ...form,
      metadata: { ...form.metadata, [key]: value },
    });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Значение *">
          <Input
            value={form.value}
            onChange={(e) => set({ value: e.target.value })}
            placeholder="Кировский"
          />
        </Field>
        <Field label="Подпись (label)">
          <Input
            value={form.label}
            onChange={(e) => set({ label: e.target.value })}
            placeholder="Как в интерфейсе"
          />
        </Field>
        <Field label="Slug">
          <Input
            value={form.slug}
            onChange={(e) => set({ slug: e.target.value })}
            placeholder="kirovsky"
          />
        </Field>
        <Field label="Порядок">
          <Input
            type="number"
            value={form.sort_order}
            onChange={(e) =>
              set({ sort_order: Number(e.target.value) || 0 })
            }
          />
        </Field>
      </div>

      {cat?.hasParent && (
        <Field label={cat.parentLabel ?? "Родитель"}>
          {isPropertyTypeCategory(category) ? (
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={normalizePropertyTypeParent(form.parent || "commercial")}
              onChange={(e) => set({ parent: e.target.value, parent_id: "" })}
            >
              {(cat.parentOptions ?? []).map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          ) : (
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              value={form.parent_id || form.parent || ""}
              onChange={(e) => {
                const id = e.target.value;
                const opt = parentOptions.find((p) => p.id === id);
                set({
                  parent_id: id,
                  parent: opt?.value ?? "",
                });
              }}
            >
              <option value="">— без родителя —</option>
              {parentOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.value}
                  {p.label && p.label !== p.value ? ` (${p.label})` : ""}
                </option>
              ))}
            </select>
          )}
        </Field>
      )}

      <Field label="Описание">
        <Textarea
          value={form.description}
          onChange={(e) => set({ description: e.target.value })}
          rows={2}
          placeholder="Внутреннее описание для админки"
        />
      </Field>

      {fields.length > 0 && (
        <div className="space-y-3 rounded-lg border p-3 bg-muted/20">
          <p className="text-xs font-medium text-muted-foreground">Метаданные</p>
          {fields.map((field) => (
            <MetadataField
              key={field.key}
              field={field}
              value={form.metadata[field.key]}
              onChange={(v) => setMeta(field.key, v)}
            />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between rounded-lg border px-3 py-2">
        <Label htmlFor="catalog-active" className="text-sm">
          Активна
        </Label>
        <Switch
          id="catalog-active"
          checked={form.is_active}
          onCheckedChange={(v) => set({ is_active: v })}
        />
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function MetadataField({
  field,
  value,
  onChange,
}: {
  field: MetadataFieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (field.type === "select") {
    return (
      <Field label={field.label}>
        <select
          className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value || undefined)}
        >
          <option value="">—</option>
          {(field.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
    );
  }

  if (field.type === "textarea") {
    return (
      <Field label={field.label}>
        <Textarea
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          placeholder={field.placeholder}
        />
      </Field>
    );
  }

  if (field.type === "string_list") {
    const text = Array.isArray(value)
      ? value.join(", ")
      : typeof value === "string"
        ? value
        : "";
    return (
      <Field label={field.label}>
        <Input
          value={text}
          onChange={(e) =>
            onChange(
              e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
          placeholder={field.placeholder}
        />
      </Field>
    );
  }

  if (field.type === "number") {
    return (
      <Field label={field.label}>
        <Input
          type="number"
          step="any"
          value={
            value === undefined || value === null || value === ""
              ? ""
              : String(value)
          }
          onChange={(e) =>
            onChange(e.target.value === "" ? undefined : Number(e.target.value))
          }
          placeholder={field.placeholder}
        />
      </Field>
    );
  }

  return (
    <Field label={field.label}>
      <Input
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
      />
    </Field>
  );
}

export function formatParentLabel(
  category: string,
  parent: string | null,
): string {
  if (!parent) return "—";
  if (isPropertyTypeCategory(category)) return propertyTypeParentLabel(parent);
  return parent;
}
