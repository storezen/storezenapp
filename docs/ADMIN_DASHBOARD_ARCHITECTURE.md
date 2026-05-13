# Admin dashboard architecture (Shopify-style merchant control)

**Goal:** maximum control for the store owner, extremely simple UI for non-technical users.

**Scope in this monorepo**

| Area | Web route | API (existing) |
|------|-----------|----------------|
| **Merchant (store) admin** | `apps/web/src/app/dashboard/**` | `authenticate` + `/stores/my/*`, products, orders, collections |
| **Platform super-admin** | `apps/web/src/app/admin/**` | `authenticateAdmin` + `/admin/*` |

This document targets the **merchant dashboard** (`/dashboard`) as the “Shopify admin” for your eCommerce app. Platform admin remains separate.

---

## 1. UI structure (information architecture)

```
/dashboard                 → Overview (KPIs, tasks, low stock, recent orders)
/dashboard/products         → List + search + filters + “Import CSV”
/dashboard/products/new     → Tabbed product editor
/dashboard/products/[id]   → Same editor + duplicate + preview
/dashboard/collections   → List + link to products
/dashboard/orders         → Pipeline / table + quick actions
/dashboard/orders?drawer=id → (optional) deep-link for drawer
/dashboard/marketing      → Pixels, event tracking toggles, (future) UTM defaults
/dashboard/content          → Homepage sections (CMS): hero, categories strip, offers…
/dashboard/settings         → Store, WhatsApp templates, delivery, payment
```

**Simple UX rules**

- One **primary action** per page (e.g. “Add product”, “Save”).
- **Settings** as grouped cards, not one long form: “Store info”, “WhatsApp”, “Delivery”, “Pixels”.
- **Mobile:** stack layout; tables become **card lists**; drawer for order details (full-screen sheet on small viewports).
- **Labels** above fields; help text one line; avoid jargon.

---

## 2. Component breakdown (reusable)

| Component | Role |
|-----------|------|
| `DashboardShell` | Already: `layout.tsx` + `Sidebar` + main area. Add optional **top bar** (store name, “View store”). |
| `AdminPageHeader` | `title`, `description?`, `actions?: ReactNode` — consistent page chrome. |
| `StatCard` / `StatRow` | Overview KPIs (orders today, revenue, pending). |
| `DataTable` | Generic: columns, row actions, empty state, loading skeleton. |
| `MobileCardList` | Same data as table, card UI for &lt; md. |
| `OrderStatusBadge` | Maps `order_status` → color + label. |
| `OrderDrawer` | Right sheet: customer, address, line items, timeline, **Confirm / Ship / Deliver**, “Send WhatsApp”. |
| `QuickOrderActions` | Inline buttons: confirm, ship, deliver, mark COD received (as per your pipeline). |
| `ProductFormTabs` | Tabs: **General** · **Media** · **Pricing & stock** · **Variants** · **SEO** — each tab = small set of fields. |
| `ProductPreviewCard` | Read-only card mirroring storefront `ProductCard`. |
| `ImageUploader` | Multi-image, reorder, set cover — backed by your existing `images` JSON. |
| `CsvImportDropzone` | Bulk upload: parse client-side or send file to `POST /products/import`. |
| `MarketingPixelsForm` | Meta + TikTok ID fields + toggles “Track add_to_cart / purchase”. |
| `HomepageSectionList` | List of blocks from `store_pages.home_blocks` with **enable/disable** and **Edit**. |
| `HomepageSectionEditor` | Per-type simple form (hero, promo banner, category row ref IDs, offer strip). |
| `ConfirmDialog` | Destructive or irreversible actions. |
| `EmptyState` | Illustration + CTA. |

**Folder suggestion (web)**

```
apps/web/src/components/dashboard/
  shell/AdminPageHeader.tsx
  orders/OrderDrawer.tsx
  orders/OrderStatusBadge.tsx
  products/ProductFormTabs.tsx
  products/ProductPreviewCard.tsx
  marketing/MarketingPixelsForm.tsx
  content/HomepageSectionList.tsx
  data/DataTable.tsx
  ui/SettingsCard.tsx
```

