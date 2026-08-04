import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../api/auth/[...nextauth]'
import type { GetServerSideProps } from 'next'
import useSWR from 'swr'
import prisma from '../../lib/prisma'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function AdminLogsPage() {
  const { data } = useSWR('/api/admin/logs', fetcher)

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h2 className="text-xl font-semibold">Admin — Audit Logs</h2>

      <div className="mt-4">
        {!data && <p>Loading logs…</p>}
        {data && data.length === 0 && <p>No logs yet.</p>}
        {data && data.map((l: any) => (
          <div key={l.id} className="p-3 bg-white rounded shadow mb-2">
            <div className="text-sm text-gray-700">{new Date(l.createdAt).toLocaleString()}</div>
            <div className="mt-1 font-medium">{l.action}</div>
            <div className="text-sm">Actor: {l.actor?.email ?? 'unknown'}</div>
            <div className="text-sm">Target: {l.target ?? '-'}</div>
            <div className="text-sm text-gray-600">Details: {l.details ?? '-'}</div>
          </div>
        ))}
      </div>
    </main>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req as any, context.res as any, authOptions)
  if (!session) {
    return {
      redirect: {
        destination: '/api/auth/signin',
        permanent: false
      }
    }
  }

  // verify admin role
  const user = await prisma.user.findUnique({ where: { email: session.user.email } })
  if (!user || user.role !== 'ADMIN') {
    return {
      redirect: {
        destination: '/',
        permanent: false
      }
    }
  }

  return { props: {} }
}
