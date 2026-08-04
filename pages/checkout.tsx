import React, { useState } from 'react'

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<null | { orderId: string; upiLink: string; qrDataUrl: string }>(null)

  // sample cart items (replace with your cart state)
  const items = [
    { title: 'Sample Product A', unitPrice: 1999, quantity: 1 },
  ]

  async function handlePay() {
    setLoading(true)
    setResult(null)
    try {
      const resp = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      })
      const data = await resp.json()
      if (!resp.ok) throw new Error(data?.error || 'Failed')
      setResult(data)
    } catch (e) {
      alert('Payment initiation failed: ' + (e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-semibold">Checkout (UPI deeplink)</h1>

      <div className="mt-4 bg-white p-4 rounded shadow">
        <h2 className="font-medium">Cart</h2>
        <ul className="mt-2">
          {items.map((it, i) => (
            <li key={i} className="flex justify-between">
              <span>{it.title} x {it.quantity}</span>
              <span>₹{(it.unitPrice * it.quantity / 100).toFixed(2)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4">
          <button onClick={handlePay} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
            {loading ? 'Preparing...' : 'Pay with UPI'}
          </button>
        </div>
      </div>

      {result && (
        <div className="mt-6 bg-white p-4 rounded shadow">
          <h3 className="font-medium">Pay using your UPI app</h3>
          <p className="mt-2">Order: <code>{result.orderId}</code></p>
          <p className="mt-2">UPI Link: <a href={result.upiLink} className="text-blue-600">Open in UPI app</a></p>
          <div className="mt-4">
            <img src={result.qrDataUrl} alt="UPI QR code" />
          </div>
          <p className="mt-2 text-sm text-gray-600">After completing payment in your UPI app, mark the order as paid in admin or implement reconciliation later. This scaffold does not auto-confirm payments.</p>
        </div>
      )}
    </main>
  )
}
