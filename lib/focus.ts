"use client";

import { useEffect, type RefObject } from "react";

// Keyboard focus helpers. Every focus call uses preventScroll: the journey's content is moved by
// ScrollSmoother, and a native "scroll into view" would jump the page (and could take the visitor
// somewhere they didn't choose; CLAUDE.md: the page never moves the visitor on its own).

/** Focus an element without scrolling the page. */
export function focusQuietly(el: HTMLElement | null | undefined) {
  el?.focus({ preventScroll: true });
}

/**
 * Give focus back to `el` once it can take it. While a sub-page is open the journey's HTML is
 * hidden (body[data-subpage], lib/view.ts) and stays hidden through the flight back, so wait for
 * that to clear first (with a safety timeout). Even then the element can stay hidden for a frame
 * or two while visibility transitions back (reduced motion gives every element a tiny transition),
 * and a hidden element can't take focus, so try once per frame until it shows.
 */
export function restoreFocus(el: Element | null) {
  if (!(el instanceof HTMLElement) || el === document.body || !el.isConnected) return;
  const body = document.body;
  // Only if nothing else took focus meanwhile (e.g. the visitor already clicked elsewhere).
  const free = () => document.activeElement === body || document.activeElement === null;
  const focusWhenShown = (frames = 30) => {
    if (!el.isConnected || !free()) return;
    if (getComputedStyle(el).visibility !== "hidden") focusQuietly(el);
    else if (frames > 0) requestAnimationFrame(() => focusWhenShown(frames - 1));
  };
  if (!("subpage" in body.dataset)) {
    focusWhenShown();
    return;
  }
  const done = () => {
    observer.disconnect();
    window.clearTimeout(timeout);
    focusWhenShown();
  };
  const observer = new MutationObserver(() => {
    if (!("subpage" in body.dataset)) done();
  });
  observer.observe(body, { attributes: true, attributeFilter: ["data-subpage"] });
  const timeout = window.setTimeout(done, 4000);
}

/**
 * Escape closes a small corner panel (menu, compass). Focus goes back to its toggle when it was
 * inside the panel or on the toggle, so keyboard visitors don't lose their place.
 */
export function useEscapeToClose(open: boolean, close: () => void, root: RefObject<HTMLElement | null>, toggle: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const hadFocus = root.current?.contains(document.activeElement) ?? false;
      close();
      if (hadFocus) focusQuietly(toggle.current);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, root, toggle]);
}
