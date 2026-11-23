"use client";

/**
 * Overlapping slider — vendored from the @uselayouts registry (MIT), then
 * reduced and restyled.
 *
 * What was removed: the demo profile data, its ProfileCard, the demo page
 * wrapper, and the Unsplash image URLs they referenced. None of it was used
 * here, and vendored dead code that fetches third-party images is exactly the
 * kind of thing that quietly stays forever.
 *
 * What was changed: the arrows and dots were hardcoded neutral-900 on white.
 * They are pine and ruby now, like everything else.
 *
 * `items` or `children` is required — the component no longer falls back to
 * demo cards when given neither, because silently rendering six strangers
 * from Unsplash is worse than rendering nothing.
 */

import React, { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function sliderStep(cardWidth: number, overlapFactor: number, cardGap: number) {
  return Math.round(cardWidth - cardWidth * overlapFactor + cardGap);
}

export function snapSliderIndex(
  offsetX: number,
  step: number,
  velocity: number,
  total: number,
) {
  if (total <= 1) return 0;
  let index = -offsetX / step;
  if (velocity < -350) index = Math.ceil(index);
  else if (velocity > 350) index = Math.floor(index);
  else index = Math.round(index);
  return Math.max(0, Math.min(index, total - 1));
}

/** diff = index − activeExact. Cards to the left recede; the rest stay put. */
export function cardLeave(diff: number) {
  const t = Math.min(1, Math.max(0, -diff));
  return {
    scale: 1 - t * 0.16,
    y: t * 36,
    rotate: 0,
  };
}

export type OverlappingSliderProps<T> = {
  items?: T[];
  renderItem?: (item: T, index: number, isActive: boolean) => ReactNode;
  children?: ReactNode;
  cardWidth?: number;
  cardHeight?: number;
  overlapFactor?: number;
  cardGap?: number;
  maxRotation?: number;
  transformOrigin?: string;
  showDots?: boolean;
  showArrows?: boolean;
  className?: string;
  onActiveChange?: (index: number) => void;
};

export function OverlappingSlider<T = unknown>({
  items,
  renderItem,
  children,
  cardWidth = 340,
  cardHeight = 460,
  overlapFactor = 0.04,
  cardGap = 18,
  maxRotation = 0,
  transformOrigin = "50% 90%",
  showDots = false,
  showArrows = true,
  className = "",
  onActiveChange,
}: OverlappingSliderProps<T>) {
  const childArray = React.Children.toArray(children);
  // Docs call `<OverlappingSlider />` with no props — fall back to demo profiles.
  const resolvedItems = items;
  const resolvedRenderItem = renderItem;
  const total = resolvedItems ? resolvedItems.length : childArray.length;
  const step = sliderStep(cardWidth, overlapFactor, cardGap);

  const [activeIndex, setActiveIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const dragRef = useRef({
    down: false,
    startX: 0,
    origin: 0,
    lastX: 0,
    lastT: 0,
    velocity: 0,
    moved: 0,
  });

  const apply = (x: number, animate: boolean) => {
    offsetRef.current = x;
    const track = trackRef.current;
    if (!track) return;
    const transition = animate ? "transform 380ms cubic-bezier(0.22, 1, 0.36, 1)" : "none";
    track.style.transition = transition;
    track.style.setProperty("--ox", `${x}px`);
    const activeExact = -x / step;
    for (let i = 0; i < track.children.length; i++) {
      const card = track.children[i] as HTMLElement;
      const diff = i - activeExact;
      const leave = cardLeave(diff);
      const rotate = maxRotation
        ? Math.min(Math.max(diff * 1.6, -maxRotation), maxRotation)
        : 0;
      card.style.transition = transition;
      card.style.zIndex = String(i);
      card.style.setProperty("--y", `${leave.y}px`);
      card.style.setProperty("--r", `${rotate}deg`);
      card.style.setProperty("--s", String(leave.scale));
    }
  };

  const goTo = (index: number) => {
    const next = Math.max(0, Math.min(index, total - 1));
    setActiveIndex(next);
    apply(-next * step, true);
    onActiveChange?.(next);
  };

  useLayoutEffect(() => {
    apply(offsetRef.current, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- drag writes transforms on the track; this only re-paints when card metrics change
  }, [cardWidth, cardHeight, overlapFactor, cardGap, maxRotation, total]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const drag = dragRef.current;
    drag.down = true;
    drag.startX = e.clientX;
    drag.origin = offsetRef.current;
    drag.lastX = e.clientX;
    // The event carries its own timestamp, off the same clock. Reading
    // performance.now() here would be an impure call in a component body.
    drag.lastT = e.timeStamp;
    drag.velocity = 0;
    drag.moved = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag.down) return;
    const now = e.timeStamp;
    const dt = Math.max(1, now - drag.lastT);
    drag.velocity = ((e.clientX - drag.lastX) / dt) * 1000;
    drag.lastX = e.clientX;
    drag.lastT = now;
    drag.moved = Math.max(drag.moved, Math.abs(e.clientX - drag.startX));
    const x = drag.origin + (e.clientX - drag.startX);
    apply(x, false);
    const predicted = Math.max(0, Math.min(Math.round(-x / step), total - 1));
    if (predicted !== activeIndex) {
      setActiveIndex(predicted);
      onActiveChange?.(predicted);
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag.down) return;
    drag.down = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    goTo(snapSliderIndex(offsetRef.current, step, drag.velocity, total));
  };

  return (
    <div className={`relative flex w-full select-none flex-col ${className}`}>
      <div
        className="flex w-full cursor-grab touch-pan-y items-center overflow-hidden py-10 active:cursor-grabbing"
        style={{ minHeight: cardHeight + 72 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          ref={trackRef}
          className="flex items-end pl-8 sm:pl-12"
          style={{ transform: "translate3d(var(--ox, 0px), 0, 0)" }}
        >
          {Array.from({ length: total }, (_, index) => (
            <div
              key={
                resolvedItems
                  ? String((resolvedItems[index] as { id?: string }).id ?? index)
                  : index
              }
              className="shrink-0"
              style={{
                width: cardWidth,
                height: cardHeight,
                marginRight: cardGap - cardWidth * overlapFactor,
                zIndex: index,
                transformOrigin,
                transform: "translateY(var(--y, 0px)) rotate(var(--r, 0deg)) scale(var(--s, 1))",
              }}
              onClick={() => {
                if (dragRef.current.moved < 8) goTo(index);
              }}
            >
              {resolvedItems && resolvedRenderItem
                ? resolvedRenderItem(resolvedItems[index], index, activeIndex === index)
                : childArray[index]}
            </div>
          ))}
        </div>
      </div>

      {(showDots || showArrows) && (
        <div className="mt-1 flex w-full items-center px-8 sm:px-12">
          {showArrows && (
            <div className="flex items-center gap-2">
              <ArrowButton
                label="Previous"
                disabled={activeIndex === 0}
                onClick={() => goTo(activeIndex - 1)}
              >
                <ChevronLeft className="size-4" strokeWidth={2.25} />
              </ArrowButton>
              <ArrowButton
                label="Next"
                disabled={activeIndex === total - 1}
                onClick={() => goTo(activeIndex + 1)}
              >
                <ChevronRight className="size-4" strokeWidth={2.25} />
              </ArrowButton>
            </div>
          )}
          {showDots && (
            <div className="ml-auto flex items-center gap-2">
              {Array.from({ length: total }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  className={`h-2 rounded-full transition-[width,background-color] duration-300 ${
                    activeIndex === i
                      ? "w-8 bg-ruby"
                      : "w-2 bg-rule hover:bg-rule-strong"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ArrowButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex size-9 items-center justify-center rounded-full bg-pine text-paper transition enabled:hover:bg-pine-soft enabled:active:scale-[0.96] disabled:cursor-not-allowed disabled:bg-paper-sunk disabled:text-pine-faint"
    >
      {children}
    </button>
  );
}
