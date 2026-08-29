import type { InstallStep, InstallTip } from "@/lib/appInstallContent";
import { cn } from "@/lib/utils";

function PhoneMockup({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto w-[140px] rounded-[1.25rem] border-[3px] border-foreground/15 bg-background p-1.5 shadow-sm",
        className,
      )}
    >
      <div className="rounded-[0.9rem] bg-muted/60 overflow-hidden aspect-[9/16] flex flex-col">
        {children}
      </div>
    </div>
  );
}

function StepMockContent({ index, platform }: { index: number; platform: "ios" | "android" }) {
  if (platform === "ios") {
    if (index === 0) {
      return (
        <>
          <div className="h-5 bg-foreground/10" />
          <div className="flex-1 p-2 space-y-1">
            <div className="h-2 w-3/4 rounded bg-primary/30" />
            <div className="h-2 w-full rounded bg-muted-foreground/20" />
            <div className="h-2 w-5/6 rounded bg-muted-foreground/20" />
          </div>
          <div className="h-6 bg-foreground/10 flex items-center justify-center text-[8px] text-muted-foreground">
            Safari
          </div>
        </>
      );
    }
    if (index === 1) {
      return (
        <>
          <div className="flex-1 p-2 bg-muted/40" />
          <div className="h-10 bg-background border-t border-border flex items-center justify-around px-1">
            <span className="text-[7px] text-muted-foreground">⋯</span>
            <span className="text-[8px] font-semibold text-primary">↑ Поделиться</span>
            <span className="text-[7px] text-muted-foreground">□</span>
          </div>
        </>
      );
    }
    return (
      <>
        <div className="flex-1 p-2 flex flex-col justify-end">
          <div className="rounded-lg bg-background border border-border p-2 space-y-1">
            <div className="text-[7px] font-medium">На экран «Домой»</div>
            <div className="h-4 rounded bg-primary/20 text-[7px] flex items-center justify-center font-semibold text-primary">
              Добавить
            </div>
          </div>
        </div>
      </>
    );
  }

  if (index === 0) {
    return (
      <>
        <div className="h-5 bg-foreground/10" />
        <div className="flex-1 p-2 space-y-1">
          <div className="h-2 w-3/4 rounded bg-primary/30" />
          <div className="h-2 w-full rounded bg-muted-foreground/20" />
        </div>
        <div className="h-6 bg-foreground/10 flex items-center justify-center text-[8px] text-muted-foreground">
          Chrome
        </div>
      </>
    );
  }
  if (index === 1) {
    return (
      <>
        <div className="flex-1 p-2" />
        <div className="mx-2 mb-2 rounded-lg border border-border bg-background p-2 space-y-1">
          <div className="text-[7px] text-muted-foreground">Меню ⋮</div>
          <div className="text-[7px] font-medium">Установить приложение</div>
        </div>
      </>
    );
  }
  return (
    <>
      <div className="h-6 bg-foreground text-background text-[7px] flex items-center justify-center font-semibold">
        Установить
      </div>
      <div className="flex-1 p-2" />
    </>
  );
}

type Props = {
  steps: InstallStep[];
  platform: "ios" | "android";
  tip?: InstallTip;
  note?: string;
};

export default function AppInstallSteps({ steps, platform, tip, note }: Props) {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className="rounded-2xl border border-border bg-muted/30 p-5 flex flex-col"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {index + 1}
            </span>
            <h3 className="mt-3 font-display text-base font-semibold text-foreground">
              {step.title}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground flex-1">
              {step.description}
            </p>
            {step.hint && (
              <p className="mt-2 text-xs text-muted-foreground/80">{step.hint}</p>
            )}
            <div className="mt-4 pt-2">
              <PhoneMockup>
                <StepMockContent index={index} platform={platform} />
              </PhoneMockup>
            </div>
          </div>
        ))}
      </div>

      {tip && (
        <div className="rounded-2xl border border-border bg-muted/20 p-5 sm:p-6">
          <h3 className="font-display text-base font-semibold text-foreground">
            {tip.title}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">{tip.description}</p>
        </div>
      )}

      {note && (
        <p className="text-sm text-muted-foreground text-center sm:text-left">
          {note}
        </p>
      )}
    </div>
  );
}
