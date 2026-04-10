import { InventoryItem, Store } from '../types';
import { useCart } from '../context/CartContext';
import { createAlert } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface Props {
  items: InventoryItem[];
  store: Store;
  liveUpdates: Set<string>; // ids that just updated
}

export default function InventoryGrid({ items, store, liveUpdates }: Props) {
  const { addItem } = useCart();
  const { user } = useAuth();

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <div className="text-5xl mb-3">📦</div>
        <p>No products match your filter.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => (
        <ProductCard
          key={item.id}
          item={item}
          store={store}
          onAdd={() => addItem(item, store)}
          onAlert={() => user && createAlert(item.productId)}
          hasUser={!!user}
          justUpdated={liveUpdates.has(item.id)}
        />
      ))}
    </div>
  );
}

interface CardProps {
  item: InventoryItem;
  store: Store;
  onAdd: () => void;
  onAlert: () => void;
  hasUser: boolean;
  justUpdated: boolean;
}

function ProductCard({ item, onAdd, onAlert, hasUser, justUpdated }: CardProps) {
  const { product } = item;

  return (
    <div
      className={`bg-white rounded-2xl border overflow-hidden flex flex-col transition-all duration-500 ${
        justUpdated ? 'ring-2 ring-brand-400 border-brand-300' : 'border-gray-100'
      } ${!item.inStock ? 'opacity-70' : ''}`}
    >
      {/* Image / placeholder */}
      <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <CategoryEmoji category={product.category.slug} />
        )}
        {item.featured && item.inStock && (
          <span className="absolute top-2 left-2 bg-brand-600 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">
            Featured
          </span>
        )}
        {!item.inStock && (
          <span className="absolute top-2 right-2 bg-gray-800/80 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
            Out of Stock
          </span>
        )}
        {justUpdated && (
          <span className="absolute bottom-2 right-2 bg-brand-600 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">
            Updated
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex-1 flex flex-col gap-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-600">
          {product.category.name}
          {product.type ? ` · ${product.type}` : ''}
        </p>
        <h3 className="font-bold text-sm text-gray-900 leading-snug">{product.name}</h3>
        <p className="text-xs text-gray-400">{product.brand} · {product.size}</p>
        {product.abv != null && product.abv > 0 && (
          <p className="text-xs text-gray-400">{product.abv}% ABV</p>
        )}
        {product.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{product.description}</p>
        )}

        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="font-bold text-base text-gray-900">${item.price.toFixed(2)}</span>
          <span className="text-xs text-gray-400">
            {item.inStock ? `${item.quantity} left` : ''}
          </span>
        </div>

        {item.inStock ? (
          <button
            onClick={onAdd}
            className="w-full mt-1 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white py-2 rounded-xl text-sm font-semibold transition-all"
          >
            Add to Cart
          </button>
        ) : (
          <button
            onClick={onAlert}
            disabled={!hasUser}
            title={hasUser ? 'Notify me when back in stock' : 'Sign in to set alerts'}
            className="w-full mt-1 border border-gray-300 text-gray-500 hover:border-brand-400 hover:text-brand-600 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Notify Me
          </button>
        )}
      </div>
    </div>
  );
}

function CategoryEmoji({ category }: { category: string }) {
  const map: Record<string, string> = {
    spirits: '🥃',
    beer: '🍺',
    wine: '🍷',
    mixers: '🧃',
    cider: '🍎',
  };
  return <span className="text-5xl select-none">{map[category] ?? '🍾'}</span>;
}
