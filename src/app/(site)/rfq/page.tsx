import type { Metadata } from "next";
import { RfqWizard } from "@/components/forms/rfq-wizard";
import { PageHero } from "@/components/site/sections";
import { getAllProducts } from "@/lib/data/catalogue";
import { getSession } from "@/lib/auth";
import { RFQ_DISCLAIMER } from "@/lib/site";

export const metadata: Metadata = {
  title: "Request a Quote — Industrial Equipment Sourcing Kenya",
  description: "Submit a request for quotation for electric vehicles, solar & energy systems or heavy machinery sourced directly from international manufacturers.",
  alternates: { canonical: "/rfq" },
};

export default async function RfqPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const [{ product }, products, session] = await Promise.all([searchParams, getAllProducts(), getSession()]);
  return (
    <>
      <PageHero eyebrow="Request for quotation" title="Tell us what you need to source.">
        A structured five-step request so our procurement team can match your requirement to the right manufacturer.
      </PageHero>
      <section className="section-y bg-steel-50">
        <div className="container-x max-w-4xl">
          <RfqWizard
            products={products.map((p) => ({ slug: p.slug, name: p.name, model: p.model, division: p.division, category: p.category_name }))}
            initialSlug={product}
            defaults={session ? { company: session.company ?? "", contact: session.full_name ?? "", email: session.email } : undefined}
          />
          <p className="mt-8 text-center text-xs text-steel-500">{RFQ_DISCLAIMER}</p>
        </div>
      </section>
    </>
  );
}

