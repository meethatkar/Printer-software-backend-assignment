-- ==============================================================================
-- PRINT PLATFORM - SUPABASE POSTGRESQL SCHEMA
-- Core Tables: 9 Tables with full constraints, Foreign Keys, RLS and Triggers
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. PROFILES TABLE
-- Extends Supabase auth.users.
-- Stores id (PK/FK), email, full_name, company_name, role (customer | admin), created_at.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    company_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('customer', 'admin')) DEFAULT 'customer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Index on role for fast RBAC checks
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ==============================================================================
-- 2. PRODUCT DIVISIONS TABLE
-- The 6 print divisions (extensible for future divisions).
-- Stores id, name, slug, description, sort_order.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.product_divisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_product_divisions_slug ON public.product_divisions(slug);
CREATE INDEX IF NOT EXISTS idx_product_divisions_sort_order ON public.product_divisions(sort_order ASC);

-- ==============================================================================
-- 3. PRODUCTS TABLE
-- Parameter-driven product definitions.
-- Stores id, division_id (FK), name, slug, base_rate, min_width_mm, max_width_mm,
-- min_height_mm, max_height_mm, bleed_mm, dpi, materials_json, volume_tiers_json,
-- print_zones_json (bounds & font fitting rules), is_active.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    division_id UUID NOT NULL REFERENCES public.product_divisions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    base_rate NUMERIC(10, 4) NOT NULL DEFAULT 0.0500, -- Rate per 1000 sq mm or base unit
    min_width_mm INTEGER NOT NULL DEFAULT 50,
    max_width_mm INTEGER NOT NULL DEFAULT 1200,
    min_height_mm INTEGER NOT NULL DEFAULT 50,
    max_height_mm INTEGER NOT NULL DEFAULT 2400,
    bleed_mm NUMERIC(5, 2) NOT NULL DEFAULT 3.00,
    dpi INTEGER NOT NULL DEFAULT 300,
    materials_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    volume_tiers_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    print_zones_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_products_division_id ON public.products(division_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

-- ==============================================================================
-- 3b. TEMPLATES TABLE (10th Table)
-- Template-driven editing & default elements.
-- Relationship: products -> templates (1:N)
-- Stores id, product_id (FK), name, print_zones_json (safe area, bleed, min/max font,
-- shrink-to-fit rules), default_elements_json, is_active, created_at.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    print_zones_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    default_elements_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_templates_product_id ON public.templates(product_id);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON public.templates(is_active);


-- ==============================================================================
-- 4. GALLERY ITEMS TABLE
-- Real print samples shown in the Live Work Gallery.
-- Stores id, division_id (FK), title, image_url, specs_label.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.gallery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    division_id UUID NOT NULL REFERENCES public.product_divisions(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    image_url TEXT NOT NULL,
    specs_label TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_gallery_items_division_id ON public.gallery_items(division_id);

-- ==============================================================================
-- 5. SAVED DESIGNS TABLE
-- Reusable customer artwork for one-click reorders.
-- Stores id, user_id (FK), product_id (FK), title, config_json, design_json,
-- uploaded_file_url, created_at.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.saved_designs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    config_json JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g. { width_mm, height_mm, material_id, orientation }
    design_json JSONB NOT NULL DEFAULT '{"elements": []}'::jsonb, -- canvas layers, texts, coordinates
    uploaded_file_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_saved_designs_user_id ON public.saved_designs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_designs_product_id ON public.saved_designs(product_id);

-- ==============================================================================
-- 6. ORDERS TABLE (Pre-declaration without circular FK to proof_versions)
-- Core transactional & production record.
-- Stores id, order_code, user_id (FK), product_id (FK), saved_design_id (FK, nullable),
-- config_json, csv_rows_json (nullable), unit_price, quantity, subtotal, discount_amount,
-- vat_amount, total_amount, payment_status, payment_ref, xero_export_data (JSONB),
-- pipeline_status (QUOTE|ORDER|ARTWORK|PROOF|PRODUCTION|COMPLETED),
-- approved_proof_id (FK, nullable), created_at, updated_at.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code TEXT NOT NULL UNIQUE,
    invoice_number TEXT UNIQUE, -- powers downloadable customer invoices/receipts and Xero export
    is_archived BOOLEAN NOT NULL DEFAULT false, -- powers Admin archive for completed work
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    saved_design_id UUID REFERENCES public.saved_designs(id) ON DELETE SET NULL,
    config_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    csv_rows_json JSONB, -- variable data printing records
    unit_price NUMERIC(10, 4) NOT NULL DEFAULT 0.0000,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    vat_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
    payment_ref TEXT,
    xero_export_data JSONB DEFAULT '{}'::jsonb,
    pipeline_status TEXT NOT NULL DEFAULT 'QUOTE' CHECK (pipeline_status IN ('QUOTE', 'ORDER', 'ARTWORK', 'PROOF', 'PRODUCTION', 'COMPLETED')),
    approved_proof_id UUID, -- Will reference proof_versions(id) once created
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_product_id ON public.orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_code ON public.orders(order_code);
CREATE INDEX IF NOT EXISTS idx_orders_invoice_number ON public.orders(invoice_number);
CREATE INDEX IF NOT EXISTS idx_orders_is_archived ON public.orders(is_archived);
CREATE INDEX IF NOT EXISTS idx_orders_pipeline_status ON public.orders(pipeline_status);

-- ==============================================================================
-- 7. PROOF VERSIONS TABLE
-- Tracks v1, v2... revisions and approval audit trail.
-- Stores id, order_id (FK), version_number, design_snapshot_json, uploaded_file_url,
-- status (PENDING | CHANGES_REQUESTED | APPROVED), change_request_notes,
-- approved_by (FK, nullable), approved_at (nullable), created_at.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.proof_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    design_snapshot_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    uploaded_file_url TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CHANGES_REQUESTED', 'APPROVED')),
    change_request_notes TEXT,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
    CONSTRAINT unique_order_proof_version UNIQUE(order_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_proof_versions_order_id ON public.proof_versions(order_id);
CREATE INDEX IF NOT EXISTS idx_proof_versions_status ON public.proof_versions(status);

-- Add Foreign Key constraint for orders.approved_proof_id -> proof_versions(id)
ALTER TABLE public.orders 
DROP CONSTRAINT IF EXISTS fk_orders_approved_proof;

ALTER TABLE public.orders 
ADD CONSTRAINT fk_orders_approved_proof 
FOREIGN KEY (approved_proof_id) 
REFERENCES public.proof_versions(id) 
ON DELETE SET NULL;

-- ==============================================================================
-- 8. PRINT FILES TABLE
-- Server-generated production files unlocked after proof approval.
-- Stores id, order_id (FK), proof_version_id (FK), file_name (OrderID_ProductType_Date_Output),
-- file_format (PDF | PNG | ZIP), storage_path, is_csv_batch, row_count, generated_at.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.print_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    proof_version_id UUID NOT NULL REFERENCES public.proof_versions(id) ON DELETE RESTRICT,
    file_name TEXT NOT NULL,
    file_format TEXT NOT NULL CHECK (file_format IN ('PDF', 'PNG', 'ZIP')),
    storage_path TEXT NOT NULL,
    is_csv_batch BOOLEAN NOT NULL DEFAULT false,
    row_count INTEGER NOT NULL DEFAULT 1,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_print_files_order_id ON public.print_files(order_id);
CREATE INDEX IF NOT EXISTS idx_print_files_proof_version_id ON public.print_files(proof_version_id);

-- ==============================================================================
-- 9. NOTIFICATIONS TABLE
-- Logs order updates, proof status alerts, and completion alerts.
-- Stores id, user_id (FK), order_id (FK, nullable), event_type, subject, message, is_read, sent_at.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_order_id ON public.notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- ==============================================================================
-- TRIGGERS & FUNCTIONS
-- ==============================================================================

-- 1. Automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_orders_updated_at ON public.orders;
CREATE TRIGGER trigger_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_saved_designs_updated_at ON public.saved_designs;
CREATE TRIGGER trigger_saved_designs_updated_at
    BEFORE UPDATE ON public.saved_designs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 2. Automatically create profile row when new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, company_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proof_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: users can view/edit their own; admins can manage all
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- Product Divisions: Public read, admin write
CREATE POLICY "Public read product_divisions" ON public.product_divisions
    FOR SELECT USING (true);

CREATE POLICY "Admin write product_divisions" ON public.product_divisions
    FOR ALL USING (public.is_admin());

-- Products: Public read active, admin write
CREATE POLICY "Public read active products" ON public.products
    FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "Admin write products" ON public.products
    FOR ALL USING (public.is_admin());

-- Templates: Public read active, admin write
CREATE POLICY "Public read active templates" ON public.templates
    FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "Admin write templates" ON public.templates
    FOR ALL USING (public.is_admin());

-- Gallery Items: Public read, admin write
CREATE POLICY "Public read gallery_items" ON public.gallery_items
    FOR SELECT USING (true);

CREATE POLICY "Admin write gallery_items" ON public.gallery_items
    FOR ALL USING (public.is_admin());

-- Saved Designs: Customer own designs, admin all
CREATE POLICY "Users can read own designs" ON public.saved_designs
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert own designs" ON public.saved_designs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own designs" ON public.saved_designs
    FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can delete own designs" ON public.saved_designs
    FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- Orders: Customer can read/insert own orders; admins can manage all
CREATE POLICY "Users can read own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert own orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and admins can update orders" ON public.orders
    FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- Proof Versions: User can view proofs of their orders; admins can manage all
CREATE POLICY "Users can read proofs of own orders" ON public.proof_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = proof_versions.order_id 
              AND (orders.user_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Admins or users can update proof status" ON public.proof_versions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = proof_versions.order_id 
              AND (orders.user_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Admins can insert proof versions" ON public.proof_versions
    FOR INSERT WITH CHECK (
        public.is_admin() OR 
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = proof_versions.order_id AND orders.user_id = auth.uid()
        )
    );

-- Print Files: Unlocked only after proof approval, order owner and admin can read
CREATE POLICY "Read print files for approved orders" ON public.print_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = print_files.order_id 
              AND (orders.user_id = auth.uid() OR public.is_admin())
        )
    );

CREATE POLICY "Admins can insert print files" ON public.print_files
    FOR ALL USING (public.is_admin());

-- Notifications: User can read/update own notifications
CREATE POLICY "Users can read own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "System/Admin can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

