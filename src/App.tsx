import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Menu, Search, ShoppingBag, Heart, UserRound, Check } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Toaster } from '@/components/ui/sonner';
import { Product, asset, money } from './catalog';
import { StoreProvider, useStore, useRoute, go } from './store';
import { Action, IconButton, Choice } from './ui';
import { ShopPage, ProductPage, WishlistPage } from './shop';
import { BagPage, CheckoutPage, ConfirmationPage, OrdersPage, AccountPage, InfoPage } from './pages';
import { AdminPage } from './AdminPage';
import { SplashScreen } from './SplashScreen';
import { LoginPage } from './LoginPage';
import { BrandLogo, HomePage, AboutPage, PackagingPage, UnseenPage, Signup } from './BrandPages';
import './styles.css';
import './theme.css';
import './admin.css';

const navigation = [{ title: 'Shop', path: '/shop' }, { title: 'Drops', path: '/shop?collection=new' }, { title: 'The unseen', path: '/unseen' }, { title: 'About', path: '/info/about' }];
function Header({ route }: { route: string }) {
  const { data, products } = useStore();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState('');
  const count = data.cart.reduce((n, line) => n + line.qty, 0);
  const matches = products.filter(p => `${p.name} ${p.color} ${p.fit} ${p.sleeve}`.toLowerCase().includes(query.toLowerCase().trim()));
  useEffect(() => { setMenu(false); setSearch(false); }, [route]);
  return <>
    <header className="header">
      <a className="brand" href="#/" aria-label="GHOSTER home"><BrandLogo /></a>
      <nav className="main-nav" aria-label="Main navigation">{navigation.map(item => <a key={item.title} href={'#' + item.path} className={route === item.path ? 'active' : ''} aria-current={route === item.path ? 'page' : undefined}>{item.title}</a>)}</nav>
      <div className="header-actions">
        <IconButton label="Search tees" onClick={() => setSearch(true)}><Search /></IconButton>
        <a className="icon-btn" href={data.user ? '#/account' : '#/login'} aria-label={data.user ? 'My account' : 'Log in'}><UserRound /></a>
        <a className="icon-btn" href="#/bag" aria-label={'Shopping bag, ' + count + ' items'}><ShoppingBag />{count > 0 && <span className="badge">{count}</span>}</a>
        <IconButton className="mobile-menu" label="Open menu" onClick={() => setMenu(true)}><Menu /></IconButton>
      </div>
    </header>
    <Sheet open={menu} onOpenChange={setMenu}><SheetContent side="left" className="menu-sheet"><SheetHeader><SheetTitle>GHOSTER</SheetTitle><SheetDescription>Three worlds. One identity.</SheetDescription></SheetHeader><nav className="menu-links" aria-label="Mobile navigation">{[...navigation, { title: 'Wishlist', path: '/wishlist' }, { title: 'My orders', path: '/orders' }, { title: 'Our packaging', path: '/packaging' }].map(item => <a href={'#' + item.path} key={item.title} onClick={() => setMenu(false)}>{item.title}<ArrowRight size={18} /></a>)}</nav><p className="eyebrow">BUILD FOR THE UNSEEN</p></SheetContent></Sheet>
    <Dialog open={search} onOpenChange={setSearch}><DialogContent className="search-dialog"><DialogHeader><DialogTitle>Find your next tee.</DialogTitle><DialogDescription>Search by name, colour, fit or sleeve.</DialogDescription></DialogHeader><form className="search-form" onSubmit={event => { event.preventDefault(); go('/shop?q=' + encodeURIComponent(query.trim())); setSearch(false); }}><Search size={20} /><input aria-label="Search products" placeholder="Try Shadow or oversized…" value={query} onChange={event => setQuery(event.target.value)} /><IconButton label="Submit search" type="submit"><ArrowRight /></IconButton></form><span className="eyebrow">{query ? 'MATCHING UNITS' : 'POPULAR RIGHT NOW'}</span><div className="search-results">{matches.slice(0, 4).map(p => <a key={p.id} href={'#/product/' + p.id} onClick={() => setSearch(false)}><img src={asset(p.image)} alt="" /><span>{p.name}<small>{money(p.price)}</small></span><ArrowRight size={18} /></a>)}{!matches.length && <p>No matches. Try “black” or “oversized”.</p>}</div></DialogContent></Dialog>
  </>;
}
function Footer() {
  return <footer className="footer"><div className="footer-main">
    <a className="footer-brand" href="#/" aria-label="GHOSTER home"><BrandLogo stacked /></a>
    <div><h3>Shop</h3><a href="#/shop">All products</a><a href="#/shop?collection=new">New drop</a><a href="#/shop?collection=oversized">Oversized fits</a><a href="#/wishlist">Your wishlist</a></div>
    <div><h3>Support</h3><a href="#/info/size">Size guide</a><a href="#/info/shipping">Shipping & returns</a><a href="#/orders">Track your order</a><a href="#/info/help">Help & FAQs</a></div>
    <div><h3>Company</h3><a href="#/info/about">Our story</a><a href="#/unseen">The unseen</a><a href="#/packaging">Our packaging</a><a href="#/info/privacy">Privacy</a></div>
    <div className="footer-signup"><h3>Stay unseen</h3><p>Join for drops, stories and more.</p><Signup compact /><div className="footer-account"><a href="#/account"><UserRound size={14} />Account</a><a href="#/wishlist"><Heart size={14} />Saved</a></div></div>
  </div><div className="footer-bottom"><span>© {new Date().getFullYear()} GHOSTER. ALL RIGHTS RESERVED.</span><span className="slashes" aria-hidden="true">/////</span><span>BUILT DIFFERENT. MOVES IN SILENCE.</span></div><div className="preview-note">STOREFRONT PREVIEW · SAMPLE PRODUCTS · DEMO CHECKOUT <a href="#/admin">Store dashboard ↗</a></div></footer>;
}
function QuickAdd({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const { add } = useStore();
  const [size, setSize] = useState('');
  useEffect(() => setSize(''), [product?.id]);
  return <Dialog open={!!product} onOpenChange={open => { if (!open) onClose(); }}><DialogContent className="quick-dialog"><DialogHeader><DialogTitle>{product?.name}</DialogTitle><DialogDescription>Choose your size. Build your loadout.</DialogDescription></DialogHeader>{product && <><div className="quick-preview"><img src={asset(product.image)} alt={product.name} /><div><strong>{money(product.price)}</strong><p>{product.color} / {product.fit}</p><a href={'#/product/' + product.id} onClick={onClose} className="text-link">Full details <ArrowRight size={16} /></a></div></div><Choice value={size} onChange={setSize} label="Select size" options={product.sizes.map(s => ({ value: s, label: s }))} /><Action disabled={!size} onClick={() => { if (add(product, size)) onClose(); }}>Add to loadout <ArrowRight size={18} /></Action></>}</DialogContent></Dialog>;
}
function AddedDialog() {
  const { added, dismissAdded } = useStore();
  return <Dialog open={!!added} onOpenChange={open => { if (!open) dismissAdded(); }}><DialogContent className="added-dialog"><div className="added-check"><Check size={28} strokeWidth={1} /></div><DialogHeader><DialogTitle>Unit added</DialogTitle><DialogDescription>Loadout updated. Ready when you are.</DialogDescription></DialogHeader>{added && <div className="added-product"><img src={asset(added.product.image)} alt={added.product.name} /><div><strong>{added.product.name} // {added.product.color}</strong><p>Size {added.size} · {money(added.product.price)}</p></div></div>}<Action onClick={() => { dismissAdded(); go('/bag'); }}>View loadout <ArrowRight size={18} /></Action><Action secondary onClick={dismissAdded}>Continue shopping</Action></DialogContent></Dialog>;
}
function Shell() {
  const route = useRoute();
  const { ready, dismissAdded } = useStore();
  const [splash, setSplash] = useState(true);
  const [quick, setQuick] = useState<Product | null>(null);
  const path = route.split('?')[0];
  const isAdmin = path === '/admin' || path.startsWith('/admin/');
  const dismissSplash = useCallback(() => setSplash(false), []);
  useEffect(() => { if (!splash) document.getElementById('content')?.focus({ preventScroll: true }); }, [splash]);
  useEffect(() => { setQuick(null); dismissAdded(); document.title = path === '/' ? 'GHOSTER | Build for the unseen' : `${path.split('/')[1].toUpperCase()} | GHOSTER`; }, [path]);
  let page;
  if (path === '/') page = <HomePage onQuick={setQuick} />;
  else if (path === '/shop') page = <ShopPage route={route} onQuick={setQuick} />;
  else if (path === '/info/about') page = <AboutPage />;
  else if (path === '/packaging') page = <PackagingPage />;
  else if (path === '/unseen') page = <UnseenPage />;
  else if (isAdmin) page = <AdminPage route={route} />;
  else if (path.startsWith('/product/')) page = <ProductPage key={path} id={path.split('/')[2]} onQuick={setQuick} />;
  else if (path === '/wishlist') page = <WishlistPage onQuick={setQuick} />;
  else if (path === '/bag') page = <BagPage />;
  else if (path === '/checkout') page = <CheckoutPage />;
  else if (path.startsWith('/confirmation/')) page = <ConfirmationPage id={path.split('/')[2]} />;
  else if (path === '/orders' || path.startsWith('/orders/')) page = <OrdersPage id={path.split('/')[2]} />;
  else if (path === '/login') page = <LoginPage />;
  else if (path === '/account') page = <AccountPage />;
  else if (path.startsWith('/info/')) page = <InfoPage topic={path.split('/')[2]} />;
  else page = <div className="empty-state"><h1>Lost in the unseen?</h1><p>This page doesn't exist.</p><Action to="/">Back to home</Action></div>;
  return <><div className="site-content" inert={splash}><a className="skip-link" href="#content" onClick={event => { event.preventDefault(); document.getElementById('content')?.focus(); }}>Skip to content</a>{!isAdmin && <Header route={route} />}<main id="content" tabIndex={-1}>{ready ? page : <div className="empty-state">Loading your loadout…</div>}</main>{!isAdmin && <Footer />}<QuickAdd product={quick} onClose={() => setQuick(null)} /><AddedDialog /><Toaster theme="dark" position="bottom-center" /></div>{splash && <SplashScreen onComplete={dismissSplash} />}</>;
}
export default function App() { return <StoreProvider><Shell /></StoreProvider>; }
