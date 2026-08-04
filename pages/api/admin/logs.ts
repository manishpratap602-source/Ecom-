import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import prisma from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || !session.user?.email) return res.status(401).json({ error: 'unauthenticated' })

  try {
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user || user.role !== 'ADMIN') return res.status(403).json({ error: 'forbidden' })

    const logs = await prisma.adminAction.findMany({
      include: { actor: { select: { id: true, email: true, name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 200
    })

    res.status(200).json(logs)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'internal_error' })
  }
}
