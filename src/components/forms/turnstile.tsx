"use client";
import * as React from "react";

declare global { interface Window { turnstile?: { render: (el: HTMLElement, o: Record<string, unknown>) => string; reset: (id?: string) => void } } }

/** Renders Cloudflare Turnstile when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set; otherwise renders nothing. */
export function Turnstile({ onToken }: { onToken: (t: string) => void }) {
  const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!key || !ref.current) return;
    const render = () => ref.current && window.turnstile?.render(ref.current, { sitekey: key, callback: onToken, "expired-callback": () => onToken("") });
    if (window.turnstile) { render(); return; }
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true; s.onload = render;
    document.head.appendChild(s);
  }, [key, onToken]);
  return key ? <div ref={ref} className="min-h-[65px]" /> : null;
}

/** Milliseconds since the form mounted — a cheap bot signal checked server-side. */
export function useElapsed() {
  const start = React.useRef(0);
  React.useEffect(() => { start.current = Date.now(); }, []);
  return () => Date.now() - start.current;
}

