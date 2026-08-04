import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../api/auth/[...nextauth]'
import type { GetServerSideProps } from 'next'
import useSWR from 'swr'
import { useState } from 'react'
import prisma from '../../lib/prisma'

type UserRow = { id: string; email: string; name?: string | null; role: 'USER' | 'ADMIN'; createdAt: string }

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function AdminUsersPage() {
  const { data, mutate } = useSWR<UserRow[]>('/api/admin/users', fetcher)
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null)
  const [newAdminEmail, setNewAdminEmail] = useState('')

  async function promote(email: string) {
    setLoadingEmail(email)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role: 'ADMIN' })
      })
      if (!res.ok) throw new Error('Failed')
      await mutate()
    } catch (e) {
      alert('Failed to promote')
    } finally {
      setLoadingEmail(null)
    }
  }

  async function demote(email: string) {
    setLoadingEmail(email)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      if (!res.ok) throw new Error('Failed')
      await mutate()
    } catch (e) {
      alert('Failed to demote')
    } finally {
      setLoadingEmail(null)
    }
  }

  async function addAdmin(e: React.FormEvent) {
    e.preventDefault()
    if (!newAdminEmail) return alert('Enter email')
    setLoadingEmail(newAdminEmail)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newAdminEmail, role: 'ADMIN' })
      })
      if (!res.ok) throw new Error('Failed')
      setNewAdminEmail('')
      await mutate()
    } catch (e) {
      alert('Failed to add admin')
    } finally {
      setLoadingEmail(null)
    }
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h2 className="text-xl font-semibold">Admin — Manage Admins</h2>

      <section className="mt-4 bg-white p-4 rounded shadow">
        <form onSubmit={addAdmin} className="flex gap-2">
          <input className="border p-2 flex-1" placeholder="email@example.com" value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} />
          <button className="px-3 py-2 bg-blue-600 text-white rounded" type="submit" disabled={!newAdminEmail || !!loadingEmail}>Add Admin</button>
        </form>
      </section>

      <div className="mt-6">
        {!data && <p>Loading users…</p>}
        {data && data.length === 0 && <p>No users yet.</p>}
        {data && data.map(u => (
          <div key={u.id} className="p-4 bg-white rounded shadow mb-3 flex justify-between items-center">
            <div>
              <p className="font-medium">{u.email} {u.name ? `— ${u.name}` : ''}</p>
              <p className="text-sm text-gray-600">Role: {u.role} • Joined: {new Date(u.createdAt).toLocaleString()}</p>
            </div>
            <div className="flex gap-2">
              {u.role !== 'ADMIN' ? (
                <button onClick={() => promote(u.email)} disabled={loadingEmail === u.email} className="px-3 py-2 bg-green-600 text-white rounded">Promote</button>
              ) : (
                <button onClick={() => demote(u.email)} disabled={loadingEmail === u.email} className="px-3 py-2 bg-red-600 text-white rounded">Demote</button>
              )}
            </div>
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