**API client layer (web)**

```
apps/web/src/services/
  store.service.ts          // get/update my store, pages, pixels, delivery
  products-admin.service.ts
  orders-admin.service.ts
```

Keep **fetch in one place**; components call services, not raw URLs everywhere.

---

## 3. Database schema (current + CMS)

**Already in `apps/api/src/db/schema.ts` (relevant):**

- `users`, `stores` — `metaPixel`, `tiktokPixel`, `whatsapp*`, `deliverySettings`, `paymentMethods`, …
- `store_collections` + `store_collection_products`
- `products` — full product + `images` / `variants` jsonb
- `orders` — `orderStatus`, `items`, `trackingNumber`, `courier`, …
- `store_pages` — **`homeBlocks` (jsonb)** ← **homepage CMS** (per store, one row per store)

**Homepage CMS (`store_pages.home_blocks`) — recommended JSON shape**

Versioned so you can migrate safely:

```json
{
  "version": 1,
  "blocks": [
    {
      "id": "hero-1",
      "type": "hero",
      "enabled": true,
      "settings": {
        "badge": "NEW ARRIVALS 2026",
        "title": "Discover Premium Smartwatches",
        "subtitle": "Cash on Delivery across Pakistan.",
        "imageUrl": "https://...",
        "primaryCta": { "label": "Shop Now", "href": "/products" }
      }
    },
    {
      "id": "categories-1",
      "type": "category_row",
      "enabled": true,
      "settings": { "source": "default" }
    },
    {
      "id": "promo-1",
      "type": "promo_strip",
      "enabled": true,
      "settings": { "eyebrow": "LIMITED TIME", "title": "Up to 50% OFF" }
    }
  ]
}
```

**Alternative (simpler):** `home_blocks` as a **plain array** (no `version` wrapper) — your API already accepts `z.array(z.unknown())`. Tighten with Zod when the dashboard ships (see `home-blocks.validator.ts`).

**Optional future tables (not required for v1)**

- `whatsapp_message_templates` — `store_id`, `event` (`order_confirmed`, `shipped`, …), `body`, `is_active`
- `audit_log` — who changed an order or product (compliance / support)

**Orders pipeline**

Align `orders.orderStatus` with a fixed enum in code (e.g. `new` → `confirmed` → `shipped` → `out_for_delivery` → `delivered` / `cancelled`). Document allowed transitions in `orders.service.ts`.

---

## 4. API surface (clean layer)

| Concern | Pattern |
|--------|---------|
| **Auth** | JWT + `authenticate` for merchant; store resolved via `findStoreByUserId`. |
| **CRUD** | Controllers stay thin; **services** own rules (stock, status transitions). |
| **Validation** | Zod per route; shared schemas in `validators/`. |
| **CMS** | `PUT /stores/my/pages` with validated `home_blocks` **or** nested `{ version, blocks }`. |
| **Bulk products** | `POST /products/import` (CSV) or reuse existing admin product routes + job queue later. |
| **WhatsApp** | Existing store WhatsApp + `orders` + scheduler; template strings in **settings** JSON or new table. |

**Public read of CMS:** add `GET /stores/:slug/home` (or include `homeBlocks` in existing public store payload) so the storefront `page.tsx` reads blocks instead of hard-coding sections.

---

## 5. Example: homepage blocks — Zod (API)

File added in repo: `apps/api/src/validators/home-blocks.validator.ts` — use in `updateStorePagesController` when you are ready to reject invalid blocks (optional migration path: accept both `unknown[]` and `{ version, blocks }` during rollout).

---

## 6. Example: order drawer + quick actions (React)

Conceptual pattern:

- List page fetches orders (paginated).
- Click row → `setSelectedOrderId(id)` and open `<OrderDrawer open order={...} onClose onAction />`.
- **Quick actions** call `PATCH /orders/:id/status` (or your existing endpoint) with `confirm` | `ship` | `deliver` and show toast + optimistic UI.

