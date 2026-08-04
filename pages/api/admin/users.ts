import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import prisma from '../../../lib/prisma'

// GET: list users
// POST: { email, role } -> upsert or update user's role
// DELETE: { email } -> set role to USER (demote)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session || !session.user?.email) return res.status(401).json({ error: 'unauthenticated' })

  try {
    const actingUser = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!actingUser || actingUser.role !== 'ADMIN') return res.status(403).json({ error: 'forbidden' })

    if (req.method === 'GET') {
      const users = await prisma.user.findMany({ select: { id: true, email: true, name: true, role: true, createdAt: true } })
      return res.status(200).json(users)
    }

    if (req.method === 'POST') {
      const { email, role } = req.body as { email?: string; role?: 'ADMIN' | 'USER' }
      if (!email || !role) return res.status(400).json({ error: 'email_and_role_required' })

      const user = await prisma.user.upsert({
        where: { email },
        update: { role },
        create: { email, role }
      })

      return res.status(200).json(user)
    }

    if (req.method === 'DELETE') {
      const { email } = req.body as { email?: string }
      if (!email) return res.status(400).json({ error: 'email_required' })

      const user = await prisma.user.updateMany({ where: { email }, data: { role: 'USER' } })
      return res.status(200).json({ success: true, count: user.count })
    }

    return res.status(405).json({ error: 'method_not_allowed' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'internal_error' })
  }
}
