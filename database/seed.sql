-- ==============================================================================
-- PRINT PLATFORM - SEED DATA
-- Pre-populates the 6 standard print divisions, parameter-driven products,
-- volume tiers, materials, print zones, and live work gallery samples.
-- ==============================================================================

-- 1. Insert 6 Core Print Divisions
INSERT INTO public.product_divisions (id, name, slug, description, sort_order) VALUES
('11111111-1111-1111-1111-111111111111', 'Business Cards & Stationery', 'business-cards-stationery', 'Premium bespoke business cards, letterheads, and corporate presentation folders.', 1),
('22222222-2222-2222-2222-222222222222', 'Marketing & Flyers', 'marketing-flyers', 'Vibrant brochures, leaflets, folded menus, and promotional mailers with custom finishes.', 2),
('33333333-3333-3333-3333-333333333333', 'Posters & Signage', 'posters-signage', 'High-impact indoor/outdoor banners, architectural prints, rigid foam boards, and fine art posters.', 3),
('44444444-4444-4444-4444-444444444444', 'Packaging & Boxes', 'packaging-boxes', 'Custom printed corrugated mailers, folding carton product boxes, and sleeves.', 4),
('55555555-5555-5555-5555-555555555555', 'Stickers & Labels', 'stickers-labels', 'Die-cut vinyl decals, waterproof roll labels, metallic foil stickers, and safety tags.', 5),
('66666666-6666-6666-6666-666666666666', 'Apparel & Merchandise', 'apparel-merchandise', 'Screen printed & DTG apparel, branded tote bags, embroidered workwear, and hard goods.', 6)
ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order;

-- 2. Insert Parameter-Driven Products
-- Product 1: Deluxe Business Cards
INSERT INTO public.products (
    id, division_id, name, slug, base_rate, min_width_mm, max_width_mm, min_height_mm, max_height_mm, bleed_mm, dpi, materials_json, volume_tiers_json, print_zones_json, is_active
) VALUES (
    'a1111111-aaaa-1111-aaaa-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Deluxe Business Cards',
    'deluxe-business-cards',
    0.0450,
    85, 90, 50, 55, 3.00, 300,
    '[
        {"id": "mat-silk-350", "name": "350gsm Silk Coated", "multiplier": 1.0, "description": "Crisp white, smooth finish for rich contrast"},
        {"id": "mat-softtouch-450", "name": "450gsm Soft-Touch Matt Velvet", "multiplier": 1.45, "description": "Ultra-thick, luxurious velvety touch"},
        {"id": "mat-kraft-300", "name": "300gsm Recycled Kraft Board", "multiplier": 1.25, "description": "Eco-friendly, tactile organic brown fiber"}
    ]'::jsonb,
    '[
        {"min_qty": 50, "max_qty": 99, "discount_pct": 0},
        {"min_qty": 100, "max_qty": 249, "discount_pct": 10},
        {"min_qty": 250, "max_qty": 499, "discount_pct": 20},
        {"min_qty": 500, "max_qty": 999999, "discount_pct": 35}
    ]'::jsonb,
    '[
        {"id": "front", "name": "Front Artwork", "bounds": {"x": 3, "y": 3, "w": 85, "h": 55}, "max_chars": 60, "min_font_pt": 7},
        {"id": "back", "name": "Back Artwork", "bounds": {"x": 3, "y": 3, "w": 85, "h": 55}, "max_chars": 120, "min_font_pt": 6}
    ]'::jsonb,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    base_rate = EXCLUDED.base_rate,
    materials_json = EXCLUDED.materials_json,
    volume_tiers_json = EXCLUDED.volume_tiers_json,
    print_zones_json = EXCLUDED.print_zones_json;

