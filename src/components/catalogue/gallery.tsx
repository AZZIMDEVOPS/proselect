"use client";
import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function Gallery({ images }: { images: { src: string; alt: string; illustrative: boolean }[] }) {
  const [i, setI] = React.useState(0);
  const cur = images[i];
  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-steel-100 shadow-card">
        <Image src={cur.src} alt={cur.alt} fill priority sizes="(min-width:1024px) 55vw, 100vw" className="object-cover" />
        {cur.illustrative && <span className="absolute bottom-3 left-3 rounded bg-navy-900/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">Illustrative image — product photography pending</span>}
      </div>
      {images.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-2" aria-label="Image thumbnails">
          {images.map((im, n) => (
            <li key={im.src}>
              <button type="button" onClick={() => setI(n)} aria-label={`Show image ${n + 1}`} aria-current={n === i}
                className={cn("relative block aspect-[4/3] w-full overflow-hidden rounded-md border-2", n === i ? "border-[#00447B]" : "border-transparent opacity-70 hover:opacity-100")}>
                <Image src={im.src} alt="" fill sizes="120px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

