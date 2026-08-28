import {
  ArrowLeft,
  ArrowRight,
  Building2,
  HardHat,
  Key,
  Megaphone,
  Search,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  ACCOUNT_TYPE_LABELS,
  type ProfileAccountType,
} from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

export type RegisterWizardStep = "group" | "lister";

type ListerAccountType = Exclude<ProfileAccountType, "seeker">;

interface RoleCard {
  id: string;
  label: string;
  hint: string;
  Icon: LucideIcon;
}

const GROUP_OPTIONS: RoleCard[] = [
  {
    id: "seeker",
    label: ACCOUNT_TYPE_LABELS.seeker,
    hint: "Избранное, заявки и подбор объектов",
    Icon: Search,
  },
  {
    id: "lister",
    label: "Размещаю объявления",
    hint: "Собственник, агентство, риелтор или застройщик",
    Icon: Megaphone,
  },
];

const LISTER_OPTIONS: (RoleCard & { id: ListerAccountType })[] = [
  {
    id: "owner",
    label: ACCOUNT_TYPE_LABELS.owner,
    hint: "Сдаю или продаю свою недвижимость",
    Icon: Key,
  },
  {
    id: "agency",
    label: ACCOUNT_TYPE_LABELS.agency,
    hint: "Команда и каталог объектов агентства",
    Icon: Building2,
  },
  {
    id: "realtor",
    label: ACCOUNT_TYPE_LABELS.realtor,
    hint: "Работаю как частный риелтор",
    Icon: User,
  },
  {
    id: "developer",
    label: ACCOUNT_TYPE_LABELS.developer,
    hint: "ЖК, дома и проекты застройщика",
    Icon: HardHat,
  },
];

interface Props {
  step: RegisterWizardStep;
  onSelectSeeker: () => void;
  onSelectLister: () => void;
  onSelectListerRole: (role: ListerAccountType) => void;
  onBack: () => void;
}

function RoleCardButton({
  card,
  onClick,
}: {
  card: RoleCard;
  onClick: () => void;
}) {
  const { Icon, label, hint } = card;

  return (
    <button
      type="button"
      role="option"
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 rounded-lg border border-border bg-background px-4 py-3.5 text-left",
        "transition-colors hover:border-primary/60 hover:bg-primary/5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
      )}
    >
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{label}</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </span>
        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
          {hint}
        </span>
      </span>
    </button>
  );
}

export default function RegisterRoleWizard({
  step,
  onSelectSeeker,
  onSelectLister,
  onSelectListerRole,
  onBack,
}: Props) {
  if (step === "group") {
    return (
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">
          Кто вы?
        </h1>
        <p className="text-sm text-muted-foreground mb-7">
          Выберите тип аккаунта — это нельзя будет изменить позже
        </p>
        <div role="listbox" aria-label="Тип аккаунта" className="space-y-3">
          {GROUP_OPTIONS.map((card) => (
            <RoleCardButton
              key={card.id}
              card={card}
              onClick={card.id === "seeker" ? onSelectSeeker : onSelectLister}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Назад
      </button>
      <h1 className="font-display text-2xl font-bold text-foreground mb-1">
        Как вы размещаете?
      </h1>
      <p className="text-sm text-muted-foreground mb-7">
        Уточните роль — для агентства откроется отдельный кабинет
      </p>
      <div
        role="listbox"
        aria-label="Роль для размещения объявлений"
        className="space-y-3"
      >
        {LISTER_OPTIONS.map((card) => (
          <RoleCardButton
            key={card.id}
            card={card}
            onClick={() => onSelectListerRole(card.id)}
          />
        ))}
      </div>
    </div>
  );
}

export const REGISTER_HEADINGS: Record<
  ProfileAccountType,
  { title: string; subtitle: string }
> = {
  seeker: {
    title: "Создать аккаунт",
    subtitle: "Доступ к избранному и заявкам",
  },
  owner: {
    title: "Регистрация собственника",
    subtitle: "Размещайте объекты от своего имени",
  },
  agency: {
    title: "Регистрация агентства",
    subtitle: "Кабинет для команды и объектов",
  },
  realtor: {
    title: "Регистрация риелтора",
    subtitle: "Размещайте объявления от своего имени",
  },
  developer: {
    title: "Регистрация застройщика",
    subtitle: "Представляйте проекты и новостройки",
  },
};
