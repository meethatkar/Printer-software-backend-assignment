# Print Platform Backend

Production-ready backend architecture for the Print Platform, designed for Next.js App Router and Supabase PostgreSQL.

## Folder Structure

```
Backend/
├── configs/
│   ├── constants.ts         # Enums (Roles, Pipeline Statuses, Proof Statuses, VAT rates)
│   ├── env.ts               # Environment validation & loader
│   └── supabase.ts          # Supabase client and service-role / admin client
├── database/
│   ├── schema.sql           # Complete Supabase PostgreSQL DDL for all 9 tables + RLS + Triggers
│   └── seed.sql             # 6 print divisions, parameter-driven products, gallery items
├── tables/
│   ├── profiles.ts          # Table 1: auth.users extension (roles, profiles)
│   ├── productDivisions.ts  # Table 2: The 6 print divisions
│   ├── products.ts          # Table 3: Parameter-driven products (bleed, materials, volume tiers)
│   ├── galleryItems.ts      # Table 4: Live work gallery samples
│   ├── savedDesigns.ts      # Table 5: Reusable artwork for one-click reorders
│   ├── orders.ts            # Table 6: Core transactional record & pipeline state
│   ├── proofVersions.ts     # Table 7: Multi-version proofing audit trail (v1, v2...)
│   ├── printFiles.ts        # Table 8: Server-generated production output files
│   ├── notifications.ts     # Table 9: Customer order & proof status alerts
│   └── index.ts             # Unified tables export
├── types/
│   └── database.types.ts    # Comprehensive TypeScript interfaces & row types
├── utils/
│   ├── pricing.ts           # Real-time pricing calculator (area, materials, volume tiers, VAT)
│   ├── orderCode.ts         # Unique order code (ORD-YYYYMMDD-XXXX) and file naming
│   ├── validation.ts        # Dimension limits, quantities, CSV row validations
│   ├── xeroExport.ts        # Formats order records into Xero invoice JSONB
│   ├── printFileGenerator.ts# High-res production PDF generator with crop marks & bleed
│   └── response.ts          # Standardized HTTP API response formatters
├── controllers/
│   ├── authController.ts
│   ├── productController.ts
│   ├── savedDesignController.ts
│   ├── orderController.ts
│   ├── proofController.ts
│   ├── printFileController.ts
│   ├── notificationController.ts
│   └── index.ts
├── middlewares/
│   ├── userAuth.ts          # requireAuth, requireAdmin, optionalAuth, expressUserAuth
│   └── index.ts
└── routes/
    └── index.ts             # Central API route dictionary and controller dispatchers
```

## The 9 Core Database Tables

1. **`profiles`**: Extends Supabase `auth.users`. Roles: `customer` | `admin`.
2. **`product_divisions`**: The 6 print divisions (`business-cards-stationery`, `marketing-flyers`, `posters-signage`, `packaging-boxes`, `stickers-labels`, `apparel-merchandise`).
3. **`products`**: Parameter-driven products (`base_rate`, `min/max width/height`, `bleed_mm`, `dpi`, `materials_json`, `volume_tiers_json`, `print_zones_json`).
4. **`gallery_items`**: Live work portfolio samples tagged with division and print finishes.
5. **`saved_designs`**: Reusable customer artwork (canvas layers, dimension configs) for one-click reordering.
6. **`orders`**: Full transactional record (`order_code`, unit pricing, discounts, VAT, `pipeline_status`: `QUOTE | ORDER | ARTWORK | PROOF | PRODUCTION | COMPLETED`, `approved_proof_id`).
7. **`proof_versions`**: Audit trail for revisions (`v1`, `v2`...), customer feedback notes, approval timestamps, and `approved_by` user.
8. **`print_files`**: Server-generated production files unlocked ONLY after proof approval (`OrderID_ProductType_Date_Output.pdf`).
9. **`notifications`**: Lifecycle alert logs for proof reviews, changes, and order status transitions.