-- Product 2: A5 & Custom Marketing Flyers
INSERT INTO public.products (
    id, division_id, name, slug, base_rate, min_width_mm, max_width_mm, min_height_mm, max_height_mm, bleed_mm, dpi, materials_json, volume_tiers_json, print_zones_json, is_active
) VALUES (
    'b2222222-bbbb-2222-bbbb-222222222222',
    '22222222-2222-2222-2222-222222222222',
    'Custom Marketing Flyers',
    'custom-marketing-flyers',
    0.0250,
    100, 210, 148, 297, 3.00, 300,
    '[
        {"id": "mat-gloss-170", "name": "170gsm Gloss Art Paper", "multiplier": 1.0, "description": "High-shine vibrant commercial standard"},
        {"id": "mat-silk-250", "name": "250gsm Premium Silk", "multiplier": 1.30, "description": "Heavyweight sturdy feel with glare-free texture"},
        {"id": "mat-uncoated-150", "name": "150gsm Laser Uncoated (Writable)", "multiplier": 1.15, "description": "Perfect for forms and stamped vouchers"}
    ]'::jsonb,
    '[
        {"min_qty": 100, "max_qty": 249, "discount_pct": 0},
        {"min_qty": 250, "max_qty": 499, "discount_pct": 15},
        {"min_qty": 500, "max_qty": 999, "discount_pct": 25},
        {"min_qty": 1000, "max_qty": 999999, "discount_pct": 40}
    ]'::jsonb,
    '[
        {"id": "content_zone", "name": "Primary Body", "bounds": {"x": 5, "y": 5, "w": 200, "h": 287}, "max_chars": 500, "min_font_pt": 9}
    ]'::jsonb,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    base_rate = EXCLUDED.base_rate,
    materials_json = EXCLUDED.materials_json,
    volume_tiers_json = EXCLUDED.volume_tiers_json;

-- Product 3: Large Format Signage Poster
INSERT INTO public.products (
    id, division_id, name, slug, base_rate, min_width_mm, max_width_mm, min_height_mm, max_height_mm, bleed_mm, dpi, materials_json, volume_tiers_json, print_zones_json, is_active
) VALUES (
    'c3333333-cccc-3333-cccc-333333333333',
    '33333333-3333-3333-3333-333333333333',
    'Architectural & Event Posters',
    'architectural-event-posters',
    0.0150,
    297, 1200, 420, 2400, 5.00, 300,
    '[
        {"id": "mat-satin-220", "name": "220gsm Satin Photo Paper", "multiplier": 1.0, "description": "Exhibition grade, deep blacks and vivid colors"},
        {"id": "mat-pvc-waterproof", "name": "440gsm Waterproof PVC Banner", "multiplier": 1.6, "description": "Outdoor weatherproof and tear-resistant"},
        {"id": "mat-foamboard-5mm", "name": "5mm Lightweight Rigid Foam-Core", "multiplier": 2.2, "description": "Direct UV print mounted on rigid board"}
    ]'::jsonb,
    '[
        {"min_qty": 1, "max_qty": 4, "discount_pct": 0},
        {"min_qty": 5, "max_qty": 19, "discount_pct": 12},
        {"min_qty": 20, "max_qty": 999999, "discount_pct": 28}
    ]'::jsonb,
    '[
        {"id": "main_art", "name": "Print Area", "bounds": {"x": 10, "y": 10, "w": 1180, "h": 2380}, "max_chars": 1000, "min_font_pt": 14}
    ]'::jsonb,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    base_rate = EXCLUDED.base_rate,
    materials_json = EXCLUDED.materials_json;

-- Product 4: Die-Cut Vinyl Stickers
INSERT INTO public.products (
    id, division_id, name, slug, base_rate, min_width_mm, max_width_mm, min_height_mm, max_height_mm, bleed_mm, dpi, materials_json, volume_tiers_json, print_zones_json, is_active
) VALUES (
    'd5555555-dddd-5555-dddd-555555555555',
    '55555555-5555-5555-5555-555555555555',
    'Precision Die-Cut Vinyl Stickers',
    'die-cut-vinyl-stickers',
    0.0350,
    30, 200, 30, 200, 2.00, 300,
    '[
        {"id": "mat-vinyl-gloss", "name": "White Gloss Waterproof Vinyl", "multiplier": 1.0, "description": "UV resistant, dishwasher safe laminate"},
        {"id": "mat-vinyl-holographic", "name": "Rainbow Holographic Vinyl", "multiplier": 1.5, "description": "Eye-catching iridescent sheen under light"},
        {"id": "mat-vinyl-clear", "name": "Ultra-Clear Transparent Adhesive", "multiplier": 1.35, "description": "Clean seamless see-through backdrop"}
    ]'::jsonb,
    '[
        {"min_qty": 50, "max_qty": 99, "discount_pct": 0},
        {"min_qty": 100, "max_qty": 249, "discount_pct": 15},
        {"min_qty": 250, "max_qty": 499, "discount_pct": 25},
        {"min_qty": 500, "max_qty": 999999, "discount_pct": 40}
    ]'::jsonb,
    '[
        {"id": "cut_line", "name": "Die Cut Boundary", "bounds": {"x": 2, "y": 2, "w": 196, "h": 196}, "max_chars": 30, "min_font_pt": 6}
    ]'::jsonb,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    base_rate = EXCLUDED.base_rate,
    materials_json = EXCLUDED.materials_json;

