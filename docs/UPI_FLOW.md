<!-- Documentation: UPI flow and admin reconciliation -->

# UPI Deeplink payment flow

This branch uses a simple UPI deeplink + QR approach for payments (no gateway). The flow is:

1. Client calls POST /api/checkout with cart items.
2. Server creates an Order in the database and returns a UPI deeplink and QR data URL for the payer to scan.
3. Buyer completes payment in their UPI app (no automatic confirmation).
4. Admin manually marks order as paid in the Admin UI, or you implement reconciliation later.

Notes and next steps
- For production you should integrate a gateway (Razorpay/Cashfree/others) for automatic confirmation and refunds.
- Secure admin routes and require sign-in (NextAuth) before allowing order status changes.
