import type { ReactNode } from "react";
import { MotionReveal } from "@/components/site/motion/motion-reveal";
import type { SiteContent } from "@/lib/content/settings";

const icons: Record<string, ReactNode> = {
  Instagram: (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-none stroke-current">
      <rect x="4" y="4" width="16" height="16" rx="4" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3.5" strokeWidth="1.6" />
      <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  ),
  Facebook: (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-current">
      <path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.6l.4-3H13v-2c0-.6.4-1 1-1Z" />
    </svg>
  ),
  TikTok: (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-current">
      <path d="M14 4c.4 2.4 1.8 4 4 4.4v2.4c-1.4 0-2.7-.4-4-1.2v6.2a5.8 5.8 0 1 1-5-5.7v2.6a3.2 3.2 0 1 0 2.2 3.1V4H14Z" />
    </svg>
  ),
  YouTube: (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-current">
      <path d="M21 8.2a3 3 0 0 0-2.1-2.1C17.2 5.6 12 5.6 12 5.6s-5.2 0-6.9.5A3 3 0 0 0 3 8.2 31 31 0 0 0 2.5 12 31 31 0 0 0 3 15.8a3 3 0 0 0 2.1 2.1c1.7.5 6.9.5 6.9.5s5.2 0 6.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-3.8 31 31 0 0 0-.5-3.8ZM10.5 14.8V9.2L15.2 12l-4.7 2.8Z" />
    </svg>
  ),
  Behance: (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-current">
      <path d="M8.2 11.2c.8-.3 1.4-1 1.4-2 0-1.6-1.2-2.4-3-2.4H3v10.4h3.8c2 0 3.4-1 3.4-2.8 0-1.3-.8-2.2-2-2.4Zm-3.4-2.8h2c.8 0 1.3.4 1.3 1.1s-.5 1.1-1.4 1.1H4.8V8.4Zm2.2 6.6H4.8v-2.4h2.3c.9 0 1.5.4 1.5 1.2s-.6 1.2-1.6 1.2ZM14.2 8.2c-2.6 0-4.2 1.8-4.2 4.4s1.6 4.5 4.3 4.5c1.6 0 2.8-.6 3.5-1.7h.1v1.4h1.8V12c0-2.4-1.8-3.8-5.5-3.8Zm.1 7.2c-1.1 0-1.9-.7-1.9-1.8s.8-1.8 1.9-1.8 1.8.7 1.8 1.8-.7 1.8-1.8 1.8ZM15.2 6.2h4.2V4.6h-4.2v1.6Z" />
    </svg>
  ),
  LinkedIn: (
    <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-current">
      <path d="M6.7 9.2H4V20h2.7V9.2ZM5.3 4A1.6 1.6 0 1 0 5.3 7.2 1.6 1.6 0 0 0 5.3 4ZM20 20h-2.7v-5.6c0-1.6-.6-2.6-2-2.6-1 0-1.6.7-1.9 1.4-.1.2-.1.6-.1.9V20H10.6s.1-9.3 0-10.8h2.7v1.5c.4-.6 1.2-1.8 3.1-1.8 2.2 0 3.6 1.4 3.6 4.5V20Z" />
    </svg>
  ),
};

export function SocialLinks({
  links,
  className = "",
}: {
  links: SiteContent["social"];
  className?: string;
}) {
  if (links.length === 0) return null;
  return (
    <ul className={className}>
      {links.map((item, index) => (
        <MotionReveal key={item.href} as="li" variant="staggerDropDown" delay={index * 0.1}>
          <a
            href={item.href}
            target="_blank"
            rel="noreferrer"
            aria-label={item.label}
            className="grid size-10 place-items-center rounded-full border border-[#2078CF]/35 text-white transition-transform duration-200 hover:border-[#2078CF] hover:bg-[#2078CF] hover:text-white motion-safe:hover:-translate-y-0.5 motion-safe:hover:scale-105"
          >
            {icons[item.label] ?? <span className="text-xs">{item.label.slice(0, 1)}</span>}
          </a>
        </MotionReveal>
      ))}
    </ul>
  );
}
