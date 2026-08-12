import { useMemo } from "react";
import { parsePropertyDescription } from "@/lib/propertyDescription";

interface PropertyDescriptionProps {
  text: string | null | undefined;
}

/**
 * Отрисовывает описание объекта структурированно: заголовки разделов,
 * абзацы, списки преимуществ и пары "метка — значение".
 */
export default function PropertyDescription({ text }: PropertyDescriptionProps) {
  const blocks = useMemo(() => parsePropertyDescription(text), [text]);

  if (!blocks.length) {
    return <p className="text-sm text-muted-foreground">Описание не указано.</p>;
  }

  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        if (block.kind === "heading") {
          return (
            <h3
              key={i}
              className="flex items-center gap-2 font-display text-base font-semibold text-foreground pt-2 first:pt-0"
            >
              {block.icon && (
                <span aria-hidden className="text-base leading-none shrink-0">
                  {block.icon}
                </span>
              )}
              {block.text}
            </h3>
          );
        }

        if (block.kind === "list") {
          return (
            <ul key={i} className="space-y-1.5">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-2.5 text-sm text-muted-foreground leading-relaxed">
                  <span aria-hidden className="shrink-0 text-primary mt-0.5">
                    {item.icon && /[✅✔☑✓]/u.test(item.icon) ? item.icon : "•"}
                  </span>
                  <span className="min-w-0">{item.text}</span>
                </li>
              ))}
            </ul>
          );
        }

        if (block.kind === "facts") {
          return (
            <dl key={i} className="divide-y divide-border border-y border-border">
              {block.items.map((item, j) => (
                <div key={j} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 py-2">
                  <dt className="text-xs uppercase tracking-wider text-muted-foreground min-w-[120px]">
                    {item.label}
                  </dt>
                  <dd className="text-sm font-medium text-foreground">{item.value}</dd>
                </div>
              ))}
            </dl>
          );
        }

        return (
          <p key={i} className="text-sm text-muted-foreground leading-relaxed">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
