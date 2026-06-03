# Editing products in Strapi (non-technical guide)

Products no longer use JSON. Everything is filled in with **forms and repeatable blocks**.

## Open a product

1. Go to **Content Manager → Product**
2. Open a product or click **Create new entry**

## Main fields

| Field | What to enter |
|-------|----------------|
| **Name** | Product title shown in the app |
| **Price** | Default sale price (used if you add no size options) |
| **Compare at price** | Old / MRP price (optional — shows discount %) |
| **Unit** | e.g. Piece, Bag, Ton |
| **Variant option name** | Label above sizes, e.g. `Size`, `Pack`, `Color` |
| **Replacement days** | Usually `7` for “7 Day Replacement” |
| **Bulk pricing enabled** | Turn on to show bulk quote CTA in the app |

## Size / pack options (variants)

Use the **“Size / pack option”** block — click **“Add an entry”** for each size or pack.

For each row:

| Field | Example |
|-------|---------|
| **Label** | `1/2"` or `10 Bags` |
| **Price** | Sale price for that option |
| **Compare at price** | Optional MRP for that option |
| **Option key** | Leave blank — auto-generated from the label |

You do **not** need to write JSON or codes unless you want a fixed internal key.

## Specifications

Use the **“Specification”** block — one row per line.

| Field | Example |
|-------|---------|
| **Label** | `Grade` |
| **Value** | `PPC` |

Add rows for Strength, Set time, Voltage, etc.

## After schema changes

If you recently updated the CMS code, reset the local database once:

```bash
rm .tmp/data.db
npm run develop
```

Sample products will be recreated automatically.
