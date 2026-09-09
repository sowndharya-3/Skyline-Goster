import { useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowRight, ArrowUpRight, Archive, Boxes, Check, ChevronLeft, ChevronRight, CircleDollarSign, LayoutDashboard, Menu, Package, Pencil, Plus, Search, ShoppingBag, Store, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { asset, money, Product } from './catalog';
import { go, Order, orderStatuses, useStore } from './store';
import { BrandLogo } from './BrandPages';
import { ProductEditor } from './ProductEditor';
import { toast } from 'sonner';

const sections = [
  { id: '', title: 'Overview', icon: LayoutDashboard },
  { id: 'products', title: 'Products', icon: Boxes },
  { id: 'orders', title: 'Orders', icon: ShoppingBag },
  { id: 'customers', title: 'Customers', icon: Users },
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
  const { data } = useStore();
  const [menu, setMenu] = useState(false);
  const section = route.split('?')[0].split('/')[2] || '';
  const active = sections.find(item => item.id === section) || sections[0];
  useEffect(() => setMenu(false), [route]);
  const navigation = <><a className="ops-brand" href="#/admin" aria-label="GHOSTER admin home"><BrandLogo /><span>STORE OPERATIONS</span></a><div className="ops-nav-label">WORKSPACE</div><nav aria-label="Admin navigation">{sections.map(item => <a key={item.id} href={'#/admin' + (item.id ? '/' + item.id : '')} aria-current={item.id === active.id ? 'page' : undefined}><item.icon size={18} /><span>{item.title}</span>{item.id === 'orders' && data.orders.filter(o => o.status === 'Confirmed').length > 0 && <b>{data.orders.filter(o => o.status === 'Confirmed').length}</b>}</a>)}</nav><div className="ops-sidebar-bottom"><div className="ops-workspace"><span>G</span><div>GHOSTER Studio<small>Demo workspace</small></div></div><a href="#/"><ArrowUpRight size={17} />Back to storefront</a></div></>;
  return <div className="ops-shell">
    <aside className="ops-sidebar">{navigation}</aside>
    <div className="ops-workspace-main">
      <div className="ops-topbar"><div><button className="ops-menu" aria-label="Open admin menu" onClick={() => setMenu(true)}><Menu size={21} /></button><span>WORKSPACE <span className="ops-divider">/</span> <strong>{active.title}</strong></span></div><div><span className="ops-demo-dot">Demo store</span><a className="ops-store-link" href="#/"><Store size={15} /><span>View store</span><ArrowUpRight size={14} /></a><span className="ops-avatar" aria-label="GHOSTER workspace">GH</span></div></div>
      <div className="ops-content">
        {active.id === '' && <Overview />}
        {active.id === 'products' && <Products />}
        {active.id === 'orders' && <Orders key={route} route={route} />}
        {active.id === 'customers' && <Customers />}
        <div className="ops-footnote"><span>GHOSTER / BUILD FOR THE UNSEEN</span><span>Demo changes are saved on this device.</span></div>
      </div>
    </div>
    <Sheet open={menu} onOpenChange={setMenu}><SheetContent side="left" className="ops-menu-sheet"><SheetHeader className="sr-only"><SheetTitle>Admin menu</SheetTitle><SheetDescription>Navigate the GHOSTER workspace.</SheetDescription></SheetHeader>{navigation}</SheetContent></Sheet>
  </div>;
}

function Overview() {
  const { data, catalog, products } = useStore();
  const [period, setPeriod] = useState(7);
  const orders = data.orders.filter(o => o.status !== 'Cancelled');
  const revenue = orders.reduce((n, o) => n + o.total, 0);
  const customers = new Set(data.orders.map(o => o.address.email.toLowerCase())).size;
  const awaiting = orders.filter(o => ['Confirmed', 'Processing'].includes(o.status)).length;
  const days = Array.from({ length: period }, (_, i) => {
    const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - period + 1 + i);
    const next = new Date(date); next.setDate(date.getDate() + 1);
    return { label: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }), total: orders.filter(o => new Date(o.date) >= date && new Date(o.date) < next).reduce((n, o) => n + o.total, 0) };
  });
  const periodTotal = days.reduce((n, d) => n + d.total, 0);
  const metrics = [
    { label: 'Order value', value: money(revenue), note: 'Excludes cancelled orders', icon: CircleDollarSign },
    { label: 'Total orders', value: data.orders.length, note: awaiting + ' awaiting fulfilment', icon: ShoppingBag },
    { label: 'Active products', value: products.length, note: products.filter(p => p.isNew).length + ' in the new drop', icon: Boxes },
    { label: 'Customers', value: customers, note: 'From completed demo checkouts', icon: Users },
  ];
  return <>
    <div className="ops-page-heading"><div><span className="eyebrow">THE BIG PICTURE</span><h1>Store overview.</h1><p>Your store. Your next move. All in one place.</p></div><button className="ops-button" onClick={() => go('/admin/products?new=1')}><Plus size={17} />Add product</button></div>
    <div className="ops-metrics">{metrics.map(metric => <article key={metric.label}><div><span>{metric.label}</span><metric.icon size={18} /></div><strong>{metric.value}</strong><small>{metric.note}</small></article>)}</div>
    <div className="ops-overview-grid">
      <section className="ops-panel"><div className="ops-panel-heading"><div><span className="eyebrow">PERFORMANCE</span><h2>Order activity</h2></div><select aria-label="Activity period" value={period} onChange={event => setPeriod(Number(event.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option></select></div><div className="ops-chart-total"><strong>{money(periodTotal)}</strong><span>Total order value in this period</span></div><div className="ops-chart" role="img" aria-label={'Order value over the last ' + period + ' days: ' + money(periodTotal)}>{days.map((day, index) => <div className="ops-chart-column" key={day.label}><div className="ops-chart-track"><span style={{ height: day.total ? Math.max(4, day.total / Math.max(...days.map(d => d.total), 1) * 100) + '%' : '0%' }} title={day.label + ': ' + money(day.total)} /></div><small>{period === 7 || index === 0 || index === days.length - 1 ? day.label : ''}</small></div>)}{!periodTotal && <div className="ops-chart-empty"><span>No orders in this period</span><small>Your first checkout will start the story.</small></div>}</div></section>
      <section className="ops-catalog-health"><span className="eyebrow">READY FOR THE NEXT DROP</span><h2>Keep the<br />rotation moving.</h2><p>A considered catalogue.<br />An unmistakable identity.</p><div><span>Available products</span><strong>{products.length}</strong></div><div><span>Limited size selection</span><strong>{products.filter(p => p.sizes.length < 5).length}</strong></div><div><span>Archived products</span><strong>{catalog.filter(p => p.archived).length}</strong></div><a href="#/admin/products">Manage products<ArrowRight size={18} /></a></section>
    </div>
    <section className="ops-panel ops-recent-orders"><div className="ops-panel-heading"><div><span className="eyebrow">THE LATEST MOVES</span><h2>Recent orders</h2></div><a className="ops-text-link" href="#/admin/orders">View all orders <ArrowRight size={15} /></a></div>{data.orders.length ? <OrderTable orders={data.orders.slice(0, 5)} onOpen={id => go('/admin/orders?order=' + encodeURIComponent(id))} /> : <Blank title="Your first order starts here." text="Demo checkouts appear here, ready to review and manage." />}</section>
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

function OrderTable({ orders, onOpen }: { orders: Order[]; onOpen: (id: string) => void }) {
  return <div className="ops-table-wrap"><table className="ops-table ops-orders-table"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th><span className="sr-only">Details</span></th></tr></thead><tbody>{orders.map(order => <tr key={order.id}><td><button className="ops-order-id" onClick={() => onOpen(order.id)}>{order.id}</button></td><td data-label="Customer"><strong>{order.address.name}</strong><small>{order.address.email}</small></td><td data-label="Date">{dateLabel(order.date)}</td><td data-label="Items">{order.items.reduce((n, l) => n + l.qty, 0)}</td><td data-label="Total"><strong>{money(order.total)}</strong></td><td data-label="Status"><Status>{order.status}</Status></td><td><button className="ops-icon" aria-label={'Manage order ' + order.id} onClick={() => onOpen(order.id)}><ArrowUpRight size={18} /></button></td></tr>)}</tbody></table></div>;
}
function Orders({ route }: { route: string }) {
  const { data } = useStore();
  const params = new URLSearchParams(route.split('?')[1]);
  const [query, setQuery] = useState(params.get('customer') || '');
  const [status, setStatus] = useState(params.get('status') || 'all');
  const [selected, setSelected] = useState<string | null>(params.get('order'));
  const orders = data.orders.filter(o => (status === 'all' || o.status === status) && (o.id + ' ' + o.address.name + ' ' + o.address.email).toLowerCase().includes(query.trim().toLowerCase()));
  const order = data.orders.find(o => o.id === selected);
  return <>
    <div className="ops-page-heading"><div><span className="eyebrow">FROM DROP TO DOORSTEP</span><h1>Orders.</h1><p>Review the details. Keep every order moving.</p></div><button className="ops-button secondary" onClick={() => downloadCSV('ghoster-orders.csv', [['Order', 'Customer', 'Email', 'Date', 'Total (INR)', 'Payment', 'Status'], ...orders.map(o => [o.id, o.address.name, o.address.email, o.date, o.total, o.payment, o.status])])}><ArrowDownToLine size={16} />Export orders</button></div>
    <section className="ops-panel ops-list-panel"><div className="ops-toolbar"><SearchField label="Search orders or customers" value={query} onChange={setQuery} /><select aria-label="Order status" value={status} onChange={event => setStatus(event.target.value)}><option value="all">All statuses</option>{orderStatuses.map(s => <option key={s}>{s}</option>)}</select><span className="ops-results-count">{orders.length} orders</span></div>{orders.length ? <OrderTable orders={orders} onOpen={setSelected} /> : <Blank title={data.orders.length ? 'No matching orders.' : 'No orders yet.'} text={data.orders.length ? 'Adjust your search or status filter.' : 'Place a demo checkout in the storefront to see it here.'} />}</section>
    {order && <OrderEditor key={order.id} order={order} onClose={() => setSelected(null)} />}
  </>;
}
function OrderEditor({ order, onClose }: { order: Order; onClose: () => void }) {
  const { catalog, updateOrderStatus } = useStore();
  const [status, setStatus] = useState(order.status);
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="ops-order-dialog"><DialogHeader><DialogTitle>Order {order.id}</DialogTitle><DialogDescription>{dateLabel(order.date)} · {order.payment} · Demo order</DialogDescription></DialogHeader><div className="ops-order-summary"><Status>{order.status}</Status><strong>{money(order.total)}</strong></div><div className="ops-order-items">{order.items.map(line => { const product = line.product || catalog.find(p => p.id === line.id); return <article key={line.id + line.size}>{product && <img src={asset(product.image)} alt="" />}<div><strong>{product?.name || line.id}</strong><small>Size {line.size} / Qty {line.qty}</small></div><strong>{product ? money(product.price * line.qty) : '—'}</strong></article>; })}</div><div className="ops-address"><span className="eyebrow">DELIVER TO</span><strong>{order.address.name}</strong><p>{order.address.street}<br />{order.address.city}, {order.address.state} – {order.address.pin}</p><p>{order.address.email}<br />{order.address.phone}</p></div><label className="ops-status-field">Fulfilment status<select value={status} onChange={event => setStatus(event.target.value)}>{orderStatuses.map(s => <option key={s}>{s}</option>)}</select></label><p className="ops-helper">Updates the demo order and customer order history. No payment, refund or courier action is performed.</p><div className="ops-dialog-actions"><button className="ops-button secondary" onClick={onClose}>Close details</button><button className="ops-button" disabled={status === order.status} onClick={() => { updateOrderStatus(order.id, status); onClose(); }}><Check size={16} />Save status</button></div></DialogContent></Dialog>;
}

function Customers() {
  const { data } = useStore();
  const [query, setQuery] = useState('');
  const customers = useMemo(() => {
    const map = new Map<string, { name: string; email: string; city: string; orders: number; spent: number; last: string }>();
    for (const order of data.orders) {
      const key = order.address.email.trim().toLowerCase();
      const existing = map.get(key);
      if (existing) { existing.orders++; if (order.status !== 'Cancelled') existing.spent += order.total; }
      else map.set(key, { name: order.address.name, email: key, city: order.address.city, orders: 1, spent: order.status === 'Cancelled' ? 0 : order.total, last: order.date });
    }
    return Array.from(map.values());
  }, [data.orders]);
  const visible = customers.filter(c => (c.name + ' ' + c.email + ' ' + c.city).toLowerCase().includes(query.trim().toLowerCase()));
  return <><div className="ops-page-heading"><div><span className="eyebrow">THE PEOPLE BEHIND THE ORDERS</span><h1>Customers.</h1><p>Different paths. The same mindset.</p></div><span className="ops-total-label">{customers.length} customers</span></div><section className="ops-panel ops-list-panel"><div className="ops-toolbar"><SearchField label="Search customers" value={query} onChange={setQuery} /><span className="ops-results-count">From this device’s demo orders</span></div>{visible.length ? <div className="ops-table-wrap"><table className="ops-table"><thead><tr><th>Customer</th><th>Location</th><th>Orders</th><th>Order value</th><th>Latest order</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{visible.map(customer => <tr key={customer.email}><td><div className="ops-customer-cell"><span>{customer.name.slice(0, 1).toUpperCase()}</span><div><strong>{customer.name}</strong><small>{customer.email}</small></div></div></td><td data-label="Location">{customer.city}</td><td data-label="Orders">{customer.orders}</td><td data-label="Order value">{money(customer.spent)}</td><td data-label="Latest order">{dateLabel(customer.last)}</td><td><a className="ops-text-link" aria-label={'View orders for ' + customer.email} href={'#/admin/orders?customer=' + encodeURIComponent(customer.email)}>View orders <ArrowUpRight size={15} /></a></td></tr>)}</tbody></table></div> : <Blank title={customers.length ? 'No matching customers.' : 'Meet your first customer soon.'} text={customers.length ? 'Search by name, email or city.' : 'Customer profiles appear automatically after a demo checkout.'} />}</section></>;
}
