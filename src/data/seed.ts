// SAMPLE / DEMONSTRATION DATA ONLY.
// Nothing here describes a real manufacturer, real product, price, certification or transaction.
// Every product is flagged is_sample=true and every specification is "awaiting manufacturer confirmation".
// Used (a) as the catalogue fallback when Supabase is not configured and (b) by `npm run db:seed`.
// NOTE: keep this file free of non-erasable TypeScript (enums, parameter properties) so Node can run it directly.
import type { Category, Product, Spec } from "../lib/types.ts";

export const SAMPLE_MANUFACTURER = { name: "Sample Manufacturer (demo data)", country: null as string | null };

type CatSeed = [slug: string, name: string, division: Category["division"], description: string];
const C: CatSeed[] = [
  ["2-seater-golf-buggies", "2-Seater Golf Buggies", "electric-mobility", "Compact electric golf cars for individual and two-person use."],
  ["4-seater-golf-buggies", "4-Seater Golf Buggies", "electric-mobility", "Four-passenger electric golf cars for courses, resorts and estates."],
  ["6-seater-golf-buggies", "6-Seater Golf Buggies", "electric-mobility", "Higher-capacity electric buggies for group and guest transport."],
  ["multi-seater-passenger-shuttles", "Multi-Seater Passenger Shuttles", "electric-mobility", "Electric shuttles for campuses, resorts, airports and facilities."],
  ["resort-transport-vehicles", "Resort Transport Vehicles", "electric-mobility", "Guest and hospitality transport vehicles."],
  ["utility-electric-buggies", "Utility Electric Buggies", "electric-mobility", "Electric utility vehicles with cargo capability."],
  ["specialized-commercial-electric-vehicles", "Specialized Commercial Electric Vehicles", "electric-mobility", "Purpose-built electric vehicles for commercial applications."],
  ["solar-panels", "Solar Panels", "renewable-energy", "Photovoltaic modules for residential, commercial and utility projects."],
  ["hybrid-inverters", "Hybrid Inverters", "renewable-energy", "Grid-interactive hybrid inverters with battery support."],
  ["lithium-battery-storage", "Lithium Battery Storage", "renewable-energy", "LiFePO4 battery storage systems."],
  ["commercial-solar-systems", "Commercial Solar Systems", "renewable-energy", "Engineered commercial and industrial solar PV systems."],
  ["industrial-energy-storage", "Industrial Energy Storage", "renewable-energy", "Large-scale battery energy storage for industrial sites."],
  ["ev-charging-infrastructure", "EV Charging Infrastructure", "renewable-energy", "AC and DC charging equipment for fleets and facilities."],
  ["excavators", "Excavators", "heavy-machinery", "Crawler and wheeled excavators for construction and earthworks."],
  ["loaders", "Loaders", "heavy-machinery", "Wheel loaders and compact loaders."],
  ["forklifts", "Forklifts", "heavy-machinery", "Electric and internal-combustion forklifts."],
  ["earthmoving-equipment", "Earthmoving Equipment", "heavy-machinery", "Dozers, graders, compactors and related equipment."],
  ["construction-machinery", "Construction Machinery", "heavy-machinery", "General construction plant and machinery."],
  ["material-handling-equipment", "Material Handling Equipment", "heavy-machinery", "Pallet trucks, stackers, cranes and handling systems."],
  ["specialized-industrial-machinery", "Specialized Industrial Machinery", "heavy-machinery", "Specialised machinery configured to project requirements."],
];

export const SEED_CATEGORIES: Category[] = C.map(([slug, name, division, description], i) => ({
  id: `cat-${slug}`, slug, name, division, description, sort_order: i,
}));

const specTemplates: Record<Category["division"], [group: string, label: string, key: boolean][]> = {
  "electric-mobility": [
    ["Capacity", "Seating capacity", true], ["Powertrain", "Battery chemistry", true], ["Powertrain", "Battery capacity", true],
    ["Powertrain", "Motor power", false], ["Performance", "Top speed", false], ["Performance", "Range per charge", true],
    ["Dimensions", "Overall dimensions", false], ["Chassis", "Gradeability", false],
  ],
  "renewable-energy": [
    ["Electrical", "Rated power", true], ["Electrical", "Nominal voltage", true], ["Electrical", "Efficiency", false],
    ["Storage", "Usable capacity", true], ["Protection", "Ingress protection", false], ["Warranty", "Warranty terms", false],
    ["Compliance", "Applicable standards", false],
  ],
  "heavy-machinery": [
    ["Capacity", "Operating weight / rated capacity", true], ["Engine", "Power rating", true], ["Engine", "Power source", true],
    ["Dimensions", "Overall dimensions", false], ["Performance", "Key performance rating", true],
    ["Compliance", "Emission / safety standard", false],
  ],
};

