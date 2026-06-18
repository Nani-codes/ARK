# CTA button guidelines

Use `PrimaryButton` from `mobile/components/PrimaryButton.tsx` for all primary actions.

## Variants

| Variant | When to use |
|---------|-------------|
| `filled` (default) | Primary action — checkout, submit, OTP |
| `navy` | Secondary emphasis on PDP — Buy Now |
| `outline` | Alternate path — Continue Shopping |
| `secondary` | Dashed border — add another item, new quote |
| `ghost` | Text-style promo links |

## Sizes

| Size | When to use |
|------|-------------|
| `sm` | Inline banners, compact rows |
| `md` (default) | Standard full-width CTAs |
| `lg` | Hero / onboarding |

## Accessibility

- Always provide meaningful `label`
- Use `accessibilityLabel` when label text is abbreviated
- `loading` and `disabled` props set `accessibilityState`

## Do not

- Create one-off gold buttons with local styles
- Mix ALL CAPS and Title Case on the same screen (PrimaryButton labels are uppercase except `ghost`)

## Commerce exceptions

`AddToCartControl` keeps custom stepper styling for Flipkart-style ADD/−/+ — that is intentional.
