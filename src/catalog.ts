export const brand = { name: 'GHOSTER', tagline: 'BUILD FOR THE UNSEEN' };
export const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
export const collections = [
  { id: 'half-sleeve', name: 'Half sleeve', image: 'hero-white', note: 'THE EVERYDAY ROTATION' },
  { id: 'full-sleeve', name: 'Full sleeve', image: 'raglan-longsleeve', note: 'A LITTLE MORE COVERAGE' },
  { id: 'oversized', name: 'Oversized', image: 'black-oversized', note: 'ROOM TO BE YOURSELF' },
  { id: 'graphic', name: 'Graphic tees', image: 'white-art-oversized', note: 'LET YOUR TEE TALK' },
];
export type Product = { id: string; name: string; price: number; mrp: number; color: string; image: string; sleeve: string; fit: string; graphic: boolean; isNew: boolean; sizes: string[]; description: string; classification?: string; worlds?: string[]; gallery?: string[] };
export const products: Product[] = [
  { id:'shadow-oversized', name:'Shadow', price:1499, mrp:1499, color:'Black', image:'product-shadow', sleeve:'Half sleeve', fit:'Oversized', graphic:false, isNew:true, sizes, classification:'Stealth', worlds:['army','gamer','biker'], gallery:['product-shadow','product-shadow-back','campaign-hero'], description:'Minimal on the front. Maximum in attitude. The Shadow tee is built for those who move in silence but still make an impact.' },
  { id:'eclipse', name:'Eclipse', price:1499, mrp:1499, color:'Black', image:'product-eclipse', sleeve:'Half sleeve', fit:'Oversized', graphic:true, isNew:true, sizes, classification:'Night', worlds:['gamer','biker'], description:'Dark on dark. A tonal emblem that reveals itself in the light. For the ones who find their focus after hours.' },
  { id:'tactical', name:'Tactical', price:1499, mrp:1499, color:'Black', image:'product-tactical', sleeve:'Half sleeve', fit:'Oversized', graphic:false, isNew:true, sizes, classification:'Field', worlds:['army'], description:'Quiet confidence, considered details. A clean everyday uniform with a field-inspired identity.' },
  { id:'apex', name:'Apex', price:1499, mrp:1499, color:'Black', image:'product-apex', sleeve:'Half sleeve', fit:'Oversized', graphic:true, isNew:true, sizes:['S','M','L','XL'], classification:'Elite', worlds:['gamer'], description:'Precision in every line. A vertical graphic and a relaxed silhouette for a mindset that never settles.' },
  { id:'strike', name:'Strike', price:1499, mrp:1499, color:'Black', image:'product-strike', sleeve:'Half sleeve', fit:'Oversized', graphic:true, isNew:true, sizes, classification:'Impact', worlds:['army','biker'], description:'An unmistakable emblem. An unspoken statement. Carry the GHOSTER identity wherever the road leads.' },
  { id:'off-duty-white', name:'Off Duty Oversized Tee', price:899, mrp:1199, color:'White', image:'white-oversized', sleeve:'Half sleeve', fit:'Oversized', graphic:false, isNew:false, sizes, description:'Easy volume, a clean neckline and a soft hand feel. Made for days that go your way.' },
  { id:'unseen-graphic', name:'Unseen Graphic Tee', price:999, mrp:1299, color:'White', image:'white-art-oversized', sleeve:'Half sleeve', fit:'Oversized', graphic:true, isNew:false, sizes:['S','M','L','XL'], description:'An expressive monochrome graphic on a roomy silhouette. Give your everyday rotation a different perspective.' },
  { id:'contrast-raglan', name:'Contrast Raglan Tee', price:1099, mrp:1399, color:'White', image:'raglan-longsleeve', sleeve:'Full sleeve', fit:'Regular', graphic:false, isNew:false, sizes, description:'Black sleeves meet a clean white body. A full-sleeve essential with a vintage athletic feel.' },
  { id:'afterhours-black', name:'Afterhours Full Sleeve Tee', price:999, mrp:1299, color:'Black', image:'black-longsleeve', sleeve:'Full sleeve', fit:'Regular', graphic:false, isNew:false, sizes:['S','M','L','XL'], description:'Clean lines. Full coverage. A versatile black crew neck that works on its own or as a layer.' },
  { id:'essential-white', name:'Essential White Tee', price:699, mrp:899, color:'White', image:'hero-white', sleeve:'Half sleeve', fit:'Regular', graphic:false, isNew:false, sizes, description:'The foundation of a good rotation. A classic white crew neck with a comfortable regular fit.' },
  { id:'concrete-black', name:'Concrete Everyday Tee', price:799, mrp:999, color:'Black', image:'hero-concrete', sleeve:'Half sleeve', fit:'Regular', graphic:false, isNew:false, sizes, description:'An understated everyday staple. A straight silhouette that keeps things simple.' },
  { id:'street-white', name:'Street Oversized Tee', price:949, mrp:1199, color:'White', image:'white-graphic', sleeve:'Half sleeve', fit:'Oversized', graphic:true, isNew:false, sizes, description:'A loose streetwear silhouette with a subtle graphic detail. Easy to wear, hard to overlook.' },
];
export const banners = [
  { eyebrow:'THE EVERYDAY, REDEFINED', title:['LESS NOISE.', 'MORE YOU.'], text:'Statement fits. Everyday comfort. Only tees.', cta:'Explore the drop', to:'/shop?collection=new', image:'white-graphic' },
  { eyebrow:'ROOM FOR YOUR OWN RULES', title:['GO BIG.', 'STAY UNSEEN.'], text:'Meet the oversized rotation.', cta:'Shop oversized', to:'/shop?collection=oversized', image:'black-oversized' },
  { eyebrow:'THE MONOCHROME EDIT', title:['LONG SLEEVES.', 'NO LIMITS.'], text:'Clean layers for whatever comes next.', cta:'Shop full sleeve', to:'/shop?collection=full-sleeve', image:'raglan-longsleeve' },
];
export const asset = (name: string) => `./assets/${name}.${name.startsWith('campaign-')||name.startsWith('product-')?'jpg':'webp'}`;
export const money = (n: number) => new Intl.NumberFormat('en-IN', {style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
export function inCollection(p: Product, key: string) {
  switch(key) {case 'army':case 'gamer':case 'biker':return p.worlds?.includes(key)||false;case 'half-sleeve':return p.sleeve==='Half sleeve';case 'full-sleeve':return p.sleeve==='Full sleeve';case 'oversized':return p.fit==='Oversized';case 'graphic':return p.graphic;case 'new':return p.isNew;case 'sale':return p.mrp>p.price;default:return true;}
}
