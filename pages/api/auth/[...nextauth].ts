import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import prisma from '../../../lib/prisma'

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async signIn({ user }) {
      try {
        const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)
        const role = adminEmails.includes(user.email ?? '') ? 'ADMIN' : 'USER'

        await prisma.user.upsert({
          where: { email: user.email ?? '' },
          update: { name: user.name ?? undefined, role },
          create: { email: user.email ?? '', name: user.name ?? undefined, role }
        })

        return true
      } catch (err) {
        console.error('signIn upsert user error', err)
        // allow sign-in even if DB upsert fails
        return true
      }
    },
    async session({ session }) {
      if (session?.user?.email) {
        try {
          const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } })
          if (dbUser) {
            // attach role to session.user
            ;(session.user as any).role = dbUser.role
          }
        } catch (err) {
          console.error('session callback error', err)
        }
      }
      return session
    }
  }
}

export default NextAuth(authOptions)
