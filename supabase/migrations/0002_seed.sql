-- =====================================================================
-- Proselect Fleet & Industrial Solutions Limited — Seed Data (0002)
-- All sample listings are explicitly flagged is_sample = true and
-- verification = 'awaiting_confirmation'. No fictional brands, prices,
-- certifications or transactions are presented as real.
-- =====================================================================

-- 1. Product Categories (20 categories across 3 divisions)
insert into product_categories (slug, name, division, description, sort_order) values
  ('2-seater-golf-buggies', '2-Seater Golf Buggies', 'electric-mobility', 'Compact electric golf cars for individual and two-person use.', 0),
  ('4-seater-golf-buggies', '4-Seater Golf Buggies', 'electric-mobility', 'Four-passenger electric golf cars for courses, resorts and estates.', 1),
  ('6-seater-golf-buggies', '6-Seater Golf Buggies', 'electric-mobility', 'Higher-capacity electric buggies for group and guest transport.', 2),
  ('multi-seater-passenger-shuttles', 'Multi-Seater Passenger Shuttles', 'electric-mobility', 'Electric shuttles for campuses, resorts, airports and facilities.', 3),
  ('resort-transport-vehicles', 'Resort Transport Vehicles', 'electric-mobility', 'Guest and hospitality transport vehicles.', 4),
  ('utility-electric-buggies', 'Utility Electric Buggies', 'electric-mobility', 'Electric utility vehicles with cargo capability.', 5),
  ('specialized-commercial-electric-vehicles', 'Specialized Commercial Electric Vehicles', 'electric-mobility', 'Purpose-built electric vehicles for commercial applications.', 6),
  ('solar-panels', 'Solar Panels', 'renewable-energy', 'Photovoltaic modules for residential, commercial and utility projects.', 7),
  ('hybrid-inverters', 'Hybrid Inverters', 'renewable-energy', 'Grid-interactive hybrid inverters with battery support.', 8),
  ('lithium-battery-storage', 'Lithium Battery Storage', 'renewable-energy', 'LiFePO4 battery storage systems.', 9),
  ('commercial-solar-systems', 'Commercial Solar Systems', 'renewable-energy', 'Engineered commercial and industrial solar PV systems.', 10),
  ('industrial-energy-storage', 'Industrial Energy Storage', 'renewable-energy', 'Large-scale battery energy storage for industrial sites.', 11),
  ('ev-charging-infrastructure', 'EV Charging Infrastructure', 'renewable-energy', 'AC and DC charging equipment for fleets and facilities.', 12),
  ('excavators', 'Excavators', 'heavy-machinery', 'Crawler and wheeled excavators for construction and earthworks.', 13),
  ('loaders', 'Loaders', 'heavy-machinery', 'Wheel loaders and compact loaders.', 14),
  ('forklifts', 'Forklifts', 'heavy-machinery', 'Electric and internal-combustion forklifts.', 15),
  ('earthmoving-equipment', 'Earthmoving Equipment', 'heavy-machinery', 'Dozers, graders, compactors and related equipment.', 16),
  ('construction-machinery', 'Construction Machinery', 'heavy-machinery', 'General construction plant and machinery.', 17),
  ('material-handling-equipment', 'Material Handling Equipment', 'heavy-machinery', 'Pallet trucks, stackers, cranes and handling systems.', 18),
  ('specialized-industrial-machinery', 'Specialized Industrial Machinery', 'heavy-machinery', 'Specialised machinery configured to project requirements.', 19)
on conflict (slug) do nothing;

-- 2. Default CMS Site Settings
insert into site_settings (key, value, is_public) values
  ('company.registration_number', '""'::jsonb, true),
  ('company.kra_pin', '""'::jsonb, true),
  ('company.vat_number', '""'::jsonb, true),
  ('contact.named_contact', '"Commercial & Procurement Desk"'::jsonb, true),
  ('contact.physical_address', '"Nairobi, Kenya"'::jsonb, true),
  ('contact.phone', '""'::jsonb, true),
  ('contact.email', '"info@proselectimports.com"'::jsonb, true),
  ('contact.location', '"Nairobi, Kenya"'::jsonb, true),
  ('contact.map_embed_url', '""'::jsonb, true),
  ('whatsapp.enabled', 'false'::jsonb, true),
  ('whatsapp.number', '""'::jsonb, true),
  ('whatsapp.message', '"Hello Proselect, I would like to discuss an equipment inquiry."'::jsonb, true),
  ('social.linkedin', '""'::jsonb, true)
