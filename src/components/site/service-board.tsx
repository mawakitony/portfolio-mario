import {
  Aperture,
  Clapperboard,
  GraduationCap,
  MonitorPlay,
  PenTool,
  Radio,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { RevealOnScroll } from "@/components/site/motion/reveal-on-scroll";

export type ServiceItem = {
  key: string;
  slug: string;
  title: string;
  summary: string | null;
};

const icons: Record<string, LucideIcon> = {
  branding: PenTool,
  "design-graphique": Sparkles,
  "motion-design": Clapperboard,
  "production-video": MonitorPlay,
  photographie: Aperture,
  "live-streaming": Radio,
  formation: GraduationCap,
};

export function ExpertiseStrip({ services }: { services: ServiceItem[] }) {
  return (
    <div className="mt-16">
      <p className="text-xs font-medium tracking-[0.22em] text-[#2078CF] uppercase">Savoir-faire</p>
      <ul className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(10.5rem,1fr))] gap-3">
        {services.map((service, index) => {
          const Icon = icons[service.slug] ?? Sparkles;
          return (
            <li key={service.key}>
              <RevealOnScroll variant="staggerDropDown" delay={index * 100}>
              <article className="group flex h-full flex-col justify-between gap-8 rounded-2xl border border-[#2078CF]/30 bg-gradient-to-b from-[#011F65] to-[#020C47] px-4 py-5 transition duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[0_12px_28px_rgba(32,120,207,0.22)]">
                <span className="flex items-center justify-between text-[#2078CF]">
                  <span className="text-xs font-medium">{String(index + 1).padStart(2, "0")}</span>
                  <Icon className="size-4 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:rotate-6" aria-hidden />
                </span>
                <span className="text-sm font-semibold text-white">{service.title}</span>
              </article>
              </RevealOnScroll>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ServiceBoard({ services }: { services: ServiceItem[] }) {
  return (
    <ul className="mt-10 grid gap-4 md:grid-cols-6">
      {services.map((service, index) => {
        const Icon = icons[service.slug] ?? Sparkles;
        const wide = index === 0 || index === 3 || index === 6;
        return (
          <li key={service.key} id={service.slug} className={`scroll-mt-24 ${wide ? "md:col-span-3" : "md:col-span-2"}`}>
            <RevealOnScroll variant="staggerScale" delay={index * 100}>
              <article className="group flex h-full min-h-52 flex-col justify-between gap-8 border border-[#2078CF]/25 bg-gradient-to-br from-[#011F65] to-[#020C47] p-6 transition duration-300 hover:border-[#2078CF] motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-[0_16px_36px_rgba(32,120,207,0.24)]">
                <span className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#2078CF]">{String(index + 1).padStart(2, "0")}</span>
                  <Icon className="size-5 text-[#2078CF] motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:-translate-y-0.5 motion-safe:group-hover:rotate-6" aria-hidden />
                </span>
                <span>
                  <span className="block font-display text-3xl">{service.title}</span>
                  {service.summary ? <span className="mt-3 block text-sm text-muted-foreground">{service.summary}</span> : null}
                </span>
              </article>
            </RevealOnScroll>
          </li>
        );
      })}
    </ul>
  );
}
