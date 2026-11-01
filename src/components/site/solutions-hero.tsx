"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SolutionSlide {
  id: string;
  no: string;
  divisionLabel: string;
  headline: string;
  subheadline: string;
  image: string;
  rfqDivision: string;
}

export const SOLUTION_SLIDES: SolutionSlide[] = [
  {
    id: "mobility",
    no: "01",
    divisionLabel: "Electric Mobility & Commercial Fleets",
    headline: "DIRECT FACTORY ACCESS. COMMERCIAL ELECTRIC MOBILITY.",
    subheadline:
      "Golf buggies, passenger shuttles, resort vehicles and utility electric fleets sourced directly from international production lines for East African operators.",
    image: "/images/solution-mobility.jpg",
    rfqDivision: "electric-mobility",
  },
  {
    id: "energy",
    no: "02",
    divisionLabel: "Renewable Energy & Power Systems",
    headline: "ENGINEERED SOLAR PV & INDUSTRIAL ENERGY STORAGE.",
    subheadline:
      "Commercial solar PV, hybrid inverters, industrial LiFePO4 battery storage and EV charging infrastructure engineered for East African project conditions.",
    image: "/images/solution-energy.jpg",
    rfqDivision: "renewable-energy",
  },
  {
    id: "machinery",
    no: "03",
    divisionLabel: "Heavy Machinery & Industrial Equipment",
    headline: "FACTORY-BACKED HEAVY MACHINERY & INDUSTRIAL PLANT.",
    subheadline:
      "Hydraulic excavators, wheel loaders, material handling forklifts and specialised industrial equipment delivered with verified manufacturer specifications.",
    image: "/images/solution-machinery.jpg",
    rfqDivision: "heavy-machinery",
  },
];

const AUTOPLAY_INTERVAL = 7000;

export function SolutionsHero() {
  const [current, setCurrent] = React.useState(0);

  // Auto-play timer
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SOLUTION_SLIDES.length);
    }, AUTOPLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [current]);

  const slide = SOLUTION_SLIDES[current];

  return (
    <section
      aria-label="Proselect Solutions"
      className="relative isolate flex min-h-[calc(100svh-76px)] flex-col justify-between overflow-hidden bg-[#002545] text-white"
    >
      {/* Background Photography with Crossfade */}
      <div className="absolute inset-0 -z-20 overflow-hidden">
        {SOLUTION_SLIDES.map((s, idx) => (
          <div
            key={s.id}
            aria-hidden={idx !== current}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === current ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <Image
              src={s.image}
              alt=""
              fill
              priority={idx === 0}
              sizes="100vw"
              className="object-cover object-center"
            />
            {/* Deep Navy 60% brand overlay for WCAG AAA contrast */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#002545]/95 via-[#002545]/80 to-[#002545]/45" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#002545] to-transparent" />
          </div>
        ))}
      </div>

      {/* Main Content: Clean Headline & Subheadline Only */}
      <div className="container-x relative z-20 flex flex-1 flex-col justify-center py-20 sm:py-24 lg:py-28">
        <div className="max-w-4xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              {/* Clean Division Tag */}
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C9A227]">
                {slide.no} — {slide.divisionLabel}
              </p>

              {/* Solution Headline */}
              <h1 className="h-display mt-4 max-w-4xl font-bold leading-[1.12] tracking-tight text-white">
                {slide.headline}
              </h1>

              {/* Solution Subheadline */}
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#C4CCD4] sm:text-lg lg:text-xl">
                {slide.subheadline}
              </p>

              {/* Clean, Simple CTA */}
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Button asChild size="lg" variant="accent">
                  <Link href={`/rfq?division=${slide.rfqDivision}`}>
                    Request a Quote <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline-light">
                  <Link href="/solutions">Explore Solutions</Link>
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Minimalist Bottom Solution Selector (No Clutter) */}
      <div className="relative z-20 border-t border-white/10 bg-[#001D36]/60 backdrop-blur-sm">
        <div className="container-x flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex flex-wrap items-center gap-6 sm:gap-10">
            {SOLUTION_SLIDES.map((s, idx) => {
              const active = idx === current;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setCurrent(idx)}
                  className={`group relative pb-2 text-left transition-colors ${
                    active ? "text-white" : "text-[#C4CCD4]/70 hover:text-white"
                  }`}
                  aria-pressed={active}
                >
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                    <span className={active ? "text-[#C9A227]" : "text-[#C4CCD4]/60"}>{s.no}</span>
                    <span>{s.divisionLabel.split(" & ")[0]}</span>
                  </div>
                  {active && (
                    <motion.div
                      layoutId="activeSlideIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C9A227]"
                      transition={{ duration: 0.25 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <p className="hidden text-xs text-[#C4CCD4]/60 lg:block">
            Nairobi · Direct Factory Access · East Africa
          </p>
        </div>
      </div>
    </section>
  );
}