function specs(division: Category["division"], overrides: Record<string, string> = {}): Spec[] {
  return specTemplates[division].map(([spec_group, label, is_key], i) => ({
    spec_group, label, is_key, sort_order: i,
    value: overrides[label] ?? null,
    verification: "awaiting_confirmation" as const,
  }));
}

type P = [slug: string, name: string, cat: string, feat: boolean, short: string, overrides?: Record<string, string>];
const P: P[] = [
  ["sample-2-seater-electric-golf-buggy", "Sample Listing — 2-Seater Electric Golf Buggy", "2-seater-golf-buggies", true,
    "Demonstration listing showing how a 2-seater electric golf buggy is presented once manufacturer data is confirmed.", { "Seating capacity": "2" }],
  ["sample-4-seater-electric-golf-buggy", "Sample Listing — 4-Seater Electric Golf Buggy", "4-seater-golf-buggies", true,
    "Demonstration listing for a 4-seater electric golf buggy. Specifications await manufacturer confirmation.", { "Seating capacity": "4" }],
  ["sample-6-seater-electric-buggy", "Sample Listing — 6-Seater Electric Buggy", "6-seater-golf-buggies", false,
    "Demonstration listing for a 6-seater electric buggy for group transport.", { "Seating capacity": "6" }],
  ["sample-passenger-shuttle", "Sample Listing — Multi-Seater Passenger Shuttle", "multi-seater-passenger-shuttles", true,
    "Demonstration listing for an electric passenger shuttle for resorts and campuses."],
  ["sample-hybrid-inverter", "Sample Listing — Hybrid Solar Inverter", "hybrid-inverters", true,
    "Demonstration listing for a hybrid inverter with battery support."],
  ["sample-lifepo4-storage", "Sample Listing — LiFePO4 Battery Storage", "lithium-battery-storage", false,
    "Demonstration listing for a LiFePO4 battery storage system.", { "Applicable standards": "To be confirmed" }],
  ["sample-ev-charger", "Sample Listing — EV Charging Station", "ev-charging-infrastructure", false,
    "Demonstration listing for fleet and facility EV charging equipment."],
  ["sample-crawler-excavator", "Sample Listing — Crawler Excavator", "excavators", true,
    "Demonstration listing for a crawler excavator."],
  ["sample-electric-forklift", "Sample Listing — Electric Forklift", "forklifts", false,
    "Demonstration listing for an electric forklift for warehouse and industrial handling."],
];

export const SEED_PRODUCTS: Product[] = P.map(([slug, name, cat, feat, short, ov], i) => {
  const category = SEED_CATEGORIES.find((c) => c.slug === cat)!;
  return {
    id: `prod-${i + 1}`, slug, name, model: "Model to be confirmed",
    manufacturer_name: SAMPLE_MANUFACTURER.name, manufacturer_country: null,
    category_slug: category.slug, category_name: category.name, division: category.division,
    short_description: short,
    overview: "This is a SAMPLE listing created for demonstration and testing. It does not represent a real product, manufacturer, price, certification or availability. Replace it from the admin dashboard with verified, manufacturer-confirmed information.",
    performance_info: "Performance data awaiting manufacturer confirmation.",
    configurations: [{ name: "Configurations", description: "Available configurations will be listed once confirmed by the manufacturer.", verified: false }],
    accessories: [{ name: "Optional accessories", description: "Awaiting manufacturer confirmation.", verified: false }],
    spare_parts_info: "Spare parts and maintenance options are confirmed per project during the quotation process.",
    is_featured: feat, is_sample: true, status: "published",
    specs: specs(category.division, ov), media: [],
  };
});

export const SEED_SETTINGS: { key: string; value: unknown; is_public: boolean }[] = [
  { key: "company.registration_number", value: "", is_public: true },
  { key: "company.kra_pin", value: "", is_public: true },
  { key: "company.vat_number", value: "", is_public: true },
  { key: "contact.named_contact", value: "Commercial & Procurement Desk", is_public: true },
  { key: "contact.physical_address", value: "Nairobi, Kenya", is_public: true },
  { key: "contact.phone", value: "", is_public: true },
  { key: "contact.email", value: "info@proselectimports.com", is_public: true },
  { key: "contact.location", value: "Nairobi, Kenya", is_public: true },
  { key: "contact.map_embed_url", value: "", is_public: true },
  { key: "whatsapp.enabled", value: false, is_public: true },
  { key: "whatsapp.number", value: "", is_public: true },
  { key: "whatsapp.message", value: "Hello Proselect, I would like to discuss an equipment inquiry.", is_public: true },
  { key: "social.linkedin", value: "", is_public: true },
];

