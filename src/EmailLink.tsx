import { useEffect, useRef, useState, type ReactNode } from "react";

/** Sanity values sometimes carry stray spaces or a pasted "mailto:" prefix, either of which breaks the link. */
export const cleanEmail = (raw?: string) => (raw ?? "").trim().replace(/^mailto:/i, "");

const HANDOFF_MS = 1200;
const NOTE_MS = 3500;

/**
 * A mailto: link that never fails silently.
 *
 * The browser opens the visitor's mail app. Browsers give no signal when nothing is set up to handle mailto: (very
 * common on desktops), so we watch for the window losing focus. If it hasn't within a moment, nothing took over, and we
 * copy the address to the clipboard instead (or just show it if the clipboard is blocked).
 */
export function EmailLink({ email, className, children }: { email: string; className?: string; children: ReactNode }) {
  const [note, setNote] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const onClick = () => {
    let handedOff = false;
    const mark = () => {
      handedOff = true;
    };
    window.addEventListener("blur", mark, { once: true });
    document.addEventListener("visibilitychange", mark, { once: true });

    timers.current.push(
      setTimeout(async () => {
        window.removeEventListener("blur", mark);
        document.removeEventListener("visibilitychange", mark);
        if (handedOff) return;

        let copied = false;
        try {
          await navigator.clipboard.writeText(email);
          copied = true;
        } catch {
          /* clipboard unavailable: show the address instead */
        }
        setNote(copied ? "Address copied" : email);
        timers.current.push(setTimeout(() => setNote(null), NOTE_MS));
      }, HANDOFF_MS),
    );
  };

  return (
    <a className={className} href={`mailto:${email}`} onClick={onClick}>
      {children}
      {note && (
        <span className="copy-note" role="status">
          {note}
        </span>
      )}
    </a>
  );
}
