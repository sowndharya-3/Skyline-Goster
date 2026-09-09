import { useId, useState } from 'react';
import { ArrowDown, ArrowRight, ChevronLeft, ChevronRight, ChevronsUp, Gamepad2, Wrench, Package, Tag, Shirt, Check } from 'lucide-react';
import { useStore } from './store';
import { Product, asset } from './catalog';
import { Action, IconButton, ProductCard } from './ui';

export function BrandLogo({ stacked = false }: { stacked?: boolean }) {
  return <span className={'brand-lockup' + (stacked ? ' stacked' : '')}><img className="brand-mark" src="./assets/brand-mark.svg" alt="" width="199" height="173" /><img className="brand-wordmark" src="./assets/brand-wordmark.svg" alt="GHOSTER" width="336" height="39" /></span>;
}
const worlds = [
  { name: 'Army', value: 'Discipline', image: 'campaign-army', note: 'Hold your ground. Stay the course.', icon: ChevronsUp },
  { name: 'Gamer', value: 'Focus', image: 'campaign-gamer', note: 'Quiet focus. Uncompromising precision.', icon: Gamepad2 },
  { name: 'Biker', value: 'Freedom', image: 'campaign-biker', note: 'Your road. Your rules.', icon: Wrench },
];
export function Signup({ compact = false }: { compact?: boolean }) {
  const id = useId();
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');
  return <form className={'signup ' + (compact ? 'compact' : '')} onSubmit={event => {
    event.preventDefault();
    try { localStorage.setItem('ghoster-community-preview', JSON.stringify({ email: email.trim(), joined: new Date().toISOString() })); setJoined(true); setError(''); }
    catch { setError('Your browser could not save this preference. Please try again.'); }
  }}><label className="sr-only" htmlFor={id}>Email for drop updates</label><div className="signup-input"><input id={id} type="email" required maxLength={254} placeholder="Your email" autoComplete="email" value={email} onChange={event => { setEmail(event.target.value); setJoined(false); }} /><button type="submit" aria-label="Join the community">{joined ? <Check size={18} /> : <ArrowRight size={18} />}</button></div><p className="signup-note" role={joined || error ? 'status' : undefined}>{error || (joined ? 'You’re on the demo list. Saved on this device.' : 'Preview signup · saved on this device only.')}</p></form>;
}
function IdentityBand() {
  return <section className="identity-band"><h2>Three worlds.<br /><span>One identity.</span></h2><div className="identity-worlds">{worlds.map((world, index) => <div key={world.name}><span>{world.name}</span><world.icon size={48} strokeWidth={1.4} /><span>{index === 1 ? 'Precision' : world.value}</span></div>)}</div></section>;
}
function WorldCards() {
  return <div className="world-grid">{worlds.map((world, index) => <a className="world-card" href={'#/shop?collection=' + world.name.toLowerCase()} key={world.name}><img src={asset(world.image)} alt={world.name === 'Army' ? 'Lone explorer facing a mountain valley' : world.name === 'Gamer' ? 'Gamer focused at a dark desk' : 'Biker on a misty mountain road'} loading="lazy" /><span className="world-number">0{index + 1}</span><div><h3>{world.name}</h3><p>{world.value}</p><ArrowRight size={22} /></div></a>)}</div>;
}
function CommunityStrip() {
  const [slide, setSlide] = useState(0);
  const pictures = [
    { image: 'campaign-hero', alt: 'The GHOSTER emblem, worn your way' },
    { image: 'campaign-biker', alt: 'Built for the open road' },
    { image: 'campaign-about', alt: 'The unseen in a black hoodie' },
    { image: 'campaign-gamer', alt: 'Find your focus' },
    { image: 'campaign-army', alt: 'Follow your own path' },
  ];
  return <section className="community-strip"><div className="community-copy"><h2>The unseen</h2><p>Real people. Same mindset.</p><Action secondary to="/unseen">Join the community <ArrowRight size={17} /></Action></div><div className="community-gallery" aria-roledescription="carousel" aria-label="The unseen lookbook"><div className="community-images">{Array.from({ length: 4 }, (_, i) => pictures[(slide + i) % pictures.length]).map(picture => <a key={picture.image} href="#/unseen"><img src={asset(picture.image)} alt={picture.alt} loading="lazy" /></a>)}</div><div className="community-controls"><IconButton label="Previous community photos" onClick={() => setSlide((slide + pictures.length - 1) % pictures.length)}><ChevronLeft size={16} /></IconButton><div className="carousel-dots">{pictures.map((p, i) => <button key={p.image} aria-label={'Community photo group ' + (i + 1)} aria-pressed={slide === i} className={slide === i ? 'active' : ''} onClick={() => setSlide(i)} />)}</div><IconButton label="Next community photos" onClick={() => setSlide((slide + 1) % pictures.length)}><ChevronRight size={16} /></IconButton></div></div></section>;
}
export function HomePage({ onQuick }: { onQuick: (p: Product) => void }) {
  const { products } = useStore();
  const [slide, setSlide] = useState(0);
  const slides = [
    { image: 'campaign-hero', alt: 'Black oversized tee with the distressed GHOSTER emblem', tagline: 'BUILD FOR THE UNSEEN', to: '/shop?collection=new' },
    { image: 'campaign-army', alt: 'A lone explorer in a rugged mountain valley', tagline: 'DISCIPLINE IS AN IDENTITY', to: '/shop?collection=army' },
    { image: 'campaign-biker', alt: 'A biker on an open mountain road', tagline: 'FREEDOM HAS NO UNIFORM', to: '/shop?collection=biker' },
  ];
  const active = slides[slide];
  return <div className="home-page">
    <section className="campaign-hero" aria-roledescription="carousel" aria-label="GHOSTER campaign">
      <img className="campaign-hero-image" src={asset(active.image)} alt={active.alt} fetchPriority="high" />
      <div className="hero-mindset">Army mindset<br />Gamer spirit<br />Biker soul</div>
      <div className="campaign-hero-copy"><h1><img src="./assets/wordmark.png" alt="GHOSTER" width="689" height="83" /></h1><p aria-live="polite">{active.tagline}</p><Action secondary to={active.to}>Explore the drop <ArrowRight size={22} /></Action></div>
      <div className="campaign-pagination">{slides.map((_, i) => <button key={i} aria-label={'Campaign slide ' + (i + 1)} aria-pressed={slide === i} className={slide === i ? 'active' : ''} onClick={() => setSlide(i)}>0{i + 1}</button>)}</div>
      <a className="hero-scroll" href="#mindset" onClick={event => { event.preventDefault(); document.getElementById('mindset')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }}>Scroll<br />for more <ArrowDown size={17} /></a><span className="hero-footnote">Wear<br />the<br />mindset.</span>
    </section>
    <section className="mindset-section" id="mindset"><div className="mindset-banner"><img src={asset('campaign-army')} alt="Mountains stretching beyond a lone explorer" loading="lazy" /><div><h2>Not everyone<br />needs to see you.</h2><p>Built for those who move with discipline,<br />think with strength, and stay loyal.</p></div></div><WorldCards /></section>
    <section className="drop-section"><div className="drop-heading"><h2>Shop the drop</h2><Action secondary to="/shop?collection=new">View all <ArrowRight size={17} /></Action></div><div className="product-grid drop-grid">{products.filter(p => p.isNew).slice(0, 5).map(p => <ProductCard key={p.id} product={p} onQuick={onQuick} />)}</div></section>
    <IdentityBand />
    <section className="packaging-banner"><img src={asset('campaign-packaging')} alt="Black GHOSTER box, folded tee, hang tags and thank-you card" loading="lazy" /><div><h2>You don’t just<br />receive a tee.<br /><span>You receive<br />the loadout.</span></h2><Action secondary to="/packaging">Our packaging <ArrowRight size={18} /></Action></div></section>
    <CommunityStrip />
  </div>;
}
export function AboutPage() {
  return <div className="about-page"><section className="about-hero"><img src={asset('campaign-about')} alt="A figure in a black hoodie emerges from the shadows" /><div><span className="eyebrow">OUR STORY / GHOSTER</span><h1>More than clothing.<br />A movement.</h1><p>GHOSTER is for those who live with discipline, move with strength, and stay loyal to what they believe in. Inspired by the worlds of the military, gaming and biker culture, we create apparel for the unseen — the ones who do more, say less, and keep going.</p><span className="about-signoff">— &nbsp; BUILD FOR THE UNSEEN.</span></div><span className="coordinates">28.6139° N<br />77.2090° E</span></section><div className="values-grid">{worlds.map((w, i) => <article key={w.name}><img src={asset(w.image)} alt={w.note} loading="lazy" /><h2>{['Discipline', 'Strength', 'Loyalty'][i]}</h2></article>)}</div><div className="brand-motto"><span className="slashes">/////</span>Different paths. Same mindset.<span className="slashes">/////</span></div><IdentityBand /><section className="story-cta"><h2>Find your identity.</h2><Action secondary to="/shop">Explore the drop <ArrowRight size={18} /></Action></section></div>;
}
export function PackagingPage() {
  return <div className="packaging-page"><section className="packaging-banner packaging-full"><img src={asset('campaign-packaging')} alt="The complete GHOSTER packaging concept" /><div><span className="eyebrow">EVERY DETAIL. INTENTIONAL.</span><h1>You don’t just<br />receive a tee.<br /><span>You receive<br />the loadout.</span></h1><p>A first impression that stays with you.</p></div></section><section className="section"><div className="packaging-details">{[{ Icon: Package, title: 'The box', text: 'A matte black home for your next essential.' }, { Icon: Shirt, title: 'The uniform', text: 'An oversized silhouette. An unmistakable identity.' }, { Icon: Tag, title: 'The details', text: 'Signature tags and a personal thank-you.' }].map(({ Icon, title, text }) => <article key={title}><Icon size={32} strokeWidth={1.2} /><h2>{title}</h2><p>{text}</p></article>)}</div><p className="muted packaging-disclaimer">Packaging concept shown for this storefront preview. Final contents will be confirmed with the live collection.</p><Action to="/shop?collection=new">Build your loadout <ArrowRight size={18} /></Action></section></div>;
}
export function UnseenPage() {
  return <div className="unseen-page"><section className="unseen-intro section"><span className="eyebrow">REAL PEOPLE. SAME MINDSET.</span><h1>We are the unseen.</h1><p>Different worlds. A shared way of moving through them.<br />Find your people. Wear your mindset.</p></section><WorldCards /><IdentityBand /><section className="community-join section"><div><span className="eyebrow">STAY IN THE KNOW</span><h2>Your next chapter<br />starts here.</h2><p>Drop updates, new stories and a place in the community.</p></div><div><h3>Join the unseen.</h3><Signup /></div></section></div>;
}
