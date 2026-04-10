import { createContext, useContext, useState, ReactNode } from 'react';
import { CartItem, InventoryItem, Store } from '../types';

interface CartCtx {
  items: CartItem[];
  storeId: string | null;
  storeName: string | null;
  addItem: (inv: InventoryItem, store: Store) => void;
  removeItem: (inventoryId: string) => void;
  updateQty: (inventoryId: string, qty: number) => void;
  clearCart: () => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartCtx>({} as CartCtx);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string | null>(null);

  function addItem(inv: InventoryItem, store: Store) {
    // Cart is single-store — warn if switching stores
    if (storeId && storeId !== store.id) {
      const ok = window.confirm(
        'Your cart has items from another store. Start a new cart for this store?'
      );
      if (!ok) return;
      setItems([]);
    }
    setStoreId(store.id);
    setStoreName(store.name);

    setItems((prev) => {
      const existing = prev.find((i) => i.inventoryId === inv.id);
      if (existing) {
        return prev.map((i) =>
          i.inventoryId === inv.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          inventoryId: inv.id,
          product: inv.product,
          price: inv.price,
          quantity: 1,
          storeId: store.id,
          storeName: store.name,
        },
      ];
    });
  }

  function removeItem(inventoryId: string) {
    setItems((prev) => {
      const next = prev.filter((i) => i.inventoryId !== inventoryId);
      if (next.length === 0) { setStoreId(null); setStoreName(null); }
      return next;
    });
  }

  function updateQty(inventoryId: string, qty: number) {
    if (qty <= 0) { removeItem(inventoryId); return; }
    setItems((prev) => prev.map((i) => i.inventoryId === inventoryId ? { ...i, quantity: qty } : i));
  }

  function clearCart() {
    setItems([]);
    setStoreId(null);
    setStoreName(null);
  }

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, storeId, storeName, addItem, removeItem, updateQty, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