Pseudocode:

```tsx
// OrderDrawer.tsx (sketch)
export function OrderDrawer({ open, order, onClose, onStatusChange }: Props) {
  if (!order) return null;
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <h2>Order {order.id.slice(0, 8)}</h2>
        <p>{order.customerName} · {order.customerPhone}</p>
        {/* line items */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Button onClick={() => onStatusChange("confirmed")}>Confirm</Button>
          <Button onClick={() => onStatusChange("shipped")}>Ship</Button>
          <Button onClick={() => onStatusChange("delivered")}>Delivered</Button>
        </div>
        <Button variant="outline" onClick={() => openWhatsApp(order)}>Send WhatsApp</Button>
      </SheetContent>
    </Sheet>
  );
}
```

Use **shadcn `Sheet`** or your existing `CartDrawer` pattern for consistent animation and focus trap.

---

## 7. Example: product editor — tab state

- Keep **one** `useState` or `useReducer` for the draft product; **tab is UI only** (no separate saves per tab unless you add autosave).
- **Duplicate:** `POST /products` with body copied from `GET /products/:id`, new slug suffix `-copy`.
- **Preview:** pass draft into `ProductPreviewCard` (same props as live product with optional `isDraft` flag).

---

## 8. Marketing (pixels + events)

- **Data:** `stores.metaPixel`, `stores.tiktokPixel` (already in schema).
- **UI:** two inputs, saved via existing `PUT /stores/my/pixel`.
- **Event toggles:** store in `stores.themeColors` (hack) or new `jsonb` column e.g. `analyticsFlags` — `{ trackAddToCart: true, trackPurchase: true }`.
- **Storefront:** `StorePixels` component — gate events on flags.

---

## 9. Settings (store info, WhatsApp, delivery)

- **Store info:** `PUT /stores/my` (name, logo, whatsapp number).
- **WhatsApp templates:** v1 = textarea fields in `deliverySettings` or new JSON column; v2 = `whatsapp_message_templates` table.
- **Delivery:** `PUT /stores/my/delivery` with structured `delivery_settings` (cities, fees, free-shipping threshold).

---

## 10. Implementation order (suggested)

1. **Order drawer + pipeline buttons** on existing orders page (highest day-to-day value).
2. **Typed `home_blocks` + Content UI** + wire storefront to public API.
3. **Product tabs + duplicate + preview** (polish `dashboard/products`).
4. **CSV import** + **marketing toggles** column.
5. **WhatsApp template** UI backed by JSON or new table.

---

## 11. Implementation status (in repo)

- **CMS:** `PUT /stores/my/pages` validates `{ version: 1, blocks }` via `parseAndValidateHomePageBody`. `GET /stores/my/pages` returns `{ homePage, updatedAt }`. **Public** `GET /stores/:slug` includes **`homePage`** (merged with defaults in API).
- **Storefront:** `HomePageView` (`apps/web/src/components/home/HomePageView.tsx`) renders blocks; `/dashboard/content` is the simple homepage editor.
- **Marketing:** `/dashboard/marketing` saves pixels + `themeColors.analytics` toggles; `StorePixels` + `setStoreAnalyticsFlags` control firing events.
- **Orders:** `/dashboard/orders` uses a **side drawer** (`OrderDrawer`) with pipeline quick actions and WhatsApp link to the customer’s number.

## 12. Supporting files

- `apps/api/src/validators/home-blocks.validator.ts` — Zod block union.
- `apps/api/src/lib/home-page.ts` — Defaults + `resolveHomePageFromDb` + request parsing.
- `apps/web/src/lib/cms/homepage-block-types.ts` — TS types + `getDefaultHomepageContent`.

`PUT /stores/my/pages` accepts **v1 documents** or legacy `{ homeBlocks: [...] }` / raw arrays (normalized before validation).
