# ARK WhatsApp templates (Twilio)

Transactional WhatsApp messages use Twilio **Content Templates** with numbered variables (`{{1}}`, `{{2}}`, …).

## Template registry

ContentSids are stored in [`src/config/twilio-template-sids.json`](../src/config/twilio-template-sids.json).

- **Env vars override JSON** — e.g. `TWILIO_TEMPLATE_OTP` in `cms/.env`
- **OTP is pre-assigned** — `HX229f5a04fd0510ce1b071852155d3e75`

## All templates

| Event | Friendly name | Variables | Message |
|-------|---------------|-----------|---------|
| `otp` | `ark_otp_login` | `1`=OTP | Your ARK login code is {{1}}. Valid for 10 minutes. Do not share this code. |
| `order_placed` | `ark_order_placed` | `1`=order#, `2`=total, `3`=ETA | Order {{1}} placed successfully! Total: {{2}}. Estimated delivery: {{3}}. Track in the ARK app. |
| `order_confirmed` | `ark_order_confirmed` | `1`=order#, `2`=ETA | Order {{1}} is confirmed. Estimated delivery: {{2}}. |
| `order_out_for_delivery` | `ark_order_out_for_delivery` | `1`=order#, `2`=ETA | Order {{1}} is out for delivery. ETA: {{2}}. |
| `order_delivered` | `ark_order_delivered` | `1`=order# | Order {{1}} has been delivered. Thank you for shopping with ARK! |
| `order_cancelled` | `ark_order_cancelled` | `1`=order# | Order {{1}} has been cancelled. Contact ARK support if you need help. |
| `quote_received` | `ark_quote_received` | `1`=product, `2`=qty+unit | We received your bulk quote request for {{1}} ({{2}}). Our team will contact you within 2 hours. |
| `quote_contacted` | `ark_quote_contacted` | `1`=product | Our procurement team is reviewing your quote for {{1}} and will call you shortly. |
| `quote_quoted` | `ark_quote_quoted` | `1`=product, `2`=price | Your bulk quote for {{1}} is ready: {{2}}. Open the ARK app to view details. |
| `quote_closed` | `ark_quote_closed` | `1`=product | Your quote request for {{1}} has been closed. Contact us anytime for a new quote. |
| `return_received` | `ark_return_received` | `1`=order#, `2`=product | Return request received for {{2}} (Order {{1}}). We will review and update you soon. |
| `return_approved` | `ark_return_approved` | `1`=order# | Return approved for Order {{1}}. Please keep the item ready for pickup. |
| `return_rejected` | `ark_return_rejected` | `1`=order# | Return request for Order {{1}} could not be approved. Check the ARK app for details. |
| `return_completed` | `ark_return_completed` | `1`=order# | Return for Order {{1}} is complete. Refund will be processed as per policy. |

Canonical definitions live in [`src/data/whatsapp-template-definitions.ts`](../src/data/whatsapp-template-definitions.ts).

## Provision templates in Twilio

### Option A — Script (recommended)

```bash
cd cms
# Add TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN to .env
npx tsx scripts/sync-twilio-templates.ts --dry-run
npx tsx scripts/sync-twilio-templates.ts --create --submit-whatsapp
```

This creates missing templates via the Content API and writes ContentSids to `twilio-template-sids.json`.

### Option B — Twilio Console

1. Go to **Messaging → Content Template Builder**
2. Create each template using the body text above
3. Submit for **WhatsApp** approval (category: Authentication for OTP, Utility for the rest)
4. Copy each `ContentSid` (HX…) into `twilio-template-sids.json` or `cms/.env`

## Sandbox testing (required first)

Twilio **accepted** your message but **delivery failed** with error **63015** if the phone has not joined the sandbox.

1. Open **Twilio Console → Messaging → Try it out → Send a WhatsApp message**
2. Note your sandbox keyword (e.g. `join happy-tiger-123`)
3. From **9553721960** (your test phone), open WhatsApp and send that join message to **+1 415 523 8886**
4. Wait for the confirmation reply from Twilio
5. Request OTP again in the ARK app

Sandbox sessions expire after **3 days** — rejoin if messages stop working.

If WhatsApp still fails, check Strapi logs for `[otp-fallback] OTP for +91 …` — the code is logged there for dev testing.

## Production

- Replace `TWILIO_WHATSAPP_FROM` with your approved WhatsApp Business number
- Ensure every template shows **Approved** under WhatsApp in Twilio Console
- Rotate auth token if it was ever exposed in chat or logs
