# ARK brand & logo guidelines

## Assets

| Asset | Path | Use |
|-------|------|-----|
| App logo | `mobile/assets/images/Logo.png` | In-app header, login, marketing |
| App icon | `mobile/assets/images/icon.png` | iOS/Android launcher |
| Splash | `mobile/assets/images/splash-icon.png` | Launch screen |
| Favicon | `mobile/assets/images/favicon.png` | Web |

## Colors

From `mobile/lib/theme.ts`:

- **Navy** `#002147` / `#000a1e` — primary brand, headers, primary text, Buy Now buttons
- **Gold** `#ffb800` (`brand.gold`, `colors.secondary`) — CTAs, active tab icons, links, accent borders
- **Gold dark** `#775a19` (`brand.goldDark`) — text on light gold surfaces (chip labels, badges), not primary accents
- **Gold container** `#fed488` — chip/badge backgrounds
- **Background** `#f9f9fc` — app canvas

## Logo component

Use `<Logo size="sm|md|hero" />` from `mobile/components/Logo.tsx`.

| Size | Pixels | Placement |
|------|--------|-----------|
| `sm` | 28 | Compact rows |
| `md` | 36 | App header (default) |
| `hero` | 72 | Login / onboarding |

## Placement rules

1. **Minimum clear space** — at least 8px padding on all sides
2. **Backgrounds** — logo on white, `#f9f9fc`, or navy header; avoid busy photos
3. **Do not** stretch, rotate, recolor, or add drop shadows to the logo
4. **App icon** is separate from the in-app logo; do not swap them

## Typography lockup

When pairing with text (e.g. login tagline), keep logo above or left of copy with `spacing.unit4` gap.

## Dark mode

Header uses navy background with gold accents; logo PNG works on both light and dark surfaces.
