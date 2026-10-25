import { useEffect, useMemo, useState } from 'react';
import { Search, ShoppingBag, ArrowRight, Plus, Minus, X, Check, Menu, Sparkles, ShieldCheck, Truck, RotateCcw, Heart, SlidersHorizontal } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const demoProducts = [
  { _id:'p1', name:'Studio Wireless Headphones', category:'Audio', price:129.00, oldPrice:159.00, rating:4.8, reviews:248, badge:'BESTSELLER', color:'#e9e5df', image:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85', description:'Rich, detailed sound and all-day comfort. Your everyday soundtrack, reimagined.' },
  { _id:'p2', name:'Everyday Carry Backpack', category:'Accessories', price:89.00, oldPrice:110.00, rating:4.7, reviews:184, badge:'−19%', color:'#dce5df', image:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85', description:'Thoughtfully organized storage with a clean silhouette for commutes and weekends.' },
  { _id:'p3', name:'Minimal Ceramic Mug Set', category:'Home', price:34.00, oldPrice:null, rating:4.9, reviews:96, badge:'NEW', color:'#eee4d8', image:'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=85', description:'A pair of tactile, timeless mugs made for slow mornings and good conversations.' },
  { _id:'p4', name:'Classic Timepiece', category:'Accessories', price:149.00, oldPrice:179.00, rating:4.6, reviews:132, badge:null, color:'#e8e1d6', image:'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85', description:'A refined everyday watch with understated details and a versatile design.' },
  { _id:'p5', name:'Everyday Sneakers', category:'Style', price:95.00, oldPrice:null, rating:4.8, reviews:211, badge:'POPULAR', color:'#e4e3df', image:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85', description:'Lightweight comfort and a clean profile that goes with just about anything.' },
  { _id:'p6', name:'Desk Lamp No. 02', category:'Home', price:68.00, oldPrice:79.00, rating:4.5, reviews:73, badge:null, color:'#e9e5dc', image:'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=85', description:'Warm, focused light and a sculptural form for your favorite workspace.' },
  { _id:'p7', name:'Portable Speaker Mini', category:'Audio', price:59.00, oldPrice:null, rating:4.7, reviews:157, badge:'NEW', color:'#dce5e8', image:'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=85', description:'Room-filling sound in a compact, grab-and-go speaker.' },
  { _id:'p8', name:'Soft Knit Throw', category:'Home', price:52.00, oldPrice:64.00, rating:4.9, reviews:88, badge:null, color:'#e7ded5', image:'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=85', description:'A soft, textured layer that makes your quiet corner feel like home.' },
];

const money = (n) => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(n);
const getCart = () => { try { return JSON.parse(localStorage.getItem('syntecxhub-cart') || '[]'); } catch { return []; } };

export default function App() {
  const [products, setProducts] = useState(demoProducts);
  const [cart, setCart] = useState(getCart);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('featured');
  const [selected, setSelected] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [orderDone, setOrderDone] = useState(false);

  useEffect(() => {
    localStorage.setItem('syntecxhub-cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    fetch(`${API}/api/products`).then(r => r.ok ? r.json() : Promise.reject()).then(data => {
      if (Array.isArray(data) && data.length) {
        const merged = data.map((p, i) => ({ ...demoProducts[i % demoProducts.length], ...p, _id:String(p._id || p.id || `api-${i}`), image:p.image || demoProducts[i % demoProducts.length].image }));
        setProducts(merged);
      }
    }).catch(() => {});
  }, []);

  const categories = ['All', ...new Set(products.map(p => p.category || 'Other'))];
  const filtered = useMemo(() => {
    let list = products.filter(p => (category === 'All' || p.category === category) && `${p.name} ${p.category} ${p.description || ''}`.toLowerCase().includes(query.toLowerCase()));
    if (sort === 'low') list = [...list].sort((a,b) => a.price-b.price);
    if (sort === 'high') list = [...list].sort((a,b) => b.price-a.price);
    if (sort === 'rating') list = [...list].sort((a,b) => (b.rating||0)-(a.rating||0));
    return list;
  }, [products, query, category, sort]);

  const cartCount = cart.reduce((n, item) => n + item.qty, 0);
  const subtotal = cart.reduce((n, item) => n + item.price * item.qty, 0);
  const shipping = subtotal === 0 || subtotal >= 100 ? 0 : 7.5;
  const total = subtotal + shipping;

  function addToCart(product, qty = 1) {
    setCart(current => {
      const found = current.find(i => i._id === product._id);
      return found ? current.map(i => i._id === product._id ? { ...i, qty:i.qty+qty } : i) : [...current, { ...product, qty }];
    });
    setNotice(`${product.name} added to your bag`);
    setTimeout(() => setNotice(''), 2400);
  }
  function changeQty(id, delta) {
    setCart(current => current.map(i => i._id === id ? { ...i, qty:i.qty+delta } : i).filter(i => i.qty > 0));
  }
  async function placeOrder(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const customer = { name:form.get('name'), email:form.get('email'), address:form.get('address') };
    const token = localStorage.getItem('syntecxhub-token');
    try {
      if (token) {
        const response = await fetch(`${API}/api/orders`, {
          method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
          body:JSON.stringify({ items:cart.map(i => ({ productId:i._id, quantity:i.qty })), customer })
        });
        if (!response.ok) throw new Error('Order could not be saved.');
      }
    } catch (err) {
      setNotice(err.message || 'Could not connect to server');
      return;
    }
    setOrderDone(true);
    setCart([]);
  }
  function closeCheckout() { setCheckoutOpen(false); setOrderDone(false); }

  return <div className="app-shell">
    <div className="announcement"><Sparkles size={13}/> A little something for your everyday <span>·</span> Free shipping on orders $100+</div>
    <header className="site-header">
      <button className="icon-btn mobile-toggle" aria-label="Open menu" onClick={() => setMobileMenu(!mobileMenu)}><Menu size={21}/></button>
      <a className="brand" href="#" onClick={e => {e.preventDefault(); window.scrollTo({top:0,behavior:'smooth'});}}><span className="brand-mark">s.</span><span>syntecx<span className="brand-light">hub</span><small>OBJECTS FOR EVERYDAY</small></span></a>
      <nav className={mobileMenu ? 'main-nav nav-open' : 'main-nav'}>
        <a href="#shop" onClick={() => setMobileMenu(false)}>Shop all</a><a href="#shop" onClick={() => {setCategory('Home');setMobileMenu(false);}}>Home</a><a href="#shop" onClick={() => {setCategory('Accessories');setMobileMenu(false);}}>Accessories</a><a href="#story" onClick={() => setMobileMenu(false)}>Our story</a>
      </nav>
      <div className="header-actions">
        <label className="header-search"><Search size={17}/><input value={query} onChange={e => {setQuery(e.target.value);document.getElementById('shop')?.scrollIntoView({behavior:'smooth'});}} placeholder="Search products"/></label>
        <button className="bag-button" onClick={() => setCartOpen(true)} aria-label="Open shopping bag"><ShoppingBag size={19}/><span>Bag</span><b>{cartCount}</b></button>
      </div>
    </header>

    <main>
      <section className="hero">
        <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line"></span> THOUGHTFULLY CHOSEN</div><h1>Good things.<br/><em>Every day.</em></h1><p>Everyday essentials, considered design, and little upgrades that make a difference.</p><a href="#shop" className="primary-btn">Explore the collection <ArrowRight size={17}/></a><div className="hero-proof"><div className="avatar-stack"><span>J</span><span>M</span><span>A</span></div><div><strong>Loved by 2,000+ customers</strong><small>Thoughtful finds, happy homes.</small></div></div></div>
        <div className="hero-art"><div className="hero-image-main"><img src="https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=1300&q=90" alt="Curated home essentials on a neutral background"/></div><div className="floating-note"><span className="note-star">✳</span><div><strong>The everyday edit</strong><small>Small things, better living.</small></div></div><div className="hero-stamp">DESIGNED<br/>FOR LIVING</div></div>
        <div className="hero-index"><span>01</span><span className="index-line"></span><span>04</span></div>
      </section>

      <section className="benefits">
        <div><Truck/><span><strong>Free shipping</strong><small>On orders over $100</small></span></div><div><ShieldCheck/><span><strong>Thoughtful quality</strong><small>Made to be lived in</small></span></div><div><RotateCcw/><span><strong>Easy returns</strong><small>30-day return window</small></span></div>
      </section>

      <section id="shop" className="shop-section">
        <div className="section-heading"><div><div className="eyebrow">THE GOOD STUFF</div><h2>Find your <em>favorites.</em></h2><p>Useful things. Beautifully made. Ready for your everyday.</p></div><div className="product-count">{filtered.length.toString().padStart(2,'0')} PRODUCTS <span>↘</span></div></div>
        <div className="shop-toolbar"><div className="category-list">{categories.map(c => <button key={c} onClick={() => setCategory(c)} className={category===c?'category-chip active':'category-chip'}>{c}</button>)}</div><label className="sort-control"><SlidersHorizontal size={15}/><select value={sort} onChange={e=>setSort(e.target.value)} aria-label="Sort products"><option value="featured">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="rating">Top rated</option></select></label></div>
        <div className="product-grid">{filtered.map((p,i)=><article className="product-card" key={p._id}><button className="product-image" style={{background:p.color||'#eee'}} onClick={()=>setSelected(p)} aria-label={`View ${p.name}`}><img src={p.image} alt={p.name} loading="lazy"/>{p.badge&&<span className="product-badge">{p.badge}</span>}<span className="quick-view">Quick view <ArrowRight size={14}/></span><button className="heart-btn" onClick={e=>{e.stopPropagation();setNotice('Wishlist is a visual demo for now.');setTimeout(()=>setNotice(''),2200);}} aria-label="Add to wishlist"><Heart size={17}/></button></button><div className="product-meta"><span>{p.category}</span><span className="rating">★ {p.rating||'4.8'} <small>({p.reviews||'new'})</small></span></div><div className="product-title-row"><button className="product-name" onClick={()=>setSelected(p)}>{p.name}</button><button className="add-mini" onClick={()=>addToCart(p)} aria-label={`Add ${p.name} to bag`}><Plus size={17}/></button></div><div className="price-row"><strong>{money(Number(p.price)||0)}</strong>{p.oldPrice&&<del>{money(p.oldPrice)}</del>}</div></article>)}</div>
        {filtered.length===0&&<div className="empty-state"><Search size={28}/><h3>No finds this time</h3><p>Try another search or category.</p><button className="text-btn" onClick={()=>{setQuery('');setCategory('All');}}>Clear filters</button></div>}
      </section>

      <section id="story" className="story-section"><div className="story-image"><img src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85" alt="Warm, thoughtfully styled living space"/></div><div className="story-copy"><div className="eyebrow">A LITTLE ABOUT US</div><h2>Less, but <em>better.</em></h2><p>We believe the things we bring into our lives should earn their place. So we look for useful details, honest materials, and timeless design—objects that feel good to use, day after day.</p><a href="#shop" className="text-btn">Meet your new favorites <ArrowRight size={16}/></a><span className="story-asterisk">✳</span></div></section>

      <section className="newsletter"><div><div className="eyebrow">THE OCCASIONAL GOOD THING</div><h2>A little note from us.</h2><p>New finds, thoughtful ideas, and 10% off your first order.</p></div><form onSubmit={e=>{e.preventDefault();setNotice('Thanks for joining our demo newsletter!');e.currentTarget.reset();setTimeout(()=>setNotice(''),2600);}}><input type="email" placeholder="Your email address" required aria-label="Email address"/><button type="submit">Count me in <ArrowRight size={16}/></button></form><small className="newsletter-note">No noise. Just the good stuff.</small></section>
    </main>

    <footer className="site-footer"><a className="brand footer-brand" href="#"><span className="brand-mark">s.</span><span>syntecx<span className="brand-light">hub</span><small>OBJECTS FOR EVERYDAY</small></span></a><p>Everyday essentials, chosen with care.</p><div className="footer-links"><a href="#shop">Shop</a><a href="#story">Our story</a><a href="mailto:hello@syntecxhub.com">Contact</a></div><span className="copyright">© {new Date().getFullYear()} Syntecxhub Store · Internship demo project</span></footer>

    {notice&&<div className="toast"><Check size={17}/>{notice}</div>}

    {selected&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null);}}><div className="product-modal"><button className="modal-close" onClick={()=>setSelected(null)} aria-label="Close"><X/></button><img src={selected.image} alt={selected.name}/><div className="modal-content"><div className="eyebrow">{selected.category}</div><h2>{selected.name}</h2><div className="rating">★ {selected.rating||'4.8'} <small>({selected.reviews||'new'} reviews)</small></div><h3>{money(Number(selected.price)||0)}</h3><p>{selected.description}</p><button className="primary-btn full-btn" onClick={()=>{addToCart(selected);setSelected(null);}}>Add to bag <ShoppingBag size={17}/></button><small className="secure-note"><ShieldCheck size={14}/> Secure demo checkout</small></div></div></div>}

    {cartOpen&&<div className="drawer-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setCartOpen(false);}}><aside className="cart-drawer"><div className="drawer-header"><div><span className="eyebrow">YOUR SELECTION</span><h2>Your bag <span>({cartCount})</span></h2></div><button className="icon-btn" onClick={()=>setCartOpen(false)} aria-label="Close bag"><X/></button></div>{cart.length===0?<div className="cart-empty"><ShoppingBag size={35}/><h3>Your bag is taking a breather.</h3><p>Find something lovely for your everyday.</p><button className="primary-btn" onClick={()=>setCartOpen(false)}>Explore the shop <ArrowRight size={16}/></button></div>:<><div className="cart-items">{cart.map(i=><div className="cart-item" key={i._id}><img src={i.image} alt={i.name}/><div className="cart-item-info"><strong>{i.name}</strong><small>{money(i.price)}</small><div className="quantity-control"><button onClick={()=>changeQty(i._id,-1)} aria-label="Decrease quantity"><Minus size={13}/></button><span>{i.qty}</span><button onClick={()=>changeQty(i._id,1)} aria-label="Increase quantity"><Plus size={13}/></button></div></div><strong>{money(i.price*i.qty)}</strong></div>)}</div><div className="cart-summary"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div><span>Shipping</span><strong>{shipping===0?'FREE':money(shipping)}</strong></div>{subtotal>0&&subtotal<100&&<small>Add {money(100-subtotal)} more for free shipping.</small>}<div className="summary-total"><span>Total</span><strong>{money(total)}</strong></div><button className="primary-btn full-btn" onClick={()=>{setCartOpen(false);setCheckoutOpen(true);}}>Continue to checkout <ArrowRight size={17}/></button><p className="secure-note"><ShieldCheck size={14}/> Demo checkout · no payment collected</p></div></>}</aside></div>}

    {checkoutOpen&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)closeCheckout();}}><div className="checkout-modal"><button className="modal-close" onClick={closeCheckout}><X/></button>{orderDone?<div className="order-success"><span className="success-icon"><Check size={30}/></span><div className="eyebrow">ORDER CONFIRMED</div><h2>Thank you for your order.</h2><p>This is a demo confirmation. No payment was collected.</p><button className="primary-btn" onClick={closeCheckout}>Back to shopping <ArrowRight size={16}/></button></div>:<><div className="eyebrow">ALMOST YOURS</div><h2>Checkout</h2><p className="checkout-sub">Your total today is <strong>{money(total)}</strong></p><form onSubmit={placeOrder} className="checkout-form"><label>Full name<input name="name" required placeholder="Your full name"/></label><label>Email address<input type="email" name="email" required placeholder="you@example.com"/></label><label>Delivery address<textarea name="address" required rows="3" placeholder="Street, city, postal code"/></label><div className="checkout-total"><span>Total</span><strong>{money(total)}</strong></div><button className="primary-btn full-btn" type="submit">Place demo order <ArrowRight size={17}/></button><small className="secure-note"><ShieldCheck size={14}/> Demo only — no payment details requested.</small></form></>}</div></div>}
  </div>;
}
