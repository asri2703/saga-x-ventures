"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/**
 * A dropdown that opens as one surface rather than a list appearing.
 *
 * Adapted from the `@uselayouts/smooth-dropdown` block the owner chose. What
 * arrived from the registry was a showcase, not a control: a 40×40 avatar
 * button with Profile / Upgrade / Logout written into it, no props, and an
 * import of `react-use-measure`, which the install did not add — so the file
 * could not compile. The motion is the part worth keeping, so the motion is
 * what was kept and the rest is a real control.
 *
 * Its easing, `[0.23, 1, 0.32, 1]`, turned out to be the exact curve this
 * site already defines as `--ease-out-ui`. Nothing had to be reconciled.
 *
 * A native <select> was here first and is what this replaces. The reason is
 * narrow and worth recording: a native option list cannot be styled, so on
 * the dark band it dropped a white panel with a blue highlight through the
 * middle of the card. Everything the native element gave for free — keyboard,
 * focus, labelling — has to be rebuilt here deliberately, and is below.
 */

type Option = { label: string };

export function SmoothDropdown({
  options,
  value,
  onChange,
  label,
  tone = "light",
}: {
  options: Option[];
  value: number;
  onChange: (index: number) => void;
  /** For screen readers: what this chooses. */
  label: string;
  /** `dark` for the pine band, where the panel inverts. */
  tone?: "light" | "dark";
}) {
  const [open, setOpen] = useState(false);
  /* Which option the keyboard is on, which is not the chosen one while a
     reader is arrowing through. */
  const [focused, setFocused] = useState(value);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const reduced = useReducedMotion();

  /* Clicking anywhere else closes it. `pointerdown` rather than `click` so
     the panel is gone before the next element reacts. */
  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  function choose(index: number) {
    onChange(index);
    setFocused(index);
    setOpen(false);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    const keys = ["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "];
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!keys.includes(event.key)) return;
    event.preventDefault();

    if (!open) {
      setOpen(true);
      setFocused(value);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      choose(focused);
      return;
    }
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? options.length - 1
          : event.key === "ArrowDown"
            ? Math.min(options.length - 1, focused + 1)
            : Math.max(0, focused - 1);
    setFocused(next);
  }

  const chosen = options[Math.min(value, options.length - 1)];

  return (
    <div
      ref={root}
      className={`dropdown dropdown--${tone}`}
      onKeyDown={onKeyDown}
    >
      <button
        type="button"
        className="dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${chosen?.label ?? ""}`}
        onClick={() => {
          setOpen((was) => !was);
          setFocused(value);
        }}
      >
        <span className="dropdown-value">{chosen?.label}</span>
        <motion.span
          aria-hidden
          className="dropdown-caret"
          animate={{ rotate: open ? 180 : 0 }}
          transition={
            reduced ? { duration: 0 } : { duration: 0.25, ease: [0.23, 1, 0.32, 1] }
          }
        >
          ▾
        </motion.span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.ul
            id={listId}
            role="listbox"
            aria-label={label}
            className="dropdown-list"
            /* Height and opacity only — the panel grows, it does not slide
               in from somewhere it never was. */
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={
              reduced
                ? { duration: 0 }
                : { duration: 0.28, ease: [0.23, 1, 0.32, 1] }
            }
          >
            {options.map((option, index) => (
              <li key={option.label} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={index === value}
                  data-focused={index === focused ? "" : undefined}
                  className="dropdown-option"
                  onClick={() => choose(index)}
                  onPointerEnter={() => setFocused(index)}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
