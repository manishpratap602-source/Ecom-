import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../lib/prisma'
import QRCode from 'qrcode'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth/[...nextauth]'
import { sendEmail } from '../../lib/mailer'

// POST /api/checkout
// body: { items: [{ productId, title, unitPrice, quantity }] }
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed')

  try {
    const { items } = req.body as { items: Array<{ productId?: string; title: string; unitPrice: number; quantity: number }> }
    if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'No items provided' })

    // Calculate total
    const total = items.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0)

    // Attach user if signed in
    const session = await getServerSession(req, res, authOptions)
    const userEmail = session?.user?.email

    const orderData: any = {
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

    if (userEmail) {
      // connect by unique email
      orderData.user = { connect: { email: userEmail } }
    }

    // Create order in DB
    const order = await prisma.order.create({ data: orderData })

    // Build UPI deeplink
    const payeeVpa = process.env.UPI_PAYEE_VPA || 'merchant@upi'
    const payeeName = process.env.UPI_PAYEE_NAME || 'Merchant'
    const amount = (total / 100).toFixed(2)
    const note = encodeURIComponent(`Order ${order.id}`)
    const upiLink = `upi://pay?pa=${encodeURIComponent(payeeVpa)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${note}`

    // Generate QR code data URL for the deeplink
    const qrDataUrl = await QRCode.toDataURL(upiLink)

    // Notify admins and buyer (if available)
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean)
    const orderHtml = `
      <p>Order <strong>${order.id}</strong> created</p>
      <p>Total: ₹${(order.total / 100).toFixed(2)}</p>
      <ul>
        ${items.map(it => `<li>${it.title} x ${it.quantity} — ₹${(it.unitPrice / 100).toFixed(2)}</li>`).join('')}
      </ul>
      <p><a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin">View orders</a></p>
    `

    if (adminEmails.length > 0) {
      await sendEmail({
        to: adminEmails,
        subject: `New order ${order.id} — ₹${(order.total / 100).toFixed(2)}`,
        html: orderHtml
      })
    }

    if (userEmail) {
      await sendEmail({
        to: userEmail,
        subject: `Order received — ${order.id}`,
        html: ` <p>Thanks for your order.</p> ${orderHtml}`
      })
    }

    // Return order id, deeplink, and QR data
    res.status(200).json({ orderId: order.id, upiLink, qrDataUrl })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'internal_error' })
  }
}
