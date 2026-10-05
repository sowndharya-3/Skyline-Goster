import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowRight, ArrowUpRight, Archive, Boxes, Check, ChevronLeft, ChevronRight, CircleDollarSign, FileText, LayoutDashboard, LogOut, Menu, Package, Pencil, Plus, Printer, Search, ShoppingBag, Store, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { asset, money, Product } from './catalog';
import { go, orderStatuses, useStore } from './store';
import { BrandLogo } from './BrandPages';
import { ProductEditor } from './ProductEditor';
import { toast } from 'sonner';
import * as api from './api';

type AdminOrderRow = {
  id: string; customerName: string; customerEmail: string; date: string;
  itemCount: number; total: number; status: string; paymentMethod: string;
};
function toAdminOrderRow(o: api.ApiOrderSummary): AdminOrderRow {
  return {
    id: o.public_order_number, customerName: o.ship_name, customerEmail: o.ship_email, date: o.created_at,
    itemCount: o.item_count, total: Math.round(Number(o.total_amount)), status: o.order_status, paymentMethod: o.payment_method,
  };
}
function useAdminOrders(token: string | null) {
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(() => {
    if (!token) return;
    setLoading(true);
    api.fetchAdminOrders(token, { page_size: 100 })
      .then(res => setOrders(res.items.map(toAdminOrderRow)))
      .catch(() => toast.error('Could not load orders from the server.'))
      .finally(() => setLoading(false));
  }, [token]);
  useEffect(() => { refresh(); }, [refresh]);
  return { orders, loading, refresh };
}

