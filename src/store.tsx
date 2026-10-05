import React, { createContext, useContext, useEffect, useState } from 'react';
import { products as initialProducts, Product, sizes } from './catalog';
import { toast } from 'sonner';
import * as api from './api';

export type Line = { id: string; size: string; qty: number; product?: Product };
export type Address = { name: string; phone: string; email: string; street: string; city: string; state: string; pin: string };
export const orderStatuses = ['Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as const;
export type Order = { id: string; items: Line[]; total: number; date: string; address: Address; payment: string; status: string };
type Data = { cart: Line[]; wishlist: string[]; user: { name: string; email: string } | null; orders: Order[]; addresses: Address[] };
const empty: Data = { cart: [], wishlist: [], user: null, orders: [], addresses: [] };
const KEY = 'ghoster-prototype-v1';
const CATALOG_KEY = 'ghoster-catalog-v1';
const ADMIN_TOKEN_KEY = 'ghoster-admin-token-v1';
export const ADMIN_DEMO_CREDENTIALS = { email: 'admin@ghosterstudio.com', password: 'ghoster123' };

export function calculate(cart: Line[], coupon = '', catalog = initialProducts) {
  const subtotal = cart.reduce((n, l) => n + (catalog.find(p => p.id === l.id)?.price || 0) * l.qty, 0);
  const discount = coupon === 'GHOST10' ? Math.round(subtotal * .1) : 0;
  const shipping = subtotal === 0 || subtotal >= 1499 ? 0 : 79;
  return { subtotal, discount, shipping, total: subtotal - discount + shipping };
}
function validProduct(value: unknown): value is Product {
  if (!value || typeof value !== 'object') return false;
  const p = value as Product;
  return typeof p.id === 'string' && !!p.id && typeof p.name === 'string' && p.name.trim().length >= 2
    && Number.isInteger(p.price) && p.price > 0 && Number.isInteger(p.mrp) && p.mrp >= p.price
    && typeof p.image === 'string' && initialProducts.some(item => item.image === p.image)
    && ['Black', 'White'].includes(p.color) && ['Regular', 'Oversized'].includes(p.fit)
    && ['Half sleeve', 'Full sleeve'].includes(p.sleeve) && typeof p.description === 'string'
    && Array.isArray(p.sizes) && p.sizes.length > 0 && p.sizes.every(size => sizes.includes(size));
}
function availableLines(cart: Line[], catalog: Product[]) {
  return cart.filter(l => l && catalog.some(p => !p.archived && p.id === l.id && p.sizes.includes(l.size))
    && Number.isInteger(l.qty) && l.qty > 0 && l.qty <= 10);
}
function useStoreState() {
  const [data, setData] = useState<Data>(empty);
  const [catalog, setCatalog] = useState<Product[]>(initialProducts);
  const [ready, setReady] = useState(false);
  const [added, setAdded] = useState<{ product: Product; size: string } | null>(null);
  const [admin, setAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const products = catalog.filter(p => !p.archived);
  const dismissAdded = () => setAdded(null);
  useEffect(() => {
    (async () => {
      let token: string | null = null;
      try { token = sessionStorage.getItem(ADMIN_TOKEN_KEY); } catch { /* Admin session starts signed out if storage is unavailable. */ }
      if (token) {
        try { await api.adminMe(token); setAdmin(true); setAdminToken(token); }
        catch { try { sessionStorage.removeItem(ADMIN_TOKEN_KEY); } catch { /* Nothing left to clear. */ } }
      }
    })();
    let loaded = initialProducts;
    try {
      const savedCatalog = JSON.parse(localStorage.getItem(CATALOG_KEY) || 'null');
      if (Array.isArray(savedCatalog) && savedCatalog.every(validProduct)
        && new Set(savedCatalog.map(p => p.id)).size === savedCatalog.length) loaded = savedCatalog;
    } catch { /* Keep the bundled catalogue if local data cannot be read. */ }
    setCatalog(loaded);
    api.fetchProducts()
      .then(live => {
        // A locally saved catalogue (admin edits made in this demo browser) still wins over the live read.
        try { if (JSON.parse(localStorage.getItem(CATALOG_KEY) || 'null')) return; } catch { /* fall through to live data */ }
        if (live.length) setCatalog(live);
      })
      .catch(() => { /* Backend unreachable: keep the bundled catalogue so the storefront still works offline. */ });
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (saved && Array.isArray(saved.cart) && Array.isArray(saved.orders) && Array.isArray(saved.wishlist) && Array.isArray(saved.addresses)) {
        const orders = saved.orders.filter((o: Order) => o && Array.isArray(o.items) && o.address).map((o: Order) => ({
          ...o, items: o.items.map(l => ({ ...l, product: l.product || loaded.find(p => p.id === l.id) })),
        }));
        setData({ ...empty, ...saved, orders, cart: availableLines(saved.cart, loaded) });
      }
    } catch { /* An invalid saved session starts with an empty bag. */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) try { localStorage.setItem(KEY, JSON.stringify(data)); }
    catch { toast.error('Your browser could not save this session.'); }
  }, [data, ready]);

  const saveProduct = (product: Product) => {
    if (!validProduct(product)) { toast.error('Check the product details before saving.'); return false; }
    const next = catalog.some(p => p.id === product.id) ? catalog.map(p => p.id === product.id ? product : p) : [...catalog, product];
    try { localStorage.setItem(CATALOG_KEY, JSON.stringify(next)); }
    catch { toast.error('Your browser could not save the catalogue. Free some storage and try again.'); return false; }
    setCatalog(next);
    setData(d => ({ ...d, cart: availableLines(d.cart, next), wishlist: d.wishlist.filter(id => next.some(p => p.id === id && !p.archived)) }));
    return true;
  };
  const resetCatalog = () => {
    setCatalog(initialProducts);
    try { localStorage.removeItem(CATALOG_KEY); } catch { /* The current session can still reset. */ }
  };
  const add = (product: Product, size: string, qty = 1) => {
    const p = products.find(item => item.id === product.id);
    if (!p || !p.sizes.includes(size) || !Number.isInteger(qty) || qty < 1) return false;
    const current = data.cart.find(l => l.id === p.id && l.size === size)?.qty || 0;
    if (current + qty > 10) { toast.error('You can add up to 10 of this size.'); return false; }
    setData(d => {
      const found = d.cart.find(l => l.id === p.id && l.size === size);
      return { ...d, cart: found ? d.cart.map(l => l === found ? { ...l, qty: Math.min(10, l.qty + qty) } : l) : [...d.cart, { id: p.id, size, qty }] };
    });
    setAdded({ product: p, size });
    return true;
  };
  const quantity = (id: string, size: string, qty: number) => setData(d => ({ ...d, cart: d.cart.map(l => l.id === id && l.size === size ? { ...l, qty: Math.max(1, Math.min(10, qty)) } : l) }));
  const remove = (id: string, size: string) => setData(d => ({ ...d, cart: d.cart.filter(l => l.id !== id || l.size !== size) }));
  const toggleWish = (id: string) => setData(d => ({ ...d, wishlist: d.wishlist.includes(id) ? d.wishlist.filter(x => x !== id) : [...d.wishlist, id] }));
  const adminLogin = async (email: string, password: string) => {
    try {
      const { access_token } = await api.adminLogin(email.trim(), password);
      setAdmin(true); setAdminToken(access_token);
      try { sessionStorage.setItem(ADMIN_TOKEN_KEY, access_token); } catch { /* Session still unlocks for this render even if storage fails. */ }
      return true;
    } catch { return false; }
  };
  const adminLogout = () => {
    setAdmin(false); setAdminToken(null);
    try { sessionStorage.removeItem(ADMIN_TOKEN_KEY); } catch { /* Nothing left to clear. */ }
  };
  return { data, setData, ready, products, catalog, saveProduct, resetCatalog, add, quantity, remove, toggleWish, added, dismissAdded, admin, adminToken, adminLogin, adminLogout };
}
const Context = createContext<ReturnType<typeof useStoreState> | null>(null);
export function StoreProvider({ children }: { children: React.ReactNode }) { const state = useStoreState(); return <Context.Provider value={state}>{children}</Context.Provider>; }
export function useStore() { const ctx = useContext(Context); if (!ctx) throw new Error('StoreProvider is required'); return ctx; }
export function go(path: string) { window.location.hash = path; }
export function useRoute() {
  const [route, setRoute] = useState('/');
  useEffect(() => { const read = () => { setRoute(window.location.hash.slice(1) || '/'); window.scrollTo(0, 0); }; read(); window.addEventListener('hashchange', read); return () => window.removeEventListener('hashchange', read); }, []);
  return route;
}
