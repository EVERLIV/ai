import glow from "@/assets/app-install/glow.svg";
import phoneMockup from "@/assets/app-install/phone-mockup.png";
import step2Screen from "@/assets/app-install/step2-screen.png";
import step3Screen from "@/assets/app-install/step3-screen.png";
import type { InstallStep, InstallTip } from "@/lib/appInstallContent";
import { cn } from "@/lib/utils";

const ROW_TOPS = ["lg:top-0", "lg:top-[105px]", "lg:top-[172px]"];

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "flex size-[30px] shrink-0 items-center justify-center rounded-full bg-[#a2c8cd] text-sm font-semibold leading-[26px] text-white",
        className,
      )}
    >
      {children}
    </span>
  );
}

function StepRows({ steps, absolute }: { steps: InstallStep[]; absolute: boolean }) {
  return (
    <ol
      className={cn(
        "relative space-y-6",
        absolute && "lg:absolute lg:left-[333px] lg:top-[14px] lg:h-[240px] lg:w-[667px] lg:space-y-0",
      )}
    >
      {steps.map((step, index) => (
        <li key={step.title} className={cn("flex gap-[10px]", absolute && "lg:absolute lg:left-0", absolute && ROW_TOPS[index])}>
          <Badge>{index + 1}</Badge>
          <div className="pt-[2px]">
            <h3 className="text-[18px] font-semibold leading-[26px] text-foreground">{step.title}</h3>
            <p className="mt-px text-sm leading-[18px] text-muted-foreground">{step.description}</p>
            {step.hint && <p className="mt-1 text-sm leading-[18px] text-[#e9c8c9]">{step.hint}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

function ScreenCard({ src, alt, imgClass, className }: { src: string; alt: string; imgClass: string; className?: string }) {
  return (
    <div className={cn("relative h-[315px] w-[294px] shrink-0 overflow-hidden rounded-[28px] border border-[#f2f2f4] bg-white", className)}>
      <img src={src} alt={alt} className={cn("absolute max-w-none", imgClass)} />
    </div>
  );
}

type Props = {
  steps: InstallStep[];
  platform: "ios" | "android";
  tip?: InstallTip;
  note?: string;
};

export default function AppInstallSteps({ steps, platform, tip, note }: Props) {
  const isIos = platform === "ios";

  return (
    <>
      <section className={cn("relative", isIos && "lg:h-[671px]")}>
        {isIos && (
          <img
            src={glow}
            alt=""
            aria-hidden
            className="pointer-events-none absolute left-[-249px] top-[-81px] hidden size-[785px] max-w-none lg:block"
          />
        )}

        <StepRows steps={steps} absolute={isIos} />

        {isIos && (
          <div className="mt-10 flex flex-col items-center gap-6 lg:mt-0">
            <div className="relative h-[618px] w-[360px] shrink-0 overflow-hidden lg:absolute lg:left-[-36px] lg:top-0">
              <img
                src={phoneMockup}
                alt="Шаг 1: сайт dadatut.ru в Safari"
                className="absolute left-[-83%] top-[-24.59%] h-[147.36%] w-[252.97%] max-w-none"
              />
              <Badge className="absolute left-[242px] top-[517px]">1</Badge>
            </div>

            <div className="relative lg:absolute lg:left-[333px] lg:top-[289px]">
              <ScreenCard
                src={step2Screen}
                alt="Шаг 2: меню «Поделиться»"
                imgClass="left-0 top-[-102.44%] h-[202.45%] w-full"
              />
              <Badge className="absolute left-[80px] top-[74px]">2</Badge>
            </div>

            <div className="relative lg:absolute lg:left-[666px] lg:top-[289px]">
              <ScreenCard
                src={step3Screen}
                alt="Шаг 3: «Добавить на экран Домой»"
                imgClass="left-[-0.02%] top-[-10.79%] h-[202.22%] w-[100.04%]"
              />
              <Badge className="absolute left-[-9px] top-[202px]">3</Badge>
            </div>
          </div>
        )}
      </section>

      {tip && (
        <section className="relative mt-12 flex gap-[11px] lg:mt-0 lg:h-[141px]">
          <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full border border-[#a2c8cd] text-sm font-semibold text-[#a2c8cd]">
            !
          </span>
          <div className="pt-[6px]">
            <h3 className="text-[18px] font-semibold leading-[18px] text-foreground">{tip.title}</h3>
            <p className="mt-[7px] text-sm leading-[18px] text-muted-foreground">{tip.description}</p>
          </div>
        </section>
      )}

      {note && <p className="mt-8 text-sm text-muted-foreground">{note}</p>}
    </>
  );
}
