export type Division = "electric-mobility" | "renewable-energy" | "heavy-machinery";
export type Role =
  | "super_admin" | "admin" | "sales_manager" | "procurement_officer" | "operations_officer" | "client" | "manufacturer";

export const STAFF_ROLES: Role[] = ["super_admin", "admin", "sales_manager", "procurement_officer", "operations_officer"];
export const COMMERCIAL_ROLES: Role[] = ["super_admin", "admin", "sales_manager", "procurement_officer"];
export const OPS_ROLES: Role[] = ["super_admin", "admin", "operations_officer"];

export interface Category {
  id: string;
  slug: string;
  name: string;
  division: Division;
  description?: string | null;
  sort_order: number;
}

export interface Spec {
  id?: string;
  spec_group: string;
  label: string;
  value: string | null;
  unit?: string | null;
  verification: "verified" | "awaiting_confirmation";
  is_key: boolean;
  sort_order: number;
}

export interface Media {
  id?: string;
  kind: "image" | "brochure" | "compliance" | "other";
  storage_path: string;
  title?: string | null;
  alt_text?: string | null;
  is_primary: boolean;
  sort_order: number;
}

export interface ConfigOption {
  name: string;
  description?: string;
  verified?: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  model: string | null;
  manufacturer_name: string | null;
  manufacturer_country?: string | null;
  category_slug: string;
  category_name: string;
  division: Division;
  short_description: string | null;
  overview: string | null;
  performance_info: string | null;
  configurations: ConfigOption[];
  accessories: ConfigOption[];
  spare_parts_info: string | null;
  is_featured: boolean;
  is_sample: boolean;
  status: "draft" | "published" | "archived";
  specs: Spec[];
  media: Media[];
}

export const DIVISION_LABEL: Record<Division, string> = {
  "electric-mobility": "Electric Mobility",
  "renewable-energy": "Renewable Energy",
  "heavy-machinery": "Heavy Machinery",
};

export const RFQ_STATUS_LABEL: Record<string, string> = {
  received: "Received",
  technical_review: "Technical review",
  manufacturer_engagement: "Manufacturer engagement",
  quotation_issued: "Quotation issued",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
  cancelled: "Cancelled",
};

export const ORDER_STAGES = [
  ["inquiry_received", "Inquiry Received"],
  ["technical_review", "Technical Review"],
  ["manufacturer_engagement", "Manufacturer Engagement"],
  ["quotation_issued", "Quotation Issued"],
  ["commercial_negotiation", "Commercial Negotiation"],
  ["contract_signed", "Contract Signed"],
  ["production_order_processing", "Production / Order Processing"],
  ["factory_dispatch", "Factory Dispatch"],
  ["international_transit", "International Transit"],
  ["port_clearance", "Port Clearance"],
  ["site_delivery", "Site Delivery"],
  ["completed", "Completed"],
] as const;

export const DOC_TYPE_LABEL: Record<string, string> = {
  quotation: "Quotation",
  commercial_invoice: "Commercial invoice",
  sales_contract: "Sales contract",
  performance_guarantee: "Performance guarantee",
  technical_specification: "Technical specification",
  compliance_certificate: "Compliance certificate",
  shipping_document: "Shipping document",
  other: "Other",
};

