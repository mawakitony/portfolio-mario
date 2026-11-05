import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export type TypewriterLine = {
  text: string;
  duration: number;
  className?: string;
  color?: string;
};

type CaretPlan = {
  on: number;
  off: number;
  blink: boolean;
  hold: number;
};

type LinePlan = {
  className?: string;
  color: string;
  chars: { char: string; delay: number }[];
  carets: CaretPlan[];
};

const leadIn = 160;

export function TypewriterText({
  lines,
  pause = 300,
  caretHold = 800,
  className,
}: {
  lines: TypewriterLine[];
  pause?: number;
  caretHold?: number;
  className?: string;
}) {
  const plan = buildPlan(lines, pause, caretHold);

  return (
    <span className={cn("typewriter", className)}>
      {plan.map((line, lineIndex) => (
        <span
          key={`${lineIndex}-${line.chars.length}`}
          className={cn("typewriter-line block w-fit max-w-full", line.className)}
          style={{ "--type-color": line.color } as CSSProperties}
        >
          {line.carets[0] ? <Caret caret={line.carets[0]} /> : null}
          {line.chars.map((slot, index) => (
            <span key={`${slot.char}-${index}`}>
              <span className="typewriter-char" style={{ "--type-delay": `${slot.delay}ms` } as CSSProperties}>
                {slot.char === " " ? "\u00A0" : slot.char}
              </span>
              {line.carets[index + 1] ? <Caret caret={line.carets[index + 1]} /> : null}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

function Caret({ caret }: { caret: CaretPlan }) {
  return (
    <span
      aria-hidden
      className="typewriter-caret"
      data-blink={caret.blink ? "true" : undefined}
      style={
        {
          "--caret-on": `${caret.on}ms`,
          "--caret-off": `${caret.off}ms`,
          "--caret-span": `${Math.max(90, caret.off - caret.on)}ms`,
          "--caret-hold": `${caret.hold}ms`,
        } as CSSProperties
      }
    />
  );
}

function buildPlan(lines: TypewriterLine[], pause: number, caretHold: number): LinePlan[] {
  let cursor = leadIn;

  return lines.map((line, lineIndex) => {
    const chars = Array.from(line.text);
    const count = chars.length;
    const start = cursor;
    const step = count > 1 ? line.duration / (count - 1) : 0;
    const timed = chars.map((char, index) => ({
      char,
      delay: start + index * step,
    }));
    const end = start + (count > 0 ? line.duration : 0);
    const last = lineIndex === lines.length - 1;
    const carets: CaretPlan[] = [];

    if (lineIndex === 0) {
      carets.push({ on: 0, off: start, blink: false, hold: 0 });
    }

    timed.forEach((slot, index) => {
      const next = index < timed.length - 1 ? timed[index + 1].delay : end + (last ? caretHold : pause);
      carets.push({
        on: slot.delay,
        off: next,
        blink: last && index === timed.length - 1,
        hold: caretHold,
      });
    });

    cursor = end + (last ? 0 : pause);
    return {
      className: line.className,
      color: line.color ?? "#ffffff",
      chars: timed,
      carets,
    };
  });
}
