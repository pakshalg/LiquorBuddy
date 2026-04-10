import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: Props) {
  const { items, removeItem, updateQty, total, count, storeName } = useCart();
  const navigate = useNavigate();

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-bold">Your Cart</h2>
            {storeName && <p className="text-xs text-gray-500">{storeName}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="text-center text-gray-400 py-16">
              <div className="text-5xl mb-4">🛒</div>
              <p>Your cart is empty</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.inventoryId} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.product.name}</p>
                  <p className="text-xs text-gray-500">{item.product.size} · ${item.price.toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQty(item.inventoryId, item.quantity - 1)}
                    className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                  >−</button>
                  <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.inventoryId, item.quantity + 1)}
                    className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                  >+</button>
                </div>
                <div className="text-right min-w-[60px]">
                  <p className="font-semibold text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                  <button
                    onClick={() => removeItem(item.inventoryId)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >Remove</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {count > 0 && (
          <div className="border-t px-6 py-4 space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal ({count} items)</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Delivery fee</span>
              <span>$4.99</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax (8.75%)</span>
              <span>${(total * 0.0875).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-1 border-t">
              <span>Total</span>
              <span>${(total + 4.99 + total * 0.0875).toFixed(2)}</span>
            </div>
            <button
              onClick={() => { onClose(); navigate('/checkout'); }}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white py-3 rounded-xl font-semibold transition-colors"
            >
              Go to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
