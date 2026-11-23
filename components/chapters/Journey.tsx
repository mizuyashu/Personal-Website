"use client";

import { useRef, type ReactNode } from "react";
import { gsap, ScrollSmoother, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { INTRO } from "@/lib/intro";
import { useReducedMotion } from "@/lib/motion";
import { journey, scrollToId, setJourneyPosition } from "@/lib/scroll";
import { installWheelGovernor } from "@/lib/wheel";
import { whenLoaderDone } from "@/lib/loading";

// The master scroll timeline. One ScrollTrigger spans the page and turns scroll into
// the journey position (chapter index + progress), which the canvas and overlays read.
// Smooth scrolling via ScrollSmoother, except with reduced motion and on touch (native).
// Snap only in special sequences: the intro flash (never with reduced motion).
function devNoSnap() {
  return process.env.NODE_ENV === "development" && new URLSearchParams(window.location.search).has("nosnap");
}

export default function Journey({ children }: { children: ReactNode }) {
  const wrapper = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      const contentEl = content.current;
      const wrapperEl = wrapper.current;
      if (!contentEl || !wrapperEl) return;

      if (!reducedMotion) {
        ScrollSmoother.create({ wrapper: wrapperEl, content: contentEl, smooth: 1.2, smoothTouch: false });
      }

      // Scroll offset where each chapter starts, plus the end of the page.
      let bounds: number[] = [];
      const measure = (maxScroll: number) => {
        const top = contentEl.getBoundingClientRect().top;
        const sections = contentEl.querySelectorAll<HTMLElement>("[data-chapter]");
        bounds = [...Array.from(sections, (s) => s.getBoundingClientRect().top - top), maxScroll];
      };
      const positionOf = (scroll: number) => {
        const count = bounds.length - 1;
        if (count < 1) return 0;
        let i = 0;
        while (i < count - 1 && scroll >= bounds[i + 1]) i++;
        const span = bounds[i + 1] - bounds[i];
        return i + (span > 0 ? Math.min(1, Math.max(0, (scroll - bounds[i]) / span)) : 0);
      };
      // Whole pixels, so a jump that lands on a chapter's first pixel counts as that chapter.
      const scrollOf = (self: ScrollTrigger) => Math.round(self.start + self.progress * (self.end - self.start));
      const update = (self: ScrollTrigger) => setJourneyPosition(positionOf(scrollOf(self)), bounds.length - 1);

      // The flash snap. Resting inside the flash window glides to its near side in the
      // scroll direction, so the flash is never left half-done. Our own, not GSAP's `snap`:
      // GSAP's snap projects momentum and could glide the page somewhere else entirely, even
      // back to the top. Rule (Michael): the page never moves the visitor back to the start.
      // The only targets here are the two edges of the flash window, never the top.
      const snapEnabled = !reducedMotion && !devNoSnap();
      let direction = 1;
      const settle = gsap.delayedCall(0.16, () => {
        if (bounds.length < 2) return;
        const p = journey.position;
        if (p <= INTRO.snapFrom || p >= INTRO.snapTo) return;
        const target = direction > 0 ? INTRO.snapTo : INTRO.snapFrom;
        const scroll = bounds[0] + target * (bounds[1] - bounds[0]);
        if (scroll <= 0) return;
        const smoother = ScrollSmoother.get();
        if (smoother) smoother.scrollTo(scroll, true);
        else window.scrollTo({ top: scroll, behavior: "smooth" });
      }).pause();

      ScrollTrigger.create({
        trigger: contentEl,
        start: 0,
        end: "max",
        onRefresh: (self) => {
          measure(self.end);
          update(self);
        },
        onUpdate: (self) => {
          update(self);
          if (!snapEnabled) return;
          direction = self.direction;
          settle.restart(true);
        },
      });
      // Back from a sub-page that was loaded directly (no journey behind it): land where it
      // belongs on the journey (?from=<element id>), never at the top. Then tidy the URL.
      const from = new URLSearchParams(window.location.search).get("from");
      if (from && document.getElementById(from)) {
        // After the loader (it locks scrolling while it shows), with fresh measurements.
        whenLoaderDone().then(() => {
          ScrollTrigger.refresh();
          scrollToId(from, true, 72);
        });
        const url = new URL(window.location.href);
        url.searchParams.delete("from");
        window.history.replaceState(null, "", url.pathname + url.search + url.hash);
      }
      // Mouse-wheel scrolling at most about arrow-key speed (lib/wheel.ts); not with reduced motion.
      const removeWheelGovernor = reducedMotion ? undefined : installWheelGovernor();
      return () => {
        settle.kill();
        removeWheelGovernor?.();
      };
    },
    { dependencies: [reducedMotion], revertOnUpdate: true },
  );

  return (
    <div ref={wrapper} id="smooth-wrapper">
      <div ref={content} id="smooth-content">
        {children}
      </div>
    </div>
  );
}
