import type { Metadata } from "next";
import { PageHero } from "@/components/site/sections";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Terms & Conditions", description: "Terms governing use of the ProSelect website, RFQs and client portal.", alternates: { canonical: "/terms" } };

export default function Terms() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Terms & Conditions" />
      <section className="section-y"><div className="container-x max-w-3xl space-y-6 text-[15px] leading-relaxed text-steel-600 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold">
        <p className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><strong>Template notice:</strong> these terms are a working draft for review by ProSelect&apos;s legal adviser before launch.</p>
        <h2>Enquiries are not orders</h2><p>A request for quotation is an enquiry only. It is not a confirmed purchase and does not create a binding order or contract. A binding commercial agreement exists only when expressly authorised and signed by ProSelect.</p>
        <h2>Product information</h2><p>Specifications, images and documents are provided by manufacturers. Information marked &ldquo;awaiting manufacturer confirmation&rdquo; is indicative only. Prices and availability are provided exclusively through formal quotations.</p>
        <h2>Quotations</h2><p>Quotations are valid for the period stated. Acceptance through the portal is recorded but initiates contractual workflows only when authorised by ProSelect.</p>
        <h2>Accounts</h2><p>You are responsible for keeping credentials confidential and for activity under your account.</p>
        <h2>Contact</h2><p>{SITE.name}, Nairobi, Kenya · {SITE.email}</p>
      </div></section>
    </>
  );
}

