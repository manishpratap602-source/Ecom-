import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import prisma from '../../../lib/prisma'
import { sendEmail } from '../../../lib/mailer'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || !session.user?.email) return res.status(401).json({ error: 'unauthenticated' })

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user || user.role !== 'ADMIN') return res.status(403).json({ error: 'forbidden' })

    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })

    const { orderId } = req.body as { orderId?: string }
    if (!orderId) return res.status(400).json({ error: 'orderId_required' })

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { paid: true },
      include: { user: true }
    })

    // audit log
    await prisma.adminAction.create({
      data: {
        actorId: user.id,
        action: 'mark_paid',
        target: orderId,
        details: `marked order ${orderId} as paid`
      }
    })

    // Notify buyer and admins
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean)
    const buyerEmail = order.user?.email
    const html = `
      <p>Order <strong>${order.id}</strong> has been marked as paid.</p>
      <p>Total: ₹${(order.total / 100).toFixed(2)}</p>
      <p>Marked by: ${user.email}</p>
      <p><a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin">View orders</a></p>
    `

    if (adminEmails.length > 0) {
      await sendEmail({ to: adminEmails, subject: `Order paid: ${order.id}`, html })
    }

    if (buyerEmail) {
      await sendEmail({ to: buyerEmail, subject: `Your order ${order.id} is paid`, html })
    }

    res.status(200).json(order)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'internal_error' })
  }
}
