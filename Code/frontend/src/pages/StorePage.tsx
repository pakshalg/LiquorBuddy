import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getStore, getStoreInventory, getCategories } from '../services/api';
import { watchStore, unwatchStore, getSocket } from '../services/socket';
import { Store, InventoryItem, Category } from '../types';
import InventoryGrid from '../components/InventoryGrid';

export default function StorePage() {
  const { id } = useParams<{ id: string }>();
  const [store, setStore] = useState<Store | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [liveUpdates, setLiveUpdates] = useState<Set<string>>(new Set());
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  // Fetch store + inventory
  useEffect(() => {
    if (!id) return;
    Promise.all([getStore(id), getStoreInventory(id)]).then(([s, inv]) => {
      setStore(s);
      setInventory(inv);
      setLoading(false);
    });
  }, [id]);

  // Re-fetch inventory when filters change
  useEffect(() => {
    if (!id) return;
    getStoreInventory(id, {
      category: category || undefined,
      inStock: inStockOnly ? true : undefined,
      q: search || undefined,
    }).then(setInventory);
  }, [id, category, inStockOnly, search]);

  // Socket.io — watch this store for live inventory updates
  const handleInventoryUpdate = useCallback((updated: InventoryItem) => {
    setInventory((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    // Flash the updated card
    setLiveUpdates((prev) => new Set([...prev, updated.id]));
    setTimeout(() => {
      setLiveUpdates((prev) => {
        const next = new Set(prev);
        next.delete(updated.id);
        return next;
      });
    }, 3000);
  }, []);

  useEffect(() => {
    if (!id) return;
    watchStore(id);
    const socket = getSocket();
    socket.on('inventory:update', handleInventoryUpdate);
    socket.on('inventory:removed', ({ id: removedId }: { id: string }) => {
      setInventory((prev) => prev.filter((i) => i.id !== removedId));
    });
    return () => {
      unwatchStore(id);
      socket.off('inventory:update', handleInventoryUpdate);
      socket.off('inventory:removed');
    };
  }, [id, handleInventoryUpdate]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex items-center justify-center">
        <svg className="animate-spin w-10 h-10 text-brand-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      </div>
    );
  }

  if (!store) return <div className="text-center py-20 text-gray-500">Store not found.</div>;

  const hours: Record<string, string> = JSON.parse(store.hours);
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
  const dayLabels: Record<string, string> = { sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat' };
  const todayKey = days[new Date().getDay()];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <Link to="/" className="text-sm text-brand-600 hover:underline mb-4 inline-block">← Back to stores</Link>

      {/* Store header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6 flex flex-col md:flex-row gap-6">
        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0">
          <span className="text-4xl">🍾</span>
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-gray-900">{store.name}</h1>
          <p className="text-gray-500 text-sm">{store.address}, {store.city}, {store.state} {store.zip}</p>
          {store.description && <p className="text-sm text-gray-600 mt-1">{store.description}</p>}
          <div className="flex flex-wrap gap-3 mt-3">
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{store.phone}</span>
            <span className="text-xs bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full">
              ⭐ {store.rating.toFixed(1)} ({store.reviewCount} reviews)
            </span>
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${
              hours[todayKey] === 'Closed' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
            }`}>
              Today: {hours[todayKey]}
            </span>
          </div>
        </div>
        {/* Hours table */}
        <div className="text-xs text-gray-500 grid grid-cols-2 gap-x-6 gap-y-0.5 self-start">
          {days.map((d) => (
            <div key={d} className={`flex gap-2 ${d === todayKey ? 'font-bold text-gray-800' : ''}`}>
              <span className="w-8">{dayLabels[d]}</span>
              <span>{hours[d] ?? 'Closed'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-2 mb-4 text-xs text-green-600">
        <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        Live inventory — updates in real time
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2 pl-9 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setCategory('')}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
              category === ''
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              onClick={() => setCategory(c.slug)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                category === c.slug
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer ml-auto">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="rounded accent-brand-600"
          />
          In stock only
        </label>
      </div>

      {/* Inventory grid */}
      <InventoryGrid items={inventory} store={store} liveUpdates={liveUpdates} />
    </div>
  );
}
