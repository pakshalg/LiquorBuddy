import { useState, useEffect } from 'react';
import { useGeolocation } from '../hooks/useGeolocation';
import { getStores } from '../services/api';
import { Store } from '../types';
import StoreCard from '../components/StoreCard';
import StoreMap from '../components/StoreMap';

const RADIUS_OPTIONS = [5, 10, 25, 50];

export default function HomePage() {
  const { lat, lng, loading: geoLoading, error: geoError } = useGeolocation();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [radius, setRadius] = useState(10);
  const [search, setSearch] = useState('');
  const [mapView, setMapView] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, unknown> = { radius, q: search || undefined };
    if (lat && lng) { params.lat = lat; params.lng = lng; }
    getStores(params as Parameters<typeof getStores>[0])
      .then(setStores)
      .finally(() => setLoading(false));
  }, [lat, lng, radius, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
          Find liquor stores near you
        </h1>
        <p className="text-gray-500 text-lg">
          Live inventory · Fast delivery · Real-time stock updates
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <input
            type="text"
            placeholder="Search stores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <select
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
        >
          {RADIUS_OPTIONS.map((r) => (
            <option key={r} value={r}>{r} mi radius</option>
          ))}
        </select>

        <div className="flex rounded-xl overflow-hidden border border-gray-200">
          <button
            onClick={() => setMapView(true)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${mapView ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Map
          </button>
          <button
            onClick={() => setMapView(false)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${!mapView ? 'bg-brand-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            List
          </button>
        </div>
      </div>

      {/* Geo status */}
      {geoLoading && (
        <div className="mb-4 text-sm text-gray-400 flex items-center gap-2">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Getting your location...
        </div>
      )}
      {geoError && (
        <div className="mb-4 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          Location unavailable — showing all stores. ({geoError})
        </div>
      )}

      {/* Content */}
      {mapView ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Map */}
          <div className="lg:col-span-3 h-[520px]">
            <StoreMap stores={stores} userLat={lat} userLng={lng} />
          </div>

          {/* Store list alongside map */}
          <div className="lg:col-span-2 space-y-3 overflow-y-auto max-h-[520px] pr-1">
            {loading ? (
              <StoreSkeleton count={4} />
            ) : stores.length === 0 ? (
              <EmptyState />
            ) : (
              stores.map((s) => <StoreCard key={s.id} store={s} />)
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            <StoreSkeleton count={8} />
          ) : stores.length === 0 ? (
            <div className="col-span-full"><EmptyState /></div>
          ) : (
            stores.map((s) => <StoreCard key={s.id} store={s} />)
          )}
        </div>
      )}
    </div>
  );
}

function StoreSkeleton({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
          <div className="h-36 bg-gray-200" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
            <div className="h-3 bg-gray-100 rounded w-1/3" />
          </div>
        </div>
      ))}
    </>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20 text-gray-400">
      <div className="text-6xl mb-4">🗺️</div>
      <p className="text-lg font-medium">No stores found nearby</p>
      <p className="text-sm mt-1">Try increasing your search radius</p>
    </div>
  );
}
