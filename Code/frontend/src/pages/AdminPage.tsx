import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getAdminOrders,
  updateOrderStatus,
  getStores,
  getStoreInventory,
  getProducts,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from '../services/api';
import { Order, Store, InventoryItem, Product } from '../types';
import { getSocket } from '../services/socket';

type Tab = 'orders' | 'inventory';

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
  'cancelled',
] as const;

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  preparing: 'bg-purple-50 text-purple-700 border-purple-200',
  out_for_delivery: 'bg-orange-50 text-orange-700 border-orange-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
};

// ─── ORDERS TAB ─────────────────────────────────────────────────────────────

function OrdersTab() {
  const [orders, setOrders] = useState<(Order & { user?: { name: string; email: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const loadOrders = useCallback(() => {
    getAdminOrders().then((data) => {
      setOrders(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Live order updates
  useEffect(() => {
    const socket = getSocket();
    socket.on('order:new', (order: Order) => {
      setOrders((prev) => [order, ...prev]);
    });
    socket.on('order:status', ({ orderId, status }: { orderId: string; status: string }) => {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    });
    return () => {
      socket.off('order:new');
      socket.off('order:status');
    };
  }, []);

  async function handleStatusChange(orderId: string, status: string) {
    setUpdating(orderId);
    try {
      await updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    } finally {
      setUpdating(null);
    }
  }

  const filtered = statusFilter ? orders.filter((o) => o.status === statusFilter) : orders;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 mb-6 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              statusFilter === '' ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            All ({orders.length})
          </button>
          {ORDER_STATUSES.map((s) => {
            const count = orders.filter((o) => o.status === s).length;
            if (count === 0) return null;
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  statusFilter === s
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {STATUS_LABEL[s]} ({count})
              </button>
            );
          })}
        </div>
        <button
          onClick={loadOrders}
          className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📋</div>
          <p>No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <div key={order.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex flex-wrap gap-4 items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-gray-900">{order.store.name}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </div>
                  {order.user && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {order.user.name} · {order.user.email}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: 'numeric', minute: '2-digit',
                    })}
                  </p>
                </div>

                {/* Status changer */}
                <div className="flex items-center gap-2">
                  <select
                    value={order.status}
                    disabled={updating === order.id}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white disabled:opacity-50"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                    ))}
                  </select>
                  {updating === order.id && (
                    <svg className="animate-spin w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  )}
                </div>
              </div>

              <div className="text-xs text-gray-600 space-y-0.5 mb-2">
                {order.items.map((item) => (
                  <span key={item.id} className="inline-block mr-3">
                    {item.product.name} ×{item.quantity}
                  </span>
                ))}
              </div>

              <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-2">
                {order.address && <span className="truncate max-w-[60%]">📍 {order.address}</span>}
                <span className="font-bold text-gray-900 ml-auto">${order.total.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── INVENTORY TAB ───────────────────────────────────────────────────────────

interface EditingState {
  id: string;
  quantity: string;
  price: string;
  featured: boolean;
}

function InventoryTab() {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingInv, setLoadingInv] = useState(false);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ productId: '', quantity: '', price: '' });
  const [addError, setAddError] = useState('');

  useEffect(() => {
    getStores().then(setStores);
    getProducts().then(setAllProducts);
  }, []);

  useEffect(() => {
    if (!selectedStore) return;
    setLoadingInv(true);
    getStoreInventory(selectedStore)
      .then(setInventory)
      .finally(() => setLoadingInv(false));
  }, [selectedStore]);

  // Available products not yet in this store's inventory
  const existingProductIds = new Set(inventory.map((i) => i.productId));
  const addableProducts = allProducts.filter((p) => !existingProductIds.has(p.id));

  async function handleSave() {
    if (!editing) return;
    setSaving(true);
    try {
      const updated = await updateInventoryItem(editing.id, {
        quantity: parseInt(editing.quantity),
        price: parseFloat(editing.price),
        featured: editing.featured,
      });
      setInventory((prev) => prev.map((i) => (i.id === editing.id ? updated : i)));
      setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Remove this item from inventory?')) return;
    setDeleting(id);
    try {
      await deleteInventoryItem(id);
      setInventory((prev) => prev.filter((i) => i.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError('');
    if (!addForm.productId || !addForm.quantity || !addForm.price) {
      setAddError('All fields are required.');
      return;
    }
    try {
      const item = await addInventoryItem({
        storeId: selectedStore,
        productId: addForm.productId,
        quantity: parseInt(addForm.quantity),
        price: parseFloat(addForm.price),
      });
      setInventory((prev) => [...prev, item]);
      setAddForm({ productId: '', quantity: '', price: '' });
      setShowAddForm(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setAddError(msg || 'Failed to add item.');
    }
  }

  return (
    <div>
      {/* Store selector */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <select
          value={selectedStore}
          onChange={(e) => { setSelectedStore(e.target.value); setEditing(null); setShowAddForm(false); }}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white min-w-[220px]"
        >
          <option value="">Select a store...</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {selectedStore && (
          <button
            onClick={() => { setShowAddForm((v) => !v); setEditing(null); }}
            className="ml-auto flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && selectedStore && (
        <form onSubmit={handleAdd} className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-5 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-700 mb-1">Product</label>
            <select
              value={addForm.productId}
              onChange={(e) => setAddForm((f) => ({ ...f, productId: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
            >
              <option value="">Choose product...</option>
              {addableProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.size}) — {p.category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-28">
            <label className="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              min="0"
              value={addForm.quantity}
              onChange={(e) => setAddForm((f) => ({ ...f, quantity: e.target.value }))}
              placeholder="0"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div className="w-28">
            <label className="block text-xs font-medium text-gray-700 mb-1">Price ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={addForm.price}
              onChange={(e) => setAddForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="0.00"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setAddError(''); }}
              className="bg-white border border-gray-200 text-gray-600 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
          {addError && (
            <p className="w-full text-xs text-red-600">{addError}</p>
          )}
        </form>
      )}

      {!selectedStore ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-4xl mb-3">🏪</div>
          <p>Select a store to manage its inventory.</p>
        </div>
      ) : loadingInv ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : inventory.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📦</div>
          <p>No inventory yet. Add some products.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-200">
                <th className="text-left pb-3 pr-4 font-medium">Product</th>
                <th className="text-left pb-3 pr-4 font-medium">Category</th>
                <th className="text-right pb-3 pr-4 font-medium">Price</th>
                <th className="text-right pb-3 pr-4 font-medium">Qty</th>
                <th className="text-center pb-3 pr-4 font-medium">In Stock</th>
                <th className="text-center pb-3 pr-4 font-medium">Featured</th>
                <th className="text-right pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {inventory.map((item) => {
                const isEditing = editing?.id === item.id;
                return (
                  <tr key={item.id} className={`${isEditing ? 'bg-brand-50' : 'bg-white hover:bg-gray-50'} transition-colors`}>
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-gray-900 leading-snug">{item.product.name}</p>
                      <p className="text-xs text-gray-400">{item.product.brand} · {item.product.size}</p>
                    </td>
                    <td className="py-3 pr-4 text-gray-500">{item.product.category.name}</td>

                    {/* Price */}
                    <td className="py-3 pr-4 text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editing.price}
                          onChange={(e) => setEditing({ ...editing, price: e.target.value })}
                          className="w-20 border border-brand-300 rounded-lg px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-brand-400"
                        />
                      ) : (
                        <span className="font-medium">${item.price.toFixed(2)}</span>
                      )}
                    </td>

                    {/* Quantity */}
                    <td className="py-3 pr-4 text-right">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          value={editing.quantity}
                          onChange={(e) => setEditing({ ...editing, quantity: e.target.value })}
                          className="w-16 border border-brand-300 rounded-lg px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-brand-400"
                        />
                      ) : (
                        <span className={item.quantity === 0 ? 'text-red-500 font-medium' : ''}>{item.quantity}</span>
                      )}
                    </td>

                    {/* In Stock */}
                    <td className="py-3 pr-4 text-center">
                      <span className={`inline-block w-2 h-2 rounded-full ${item.inStock ? 'bg-green-500' : 'bg-red-400'}`} />
                    </td>

                    {/* Featured */}
                    <td className="py-3 pr-4 text-center">
                      {isEditing ? (
                        <input
                          type="checkbox"
                          checked={editing.featured}
                          onChange={(e) => setEditing({ ...editing, featured: e.target.checked })}
                          className="accent-brand-600"
                        />
                      ) : (
                        <span className="text-gray-400">{item.featured ? '★' : '—'}</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={handleSave}
                            disabled={saving}
                            className="text-xs bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white px-3 py-1 rounded-lg font-medium transition-colors"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => setEditing(null)}
                            className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditing({
                              id: item.id,
                              quantity: String(item.quantity),
                              price: item.price.toFixed(2),
                              featured: item.featured,
                            })}
                            className="text-xs text-brand-600 hover:text-brand-700 px-3 py-1 rounded-lg border border-brand-200 hover:bg-brand-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deleting === item.id}
                            className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 px-3 py-1 rounded-lg border border-red-200 hover:bg-red-50"
                          >
                            {deleting === item.id ? '...' : 'Remove'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── ADMIN PAGE ──────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('orders');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (!isAdmin) { navigate('/'); }
  }, [user, isAdmin, navigate]);

  if (!user || !isAdmin) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Manage orders and store inventory.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {([
          { key: 'orders', label: '📋 Orders' },
          { key: 'inventory', label: '📦 Inventory' },
        ] as { key: Tab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-5 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              tab === key
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'orders' && <OrdersTab />}
      {tab === 'inventory' && <InventoryTab />}
    </div>
  );
}
