import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-[#E8EDF2] text-[#2A2F36] ring-[#C4CCD4]",
  navy: "bg-[#E8EDF2] text-[#00447B] ring-[#B3C7DC]",
  gold: "bg-[#FEF9E7] text-[#8C6D14] ring-[#E8D48E]",
  fleet: "bg-[#EBF7EF] text-[#1E6B3E] ring-[#B4E0C4]",
  industrial: "bg-[#F5EDFA] text-[#5B2E7E] ring-[#DAC0EB]",
  green: "bg-[#E9F7EF] text-[#16794C] ring-[#B8E6CB]",
  amber: "bg-[#FEF3C7] text-[#B45309] ring-[#FCD34D]",
  red: "bg-[#FEE2E2] text-[#B91C1C] ring-[#FCA5A5]",
  crimson: "bg-[#E8EDF2] text-[#00447B] ring-[#B3C7DC]",
};
export type Tone = keyof typeof tones;

export function Badge({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset", tones[tone], className)}>
      {children}
    </span>
  );
}

export const statusTone = (s: string): Tone =>
  (({
    received: "navy", new: "navy", submitted: "navy", draft: "neutral", technical_review: "amber", under_review: "amber",
    manufacturer_engagement: "amber", quotation_issued: "navy", sent: "navy", negotiation: "amber",
    won: "green", accepted: "green", approved: "green", converted: "green", completed: "green",
    lost: "red", cancelled: "red", declined: "red", rejected: "red", expired: "red",
    revision_requested: "amber", more_info_requested: "amber", contacted: "amber", qualified: "green", closed: "neutral",
  }) as Record<string, Tone>)[s] ?? "neutral";
