import { Product } from './catalog';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:8000';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(API_BASE + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = Array.isArray(body?.detail) ? body.detail.map((d: { msg: string }) => d.msg).join(' ') : body?.detail || response.statusText;
    throw new ApiError(response.status, message || 'Request failed.');
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

function authHeaders(token: string): HeadersInit { return { Authorization: 'Bearer ' + token }; }

// --- Products ---
type ApiProduct = {
  id: number; slug: string; sku: string; product_name: string; description: string; price: string; mrp: string;
  image_url: string; color: string; fit: string; sleeve: string; is_new_drop: boolean; graphic: boolean;
  classification: string | null; worlds: string[] | null; gallery: string[] | null; sizes: string[]; stock_quantity: number; is_active: boolean;
};

export function toStoreProduct(p: ApiProduct): Product {
  return {
    id: p.slug, name: p.product_name, price: Math.round(Number(p.price)), mrp: Math.round(Number(p.mrp)),
    color: p.color, image: p.image_url, sleeve: p.sleeve, fit: p.fit, graphic: p.graphic, isNew: p.is_new_drop,
    sizes: p.sizes, description: p.description, classification: p.classification || undefined,
    worlds: p.worlds || undefined, gallery: p.gallery || undefined,
  };
}

export async function fetchProducts(): Promise<Product[]> {
  const products = await request<ApiProduct[]>('/api/products');
  return products.map(toStoreProduct);
}

// --- Orders ---
export type ApiOrderItemRequest = { product_slug: string; size: string; quantity: number };
export type ApiOrderRequest = {
  customer: { name: string; phone: string; email: string; street: string; city: string; state: string; pin: string };
  items: ApiOrderItemRequest[];
  payment_method: string;
  coupon?: string | null;
};
export type ApiOrder = {
  public_order_number: string; ship_name: string; ship_phone: string; ship_email: string; ship_street: string;
  ship_city: string; ship_state: string; ship_pincode: string; subtotal: string; discount: string; shipping_fee: string;
  tax: string; total_amount: string; payment_method: string; payment_status: string; order_status: string;
  created_at: string; items: { product_id: number; product_slug: string; product_name_snapshot: string; size: string; quantity: number; unit_price: string; total_price: string }[];
};

export function placeOrder(payload: ApiOrderRequest): Promise<ApiOrder> {
  return request('/api/orders', { method: 'POST', body: JSON.stringify(payload) });
}

export function fetchOrder(orderNumber: string): Promise<ApiOrder> {
  return request(`/api/orders/${encodeURIComponent(orderNumber)}`);
}

// --- Admin auth ---
export function adminLogin(email: string, password: string): Promise<{ access_token: string }> {
  return request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export function adminMe(token: string): Promise<{ id: number; name: string; email: string; role: string }> {
  return request('/api/auth/me', { headers: authHeaders(token) });
}

// --- Admin orders ---
export type ApiOrderSummary = {
  public_order_number: string; ship_name: string; ship_email: string; total_amount: string; payment_method: string;
  payment_status: string; order_status: string; item_count: number; created_at: string;
};
export type ApiPaginatedOrders = { total: number; page: number; page_size: number; items: ApiOrderSummary[] };

export function fetchAdminOrders(token: string, params: { status?: string; search?: string; page?: number; page_size?: number } = {}): Promise<ApiPaginatedOrders> {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.search) qs.set('search', params.search);
  qs.set('page', String(params.page || 1));
  qs.set('page_size', String(Math.min(params.page_size || 100, 100)));
  return request(`/api/admin/orders?${qs}`, { headers: authHeaders(token) });
}

export function fetchAdminOrder(token: string, orderNumber: string): Promise<ApiOrder> {
  return request(`/api/admin/orders/${encodeURIComponent(orderNumber)}`, { headers: authHeaders(token) });
}

export function updateAdminOrderStatus(token: string, orderNumber: string, orderStatus: string): Promise<ApiOrder> {
  return request(`/api/admin/orders/${encodeURIComponent(orderNumber)}/status`, {
    method: 'PATCH', headers: authHeaders(token), body: JSON.stringify({ order_status: orderStatus }),
  });
}

// --- Admin reports ---
export type ApiReport = {
  period: { start_date: string; end_date: string };
  summary: { total_sales: string; total_orders: number; completed_orders: number; cancelled_orders: number; items_sold: number; average_order_value: string };
  daily_sales: { date: string; orders: number; items_sold: number; sales_amount: string }[];
};

function reportQuery(params: { period?: string; start_date?: string; end_date?: string }) {
  const qs = new URLSearchParams();
  if (params.period) qs.set('period', params.period);
  if (params.start_date) qs.set('start_date', params.start_date);
  if (params.end_date) qs.set('end_date', params.end_date);
  return qs;
}

export function fetchReport(token: string, params: { period?: string; start_date?: string; end_date?: string }): Promise<ApiReport> {
  return request(`/api/admin/reports?${reportQuery(params)}`, { headers: authHeaders(token) });
}

export async function downloadReportExport(token: string, kind: 'excel' | 'pdf', params: { period?: string; start_date?: string; end_date?: string }) {
  const response = await fetch(`${API_BASE}/api/admin/reports/export/${kind}?${reportQuery(params)}`, { headers: authHeaders(token) });
  if (!response.ok) throw new ApiError(response.status, 'Export failed.');
  const blob = await response.blob();
  const filename = response.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] || `report.${kind === 'excel' ? 'xlsx' : 'pdf'}`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
