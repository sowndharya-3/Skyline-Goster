import { useState, type FormEvent } from 'react';
import { Check, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { products as artwork, sizes, asset, Product } from './catalog';
import { useStore } from './store';
import { toast } from 'sonner';

const newProduct: Product = {
  id: '', name: '', price: 1499, mrp: 1499, color: 'Black', image: 'product-shadow',
  sleeve: 'Half sleeve', fit: 'Oversized', graphic: false, isNew: true,
  sizes: [...sizes], description: '', classification: '', worlds: [], archived: false,
};

export function ProductEditor({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const { saveProduct } = useStore();
  const [draft, setDraft] = useState<Product>(() => product ? { ...product, sizes: [...product.sizes] } : { ...newProduct });
  const [error, setError] = useState('');
  const change = <K extends keyof Product>(key: K, value: Product[K]) => { setDraft(current => ({ ...current, [key]: value })); setError(''); };
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draft.name.trim().length < 2) { setError('Enter a product name with at least 2 characters.'); return; }
    if (draft.description.trim().length < 10) { setError('Add a description with at least 10 characters.'); return; }
    if (!draft.sizes.length) { setError('Select at least one available size.'); return; }
    const next = {
      ...draft, name: draft.name.trim(), description: draft.description.trim(), classification: draft.classification?.trim(),
      id: product?.id || 'tee-' + crypto.randomUUID().slice(0, 12),
      gallery: product?.image === draft.image ? product.gallery : undefined,
    };
    if (saveProduct(next)) { toast.success(product ? 'Product updated' : 'Product created'); onClose(); }
  }
  return <Dialog open onOpenChange={open => { if (!open) onClose(); }}>
    <DialogContent className="ops-editor">
      <DialogHeader><DialogTitle>{product ? 'Edit product' : 'Add product'}</DialogTitle><DialogDescription>Shape the next rotation. Changes appear in this demo storefront.</DialogDescription></DialogHeader>
      <form onSubmit={submit}>
        <div className="ops-editor-grid">
          <div className="ops-artwork">
            <div className="ops-artwork-preview"><img src={asset(draft.image)} alt="Selected product artwork" /><span>GHOSTER / CATALOGUE</span></div>
            <label>Product artwork<select value={draft.image} onChange={event => change('image', event.target.value)}>{artwork.map(item => <option value={item.image} key={item.image}>{item.name}</option>)}</select></label>
            <p>Choose from the supplied sample product images.</p>
          </div>
          <div className="ops-fields">
            <label className="ops-field-wide">Product name<input value={draft.name} required maxLength={80} onChange={event => change('name', event.target.value)} placeholder="e.g. Phantom" /></label>
            <label>Price (INR)<input type="number" min={1} max={1000000} step={1} required value={draft.price || ''} onChange={event => change('price', Number(event.target.value))} /></label>
            <label>MRP (INR)<input type="number" min={draft.price || 1} max={1000000} step={1} required value={draft.mrp || ''} onChange={event => change('mrp', Number(event.target.value))} /></label>
            <label>Colour<select value={draft.color} onChange={event => change('color', event.target.value)}><option>Black</option><option>White</option></select></label>
            <label>Fit<select value={draft.fit} onChange={event => change('fit', event.target.value)}><option>Oversized</option><option>Regular</option></select></label>
            <label>Sleeve<select value={draft.sleeve} onChange={event => change('sleeve', event.target.value)}><option>Half sleeve</option><option>Full sleeve</option></select></label>
            <label>Classification<input value={draft.classification || ''} maxLength={24} onChange={event => change('classification', event.target.value)} placeholder="e.g. Stealth" /></label>
            <fieldset className="ops-field-wide"><legend>Available sizes</legend><div className="ops-size-options">{sizes.map(size => <button type="button" key={size} aria-pressed={draft.sizes.includes(size)} onClick={() => change('sizes', draft.sizes.includes(size) ? draft.sizes.filter(s => s !== size) : sizes.filter(s => s === size || draft.sizes.includes(s)))}>{size}{draft.sizes.includes(size) && <Check size={12} />}</button>)}</div></fieldset>
            <fieldset className="ops-field-wide"><legend>Worlds</legend><div className="ops-checks">{['Army', 'Gamer', 'Biker'].map(world => <label key={world}><input type="checkbox" checked={draft.worlds?.includes(world.toLowerCase()) || false} onChange={event => change('worlds', event.target.checked ? [...(draft.worlds || []), world.toLowerCase()] : draft.worlds?.filter(w => w !== world.toLowerCase()))} />{world}</label>)}</div></fieldset>
            <label className="ops-field-wide">Description<textarea required maxLength={1000} rows={3} value={draft.description} onChange={event => change('description', event.target.value)} placeholder="The fit, the feel, the mindset." /></label>
            <div className="ops-checks ops-field-wide"><label><input type="checkbox" checked={draft.isNew} onChange={event => change('isNew', event.target.checked)} />In the new drop</label><label><input type="checkbox" checked={draft.graphic} onChange={event => change('graphic', event.target.checked)} />Graphic tee</label></div>
          </div>
        </div>
        {error && <p className="field-error" role="alert">{error}</p>}
        <div className="ops-dialog-actions"><button type="button" className="ops-button secondary" onClick={onClose}>Cancel</button><button className="ops-button" type="submit"><Save size={16} />{product ? 'Save product' : 'Create product'}</button></div>
      </form>
    </DialogContent>
  </Dialog>;
}