const sections = [
  { id: '', title: 'Overview', icon: LayoutDashboard },
  { id: 'products', title: 'Products', icon: Boxes },
  { id: 'orders', title: 'Orders', icon: ShoppingBag },
  { id: 'customers', title: 'Customers', icon: Users },
  { id: 'reports', title: 'Reports', icon: FileText },
];
const dateLabel = (date: string) => new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
function Status({ children }: { children: string }) { return <span className={'ops-status ' + children.toLowerCase()}><i />{children}</span>; }
function SearchField({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) {
  return <label className="ops-search"><Search size={17} /><span className="sr-only">{label}</span><input placeholder={label + '…'} value={value} onChange={event => onChange(event.target.value)} type="search" /></label>;
}
function Blank({ title, text }: { title: string; text: string }) { return <div className="ops-empty"><Package size={28} strokeWidth={1} /><h3>{title}</h3><p>{text}</p></div>; }
function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows.map(row => row.map(value => {
    const text = String(value);
    const safe = /^[=+@\-\t\r\n]/.test(text) ? "'" + text : text;
    return '"' + safe.replace(/"/g, '""') + '"';
  }).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast.success('Export downloaded');
}

export function AdminPage({ route }: { route: string }) {
  const { adminToken, adminLogout } = useStore();
  const { orders: adminOrders, loading: ordersLoading, refresh: refreshOrders } = useAdminOrders(adminToken);
  const [menu, setMenu] = useState(false);
  const section = route.split('?')[0].split('/')[2] || '';
  const active = sections.find(item => item.id === section) || sections[0];
  useEffect(() => setMenu(false), [route]);
  const confirmedCount = adminOrders.filter(o => o.status === 'Confirmed').length;
  const navigation = <><a className="ops-brand" href="#/admin" aria-label="GHOSTER admin home"><BrandLogo /><span>STORE OPERATIONS</span></a><div className="ops-nav-label">WORKSPACE</div><nav aria-label="Admin navigation">{sections.map(item => <a key={item.id} href={'#/admin' + (item.id ? '/' + item.id : '')} aria-current={item.id === active.id ? 'page' : undefined}><item.icon size={18} /><span>{item.title}</span>{item.id === 'orders' && confirmedCount > 0 && <b>{confirmedCount}</b>}</a>)}</nav><div className="ops-sidebar-bottom"><div className="ops-workspace"><span>G</span><div>GHOSTER Studio<small>Live workspace</small></div></div><a href="#/"><ArrowUpRight size={17} />Back to storefront</a><button className="ops-logout" onClick={() => { adminLogout(); go('/admin'); }}><LogOut size={17} />Sign out</button></div></>;
  return <div className="ops-shell">
    <aside className="ops-sidebar">{navigation}</aside>
    <div className="ops-workspace-main">
      <div className="ops-topbar"><div><button className="ops-menu" aria-label="Open admin menu" onClick={() => setMenu(true)}><Menu size={21} /></button><span>WORKSPACE <span className="ops-divider">/</span> <strong>{active.title}</strong></span></div><div><span className="ops-demo-dot">Live store</span><a className="ops-store-link" href="#/"><Store size={15} /><span>View store</span><ArrowUpRight size={14} /></a><span className="ops-avatar" aria-label="GHOSTER workspace">GH</span></div></div>
      <div className="ops-content">
        {active.id === '' && <Overview orders={adminOrders} loading={ordersLoading} />}
        {active.id === 'products' && <Products />}
        {active.id === 'orders' && <Orders key={route} route={route} orders={adminOrders} loading={ordersLoading} refresh={refreshOrders} token={adminToken} />}
        {active.id === 'customers' && <Customers orders={adminOrders} />}
        {active.id === 'reports' && <Reports token={adminToken} />}
        <div className="ops-footnote"><span>GHOSTER / BUILD FOR THE UNSEEN</span><span>Orders and reports are live from the GHOSTER API.</span></div>
      </div>
    </div>
    <Sheet open={menu} onOpenChange={setMenu}><SheetContent side="left" className="ops-menu-sheet"><SheetHeader className="sr-only"><SheetTitle>Admin menu</SheetTitle><SheetDescription>Navigate the GHOSTER workspace.</SheetDescription></SheetHeader>{navigation}</SheetContent></Sheet>
  </div>;
}

function Overview({ orders, loading }: { orders: AdminOrderRow[]; loading: boolean }) {
  const { catalog, products } = useStore();
  const [period, setPeriod] = useState(7);
  const active = orders.filter(o => o.status !== 'Cancelled');
  const revenue = active.reduce((n, o) => n + o.total, 0);
  const customers = new Set(orders.map(o => o.customerEmail.toLowerCase())).size;
  const awaiting = active.filter(o => ['Confirmed', 'Processing'].includes(o.status)).length;
  const days = Array.from({ length: period }, (_, i) => {
    const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - period + 1 + i);
    const next = new Date(date); next.setDate(date.getDate() + 1);
    return { label: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), total: active.filter(o => new Date(o.date) >= date && new Date(o.date) < next).reduce((n, o) => n + o.total, 0) };
  });
  const periodTotal = days.reduce((n, d) => n + d.total, 0);
  const metrics = [
    { label: 'Order value', value: money(revenue), note: 'Excludes cancelled orders', icon: CircleDollarSign },
    { label: 'Total orders', value: orders.length, note: awaiting + ' awaiting fulfilment', icon: ShoppingBag },
    { label: 'Active products', value: products.length, note: products.filter(p => p.isNew).length + ' in the new drop', icon: Boxes },
    { label: 'Customers', value: customers, note: 'From completed checkouts', icon: Users },
  ];
  return <>
    <div className="ops-page-heading"><div><span className="eyebrow">THE BIG PICTURE</span><h1>Store overview.</h1><p>Your store. Your next move. All in one place.</p></div><button className="ops-button" onClick={() => go('/admin/products?new=1')}><Plus size={17} />Add product</button></div>
    <div className="ops-metrics">{metrics.map(metric => <article key={metric.label}><div><span>{metric.label}</span><metric.icon size={18} /></div><strong>{metric.value}</strong><small>{metric.note}</small></article>)}</div>
    <div className="ops-overview-grid">
      <section className="ops-panel"><div className="ops-panel-heading"><div><span className="eyebrow">PERFORMANCE</span><h2>Order activity</h2></div><select aria-label="Activity period" value={period} onChange={event => setPeriod(Number(event.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option></select></div><div className="ops-chart-total"><strong>{money(periodTotal)}</strong><span>Total order value in this period</span></div><div className="ops-chart" role="img" aria-label={'Order value over the last ' + period + ' days: ' + money(periodTotal)}>{days.map((day, index) => <div className="ops-chart-column" key={day.label}><div className="ops-chart-track"><span style={{ height: day.total ? Math.max(4, day.total / Math.max(...days.map(d => d.total), 1) * 100) + '%' : '0%' }} title={day.label + ': ' + money(day.total)} /></div><small>{period === 7 || index === 0 || index === days.length - 1 ? day.label : ''}</small></div>)}{!periodTotal && <div className="ops-chart-empty"><span>No orders in this period</span><small>Your first checkout will start the story.</small></div>}</div></section>
      <section className="ops-catalog-health"><span className="eyebrow">READY FOR THE NEXT DROP</span><h2>Keep the<br />rotation moving.</h2><p>A considered catalogue.<br />An unmistakable identity.</p><div><span>Available products</span><strong>{products.length}</strong></div><div><span>Limited size selection</span><strong>{products.filter(p => p.sizes.length < 5).length}</strong></div><div><span>Archived products</span><strong>{catalog.filter(p => p.archived).length}</strong></div><a href="#/admin/products">Manage products<ArrowRight size={18} /></a></section>
    </div>
    <section className="ops-panel ops-recent-orders"><div className="ops-panel-heading"><div><span className="eyebrow">THE LATEST MOVES</span><h2>Recent orders</h2></div><a className="ops-text-link" href="#/admin/orders">View all orders <ArrowRight size={15} /></a></div>{loading ? <Blank title="Loading orders…" text="Fetching the latest orders from the API." /> : orders.length ? <OrderTable orders={orders.slice(0, 5)} onOpen={id => go('/admin/orders?order=' + encodeURIComponent(id))} /> : <Blank title="Your first order starts here." text="Checkouts appear here, ready to review and manage." />}</section>
    <div className="ops-shortcuts"><a href="#/admin/products"><Boxes size={23} /><div><strong>Refine the catalogue</strong><span>Products, pricing and available sizes</span></div><ArrowUpRight size={19} /></a><a href="#/admin/orders?status=Confirmed"><Package size={23} /><div><strong>Review new orders</strong><span>{awaiting} orders awaiting fulfilment</span></div><ArrowUpRight size={19} /></a><a href="#/shop"><Store size={23} /><div><strong>View storefront</strong><span>See the experience your customers see</span></div><ArrowUpRight size={19} /></a></div>
  </>;
}

function Products() {
  const { catalog, saveProduct } = useStore();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [editor, setEditor] = useState<Product | 'new' | null>(() => new URLSearchParams(window.location.hash.split('?')[1]).has('new') ? 'new' : null);
  const [archiving, setArchiving] = useState<Product | null>(null);
  const visible = catalog.filter(p => (!query || (p.name + ' ' + p.id + ' ' + (p.classification || '')).toLowerCase().includes(query.trim().toLowerCase())) && (status === 'all' || (status === 'archived' ? p.archived : !p.archived)));
  const pages = Math.max(1, Math.ceil(visible.length / 8));
  const current = Math.min(page, pages);
  useEffect(() => setPage(1), [query, status]);
  const closeEditor = () => { setEditor(null); if (window.location.hash.includes('?new=')) go('/admin/products'); };
  return <>
    <div className="ops-page-heading"><div><span className="eyebrow">THE ROTATION</span><h1>Products.</h1><p>Build the drop. Fine-tune every detail.</p></div><button className="ops-button" onClick={() => setEditor('new')}><Plus size={17} />Add product</button></div>
    <div className="ops-count-strip"><span><strong>{catalog.length}</strong> Total products</span><span><i /><strong>{catalog.filter(p => !p.archived).length}</strong> Active</span><span><strong>{catalog.filter(p => p.archived).length}</strong> Archived</span></div>
    <section className="ops-panel ops-list-panel"><div className="ops-toolbar"><SearchField label="Search products" value={query} onChange={setQuery} /><select aria-label="Product status" value={status} onChange={event => setStatus(event.target.value)}><option value="all">All products</option><option value="active">Active</option><option value="archived">Archived</option></select><button className="ops-button secondary" onClick={() => downloadCSV('ghoster-products.csv', [['ID', 'Product', 'Price (INR)', 'MRP (INR)', 'Sizes', 'Status'], ...visible.map(p => [p.id, p.name, p.price, p.mrp, p.sizes.join(' / '), p.archived ? 'Archived' : 'Active'])])}><ArrowDownToLine size={16} />Export</button></div>
      {visible.length ? <><div className="ops-table-wrap"><table className="ops-table ops-products-table"><thead><tr><th>Product</th><th>Price</th><th>Sizes</th><th>Collection</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{visible.slice((current - 1) * 8, current * 8).map(p => <tr key={p.id}><td><button className="ops-product-cell" onClick={() => setEditor(p)}><img src={asset(p.image)} alt="" /><span><strong>{p.name}</strong><small>{p.color} / {p.fit}</small></span></button></td><td data-label="Price"><strong>{money(p.price)}</strong>{p.mrp > p.price && <del>{money(p.mrp)}</del>}</td><td data-label="Sizes"><span className="ops-sizes">{p.sizes.join(' · ')}</span></td><td data-label="Collection">{p.isNew ? 'New drop' : 'Essentials'}<small>{p.sleeve}</small></td><td data-label="Status"><Status>{p.archived ? 'Archived' : 'Active'}</Status></td><td><div className="ops-row-actions"><button aria-label={'Edit ' + p.name} title="Edit product" onClick={() => setEditor(p)}><Pencil size={16} /></button><button aria-label={(p.archived ? 'Restore ' : 'Archive ') + p.name} title={p.archived ? 'Restore product' : 'Archive product'} onClick={() => { if (p.archived) { if (saveProduct({ ...p, archived: false })) toast.success('Product restored'); } else setArchiving(p); }}>{p.archived ? <Plus size={17} /> : <Archive size={17} />}</button>{!p.archived && <a aria-label={'View ' + p.name + ' in store'} href={'#/product/' + p.id}><ArrowUpRight size={17} /></a>}</div></td></tr>)}</tbody></table></div><div className="ops-pagination"><span>Showing {(current - 1) * 8 + 1}–{Math.min(current * 8, visible.length)} of {visible.length} products</span><div><button aria-label="Previous product page" disabled={current === 1} onClick={() => setPage(current - 1)}><ChevronLeft size={16} /></button><span>{current} / {pages}</span><button aria-label="Next product page" disabled={current === pages} onClick={() => setPage(current + 1)}><ChevronRight size={16} /></button></div></div></> : <Blank title="No matching products." text="Try another name or change the status filter." />}
    </section>
    {editor && <ProductEditor key={editor === 'new' ? 'new' : editor.id} product={editor === 'new' ? null : editor} onClose={closeEditor} />}
    <Dialog open={!!archiving} onOpenChange={open => { if (!open) setArchiving(null); }}><DialogContent className="ops-confirm"><DialogHeader><DialogTitle>Archive {archiving?.name}?</DialogTitle><DialogDescription>This hides the product from the storefront and removes it from the current bag and wishlist. Existing orders stay available. You can restore it later.</DialogDescription></DialogHeader><div className="ops-dialog-actions"><button className="ops-button secondary" onClick={() => setArchiving(null)}>Keep product</button><button className="ops-button" onClick={() => { if (archiving && saveProduct({ ...archiving, archived: true })) { toast.success('Product archived'); setArchiving(null); } }}>Archive product</button></div></DialogContent></Dialog>
  </>;
}

function OrderTable({ orders, onOpen }: { orders: AdminOrderRow[]; onOpen: (id: string) => void }) {
  return <div className="ops-table-wrap"><table className="ops-table ops-orders-table"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th><span className="sr-only">Details</span></th></tr></thead><tbody>{orders.map(order => <tr key={order.id}><td><button className="ops-order-id" onClick={() => onOpen(order.id)}>{order.id}</button></td><td data-label="Customer"><strong>{order.customerName}</strong><small>{order.customerEmail}</small></td><td data-label="Date">{dateLabel(order.date)}</td><td data-label="Items">{order.itemCount}</td><td data-label="Total"><strong>{money(order.total)}</strong></td><td data-label="Status"><Status>{order.status}</Status></td><td><button className="ops-icon" aria-label={'Manage order ' + order.id} onClick={() => onOpen(order.id)}><ArrowUpRight size={18} /></button></td></tr>)}</tbody></table></div>;
}
function Orders({ route, orders, loading, refresh, token }: { route: string; orders: AdminOrderRow[]; loading: boolean; refresh: () => void; token: string | null }) {
  const params = new URLSearchParams(route.split('?')[1]);
  const [query, setQuery] = useState(params.get('customer') || '');
  const [status, setStatus] = useState(params.get('status') || 'all');
  const [selected, setSelected] = useState<string | null>(params.get('order'));
  const filtered = orders.filter(o => (status === 'all' || o.status === status) && (o.id + ' ' + o.customerName + ' ' + o.customerEmail).toLowerCase().includes(query.trim().toLowerCase()));
  return <>
    <div className="ops-page-heading"><div><span className="eyebrow">FROM DROP TO DOORSTEP</span><h1>Orders.</h1><p>Review the details. Keep every order moving.</p></div><button className="ops-button secondary" onClick={() => downloadCSV('ghoster-orders.csv', [['Order', 'Customer', 'Email', 'Date', 'Total (INR)', 'Payment', 'Status'], ...filtered.map(o => [o.id, o.customerName, o.customerEmail, o.date, o.total, o.paymentMethod, o.status])])}><ArrowDownToLine size={16} />Export orders</button></div>
    <section className="ops-panel ops-list-panel"><div className="ops-toolbar"><SearchField label="Search orders or customers" value={query} onChange={setQuery} /><select aria-label="Order status" value={status} onChange={event => setStatus(event.target.value)}><option value="all">All statuses</option>{orderStatuses.map(s => <option key={s}>{s}</option>)}</select><span className="ops-results-count">{loading ? 'Loading…' : filtered.length + ' orders'}</span></div>{loading ? <Blank title="Loading orders…" text="Fetching the latest orders from the API." /> : filtered.length ? <OrderTable orders={filtered} onOpen={setSelected} /> : <Blank title={orders.length ? 'No matching orders.' : 'No orders yet.'} text={orders.length ? 'Adjust your search or status filter.' : 'Place a checkout in the storefront to see it here.'} />}</section>
    {selected && token && <OrderEditor key={selected} orderNumber={selected} token={token} onClose={() => setSelected(null)} onSaved={refresh} />}
  </>;
}
function OrderEditor({ orderNumber, token, onClose, onSaved }: { orderNumber: string; token: string; onClose: () => void; onSaved: () => void }) {
  const [order, setOrder] = useState<api.ApiOrder | null>(null);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    api.fetchAdminOrder(token, orderNumber).then(o => { setOrder(o); setStatus(o.order_status); }).catch(() => toast.error('Could not load this order.'));
  }, [orderNumber, token]);
  const save = async () => {
    if (!order) return;
    setSaving(true);
    try { const updated = await api.updateAdminOrderStatus(token, orderNumber, status); setOrder(updated); toast.success('Order status updated'); onSaved(); onClose(); }
    catch { toast.error('Could not update the order status.'); }
    finally { setSaving(false); }
  };
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="ops-order-dialog">
    {!order ? <div className="ops-empty"><Package size={28} strokeWidth={1} /><h3>Loading order…</h3></div> : <>
      <DialogHeader><DialogTitle>Order {order.public_order_number}</DialogTitle><DialogDescription>{dateLabel(order.created_at)} · {order.payment_method}</DialogDescription></DialogHeader>
      <div className="ops-order-summary"><Status>{order.order_status}</Status><strong>{money(Number(order.total_amount))}</strong></div>
      <div className="ops-order-items">{order.items.map(line => <article key={line.product_id + line.size}><div><strong>{line.product_name_snapshot}</strong><small>Size {line.size} / Qty {line.quantity}</small></div><strong>{money(Number(line.total_price))}</strong></article>)}</div>
      <div className="ops-address"><span className="eyebrow">DELIVER TO</span><strong>{order.ship_name}</strong><p>{order.ship_street}<br />{order.ship_city}, {order.ship_state} – {order.ship_pincode}</p><p>{order.ship_email}<br />{order.ship_phone}</p></div>
      <label className="ops-status-field">Fulfilment status<select value={status} onChange={event => setStatus(event.target.value)}>{orderStatuses.map(s => <option key={s}>{s}</option>)}</select></label>
      <p className="ops-helper">Updates the order in the database and the customer's order history. No payment, refund or courier action is performed.</p>
      <div className="ops-dialog-actions"><button className="ops-button secondary" onClick={onClose}>Close details</button><button className="ops-button" disabled={saving || status === order.order_status} onClick={save}><Check size={16} />{saving ? 'Saving…' : 'Save status'}</button></div>
    </>}
  </DialogContent></Dialog>;
}

function Customers({ orders }: { orders: AdminOrderRow[] }) {
  const [query, setQuery] = useState('');
  const customers = useMemo(() => {
    const map = new Map<string, { name: string; email: string; orders: number; spent: number; last: string }>();
    for (const order of orders) {
      const key = order.customerEmail.trim().toLowerCase();
      const existing = map.get(key);
      if (existing) { existing.orders++; if (order.status !== 'Cancelled') existing.spent += order.total; }
      else map.set(key, { name: order.customerName, email: key, orders: 1, spent: order.status === 'Cancelled' ? 0 : order.total, last: order.date });
    }
    return Array.from(map.values());
  }, [orders]);
  const visible = customers.filter(c => (c.name + ' ' + c.email).toLowerCase().includes(query.trim().toLowerCase()));
  return <><div className="ops-page-heading"><div><span className="eyebrow">THE PEOPLE BEHIND THE ORDERS</span><h1>Customers.</h1><p>Different paths. The same mindset.</p></div><span className="ops-total-label">{customers.length} customers</span></div><section className="ops-panel ops-list-panel"><div className="ops-toolbar"><SearchField label="Search customers" value={query} onChange={setQuery} /><span className="ops-results-count">From live orders</span></div>{visible.length ? <div className="ops-table-wrap"><table className="ops-table"><thead><tr><th>Customer</th><th>Orders</th><th>Order value</th><th>Latest order</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{visible.map(customer => <tr key={customer.email}><td><div className="ops-customer-cell"><span>{customer.name.slice(0, 1).toUpperCase()}</span><div><strong>{customer.name}</strong><small>{customer.email}</small></div></div></td><td data-label="Orders">{customer.orders}</td><td data-label="Order value">{money(customer.spent)}</td><td data-label="Latest order">{dateLabel(customer.last)}</td><td><a className="ops-text-link" aria-label={'View orders for ' + customer.email} href={'#/admin/orders?customer=' + encodeURIComponent(customer.email)}>View orders <ArrowUpRight size={15} /></a></td></tr>)}</tbody></table></div> : <Blank title={customers.length ? 'No matching customers.' : 'Meet your first customer soon.'} text={customers.length ? 'Search by name or email.' : 'Customer profiles appear automatically after a checkout.'} />}</section></>;
}

const isoLabel = (date: Date) => date.toISOString().slice(0, 10);

function Reports({ token }: { token: string | null }) {
  const [range, setRange] = useState<'7' | '30' | 'custom'>('7');
  const today = isoLabel(new Date());
  const [from, setFrom] = useState(isoLabel(new Date(Date.now() - 6 * 86400000)));
  const [to, setTo] = useState(today);
  const [report, setReport] = useState<api.ApiReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    const params = range === 'custom' ? { start_date: from, end_date: to } : { period: range + 'd' };
    api.fetchReport(token, params).then(setReport).catch(() => toast.error('Could not load the report.')).finally(() => setLoading(false));
  }, [token, range, from, to]);

  const summary = report ? [
    { label: 'Total sales', value: money(Number(report.summary.total_sales)), icon: CircleDollarSign },
    { label: 'Total orders', value: report.summary.total_orders, icon: ShoppingBag },
    { label: 'Completed orders', value: report.summary.completed_orders, icon: Check },
    { label: 'Cancelled orders', value: report.summary.cancelled_orders, icon: Archive },
    { label: 'Items sold', value: report.summary.items_sold, icon: Boxes },
    { label: 'Average order value', value: money(Math.round(Number(report.summary.average_order_value))), icon: FileText },
  ] : [];

  const runExport = async (kind: 'excel' | 'pdf') => {
    if (!token) return;
    setExporting(kind);
    try { await api.downloadReportExport(token, kind, range === 'custom' ? { start_date: from, end_date: to } : { period: range + 'd' }); toast.success('Export downloaded'); }
    catch { toast.error('Could not download the export.'); }
    finally { setExporting(null); }
  };

  return <>
    <div className="ops-page-heading"><div><span className="eyebrow">THE NUMBERS</span><h1>Reports.</h1><p>Sales performance for the selected period.</p></div>
      <div className="ops-date-filters">
        <button className={'ops-button secondary' + (range === '7' ? ' active' : '')} onClick={() => setRange('7')}>Last 7 days</button>
        <button className={'ops-button secondary' + (range === '30' ? ' active' : '')} onClick={() => setRange('30')}>Last 30 days</button>
        <button className={'ops-button secondary' + (range === 'custom' ? ' active' : '')} onClick={() => setRange('custom')}>Custom range</button>
        {range === 'custom' && <div className="ops-date-range">
          <input type="date" aria-label="From date" value={from} onChange={event => setFrom(event.target.value)} max={to} />
          <span>to</span>
          <input type="date" aria-label="To date" value={to} onChange={event => setTo(event.target.value)} min={from} max={today} />
        </div>}
      </div>
    </div>
    {loading || !report ? <Blank title="Loading report…" text="Fetching real sales data from the API." /> : <>
      <div className="ops-metrics">{summary.map(metric => <article key={metric.label}><div><span>{metric.label}</span><metric.icon size={18} /></div><strong>{metric.value}</strong></article>)}</div>
      <section className="ops-panel ops-list-panel">
        <div className="ops-toolbar">
          <span className="ops-results-count">{report.period.start_date} to {report.period.end_date} · {report.summary.total_orders} orders</span>
          <button className="ops-button secondary" disabled={exporting === 'excel'} onClick={() => runExport('excel')}><ArrowDownToLine size={16} />{exporting === 'excel' ? 'Exporting…' : 'Export Excel'}</button>
          <button className="ops-button secondary" disabled={exporting === 'pdf'} onClick={() => runExport('pdf')}><Printer size={16} />{exporting === 'pdf' ? 'Exporting…' : 'Export PDF'}</button>
        </div>
        {report.daily_sales.length ? <div className="ops-table-wrap"><table className="ops-table"><thead><tr><th>Date</th><th>Orders</th><th>Items sold</th><th>Sales amount</th></tr></thead><tbody>{[...report.daily_sales].reverse().map(day => <tr key={day.date}><td data-label="Date"><strong>{dateLabel(day.date)}</strong></td><td data-label="Orders">{day.orders}</td><td data-label="Items sold">{day.items_sold}</td><td data-label="Sales amount">{money(Number(day.sales_amount))}</td></tr>)}</tbody></table></div>
          : report.summary.total_orders ? <Blank title="Range too wide for a daily table." text="Narrow the custom range to 92 days or fewer to see day-by-day sales." />
          : <Blank title="No orders in this period." text="Try a wider date range." />}
      </section>
    </>}
  </>;
}
