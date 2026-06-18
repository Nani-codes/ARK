# Contributing to ARK

## Setup

```bash
# CMS (Strapi)
cd cms && cp .env.example .env && npm install && npm run develop

# Mobile (Expo)
cd mobile && cp .env.example .env && npm install && npm start
```

## Branch naming

- `feature/short-description`
- `fix/short-description`

## Before opening a PR

1. `cd mobile && npx tsc --noEmit`
2. `cd cms && npm run build`
3. Describe manual test steps in the PR body

## Issue workflow

See [docs/TRIAGE.md](./docs/TRIAGE.md) for priorities and labels.

Use GitHub issue templates under `.github/ISSUE_TEMPLATE/`.

## CMS content changes

Non-developers should follow [cms/CONTENT-EDITING.md](./cms/CONTENT-EDITING.md).

## Mobile conventions

- Theme tokens from `mobile/lib/theme.ts`
- CTAs via `PrimaryButton` — see `mobile/docs/CTA-GUIDELINES.md`
- Logo via `Logo` component — see `docs/BRAND.md`