-- 2b. Insert Templates (10th Table Seed)
INSERT INTO public.templates (id, product_id, name, print_zones_json, default_elements_json, is_active) VALUES
(
    '01111111-1111-1111-1111-111111111111',
    'a1111111-aaaa-1111-aaaa-111111111111', -- Deluxe Business Cards
    'Modern Minimalist Executive Card',
    '[
        {"id": "name_zone", "name": "Executive Name", "bounds": {"x": 10, "y": 15, "w": 65, "h": 10}, "max_chars": 35, "min_font_pt": 8, "shrink_to_fit": true},
        {"id": "title_zone", "name": "Job Title", "bounds": {"x": 10, "y": 25, "w": 65, "h": 8}, "max_chars": 40, "min_font_pt": 6, "shrink_to_fit": true},
        {"id": "contact_zone", "name": "Contact Details", "bounds": {"x": 10, "y": 35, "w": 65, "h": 15}, "max_chars": 120, "min_font_pt": 5, "shrink_to_fit": true}
    ]'::jsonb,
    '[
        {"id": "el_name", "type": "text", "text": "Alexander Wright", "x": 10, "y": 18, "fontSize": 14, "vdpColumn": "Full_Name"},
        {"id": "el_title", "type": "text", "text": "Managing Director", "x": 10, "y": 27, "fontSize": 8, "vdpColumn": "Job_Title"},
        {"id": "el_contact", "type": "text", "text": "alex@wrightcorp.com | +44 20 7946 0912", "x": 10, "y": 38, "fontSize": 6, "vdpColumn": "Contact"}
    ]'::jsonb,
    true
),
(
    '02222222-2222-2222-2222-222222222222',
    'b2222222-bbbb-2222-bbbb-222222222222', -- Custom Marketing Flyers
    'Vibrant Event Promo Flyer',
    '[
        {"id": "headline_zone", "name": "Event Headline", "bounds": {"x": 15, "y": 20, "w": 180, "h": 30}, "max_chars": 60, "min_font_pt": 18, "shrink_to_fit": true},
        {"id": "body_zone", "name": "Promotional Copy", "bounds": {"x": 15, "y": 60, "w": 180, "h": 120}, "max_chars": 400, "min_font_pt": 9, "shrink_to_fit": true}
    ]'::jsonb,
    '[
        {"id": "el_headline", "type": "text", "text": "ANNUAL TECH SUMMIT 2026", "x": 15, "y": 30, "fontSize": 24, "vdpColumn": "Headline"},
        {"id": "el_body", "type": "text", "text": "Join industry pioneers for three days of cutting-edge innovation and networking.", "x": 15, "y": 70, "fontSize": 11, "vdpColumn": "Description"}
    ]'::jsonb,
    true
)
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Live Work Gallery Items
INSERT INTO public.gallery_items (id, division_id, title, image_url, specs_label) VALUES
(
    'f1111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'Architectural Studio Brand Identity',
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
    '450gsm Soft-Touch Velvet • Spot UV Gloss Foil • 85x55mm'
),
(
    'f2222222-2222-2222-2222-222222222222',
    '22222222-2222-2222-2222-222222222222',
    'Artisanal Coffee Roaster Product Launch',
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&q=80',
    '250gsm Uncoated Recycled • Tri-Fold Gatefold • CMYK + Gold Ink'
),
(
    'f3333333-3333-3333-3333-333333333333',
    '33333333-3333-3333-3333-333333333333',
    'Modernist Film Festival Exhibition Signage',
    'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
    '5mm Direct-to-Board Foamex • Matte Lamination • 841x1189mm (A0)'
),
(
    'f4444444-4444-4444-4444-444444444444',
    '44444444-4444-4444-4444-444444444444',
    'Bespoke Cosmetic Packaging Sleeve & Box',
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
    '380gsm Folding Boxboard • Embossed Logo • Custom Window Die-Cut'
),
(
    'f5555555-5555-5555-5555-555555555555',
    '55555555-5555-5555-5555-555555555555',
    'Holographic Beverage Brand Sticker Packs',
    'https://images.unsplash.com/photo-1572375992501-4b0892d50c69?auto=format&fit=crop&w=800&q=80',
    'Laser Rainbow Vinyl • UV Laminated • Kiss-Cut Sheet'
),
(
    'f6666666-6666-6666-6666-666666666666',
    '66666666-6666-6666-6666-666666666666',
    'Tech Summit Organic Cotton Heavyweight Hoodies',
    'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
    '400gsm French Terry • 3-Color Plastisol Front & Sleeve • Embroidered Hood'
)
ON CONFLICT (id) DO NOTHING;

