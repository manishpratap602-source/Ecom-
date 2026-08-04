# Ecom-

This repository will host a full-stack e-commerce application.

This initial commit contains minimal repository files. I will create a feature branch `feat/v2-plus` next and scaffold the V2+ starter (Next.js + TypeScript, Prisma, Stripe, Tailwind, NextAuth, inventory, coupons, shipping, reviews, admin UI, and CI). See the `feat/v2-plus` branch for scaffolded code after I finish.

Contents to be added in `feat/v2-plus`:
- Next.js (TypeScript) app
- Prisma schema (Postgres) with Inventory, Coupon, ShippingRate, Review models
- Seed scripts, API routes, Stripe webhook handler
- Admin UI pages for managing inventory, coupons, shipping, and reviews
- PWA manifest and service worker scaffold
- GitHub Actions workflow for lint/test

Local setup (after scaffold is pushed):
- node >= 18, pnpm/npm/yarn
- copy `.env.example` to `.env` and configure DATABASE_URL, NEXTAUTH_URL, STRIPE keys, etc.
- pnpm install
- pnpm prisma migrate dev --name init
- pnpm dev
