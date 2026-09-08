import { useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Heart, Ruler, Maximize2, Shirt, Layers, Fingerprint, BadgeCheck, Truck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { products, sizes, Product, asset, money } from './catalog';
import { useStore } from './store';
import { Action, IconButton, ProductCard, Quantity, EmptyState } from './ui';
import { SizeGuide } from './shop';

const tabs = ['Description', 'Details', 'Size guide', 'Shipping'];
export function ProductPage({ id, onQuick }: { id: string; onQuick: (p: Product) => void }) {
  const { data, add, toggleWish } = useStore();
  const product = products.find(p => p.id === id);
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [tab, setTab] = useState(0);
  const [sizeGuide, setSizeGuide] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [pin, setPin] = useState('');
  const [delivery, setDelivery] = useState('');
  if (!product) return <EmptyState title="This tee isn't in the collection." text="Explore the latest drop instead." />;
  const p = product;
  const gallery = p.gallery || [p.image, p.worlds?.includes('biker') ? 'campaign-biker' : p.worlds?.includes('gamer') ? 'campaign-gamer' : p.image, 'campaign-packaging'];
  const productIndex = products.findIndex(item => item.id === p.id);
  const wished = data.wishlist.includes(p.id);
  return <>
    <section className="section product-section">
      <div className="breadcrumb"><a href="#/">Home</a> / <a href="#/shop">T-shirts</a> / {p.name}</div>
      <div className="product-detail">
        <div className="product-gallery">
          <div className="gallery-thumbnails" aria-label="Product photographs">{gallery.map((photo, i) => <button key={photo+i} className={selectedImage === i ? 'active' : ''} aria-pressed={selectedImage === i} aria-label={['View front photograph', p.gallery ? 'View back photograph' : 'View campaign photograph', p.gallery ? 'View campaign photograph' : 'View packaging concept'][i]} onClick={() => setSelectedImage(i)}><img src={asset(photo)} alt="" /></button>)}<IconButton label="Enlarge product image" onClick={() => setZoom(true)}><Maximize2 size={16} /></IconButton></div>
          <button className="main-photo" onClick={() => setZoom(true)} aria-label={'Enlarge ' + p.name}><img src={asset(gallery[selectedImage])} alt={p.name + ' — ' + ['front', p.gallery ? 'back' : 'campaign', p.gallery ? 'campaign' : 'packaging concept'][selectedImage]} /><span><Maximize2 size={16} /> Explore the details</span></button>
        </div>
        <div className="product-info">
          <div className="product-title-row"><h1>{p.name}</h1><div><a href={'#/product/' + products[(productIndex + products.length - 1) % products.length].id} className="icon-btn" aria-label="Previous product"><ChevronLeft size={18} /></a><a href={'#/product/' + products[(productIndex + 1) % products.length].id} className="icon-btn" aria-label="Next product"><ChevronRight size={18} /></a></div></div>
          <p className="product-tagline">{p.classification === 'Stealth' ? 'Move in silence.' : 'Wear the mindset.'}</p>
          <div className="detail-price"><strong>{money(p.price)}</strong>{p.mrp > p.price && <del>{money(p.mrp)}</del>}</div>
          <span className="tax-note">Inclusive of all taxes</span>
          <div className="color-row"><span className="selected-color" style={{ backgroundColor: p.color.toLowerCase() }} aria-label={'Colour: ' + p.color} /><span>{p.color}</span></div>
          <div className="size-heading"><strong>Size {size && '/ ' + size}</strong><button className="underlined" onClick={() => setSizeGuide(true)}><Ruler size={14} />Size guide</button></div>
          <div className="size-buttons" aria-label="Choose a size">{sizes.map(s => <button key={s} disabled={!p.sizes.includes(s)} aria-pressed={s === size} className={s === size ? 'active' : ''} onClick={() => { setSize(s); setSizeError(false); }}>{s}</button>)}</div>
          {sizeError && <p className="field-error" role="alert">Select your size to add this unit.</p>}
          <div className="quantity-row"><span>Quantity</span><Quantity value={qty} onChange={setQty} /></div>
          <div className="purchase-buttons"><Action onClick={() => { if (!size) { setSizeError(true); document.querySelector<HTMLButtonElement>('.size-buttons button:not(:disabled)')?.focus(); return; } add(p, size, qty); }}>Add to loadout <ArrowRight size={21} /></Action><IconButton label={wished ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={wished} onClick={() => toggleWish(p.id)}><Heart size={20} fill={wished ? 'currentColor' : 'none'} /></IconButton></div>
          <div className="product-features">{[{ Icon: BadgeCheck, title: p.classification ? '240 GSM' : 'Cotton jersey', text: 'Premium cotton' }, { Icon: Shirt, title: p.fit + ' fit', text: 'Street wear' }, { Icon: Layers, title: 'Single jersey', text: 'Soft & durable' }, { Icon: Fingerprint, title: p.graphic ? 'Tonal print' : 'Signature detail', text: 'Matte finish' }].map(({ Icon, title, text }) => <div key={title}><Icon size={29} strokeWidth={1} /><span><strong>{title}</strong><small>{text}</small></span></div>)}</div>
        </div>
      </div>
      <div className="product-tabs" role="tablist" aria-label="Product information">{tabs.map((title, i) => <button key={title} id={'product-tab-' + i} role="tab" aria-selected={tab === i} tabIndex={tab === i ? 0 : -1} aria-controls="product-tab-panel" onClick={() => setTab(i)} onKeyDown={event => { let next = i; if (event.key === 'ArrowRight') next = (i + 1) % tabs.length; else if (event.key === 'ArrowLeft') next = (i + tabs.length - 1) % tabs.length; else if (event.key === 'Home') next = 0; else if (event.key === 'End') next = tabs.length - 1; else return; event.preventDefault(); setTab(next); document.getElementById('product-tab-' + next)?.focus(); }}>{title}</button>)}</div>
      <div className="product-tab-panel" id="product-tab-panel" role="tabpanel" aria-labelledby={'product-tab-' + tab} tabIndex={0}>
        {tab === 0 && <p>{p.description}</p>}
        {tab === 1 && <div className="product-detail-copy"><p>{p.fit} fit / {p.sleeve} / {p.color} / Crew neck</p><p>Design specification preview: {p.classification ? '240 GSM cotton jersey' : 'cotton jersey'}. Final fabric specifications will be confirmed with the live catalogue.</p><p>Wash with similar colours. Dry in shade. Avoid ironing directly over prints and follow the garment care label.</p></div>}
        {tab === 2 && <SizeGuide />}
        {tab === 3 && <><p>Preview shipping: free on subtotals of ₹1,499 or more; ₹79 below. Estimated delivery is 4–7 business days. Final return terms will be confirmed before launch.</p><form className="delivery-check" onSubmit={event => { event.preventDefault(); setDelivery(/^[1-9]\d{5}$/.test(pin) ? 'Demo estimate: 4–7 business days. Live delivery availability is not connected yet.' : 'Enter a valid 6-digit PIN code.'); }}><label htmlFor="pin-check"><Truck size={17} />Check your delivery PIN</label><div><input id="pin-check" placeholder="Enter PIN code" inputMode="numeric" maxLength={6} value={pin} onChange={event => setPin(event.target.value.replace(/\D/g, ''))} /><button type="submit">Check</button></div>{delivery && <p role="status">{delivery}</p>}</form><a className="text-link" href="#/info/shipping">Shipping & returns <ArrowRight size={16} /></a></>}
      </div>
      <div className="detail-images">{[{ image: p.image, label: 'The silhouette' }, { image: p.gallery?.[1] || p.image, label: 'The signature' }, { image: 'campaign-hero', label: 'The identity' }, { image: 'campaign-packaging', label: 'The loadout' }].map((item, i) => <figure className={'detail-shot detail-shot-' + i} key={item.label}><img src={asset(item.image)} alt={item.label + ' — GHOSTER design preview'} loading="lazy" /><figcaption>{item.label}</figcaption></figure>)}</div>
    </section>
    <section className="section related-section"><div className="drop-heading"><h2>Complete your rotation</h2><a href="#/shop" className="text-link">View all <ArrowRight size={17} /></a></div><div className="product-grid">{products.filter(item => item.id !== p.id).slice(0, 4).map(item => <ProductCard key={item.id} product={item} onQuick={onQuick} />)}</div></section>
    <Dialog open={sizeGuide} onOpenChange={setSizeGuide}><DialogContent className="size-dialog"><DialogHeader><DialogTitle>Find your fit.</DialogTitle><DialogDescription>GHOSTER T-shirt size guide</DialogDescription></DialogHeader><SizeGuide /></DialogContent></Dialog>
    <Dialog open={zoom} onOpenChange={setZoom}><DialogContent className="zoom-dialog"><DialogTitle className="sr-only">{p.name}</DialogTitle><DialogDescription className="sr-only">Enlarged product photograph.</DialogDescription><img src={asset(gallery[selectedImage])} alt={p.name} /></DialogContent></Dialog>
  </>;
}
