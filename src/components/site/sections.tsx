import Image from "next/image";
import { HeroReveal } from "@/components/ui/reveal";

export function PageHero({
  eyebrow,
  title,
  children,
  image = "/images/cta.jpg",
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
  image?: string;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-[#002545] text-white">
      <Image src={image} alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-45" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#002545] via-[#002545]/90 to-[#002545]/40" />
      <div className="container-x py-20 sm:py-24 lg:py-28">
        <HeroReveal>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C9A227]">{eyebrow}</p>
          <h1 className="mt-4 max-w-4xl text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-4xl lg:text-5xl">{title}</h1>
          {children && <div className="mt-6 max-w-2xl text-base leading-relaxed text-[#C4CCD4] sm:text-lg">{children}</div>}
        </HeroReveal>
      </div>
      <div className="metal-rule" />
    </section>
  );
}

export function SectionHead({
  eyebrow,
  title,
  children,
  center,
  light,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
  center?: boolean;
  light?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {eyebrow && <p className={`eyebrow ${light ? "!text-[#C9A227]" : ""}`}>{eyebrow}</p>}
      <h2 className={`h-section mt-3 ${light ? "!text-white" : ""}`}>{title}</h2>
      {children && <p className={`lead mt-4 ${light ? "!text-[#C4CCD4]" : "!text-[#6B7682]"}`}>{children}</p>}
    </div>
  );
}
