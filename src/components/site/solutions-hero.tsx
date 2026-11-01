"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play, ShieldCheck, Zap, Truck, Factory } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SolutionSlide {
  id: string;
  no: string;
  divisionLabel: string;
  badgeTone: "fleet" | "gold" | "industrial";
  title: string;
  headline: string;
  description: string;
  image: string;
  highlights: string[];
  primaryCtaText: string;
  primaryCtaHref: string;
  secondaryCtaText: string;
  secondaryCtaHref: string;
}

export const SOLUTION_SLIDES: SolutionSlide[] = [
  {
    id: "mobility",
    no: "01",
    divisionLabel: "Fleet Division",
    badgeTone: "fleet",
    title: "Electric Mobility & Commercial Fleets",
    headline: "DIRECT FACTORY ACCESS. COMMERCIAL ELECTRIC MOBILITY.",
    description:
      "Golf buggies, passenger shuttles, resort vehicles and utility electric transport sourced directly from international production lines for East African operators.",
    image: "/images/solution-mobility.jpg",
    highlights: ["2 to 14-Seat Passenger Shuttles", "LiFePO4 Lithium Powertrains", "Golf & Resort Fleets", "Fleet Charging Infrastructure"],
    primaryCtaText: "Request a Fleet Quote",
    primaryCtaHref: "/rfq?division=electric-mobility",
    secondaryCtaText: "Explore Fleet Solutions",
    secondaryCtaHref: "/solutions#electric-mobility",
  },
  {
    id: "energy",
    no: "02",
    divisionLabel: "Power & Energy Systems",
    badgeTone: "gold",
    title: "Renewable Energy & Power Systems",
    headline: "ENGINEERED SOLAR PV & INDUSTRIAL ENERGY STORAGE.",
    description:
      "High-efficiency commercial solar PV, hybrid inverters, industrial LiFePO4 battery storage and EV charging networks engineered for reliable power.",
    image: "/images/solution-energy.jpg",
    highlights: ["Tier-1 Solar PV Modules", "Commercial Hybrid Inverters", "Containerised Industrial BESS", "EV Fast Charging"],
    primaryCtaText: "Request Energy Quote",
    primaryCtaHref: "/rfq?division=renewable-energy",
    secondaryCtaText: "Explore Energy Systems",
    secondaryCtaHref: "/solutions#renewable-energy",
  },
  {
    id: "machinery",
    no: "03",
    divisionLabel: "Industrial Division",
    badgeTone: "industrial",
    title: "Heavy Machinery & Industrial Equipment",
    headline: "FACTORY-BACKED HEAVY MACHINERY & INDUSTRIAL PLANT.",
    description:
      "Crawler excavators, wheel loaders, material handling forklifts, and specialised earthmoving equipment delivered with verified manufacturer specifications.",
    image: "/images/solution-machinery.jpg",
    highlights: ["Hydraulic Excavators & Loaders", "Warehouse Electric & Diesel Forklifts", "Earthmoving Plant", "Direct Factory Backing"],
    primaryCtaText: "Request Machinery Quote",
    primaryCtaHref: "/rfq?division=heavy-machinery",
    secondaryCtaText: "Explore Heavy Machinery",
    secondaryCtaHref: "/solutions#heavy-machinery",
  },
];

const AUTOPLAY_INTERVAL = 8000; // 8 seconds per slide

