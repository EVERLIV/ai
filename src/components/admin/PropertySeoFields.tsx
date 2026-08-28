import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  buildPropertySeoDescription,
  buildPropertySeoTitle,
  type PropertySeoInput,
} from "@/lib/seo/propertySeoTitle";

type SeoExtras = {
  seo_title?: string;
  seo_description?: string;
};

type Props = {
  property: PropertySeoInput;
  seoTitle: string;
  seoDescription: string;
  onSeoTitleChange: (v: string) => void;
  onSeoDescriptionChange: (v: string) => void;
};

export function getSeoFromExtras(
  extras: Record<string, unknown> | null | undefined,
): SeoExtras {
  const e = extras || {};
  return {
    seo_title:
      typeof e.seo_title === "string" ? e.seo_title : "",
    seo_description:
      typeof e.seo_description === "string" ? e.seo_description : "",
  };
}

export default function PropertySeoFields({
  property,
  seoTitle,
  seoDescription,
  onSeoTitleChange,
  onSeoDescriptionChange,
}: Props) {
  const autoTitle = buildPropertySeoTitle(property);
  const autoDescription = buildPropertySeoDescription(property);
  const previewTitle = seoTitle.trim() || autoTitle;
  const previewDescription = seoDescription.trim() || autoDescription;

  return (
    <fieldset className="space-y-3 rounded-lg border p-3 bg-muted/20">
      <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
        SEO
      </legend>
      <p className="text-[11px] text-muted-foreground px-0.5">
        Если поля пустые — заголовок и описание генерируются автоматически для
        карточки на сайте.
      </p>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs">SEO заголовок</Label>
          <span className="text-[10px] text-muted-foreground">
            {previewTitle.length}/60
          </span>
        </div>
        <Input
          value={seoTitle}
          onChange={(e) => onSeoTitleChange(e.target.value)}
          placeholder={autoTitle}
          className="h-8 text-xs"
        />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs">SEO описание</Label>
          <span className="text-[10px] text-muted-foreground">
            {previewDescription.length}/160
          </span>
        </div>
        <Textarea
          value={seoDescription}
          onChange={(e) => onSeoDescriptionChange(e.target.value)}
          placeholder={autoDescription}
          rows={3}
          className="text-xs"
        />
      </div>

      <div className="rounded-md border bg-card p-3 space-y-1">
        <p className="text-[10px] uppercase text-muted-foreground tracking-wide">
          Превью в поиске
        </p>
        <p className="text-sm text-blue-700 dark:text-blue-400 line-clamp-1">
          {previewTitle}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {previewDescription}
        </p>
      </div>
    </fieldset>
  );
}
