export const SITE = {
  name: "Proselect Fleet & Industrial Solutions Limited",
  short: "Proselect",
  tagline: "Global Manufacturing. Local Expertise. Smarter Procurement.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.proselectimports.com",
  email: "info@proselectimports.com",
  operationalEmail: "kennahkent50@gmail.com",
  domain: "www.proselectimports.com",
  location: "Nairobi, Kenya",
  description:
    "Proselect Fleet & Industrial Solutions Limited sources, documents and delivers fleet vehicles, renewable power systems and heavy-duty industrial equipment for Kenyan and East African operators, and represents international manufacturers across East Africa.",
};

export const TRUST_PILLARS = [
  {
    name: "Reliability",
    summary: "Delivered when promised, with a documented chain of custody from factory production through handover.",
    proof: "Tracked 12-stage delivery milestones, pre-shipment inspection records and serial-referenced documentation.",
  },
  {
    name: "Transparency",
    summary: "Prices, lead-times and commercial terms stated plainly — no hidden fees or vague ETAs.",
    proof: "Itemised formal quotations, disclosed logistics terms and clear separation of confirmed versus pending data.",
  },
  {
    name: "Expertise",
    summary: "Deep knowledge of equipment specifications, East African operating conditions, customs compliance and routes.",
    proof: "Side-by-side specification comparisons, technical matching before commitment and named human contacts.",
  },
] as const;

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/solutions", label: "Solutions" },
  { href: "/equipment", label: "Equipment Catalogue" },
  { href: "/manufacturer-partnerships", label: "Manufacturer Partnerships" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/contact", label: "Contact" },
] as const;

export const SOLUTIONS = [
  {
    slug: "electric-mobility",
    division: "electric-mobility" as const,
    no: "01",
    badgeLabel: "Fleet Division",
    title: "Electric Mobility & Commercial Fleets",
    image: "/images/solution-mobility.jpg",
    summary:
      "Golf buggies, passenger shuttles, resort vehicles, utility buggies and specialized electric transport solutions.",
    applications: ["Golf & country clubs", "Resorts & hospitality", "Estates & campuses", "Commercial fleets"],
  },
  {
    slug: "renewable-energy",
    division: "renewable-energy" as const,
    no: "02",
    badgeLabel: "Power & Energy Systems",
    title: "Renewable Energy & Power Systems",
    image: "/images/solution-energy.jpg",
    summary: "Solar PV systems, hybrid inverters, LiFePO4 battery storage and EV charging infrastructure.",
    applications: ["Commercial & industrial solar", "Backup & hybrid power", "Fleet charging", "Off-grid sites"],
  },
  {
    slug: "heavy-machinery",
    division: "heavy-machinery" as const,
    no: "03",
    badgeLabel: "Industrial Division",
    title: "Heavy Machinery & Industrial Equipment",
    image: "/images/solution-machinery.jpg",
    summary:
      "Construction machinery, earthmoving equipment, material handling equipment and specialized industrial machinery.",
    applications: ["Construction & infrastructure", "Earthworks & quarrying", "Warehousing & logistics", "Industrial plants"],
  },
];

export const INDUSTRIES = [
  ["Golf & Country Clubs", "Fleets and charging for courses and clubhouses."],
  ["Hospitality & Resorts", "Guest transport and on-site renewable power."],
  ["Real Estate & Residential Developments", "Estate mobility, solar and site equipment."],
  ["Commercial Transport", "Electric commercial vehicles and fleet charging."],
  ["Renewable Energy", "Solar, storage and charging project supply."],
  ["Construction & Infrastructure", "Earthmoving and construction machinery."],
  ["Industrial Facilities", "Handling equipment and specialised machinery."],
  ["Institutional & Enterprise Projects", "Campus, hospital and corporate procurement."],
] as const;

export const RFQ_DISCLAIMER =
  "Submitting a request for quotation is an enquiry only. It is not a confirmed purchase and does not create a binding order or contract.";
