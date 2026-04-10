import { Link } from 'react-router-dom';
import { Store } from '../types';

interface Props {
  store: Store;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5 text-yellow-400 text-xs">
      {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
      <span className="text-gray-500 ml-1">{rating.toFixed(1)}</span>
    </span>
  );
}

export default function StoreCard({ store }: Props) {
  const hours: Record<string, string> = JSON.parse(store.hours);
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const today = days[new Date().getDay()];
  const todayHours = hours[today] ?? 'Closed';

  return (
    <Link
      to={`/store/${store.id}`}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group"
    >
      {/* Store image / placeholder */}
      <div className="h-36 bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center relative overflow-hidden">
        {store.imageUrl ? (
          <img src={store.imageUrl} alt={store.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-6xl select-none">🍾</span>
        )}
        {store.distance != null && (
          <span className="absolute top-2 right-2 bg-white/90 text-gray-700 text-xs px-2 py-1 rounded-full font-medium">
            {store.distance.toFixed(1)} mi
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col gap-1">
        <h3 className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{store.name}</h3>
        <p className="text-xs text-gray-500">{store.address}, {store.city}</p>
        <StarRating rating={store.rating} />
        <p className="text-xs text-gray-400 mt-auto pt-2">
          Today: <span className="text-gray-600 font-medium">{todayHours}</span>
          {store.productCount !== undefined && (
            <span className="ml-2 text-gray-400">· {store.productCount} items</span>
          )}
        </p>
      </div>
    </Link>
  );
}
