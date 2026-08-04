import { getServerSession } from 'next-auth/next'
import { authOptions } from '../api/auth/[...nextauth]'
import type { GetServerSideProps } from 'next'
import useSWR from 'swr'
import { useState } from 'react'
import prisma from '../../lib/prisma'

type OrderItem = {
  id: string
  productId: string
  title: string
  unitPrice: number
  quantity: number
}

type Order = {
  id: string
  total: number
  currency: string
  paid: boolean
  createdAt: string
  items: OrderItem[]
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function AdminPage() {
  const { data, mutate } = useSWR<Order[]>('/api/admin/orders', fetcher)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function markPaid(orderId: string) {
    setLoadingId(orderId)
    try {
      const res = await fetch('/api/admin/mark-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      })
      if (!res.ok) throw new Error('Failed')
      await mutate()
    } catch (e) {
      alert('Failed to mark paid')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h2 className="text-xl font-semibold">Admin — Orders</h2>

      <div className="mt-4">
        {!data && <p>Loading orders…</p>}
        {data && data.length === 0 && <p>No orders yet.</p>}
        {data && data.map(o => (
          <div key={o.id} className="p-4 bg-white rounded shadow mb-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">Order {o.id}</p>
                <p className="text-sm text-gray-600">Created: {new Date(o.createdAt).toLocaleString()}</p>
                <p className="mt-2">Total: ₹{(o.total / 100).toFixed(2)} — {o.currency}</p>
                <p className="mt-2">Status: {o.paid ? 'Paid' : 'Pending'}</p>
                <ul className="mt-2">
                  {o.items.map(it => (
                    <li key={it.id} className="text-sm">{it.title} x {it.quantity} — ₹{(it.unitPrice / 100).toFixed(2)}</li>
                  ))}
                </ul>
              </div>
              <div>
                {!o.paid && (
                  <button onClick={() => markPaid(o.id)} disabled={loadingId === o.id} className="px-3 py-2 bg-green-600 text-white rounded">
                    {loadingId === o.id ? 'Marking…' : 'Mark as paid'}
                  </button>
                )}
              </div>
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
