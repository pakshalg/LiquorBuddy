export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  description?: string;
  imageUrl?: string;
  abv?: number;
  size: string;
  type?: string;
  country?: string;
  category: Category;
}

export interface InventoryItem {
  id: string;
  quantity: number;
  price: number;
  inStock: boolean;
  featured: boolean;
  storeId: string;
  productId: string;
  product: Product;
  updatedAt: string;
}

export interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  lat: number;
  lng: number;
  imageUrl?: string;
  description?: string;
  hours: string; // JSON string
  rating: number;
  reviewCount: number;
  productCount?: number;
  distance?: number | null;
}

export interface ParsedHours {
  mon: string; tue: string; wed: string; thu: string;
  fri: string; sat: string; sun: string;
}

export interface CartItem {
  inventoryId: string;
  product: Product;
  price: number;
  quantity: number;
  storeId: string;
  storeName: string;
}

export interface Order {
  id: string;
  status: string;
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  notes?: string;
  address?: string;
  createdAt: string;
  store: Pick<Store, 'id' | 'name' | 'address'>;
  items: OrderItem[];
  user?: { id: string; name: string; email: string };
}

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: Product;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}
