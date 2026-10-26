import type { ReactNode } from "react";

import { AppSidebar, type SidebarUser } from "./AppSidebar";
import { LessonProgress } from "./LessonProgress";

type KotevLayoutProps = {
  user: SidebarUser;
  /** Lesson steps for the road in the top band. Pages that aren't a lesson pass `banner` instead. */
  steps?: string[];
  currentStep?: number;
  banner?: ReactNode;
  /** The sidebar link of the page being shown. */
  activeHref?: string;
  stepProgress?: number;
  onStepSelect?: (index: number) => void;
  onLogout?: () => void;
  children?: ReactNode;
};

/**
 * App shell for "כותב החוק": right-hand rail, rounded content panel and the lesson road on top.
 * Sizes are px on mobile/tablet and vw on desktop (vw = px / 19.2 from the 1920px Figma frame).
 * --banner-h is the desktop height of the top band (233px in Figma); the rail's background
 * shape lines up with it. Steps size themselves on desktop with --u (set on <main>), not raw vw.
 */
export function KotevLayout({
  user,
  steps,
  currentStep = 0,
  banner,
  activeHref,
  stepProgress,
  onStepSelect,
  onLogout,
  children,
}: KotevLayoutProps) {
  return (
    <div dir="rtl" className="flex min-h-dvh w-full flex-col bg-sidebar font-sans text-foreground lg:flex-row lg:[--banner-h:12.136vw]">
      <AppSidebar user={user} activeHref={activeHref} onLogout={onLogout} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-tr-[32px] bg-background md:rounded-tr-[64px] lg:rounded-tr-[5.938vw]">
        <section
          aria-label={steps ? "התקדמות בשיעור" : undefined}
          className="rounded-bl-[32px] rounded-tr-[32px] bg-surface px-11 pb-7 pt-5 md:rounded-bl-[64px] md:rounded-tr-[64px] md:px-14 md:pb-9 md:pt-8 lg:rounded-bl-[5.677vw] lg:rounded-tr-[5.885vw] lg:px-[5.385vw] lg:h-[var(--banner-h)] lg:pb-[2.708vw] lg:pt-[3.021vw]"
        >
          {steps ? (
            <LessonProgress steps={steps} current={currentStep} progress={stepProgress} onStepSelect={onStepSelect} />
          ) : (
            banner
          )}
        </section>

        {/* --u is the desktop size unit of the steps: 1vw, shrunk on short screens so the step (847px tall
            below the banner in Figma, 44.115 units) always fits the height left under the banner.
            The steps' outer side padding stays in vw so it follows the screen width. */}
        <main className="flex-1 lg:flex lg:flex-col lg:justify-center lg:[--u:min(1vw,calc((100dvh-var(--banner-h))/44.115))]">
          {children}
        </main>
      </div>
    </div>
  );
}
