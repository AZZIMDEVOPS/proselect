import { z } from "zod";

const text = (min: number, max: number, msg?: string) =>
  z.string().trim().min(min, msg ?? `Please enter at least ${min} characters`).max(max, `Maximum ${max} characters`);
const optional = (max: number) => z.string().trim().max(max, `Maximum ${max} characters`).optional().or(z.literal(""));
const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(200);
const phone = z.string().trim().min(7, "Enter a valid phone number").max(30).regex(/^[+\d][\d\s().-]{5,}$/, "Enter a valid phone number");

const antiSpam = {
  hp: z.string().optional(),            // honeypot
  elapsedMs: z.number().optional(),     // time-to-complete trap
  turnstile: z.string().optional(),
};

export const INQUIRY_CATEGORIES = [
  "General business inquiry", "Equipment sourcing / RFQ", "Electric mobility", "Renewable energy & power",
  "Heavy machinery & industrial", "Manufacturer partnership", "After-sales & spare parts", "Media & other",
] as const;

export const contactSchema = z.object({
  name: text(2, 120), company: optional(160), email, phone: optional(30),
  category: z.enum(INQUIRY_CATEGORIES, { message: "Select an inquiry category" }),
  message: text(10, 4000),
  ...antiSpam,
});
export type ContactInput = z.infer<typeof contactSchema>;

export const rfqItemSchema = z.object({
  productSlug: optional(120),
  custom: z.boolean(),
  description: optional(1500),
  category: optional(40),
  model: optional(160),
  quantity: z.number({ message: "Enter a quantity" }).int("Whole units only").min(1, "Minimum 1").max(99999),
  preferredManufacturer: optional(160),
  specifications: optional(3000),
  power: optional(500),
  accessories: optional(1500),
  spareParts: optional(1500),
  maintenance: optional(1500),
  customConfiguration: optional(1500),
}).superRefine((v, ctx) => {
  if (!v.productSlug && !v.custom) ctx.addIssue({ code: "custom", path: ["productSlug"], message: "Select equipment or choose a custom inquiry" });
  if (v.custom && (!v.description || v.description.length < 10))
    ctx.addIssue({ code: "custom", path: ["description"], message: "Describe the equipment you need (min 10 characters)" });
});

export const rfqSchema = z.object({
  items: z.array(rfqItemSchema).min(1, "Add at least one item").max(20),
  company: text(2, 160, "Enter your company name"),
  contact: text(2, 120, "Enter a contact person"),
  email, phone,
  location: text(2, 200, "Enter the project location"),
  countyCountry: text(2, 120, "Enter the county / country"),
  application: text(3, 1000, "Describe the intended application"),
  timeline: z.enum(["Immediate (under 1 month)", "1–3 months", "3–6 months", "6–12 months", "Planning / budgeting stage"], { message: "Select an expected timeline" }),
  additional: optional(4000),
  destination: text(2, 300, "Enter the delivery destination"),
  arrangement: z.enum(["Delivered to site", "Delivered to port of entry (Mombasa)", "Ex-works / factory pickup arranged by client", "To be advised by ProSelect"], { message: "Select a delivery arrangement" }),
  siteAccess: optional(1500),
  logisticsSupport: z.array(z.string().max(80)).max(10),
  consent: z.literal(true, { message: "Please confirm you understand this is an enquiry only" }),
  ...antiSpam,
});
export type RfqInput = z.infer<typeof rfqSchema>;
export type RfqFormInput = z.input<typeof rfqSchema>;

export const LOGISTICS_OPTIONS = [
  "International freight & shipping", "Port clearance & customs documentation", "Import duty & tax guidance",
  "Inland transport to site", "Offloading & site handling", "Commissioning & training",
] as const;

export const manufacturerSchema = z.object({
  company: text(2, 200), country: text(2, 100), website: optional(200),
  contact: text(2, 120), email, phone: optional(30),
  categories: z.array(z.string()).min(1, "Select at least one product category").max(30),
  products: text(10, 4000, "Briefly describe your products"),
  certifications: optional(2000),
  arrangement: z.enum(["Exclusive representation (Kenya)", "Exclusive representation (East Africa)", "Non-exclusive representation", "Distribution / dealer partnership", "Open to discussion"], { message: "Select a representation arrangement" }),
  message: optional(4000),
  ...antiSpam,
});
export type ManufacturerInput = z.infer<typeof manufacturerSchema>;

export const registerSchema = z.object({
  fullName: text(2, 120), company: text(2, 160), email, phone,
  password: z.string().min(10, "Use at least 10 characters").max(128)
    .regex(/[a-z]/, "Include a lowercase letter").regex(/[A-Z]/, "Include an uppercase letter").regex(/\d/, "Include a number"),
  ...antiSpam,
});
export const loginSchema = z.object({ email, password: z.string().min(1, "Enter your password").max(128) });
