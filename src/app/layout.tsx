import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { SITE } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Proselect | Direct Factory Access & Industrial Equipment Sourcing in Kenya",
    template: "%s | Proselect Kenya",
  },
  description: SITE.description,
  applicationName: "Proselect",
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "en_KE",
    url: SITE.url,
    title: "Proselect — Global Manufacturing. Local Expertise. Smarter Procurement.",
    description: SITE.description,
    images: [
      {
        url: "/images/hero.jpg",
        width: 1920,
        height: 1080,
        alt: "Proselect — fleet and industrial equipment sourcing for East Africa",
      },
    ],
  },
  twitter: { card: "summary_large_image" },
  alternates: { canonical: "./" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#00447B", width: "device-width", initialScale: 1 };

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE.name,
  alternateName: "Proselect",
  url: SITE.url,
  email: SITE.email,
  logo: `${SITE.url}/brand/proselect_logo_blue.png`,
  address: { "@type": "PostalAddress", addressLocality: "Nairobi", addressCountry: "KE" },
  description: SITE.description,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        {children}
        <Toaster position="top-right" richColors closeButton toastOptions={{ classNames: { toast: "font-sans" } }} />
      </body>
    </html>
  );
}
