/**
-- ==============================================================================
-- PRINT PLATFORM - DATABASE TYPES & INTERFACES
-- Matches all 9 core tables with strict TypeScript typings.
-- ==============================================================================
*/

export type UserRole = 'customer' | 'admin';

export type PipelineStatus = 
  | 'QUOTE' 
  | 'ORDER' 
  | 'ARTWORK' 
  | 'PROOF' 
  | 'PRODUCTION' 
  | 'COMPLETED';

export type ProofStatus = 
  | 'PENDING' 
  | 'CHANGES_REQUESTED' 
  | 'APPROVED';

export type PaymentStatus = 
  | 'PENDING' 
  | 'PAID' 
  | 'FAILED' 
  | 'REFUNDED';

export type FileFormat = 
  | 'PDF' 
  | 'PNG' 
  | 'ZIP';

// ------------------------------------------------------------------------------
// JSON Field Sub-Types
// ------------------------------------------------------------------------------

export interface ProductMaterial {
  id: string;
  name: string;
  multiplier: number;
  description?: string;
}

export interface VolumeTier {
  min_qty: number;
  max_qty: number;
  discount_pct: number;
}

export interface PrintZoneBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PrintZone {
  id: string;
  name: string;
  bounds: PrintZoneBounds;
  max_chars?: number;
  min_font_pt?: number;
  shrink_to_fit?: boolean;
}

export interface DesignConfig {
  width_mm: number;
  height_mm: number;
  material_id: string;
  orientation?: 'portrait' | 'landscape';
  double_sided?: boolean;
  finish?: string;
  custom_notes?: string;
}

export interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'rect' | 'circle' | 'vdp_field';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  align?: 'left' | 'center' | 'right';
  src?: string;
  vdpColumn?: string; // CSV column mapping for variable data printing
}

export interface DesignData {
  elements: CanvasElement[];
  bleed_mm?: number;
  safety_margin_mm?: number;
  background_color?: string;
}

export interface XeroExportData {
  invoice_id?: string;
  invoice_number?: string;
  contact_name: string;
  contact_email: string;
  line_items: Array<{
    description: string;
    quantity: number;
    unit_amount: number;
    account_code: string;
    tax_type: string;
    tax_amount: number;
    line_amount: number;
  }>;
  subtotal: number;
  tax_amount: number;
  total: number;
  currency: string;
  date: string;
  due_date: string;
  status: string;
}

// ------------------------------------------------------------------------------
// Table Entity Interfaces (Row definitions)
// ------------------------------------------------------------------------------

// 1. profiles
export interface Profile {
  id: string; // PK, matches auth.users.id
  email: string;
  full_name: string | null;
  company_name: string | null;
  role: UserRole;
  created_at: string;
}

// 2. product_divisions
export interface ProductDivision {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  created_at?: string;
}

// 3. products
export interface Product {
  id: string;
  division_id: string;
  name: string;
  slug: string;
  base_rate: number;
  min_width_mm: number;
  max_width_mm: number;
  min_height_mm: number;
  max_height_mm: number;
  bleed_mm: number;
  dpi: number;
  materials_json: ProductMaterial[];
  volume_tiers_json: VolumeTier[];
  print_zones_json: PrintZone[];
  is_active: boolean;
  created_at?: string;
}

// 3b. templates (10th Table)
export interface Template {
  id: string;
  product_id: string;
  name: string;
  print_zones_json: PrintZone[];
  default_elements_json: CanvasElement[];
  is_active: boolean;
  created_at?: string;
}

// 4. gallery_items
export interface GalleryItem {
  id: string;
  division_id: string;
  title: string;
  image_url: string;
  specs_label: string;
  created_at?: string;
}

// 5. saved_designs
export interface SavedDesign {
  id: string;
  user_id: string;
  product_id: string;
  title: string;
  config_json: DesignConfig;
  design_json: DesignData;
  uploaded_file_url: string | null;
  created_at: string;
  updated_at?: string;
}

// 6. orders
export interface Order {
  id: string;
  order_code: string;
  invoice_number: string | null; // unique invoice ref
  is_archived: boolean; // admin archive flag
  user_id: string;
  product_id: string;
  saved_design_id: string | null;
  config_json: DesignConfig;
  csv_rows_json: Record<string, string | number>[] | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
  discount_amount: number;
  vat_amount: number;
  total_amount: number;
  payment_status: PaymentStatus;
  payment_ref: string | null;
  xero_export_data: XeroExportData | null;
  pipeline_status: PipelineStatus;
  approved_proof_id: string | null;
  created_at: string;
  updated_at: string;
}

// 7. proof_versions
export interface ProofVersion {
  id: string;
  order_id: string;
  version_number: number;
  design_snapshot_json: DesignData;
  uploaded_file_url: string | null;
  status: ProofStatus;
  change_request_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

// 8. print_files
export interface PrintFile {
  id: string;
  order_id: string;
  proof_version_id: string;
  file_name: string; // Format: OrderID_ProductType_Date_Output
  file_format: FileFormat;
  storage_path: string;
  is_csv_batch: boolean;
  row_count: number;
  generated_at: string;
}

// 9. notifications
export interface Notification {
  id: string;
  user_id: string;
  order_id: string | null;
  event_type: string;
  subject: string;
  message: string;
  is_read: boolean;
  sent_at: string;
}

// ------------------------------------------------------------------------------
// Insert/Update Payload Types
// ------------------------------------------------------------------------------

export type ProfileInsert = Omit<Profile, 'created_at'> & { created_at?: string };
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at'>>;

export type ProductDivisionInsert = Omit<ProductDivision, 'id' | 'created_at'> & { id?: string };
export type ProductDivisionUpdate = Partial<Omit<ProductDivision, 'id' | 'created_at'>>;

export type ProductInsert = Omit<Product, 'id' | 'created_at'> & { id?: string };
export type ProductUpdate = Partial<Omit<Product, 'id' | 'created_at'>>;

export type TemplateInsert = Omit<Template, 'id' | 'created_at'> & { id?: string };
export type TemplateUpdate = Partial<Omit<Template, 'id' | 'created_at'>>;


export type GalleryItemInsert = Omit<GalleryItem, 'id' | 'created_at'> & { id?: string };
export type GalleryItemUpdate = Partial<Omit<GalleryItem, 'id' | 'created_at'>>;

export type SavedDesignInsert = Omit<SavedDesign, 'id' | 'created_at' | 'updated_at'> & { id?: string };
export type SavedDesignUpdate = Partial<Omit<SavedDesign, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type OrderInsert = Omit<Order, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
export type OrderUpdate = Partial<Omit<Order, 'id' | 'user_id' | 'order_code' | 'created_at' | 'updated_at'>>;

export type ProofVersionInsert = Omit<ProofVersion, 'id' | 'created_at'> & { id?: string };
export type ProofVersionUpdate = Partial<Omit<ProofVersion, 'id' | 'order_id' | 'created_at'>>;

export type PrintFileInsert = Omit<PrintFile, 'id' | 'generated_at'> & { id?: string };
export type PrintFileUpdate = Partial<Omit<PrintFile, 'id' | 'generated_at'>>;

export type NotificationInsert = Omit<Notification, 'id' | 'sent_at'> & { id?: string; sent_at?: string };
export type NotificationUpdate = Partial<Omit<Notification, 'id' | 'sent_at'>>;

