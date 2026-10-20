import { useEffect, useRef, useState, type ComponentType, type SVGProps } from "react";
import { Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  HomeIcon,
  KotevLogo,
  LessonsIcon,
  LogoutIcon,
  ParentsIcon,
  PrintIcon,
  SettingsIcon,
  TrophyIcon,
} from "./icons";

/*
 * Sizing: tablet and mobile are in px. On desktop the rail is always exactly 100vh tall
 * and never scrolls, so it is drawn as one unit, --rail, that keeps the Figma frame's
 * 266:1080 proportions: --rail = max(13.854vw, 24.63vh), i.e. 266px on the 1920x1080
 * frame. Every rail size is a fraction of --rail (px / 266), and the vertical gaps are
 * flex-grow spacers weighted by their Figma heights, so the free height is shared out
 * in the same proportions as the design.
 */

type NavItem = {
  label: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Icons drawn on a 36px canvas already include their own padding. */
  fullSize?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "דף הבית", href: "/", icon: HomeIcon },
  { label: "שיעורים", href: "/lessons", icon: LessonsIcon },
  { label: "משימות", href: "/tasks", icon: TrophyIcon },
  { label: "קבצים להדפסה", href: "/printables", icon: PrintIcon },
  { label: "הדרכה להורים", href: "/parents", icon: ParentsIcon },
  { label: "הגדרות", href: "/settings", icon: SettingsIcon, fullSize: true },
];

export type SidebarUser = {
  name: string;
  points: number;
};

type AppSidebarProps = {
  user: SidebarUser;
  onLogout?: () => void;
};

type Variant = "rail" | "drawer";

const SNAIL_SRC = "./assets/snail.png";

/* Shared size sets: "drawer" is the tablet/mobile menu (px), "rail" is the desktop rail (vw). */
const SIZES = {
  drawer: {
    pill: "w-[211px] py-2 pe-2 ps-4 text-[20px]",
    iconBox: "size-9",
    icon: "size-6",
    nav: "mt-8 gap-3",
    spacer: "h-8",
    footer: "w-[211px] gap-[30px]",
    logout: "h-10 py-0",
    divider: "h-0.5 w-[200px]",
    profile: "w-[167px]",
    badge: "h-[49px] min-w-[90px] gap-1 p-2 text-[20px]",
    badgeSnail: "w-[42px]",
    name: "mt-[15px] text-[35px] leading-[37px]",
    greeting: "-mb-[5px] text-[16px] leading-[37px]",
  },
  rail: {
    pill: "w-[calc(var(--rail)*0.79323)] py-[calc(var(--rail)*0.03008)] pe-[calc(var(--rail)*0.03008)] ps-[calc(var(--rail)*0.06015)] text-[length:calc(var(--rail)*0.07519)]",
    iconBox: "size-[calc(var(--rail)*0.13534)]",
    icon: "size-[calc(var(--rail)*0.09023)]",
    nav: "grow-[132] justify-between",
    spacer: "grow-[62]",
    footer: "w-[calc(var(--rail)*0.79323)] gap-[calc(var(--rail)*0.11278)]",
    logout: "h-[calc(var(--rail)*0.15038)] py-0",
    divider: "h-[calc(var(--rail)*0.00752)] w-[calc(var(--rail)*0.75188)]",
    profile: "w-[calc(var(--rail)*0.62782)]",
    badge: "h-[calc(var(--rail)*0.18421)] min-w-[calc(var(--rail)*0.33835)] gap-[calc(var(--rail)*0.01504)] p-[calc(var(--rail)*0.03008)] text-[length:calc(var(--rail)*0.07519)]",
    badgeSnail: "w-[calc(var(--rail)*0.15789)]",
    name: "mt-[calc(var(--rail)*0.05639)] text-[length:calc(var(--rail)*0.13158)] leading-[calc(var(--rail)*0.13910)]",
    greeting: "-mb-[calc(var(--rail)*0.01880)] text-[length:calc(var(--rail)*0.06015)] leading-[calc(var(--rail)*0.13910)]",
  },
} as const;

function PointsBadge({ points, className, snailClassName }: { points: number; className?: string; snailClassName?: string }) {
  // Each new point pops the badge and floats a small "+1" up from it.
  const prev = useRef(points);
  const [gain, setGain] = useState<{ id: number; n: number } | null>(null);
  useEffect(() => {
    const diff = points - prev.current;
    prev.current = points;
    if (diff > 0) setGain((g) => ({ id: (g?.id ?? 0) + 1, n: diff }));
  }, [points]);
  useEffect(() => {
    if (!gain) return;
    const t = window.setTimeout(() => setGain(null), 1100);
    return () => window.clearTimeout(t);
  }, [gain]);

  return (
    <div
      key={gain?.id ?? 0}
      dir="ltr"
      className={cn(
        "relative flex items-center justify-center rounded-full bg-card leading-none",
        gain && "motion-safe:animate-pop",
        className,
      )}
      aria-label={`${points} חלזונות`}
      aria-live="polite"
    >
      <span>{points}</span>
      <img src={SNAIL_SRC} alt="" className={cn("aspect-[56/55] shrink-0 object-contain", snailClassName)} />
      {gain && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 font-bold text-primary motion-safe:animate-float-away"
        >
          +{gain.n}
        </span>
      )}
    </div>
  );
}