export function SolutionsHero() {
  const [current, setCurrent] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [touchStart, setTouchStart] = React.useState<number | null>(null);

  const slide = SOLUTION_SLIDES[current];

  // Auto-play timer
  React.useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SOLUTION_SLIDES.length);
    }, AUTOPLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, current]);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % SOLUTION_SLIDES.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + SOLUTION_SLIDES.length) % SOLUTION_SLIDES.length);

  // Swipe support for touch screens
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (diff > 50) nextSlide();
    if (diff < -50) prevSlide();
    setTouchStart(null);
  };

  const badgeStyles = {
    fleet: "bg-[#1E6B3E]/25 text-[#7EE5A7] border-[#1E6B3E]/60",
    gold: "bg-[#C9A227]/25 text-[#F6D878] border-[#C9A227]/60",
    industrial: "bg-[#5B2E7E]/30 text-[#D8B4F8] border-[#5B2E7E]/60",
  }[slide.badgeTone];

  return (
    <section
      aria-label="Core Business Solutions Showcase"
      className="relative isolate flex min-h-[calc(100svh-76px)] flex-col justify-between overflow-hidden bg-[#002545] text-white"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Images with smooth Crossfade */}
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
            {/* Deep Navy 55-75% brand overlay for pristine WCAG AAA contrast */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#002545] via-[#002545]/85 to-[#002545]/40" />
            <div className="absolute inset-0 bg-radial from-transparent via-[#002545]/40 to-[#002545]/90" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#002545] to-transparent" />
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="container-x relative z-20 flex flex-1 flex-col justify-center py-16 sm:py-20 lg:py-24">
        <div className="max-w-4xl">
          {/* Eyebrow & Division Indicator */}
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${badgeStyles}`}>
              {slide.no} · {slide.divisionLabel}
            </span>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#C4CCD4]">
              Nairobi · Direct Factory Access · East Africa
            </span>
          </div>

          {/* Dynamic Headline with Animated Keyed Transition */}
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              <h1 className="h-display mt-5 max-w-4xl text-white font-bold leading-[1.15] tracking-tight">
                {slide.headline}
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#C4CCD4] sm:text-lg lg:text-xl">
                {slide.description}
              </p>

              {/* Highlights Pills */}
              <div className="mt-6 flex flex-wrap gap-2 pt-1">
                {slide.highlights.map((h) => (
                  <span
                    key={h}
                    className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-xs"
                  >
                    <span className="size-1.5 rounded-full bg-[#C9A227]" />
                    {h}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg" variant="accent">
                  <Link href={slide.primaryCtaHref}>
                    {slide.primaryCtaText} <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline-light">
                  <Link href={slide.secondaryCtaHref}>{slide.secondaryCtaText}</Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="!text-white hover:!bg-white/10">
                  <Link href="/manufacturer-partnerships">Become a Manufacturer Partner</Link>
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Interactive Bottom Selector Bar */}
      <div className="relative z-20 border-t border-white/15 bg-[#001D36]/80 backdrop-blur-md">
        <div className="container-x flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
          {/* Solution Tabs */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3 flex-1 max-w-3xl">
            {SOLUTION_SLIDES.map((s, idx) => {
              const active = idx === current;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setCurrent(idx)}
                  className={`group relative flex flex-col rounded-lg p-2.5 text-left transition-all ${
                    active ? "bg-white/15 text-white" : "text-[#C4CCD4] hover:bg-white/8 hover:text-white"
                  }`}
                  aria-label={`Switch to solution ${s.no}: ${s.title}`}
                  aria-pressed={active}
                >
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                    <span className={active ? "text-[#C9A227]" : "text-[#C4CCD4] group-hover:text-white"}>
                      {s.no} · {s.divisionLabel}
                    </span>
                    {active && (
                      <span className="size-2 rounded-full bg-[#C9A227] animate-pulse" aria-hidden />
                    )}
                  </div>
                  <span className="mt-1 truncate text-xs font-semibold">{s.title}</span>

                  {/* Progress bar line for active slide */}
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/20">
                    {active && (
                      <motion.div
                        className="h-full bg-[#C9A227]"
                        initial={{ width: "0%" }}
                        animate={{ width: isPaused ? "100%" : "100%" }}
                        transition={{
                          duration: isPaused ? 0 : AUTOPLAY_INTERVAL / 1000,
                          ease: "linear",
                        }}
                        key={`${current}-${isPaused}`}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Controls: Prev, Next, Play/Pause */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              aria-label={isPaused ? "Play auto-advance" : "Pause auto-advance"}
              className="flex size-9 items-center justify-center rounded-md border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            >
              {isPaused ? <Play className="size-4" /> : <Pause className="size-4" />}
            </button>
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Previous solution"
              className="flex size-9 items-center justify-center rounded-md border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next solution"
              className="flex size-9 items-center justify-center rounded-md border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

