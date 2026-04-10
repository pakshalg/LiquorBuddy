import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder } from '../services/api';

export default function CheckoutPage() {
  const { items, storeId, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState(user ? '' : '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-xl font-bold mb-2">Sign in to checkout</h2>
        <Link to="/login" className="inline-block mt-4 bg-brand-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-700">
          Sign in
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">🛒</div>
        <h2 className="text-xl font-bold mb-2">Your cart is empty</h2>
        <Link to="/" className="inline-block mt-4 text-brand-600 hover:underline">Browse stores</Link>
      </div>
    );
  }

  const tax = total * 0.0875;
  const deliveryFee = 4.99;
  const orderTotal = total + tax + deliveryFee;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) { setError('Delivery address is required'); return; }
    if (!storeId) return;

    setSubmitting(true);
    setError('');
    try {
      const order = await createOrder({
        storeId,
        items: items.map((i) => ({ inventoryId: i.inventoryId, quantity: i.quantity })),
        address,
        notes,
      });
      clearCart();
      navigate(`/orders?new=${order.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/" className="text-sm text-brand-600 hover:underline mb-6 inline-block">← Back</Link>
      <h1 className="text-2xl font-extrabold mb-6">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Order summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-lg mb-4">Order Summary</h2>
          <div className="space-y-3 mb-4">
            {items.map((item) => (
              <div key={item.inventoryId} className="flex items-center gap-3 text-sm">
                <span className="flex-1 text-gray-700">{item.product.name} <span className="text-gray-400">×{item.quantity}</span></span>
                <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-3 space-y-1.5 text-sm text-gray-600">
            <div className="flex justify-between"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Tax (8.75%)</span><span>${tax.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>Delivery fee</span><span>${deliveryFee.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-base text-gray-900 pt-1 border-t mt-1">
              <span>Total</span><span>${orderTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Delivery form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-bold text-lg">Delivery Details</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={user.name}
              disabled
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address *</label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main St, Miami, FL 33101"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Leave at door, buzz #2..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold text-base transition-colors"
          >
            {submitting ? 'Placing order...' : `Place Order · $${orderTotal.toFixed(2)}`}
          </button>
        </form>
      </div>
    </div>
  );
}
