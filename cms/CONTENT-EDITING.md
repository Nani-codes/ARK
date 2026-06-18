# Editing products in Strapi (non-technical guide)

Products use **simple forms** — no JSON or coding required.

## Open a product

1. Go to **Content Manager → Product**
2. Open a product or click **Create new entry**

## Main fields

| Field | What to enter |
|-------|----------------|
| **Name** | Product title shown in the app |
| **Price** | Default price (also used as the starting price when combinations are auto-built) |
| **Compare at price** | Old / MRP price (optional — shows discount %) |
| **Unit** | e.g. Piece, Bag, Sq Ft |
| **Replacement days** | Usually `7` for “7 Day Replacement” |
| **Bulk pricing enabled** | Turn on to show bulk quote button in the app |

---

## Simple products (one choice only — e.g. different bag sizes)

Use this when shoppers pick **one thing** like “10 Bags” or `1/2 inch`.

1. **Variant option name** — label shown in the app, e.g. `Size`, `Pack`, `Length`
2. Under **Price option**, click **Add an entry** for each choice
3. For each row fill in:
   - **Label** — e.g. `10 Bags` or `1/2"`
   - **Price** — sale price for that choice
   - **Compare at price** — optional MRP
   - Leave **Option key** blank (filled automatically)

You do **not** need “Customer choice groups” for this simple setup.

---

## Products with multiple choices (Colour × Size × Finish, etc.)

Use this when shoppers must combine **two or more** choices (e.g. colour **and** size).

### Step 1 — List what customers can pick

Under **Customer choice group**, click **Add an entry** for each type of choice:

| Field | Example |
|-------|---------|
| **Group name** | `Colour` |
| **Choices** | `Matte Grey, Gloss White, Beige` |

Add another group:

| Field | Example |
|-------|---------|
| **Group name** | `Size` |
| **Choices** | `2×2 ft, 4×4 ft` |

**Tips:**
- Separate each choice with a **comma**
- Spell names exactly as you want them in the app
- You can add 2, 3, or more groups — the system handles any number

### Step 2 — Auto-build price rows

Leave **Auto build variants** turned **ON** (default).

When you **Save**, Strapi creates every combination (e.g. 3 colours × 2 sizes = 6 rows) under **Price option**.

### Step 3 — Set prices

Open each **Price option** row and set **Price** (and optional **Compare at price**).

You usually **do not** need to edit **Choice value** rows — those are filled automatically.

---

## Specifications

Use the **Specification** block — one row per line.

| Field | Example |
|-------|---------|
| **Label** | `Grade` |
| **Value** | `PPC` |

---

## After CMS code updates

Reset the local database once if your developer asks you to:

```bash
rm .tmp/data.db
npm run develop
```

Sample products are recreated automatically.

---

## Quantity price tiers

Add **Quantity price tier** rows on the product or on individual **Price option** rows.

| Field | Example |
|-------|---------|
| **Min qty** | `10` |
| **Unit price** | `415` |

When a customer buys at least **Min qty**, the app uses **Unit price** instead of the base price. Variant-level tiers override product-level tiers.

---

## Temperature-sensitive products

| Field | When to use |
|-------|-------------|
| **Temperature sensitive** | ON for items needing cool/dry handling |
| **Temperature note** | Short instruction shown on product & checkout |

---

## Bulk quote fields

| Field | Purpose |
|-------|---------|
| **Bulk pricing enabled** | Shows bulk quote CTA in app |
| **Bulk min quantity** | Minimum qty for quote form validation |

Quote requests in Strapi now link to the **Product**, store **Quantity** + **Quantity unit**, optional **GSTIN**, and **Preferred delivery date**. Set **Quoted price** when replying to the customer.
