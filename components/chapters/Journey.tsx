"use client";

import { useRef, type ReactNode } from "react";
import { ScrollSmoother, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/motion";
import { setJourneyPosition } from "@/lib/scroll";

// The master scroll timeline. One ScrollTrigger spans the page and turns scroll into
// the journey position (chapter index + progress), which the canvas reads each frame.
// Smooth scrolling via ScrollSmoother, except with reduced motion and on touch (native).
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
      const update = (scroll: number) => {
        const count = bounds.length - 1;
        if (count < 1) return;
        let i = 0;
        while (i < count - 1 && scroll >= bounds[i + 1]) i++;
        const span = bounds[i + 1] - bounds[i];
        const local = span > 0 ? Math.min(1, Math.max(0, (scroll - bounds[i]) / span)) : 0;
        setJourneyPosition(i + local, count);
      };
      // Whole pixels, so a jump that lands on a chapter's first pixel counts as that chapter.
      const scrollOf = (self: ScrollTrigger) => Math.round(self.start + self.progress * (self.end - self.start));

      ScrollTrigger.create({
        trigger: contentEl,
        start: 0,
        end: "max",
        onRefresh: (self) => {
          measure(self.end);
          update(scrollOf(self));
        },
        onUpdate: (self) => update(scrollOf(self)),
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
