import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import prisma from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session) return res.status(401).json({ error: 'unauthenticated' })

  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })

  try {
    const { orderId } = req.body as { orderId?: string }
    if (!orderId) return res.status(400).json({ error: 'orderId_required' })

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { paid: true }
    })

    res.status(200).json(order)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'internal_error' })
  }
}
