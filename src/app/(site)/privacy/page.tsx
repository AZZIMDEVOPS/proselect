import type { Metadata } from "next";
import { PageHero } from "@/components/site/sections";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy", description: "How ProSelect collects, uses and protects personal and business information.", alternates: { canonical: "/privacy" } };

export default function Privacy() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy Policy" />
      <section className="section-y"><div className="container-x max-w-3xl space-y-6 text-[15px] leading-relaxed text-steel-600 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc">
        <p className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><strong>Template notice:</strong> this policy is a working draft prepared for review by ProSelect&apos;s legal adviser. It must be reviewed against the Kenya Data Protection Act, 2019 before launch.</p>
        <h2>Who we are</h2><p>{SITE.name}, Nairobi, Kenya (&ldquo;Proselect&rdquo;), is the data controller for information collected through this website. Contact: <a className="text-[#00447B] font-semibold underline hover:text-[#1A6DB3]" href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>
        <h2>Information we collect</h2>
        <ul><li>Enquiry and RFQ details you submit (company, contact, project and technical information).</li><li>Account information for the client portal.</li><li>Manufacturer application details and documents.</li><li>Basic technical data needed to operate and secure the website, and for anti-spam rate limiting.</li></ul>
        <h2>How we use it</h2><p>To respond to enquiries, prepare quotations, coordinate procurement and delivery, operate the portal, meet legal obligations and protect the platform. We do not sell personal data.</p>
        <h2>Sharing</h2><p>We share information with manufacturers only as necessary to obtain quotations for your request, and with service providers (hosting, email) under appropriate safeguards.</p>
        <h2>Security &amp; retention</h2><p>Access is restricted by role, data is encrypted in transit, and documents are held in private storage. We retain information only as long as needed for the purposes above or as required by law.</p>
        <h2>Your rights</h2><p>You may request access, correction or deletion of your personal data by emailing us.</p>
      </div></section>
    </>
  );
}

