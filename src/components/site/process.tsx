import { Reveal } from "@/components/ui/reveal";

export const STEPS = [
  { no: "01", name: "Discover", text: "Explore our equipment showroom and identify the right machinery, vehicles or energy solutions." },
  { no: "02", name: "Specify", text: "Submit your requirements, quantities, technical configurations and project location through our RFQ system." },
  { no: "03", name: "Source & Coordinate", text: "Proselect engages suitable manufacturers, coordinates commercial terms, pricing and international logistics." },
  { no: "04", name: "Deliver & Support", text: "Track procurement milestones, access documentation and coordinate final delivery and after-sales support." },
];

/** Horizontal on lg+, vertical on mobile. */
export function ProcessTimeline({ dark }: { dark?: boolean }) {
  return (
    <ol className="relative grid gap-10 lg:grid-cols-4 lg:gap-8">
      <div aria-hidden className={`absolute left-[21px] top-3 h-[calc(100%-1.5rem)] w-px lg:left-0 lg:right-0 lg:top-[21px] lg:h-px lg:w-full ${dark ? "bg-white/20" : "bg-[#C4CCD4]"}`} />
      {STEPS.map((s, i) => (
        <Reveal key={s.no} as="li" delay={i * 0.1} className="relative pl-16 lg:pl-0 lg:pt-16">
          <span className={`absolute left-0 top-0 flex size-11 items-center justify-center rounded-full border-2 text-sm font-bold ${dark ? "border-[#C9A227] bg-[#002545] text-[#C9A227]" : "border-[#00447B] bg-white text-[#00447B]"}`}>
            {s.no}
          </span>
          <p className={`text-xs font-bold uppercase tracking-[0.18em] ${dark ? "text-[#C9A227]" : "text-[#00447B]"}`}>Step {s.no}</p>
          <h3 className={`mt-1 text-xl font-bold ${dark ? "!text-white" : "!text-[#00447B]"}`}>{s.name}</h3>
          <p className={`mt-3 text-sm leading-relaxed ${dark ? "text-[#C4CCD4]" : "text-[#6B7682]"}`}>{s.text}</p>
        </Reveal>
      ))}
    </ol>
  );
}
