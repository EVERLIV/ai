import consultantAvatar from "@/assets/consultant-anastasia.jpg";
import {
  consultantAvatarForListing,
  listingHasAiConsultant,
  openConsultantChat,
  useAiConsultantAccess,
  type AiConsultantListing,
} from "@/lib/aiConsultant";
import { cn } from "@/lib/utils";

type Props = {
  property: AiConsultantListing & {
    id: string;
    address?: string | null;
  };
  className?: string;
  /** Чуть меньше на компактных карточках */
  size?: "sm" | "md";
};

/** Аватар ИИ-консультанта на фото карточки — только если услуга включена у продавца. */
export default function ListingConsultantBadge({
  property,
  className,
  size = "md",
}: Props) {
  const { data: access } = useAiConsultantAccess();
  if (!listingHasAiConsultant(property, access)) return null;

  const avatar = consultantAvatarForListing(property, consultantAvatar);
  const box = size === "sm" ? "w-9 h-9" : "w-10 h-10";
  const img = size === "sm" ? "w-7 h-7" : "w-8 h-8";

  return (
    <button
      type="button"
      aria-label="Открыть чат с консультантом"
      className={cn(
        "absolute bottom-2 left-2 z-[2] flex items-center justify-center",
        "bg-card border border-border shadow-md",
        "hover:shadow-lg transition-shadow",
        box,
        className,
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openConsultantChat({
          propertyId: property.id,
          propertyAddress: property.address || undefined,
          avatarUrl: avatar,
        });
      }}
    >
      <span className="relative">
        <img
          src={avatar}
          alt=""
          className={cn(img, "object-cover object-top")}
        />
        <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-card rounded-full" />
        <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-primary text-primary-foreground text-[8px] font-bold flex items-center justify-center leading-none">
          1
        </span>
      </span>
    </button>
  );
}
