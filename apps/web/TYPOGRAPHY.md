# Typography System Lock

This file defines the authoritative typography scale for `apps/web`.
Use these values across routes to keep visual consistency and prevent drift.

## Font Family

- Base/body: `"Helvetica Neue", Arial, sans-serif`
- Headings: `"Helvetica Neue", Arial, sans-serif`
- Weights:
  - Regular: `400`
  - Medium: `500`
  - Semibold: `600`
  - Bold: `700`
  - Extrabold: `800`

## Global Heading Scale

- `h1`: `clamp(36px, 6vw, 72px)` (extra bold)
- `h2`: `36px` (extra bold)
- `h3`: `28px` (bold)
- `h4`: `22px` (bold)
- Heading letter spacing: `-0.5px`

## Core UI Type Ramp

- Navigation links: `14px` (`.type-nav`)
- Body text: `16px` (`.type-body`)
- Card title: `22px` (`.type-card-title`)
- Card price: `36px` (`.type-card-price`)
- Form/section labels: `13px` (`.type-label`)
- Micro text (badges/meta): `11px` (`.type-micro`)

## Route Matrix

### Home
- Hero title: `h1`
- Hero paragraph: `16px`
- Stats number: `36px-40px` extra bold
- Stats label: `13px`
- Section titles: `h2`

### Products
- Page title: `h2`
- Search input text: `15px`
- Category pill text: `14px`
- Product card title: `.type-card-title`
- Product card price: `.type-card-price`

### Product Detail
- Product title: `44px` desktop, `30px` mobile
- Price: `48px` desktop, `36px` mobile
- Badges/meta: `11px-13px`
- CTA button text: `15px`

### Track / Contact / Login / Checkout
- Page title: `h2` to `h1` depending on hero style
- Form labels: `.type-label`
- Input text: `15px`
- Helper text: `13px-14px`
- Primary CTA text: `15px`

### Dashboard
- Top greeting/title: `h2`
- Stat value: `30px-36px`, extra bold
- Table headers: `11px-12px`, uppercase
- Table body: `14px`

## Implementation Rules

1. Prefer typography tokens/utility classes over ad hoc values.
2. Do not introduce new font families without explicit design direction.
3. New screens must follow this matrix before PR/merge.
4. If a new type size is needed, add token + document it here.
