"use client";

import { useRef, type ReactNode } from "react";
import { ScrollSmoother, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { INTRO } from "@/lib/intro";
import { useReducedMotion } from "@/lib/motion";
import { setJourneyPosition } from "@/lib/scroll";

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

      // Resting inside the flash window glides to its near side in the scroll direction.
      const snapTo = (value: number, self?: ScrollTrigger) => {
        if (!self || bounds.length < 2) return value;
        const range = self.end - self.start;
        const p = positionOf(self.start + value * range);
        if (p <= INTRO.snapFrom || p >= INTRO.snapTo) return value;
        const target = self.direction > 0 ? INTRO.snapTo : INTRO.snapFrom;
        const scroll = bounds[0] + target * (bounds[1] - bounds[0]);
        return (scroll - self.start) / range;
      };

      ScrollTrigger.create({
        trigger: contentEl,
        start: 0,
        end: "max",
        onRefresh: (self) => {
          measure(self.end);
          update(self);
        },
        onUpdate: update,
        // Dev only: ?nosnap turns the snap off so browser tests can jump straight to a position.
        snap: reducedMotion || devNoSnap() ? undefined : { snapTo, duration: { min: 0.4, max: 1 }, delay: 0.12, ease: "power2.inOut" },
      });
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
