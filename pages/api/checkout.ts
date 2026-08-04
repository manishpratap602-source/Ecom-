import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../lib/prisma'
import QRCode from 'qrcode'

// POST /api/checkout
// body: { items: [{ productId, title, unitPrice, quantity }] }
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed')

  try {
    const { items } = req.body as { items: Array<{ productId?: string; title: string; unitPrice: number; quantity: number }> }
    if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'No items provided' })

    // Calculate total
    const total = items.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0)

    // Create order in DB
    const order = await prisma.order.create({
      data: {
        total,
        currency: 'INR',
        items: {
          create: items.map(it => ({
            productId: it.productId ?? '',
            title: it.title,
            unitPrice: it.unitPrice,
            quantity: it.quantity
          }))
        }
      }
    })

    // Build UPI deeplink
    // Example: upi://pay?pa=merchant@upi&pn=MerchantName&am=10.00&cu=INR&tn=Order+<id>
    const payeeVpa = process.env.UPI_PAYEE_VPA || 'merchant@upi'
    const payeeName = process.env.UPI_PAYEE_NAME || 'Merchant'
    const amount = (total / 100).toFixed(2) // total is in cents/paise? here we assume cents => rupees
    const note = encodeURIComponent(`Order ${order.id}`)
    const upiLink = `upi://pay?pa=${encodeURIComponent(payeeVpa)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${note}`

    // Generate QR code data URL for the deeplink
    const qrDataUrl = await QRCode.toDataURL(upiLink)

    // Return order id, deeplink, and QR data
    res.status(200).json({ orderId: order.id, upiLink, qrDataUrl })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'internal_error' })
  }
}
