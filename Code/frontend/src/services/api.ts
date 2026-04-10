import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Stores
export const getStores = (params?: { lat?: number; lng?: number; radius?: number; q?: string }) =>
  api.get('/stores', { params }).then((r) => r.data);

export const getStore = (id: string) => api.get(`/stores/${id}`).then((r) => r.data);

// Categories
export const getCategories = () => api.get('/categories').then((r) => r.data);

// Products
export const getProducts = (params?: { category?: string; q?: string }) =>
  api.get('/products', { params }).then((r) => r.data);

// Inventory
export const getStoreInventory = (
  storeId: string,
  params?: { category?: string; inStock?: boolean; q?: string }
) => api.get(`/inventory/store/${storeId}`, { params }).then((r) => r.data);

export const addInventoryItem = (data: {
  storeId: string;
  productId: string;
  quantity: number;
  price: number;
  featured?: boolean;
}) => api.post('/inventory', data).then((r) => r.data);

export const updateInventoryItem = (
  id: string,
  data: { quantity?: number; price?: number; featured?: boolean }
) => api.patch(`/inventory/${id}`, data).then((r) => r.data);

export const deleteInventoryItem = (id: string) =>
  api.delete(`/inventory/${id}`).then((r) => r.data);

// Orders
export const createOrder = (data: {
  storeId: string;
  items: { inventoryId: string; quantity: number }[];
  address: string;
  notes?: string;
}) => api.post('/orders', data).then((r) => r.data);

export const getOrders = () => api.get('/orders').then((r) => r.data);
export const getAdminOrders = () => api.get('/orders', { params: { all: 'true' } }).then((r) => r.data);
export const getOrder = (id: string) => api.get(`/orders/${id}`).then((r) => r.data);
export const updateOrderStatus = (id: string, status: string) =>
  api.patch(`/orders/${id}/status`, { status }).then((r) => r.data);

// Auth
export const login = (email: string, password: string) =>
  api.post('/auth/login', { email, password }).then((r) => r.data);

export const register = (data: { email: string; password: string; name: string; phone?: string }) =>
  api.post('/auth/register', data).then((r) => r.data);

export const getMe = () => api.get('/auth/me').then((r) => r.data);

// Alerts
export const createAlert = (productId: string, type = 'back_in_stock') =>
  api.post('/alerts', { productId, type }).then((r) => r.data);

export const deleteAlert = (id: string) => api.delete(`/alerts/${id}`).then((r) => r.data);

export const getAlerts = () => api.get('/alerts').then((r) => r.data);

export default api;