on conflict (key) do nothing;

-- 3. Sample Manufacturer & Demonstration Listings (explicitly marked is_sample = true)
do $$
declare
  v_mfr uuid;
  v_prod uuid;
begin
  select id into v_mfr from manufacturers where is_sample = true limit 1;
  if v_mfr is null then
    insert into manufacturers (name, representation, is_sample, specializations)
      values ('Sample Manufacturer (demo data)', 'prospect', true, array['Electric Mobility','Renewable Energy','Heavy Machinery'])
      returning id into v_mfr;
  end if;

  -- Sample 4-Seater Buggy
  insert into products (slug, name, model, manufacturer_id, category_id, short_description, overview, performance_info, spare_parts_info, is_featured, is_sample, status)
  select
    'sample-4-seater-electric-golf-buggy',
    'Sample Listing — 4-Seater Electric Golf Buggy',
    'Model to be confirmed',
    v_mfr,
    c.id,
    'Demonstration listing for a 4-seater electric golf buggy. Specifications await manufacturer confirmation.',
    'SAMPLE / DEMONSTRATION LISTING ONLY. Replace from the Admin Command Centre with verified manufacturer-confirmed data.',
    'Performance data awaiting manufacturer confirmation.',
    'Spare parts and maintenance options are confirmed per project during the quotation process.',
    true, true, 'published'
  from product_categories c where c.slug = '4-seater-golf-buggies'
  on conflict (slug) do nothing
  returning id into v_prod;

  if v_prod is not null then
    insert into product_specifications (product_id, spec_group, label, value, verification, is_key, sort_order) values
      (v_prod, 'Capacity', 'Seating capacity', '4', 'awaiting_confirmation', true, 0),
      (v_prod, 'Powertrain', 'Battery chemistry', null, 'awaiting_confirmation', true, 1),
      (v_prod, 'Performance', 'Range per charge', null, 'awaiting_confirmation', true, 2);
  end if;

  -- Sample Hybrid Solar Inverter
  insert into products (slug, name, model, manufacturer_id, category_id, short_description, overview, performance_info, spare_parts_info, is_featured, is_sample, status)
  select
    'sample-hybrid-inverter',
    'Sample Listing — Hybrid Solar Inverter',
    'Model to be confirmed',
    v_mfr,
    c.id,
    'Demonstration listing for a commercial hybrid solar inverter with battery storage support.',
    'SAMPLE / DEMONSTRATION LISTING ONLY. Replace from the Admin Command Centre with verified manufacturer-confirmed data.',
    'Performance data awaiting manufacturer confirmation.',
    'Spare parts and warranty support options are confirmed per project during quotation.',
    true, true, 'published'
  from product_categories c where c.slug = 'hybrid-inverters'
  on conflict (slug) do nothing
  returning id into v_prod;

  if v_prod is not null then
    insert into product_specifications (product_id, spec_group, label, value, verification, is_key, sort_order) values
      (v_prod, 'Electrical', 'Rated power', null, 'awaiting_confirmation', true, 0),
      (v_prod, 'Electrical', 'Nominal voltage', null, 'awaiting_confirmation', true, 1);
  end if;

  -- Sample Crawler Excavator
  insert into products (slug, name, model, manufacturer_id, category_id, short_description, overview, performance_info, spare_parts_info, is_featured, is_sample, status)
  select
    'sample-crawler-excavator',
    'Sample Listing — Crawler Excavator',
    'Model to be confirmed',
    v_mfr,
    c.id,
    'Demonstration listing for a hydraulic crawler excavator. Specifications await manufacturer confirmation.',
    'SAMPLE / DEMONSTRATION LISTING ONLY. Replace from the Admin Command Centre with verified manufacturer-confirmed data.',
    'Performance data awaiting manufacturer confirmation.',
    'Spare parts and maintenance kits are confirmed per project during quotation.',
    true, true, 'published'
  from product_categories c where c.slug = 'excavators'
  on conflict (slug) do nothing
  returning id into v_prod;

  if v_prod is not null then
    insert into product_specifications (product_id, spec_group, label, value, verification, is_key, sort_order) values
      (v_prod, 'Capacity', 'Operating weight / rated capacity', null, 'awaiting_confirmation', true, 0),
      (v_prod, 'Engine', 'Power rating', null, 'awaiting_confirmation', true, 1);
  end if;
end $$;