const pillBase =
  "group/pill flex items-center justify-between rounded-full bg-sidebar-accent leading-none text-sidebar-foreground transition-[background-color,transform] duration-200 hover:bg-card/60 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function NavPill({ item, variant }: { item: NavItem; variant: Variant }) {
  const s = SIZES[variant];
  const Icon = item.icon;
  return (
    <a href={item.href} className={cn(pillBase, s.pill)}>
      <span>{item.label}</span>
      {item.fullSize ? (
        <Icon className={cn("shrink-0 text-primary transition-transform duration-200 group-hover/pill:scale-110", s.iconBox)} />
      ) : (
        <span className={cn("flex shrink-0 items-center justify-center", s.iconBox)}>
          <Icon className={cn("text-primary transition-transform duration-200 group-hover/pill:scale-110", s.icon)} />
        </span>
      )}
    </a>
  );
}

/** Greeting, navigation and logout. Shared by the desktop rail and the mobile drawer. */
function SidebarBody({ user, onLogout, variant }: AppSidebarProps & { variant: Variant }) {
  const s = SIZES[variant];
  return (
    <>
      <div className={cn("flex flex-col items-center text-center", s.profile)}>
        <PointsBadge points={user.points} className={s.badge} snailClassName={s.badgeSnail} />
        <p className={cn("font-bold", s.name)}>היי {user.name}</p>
        <p className={s.greeting}>איזה כיף שאתה כאן! 👋</p>
      </div>

      {variant === "rail" && <div className="grow-[89]" />}
      <nav aria-label="ניווט ראשי" className={cn("flex flex-col", s.nav)}>
        {NAV_ITEMS.map((item) => (
          <NavPill key={item.href} item={item} variant={variant} />
        ))}
      </nav>

      <div className={cn("shrink-0", s.spacer)} />

      <div className={cn("flex flex-col items-center", s.footer)}>
        <div className={cn("rounded-full bg-sidebar-border", s.divider)} />
        <button type="button" onClick={onLogout} className={cn(pillBase, s.pill, s.logout)}>
          <span>יציאה</span>
          <LogoutIcon className={cn("shrink-0 text-primary transition-transform duration-200 group-hover/pill:scale-110", s.icon)} />
        </button>
      </div>
    </>
  );
}

/**
 * Soft background blob that sweeps down the lower part of the rail (Figma "Vector").
 * As in Figma, its edge meets the rail's left side exactly where the top banner ends:
 * the path point (1378.83, 154.52) is pinned to (rail left, --banner-h).
 */
function SidebarShape() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
    <svg
      aria-hidden="true"
      viewBox="0 0 1783 1361"
      className="absolute left-[calc(var(--rail)*-5.18357)] top-[calc(var(--banner-h)-var(--rail)*0.58090)] h-[calc(var(--rail)*5.11654)] w-[calc(var(--rail)*6.70301)] max-w-none fill-sidebar-shape/[0.13]"
    >
      <path d="M1755.18 799.741C1755.18 910.525 1804.03 1259.9 1771.98 1360.07H54.205C24.2536 1360.07 2.39149e-05 1335.82 2.39149e-05 1305.87V349.281C190.943 134.98 469.078 2.77212e-05 778.735 2.77212e-05C1025.9 2.77212e-05 1214.04 61.8602 1378.83 154.523C1597.92 277.725 1755.18 471.174 1755.18 799.741Z" />
    </svg>
    </div>
  );
}

/** Desktop: rail on the right. Tablet and mobile: top bar with a drawer. */
export function AppSidebar({ user, onLogout }: AppSidebarProps) {
  return (
    <>
      <aside className="sticky top-0 hidden h-[100vh] w-[var(--rail)] shrink-0 flex-col items-center overflow-hidden bg-sidebar text-sidebar-foreground [--rail:max(13.854vw,24.63vh)] lg:flex">
        <SidebarShape />
        <div className="relative flex h-full flex-col items-center">
          <div className="grow-[50]" />
          <a href="/" aria-label="כותב החוק - דף הבית" className="shrink-0">
            <KotevLogo className="h-auto w-[calc(var(--rail)*0.37970)]" />
          </a>
          <div className="grow-[75]" />
          <SidebarBody user={user} onLogout={onLogout} variant="rail" />
          <div className="grow-[50]" />
        </div>
      </aside>

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-sidebar px-4 text-sidebar-foreground md:h-20 md:px-8 lg:hidden">
        <div className="flex items-center gap-3 md:gap-4">
          <Sheet>
            <SheetTrigger
              className="flex size-10 items-center justify-center rounded-full bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:size-12"
              aria-label="פתיחת תפריט"
            >
              <Menu className="size-6 md:size-7" />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex w-[300px] flex-col items-center overflow-y-auto border-none bg-sidebar px-0 py-10 text-sidebar-foreground md:w-[340px]"
            >
              <SheetTitle className="sr-only">תפריט</SheetTitle>
              <SidebarBody user={user} onLogout={onLogout} variant="drawer" />
            </SheetContent>
          </Sheet>
          <a href="/" aria-label="כותב החוק - דף הבית">
            <KotevLogo className="h-11 w-auto md:h-14" />
          </a>
        </div>
        <PointsBadge
          points={user.points}
          className="h-10 min-w-[76px] gap-1 p-2 text-[18px] md:h-[49px] md:min-w-[90px] md:text-[20px]"
          snailClassName="w-[34px] md:w-[42px]"
        />
      </header>
    </>
  );
}
