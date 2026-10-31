import { MessageCircle } from "lucide-react";

export function WhatsAppFloat({ settings }: { settings: Record<string, unknown> }) {
  const enabled = settings["whatsapp.enabled"] === true;
  const number = String(settings["whatsapp.number"] ?? "").replace(/\D/g, "");
  if (!enabled || number.length < 8) return null;
  const text = encodeURIComponent(String(settings["whatsapp.message"] ?? ""));
  return (
    <a
      href={`https://wa.me/${number}?text=${text}`} target="_blank" rel="noopener noreferrer"
      aria-label="Chat with ProSelect on WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-[#1f9d55] text-white shadow-lift transition hover:scale-105 hover:bg-[#178a49]"
    >
      <MessageCircle className="size-7" aria-hidden />
    </a>
  );
}

