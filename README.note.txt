Updated README: added UPI deeplink flow & Google OAuth notes.

- Added pages/checkout and API route pages/api/checkout
- Added NextAuth Google provider scaffold at pages/api/auth/[...nextauth].ts
- Added lib/prisma.ts singleton for Prisma client
- Replaced Stripe dependency with qrcode for QR generation

Be sure to add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, UPI_PAYEE_VPA, and UPI_PAYEE_NAME to your .env before running.
