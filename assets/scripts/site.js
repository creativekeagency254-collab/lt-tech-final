// ============================================================
// CONFIG â€” All keys for testing environment
// ============================================================
const CFG = {
  ENABLE_SUPABASE:  true,
  SUPABASE_URL:     'https://fbulitfyarmnyegxduqy.supabase.co',
  SUPABASE_PUBLISHABLE: 'sb_publishable_h5pygvIpbj6JaQwCiAnMSw_0MXm8Z7Q',
  SUPABASE_ANON:    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZidWxpdGZ5YXJtbnllZ3hkdXF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMjE5MDAsImV4cCI6MjA4Nzc5NzkwMH0.K5UwbTYttPQeK4DTx1AO_CzPWg6IuOx4_zTbQcYEWts',
  PAYSTACK_PK:      'pk_test_69283fe06fedab5b485efdae233a92be25d77c6b',
  PAYSTACK_SK:      'sk_test_fd736a649e04cd256f6328ac8b45aa007e87b99f',
  WHATSAPP:         '0705925800',
  ADMIN_PASS:       'admin123',
};

function normalizeWhatsAppNumber(rawNumber) {
  const digits = String(rawNumber || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('254')) return digits;
  if (digits.startsWith('0')) return `254${digits.slice(1)}`;
  if (digits.length === 9 && digits.startsWith('7')) return `254${digits}`;
  return digits;
}

function getWhatsAppLink(encodedText) {
  const phone = normalizeWhatsAppNumber(CFG.WHATSAPP);
  return encodedText ? `https://wa.me/${phone}?text=${encodedText}` : `https://wa.me/${phone}`;
}

function decodeUrlSafe(value) {
  try { return decodeURIComponent(value); } catch (_) { return value; }
}

function normalizeImageUrl(rawUrl, depth = 0) {
  let input = String(rawUrl || '').trim().replace(/^['"]+|['"]+$/g, '');
  if (!input) return '';
  input = input.replace(/&amp;/gi, '&');

  if (/^data:image\//i.test(input) || /^blob:/i.test(input)) return input;
  if (input.startsWith('//')) input = `https:${input}`;
  if (/^www\./i.test(input)) input = `https://${input}`;

  let parsed;
  try { parsed = new URL(input); }
  catch (_) {
    try { parsed = new URL(`https://${input}`); }
    catch (_) { return ''; }
  }

  const pickParam = (...keys) => {
    for (const key of keys) {
      const value = parsed.searchParams.get(key);
      if (value) return value;
    }
    return '';
  };

  if (depth < 2) {
    const preferred = pickParam('imgurl', 'mediaurl', 'media', 'image');
    if (preferred) {
      const next = normalizeImageUrl(decodeUrlSafe(preferred), depth + 1);
      if (next) return next;
    }
    const fallback = pickParam('src', 'url', 'u', 'q');
    if (fallback) {
      const decoded = decodeUrlSafe(fallback);
      if (/^https?:\/\//i.test(decoded) || decoded.startsWith('//') || /^www\./i.test(decoded)) {
        const next = normalizeImageUrl(decoded, depth + 1);
        if (next) return next;
      }
    }
  }

  return parsed.toString();
}

function normalizeImageUrlList(rawValue) {
  const parts = String(rawValue || '').split(/[\n,]/).map(v => v.trim()).filter(Boolean);
  const urls = [];
  const seen = new Set();
  parts.forEach((part) => {
    const normalized = normalizeImageUrl(part);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      urls.push(normalized);
    }
  });
  return urls;
}

// ============================================================
// SUPABASE CLIENT
// ============================================================
const { createClient } = supabase;
const sbKey = CFG.SUPABASE_PUBLISHABLE || CFG.SUPABASE_ANON;
const sb = (CFG.ENABLE_SUPABASE && CFG.SUPABASE_URL && sbKey) ? createClient(CFG.SUPABASE_URL, sbKey) : null;
// Never use Supabase service-role/secret keys in browser code.
const sbAdmin = sb;

// ============================================================
// FALLBACK PRODUCTS (shown if Supabase is empty)
// ============================================================
const FALLBACK_PRODUCTS = [
  {id:'f1',name:'Samsung Galaxy S24 Ultra',slug:'s24-ultra',category:'smartphones',brand:'Samsung',price:179999,original_price:199999,stock:12,description:'The ultimate Galaxy. 200MP camera, S Pen, titanium frame, 6.8" QHD+ AMOLED.',specs:{Display:'6.8" QHD+ Dynamic AMOLED',Processor:'Snapdragon 8 Gen 3',RAM:'12GB',Storage:'256GB',Battery:'5000mAh 45W'},variants:['Titanium Black','Titanium Gray','Titanium Violet'],badge:'Hot',active:true,images:[]},
  {id:'f2',name:'iPhone 15 Pro Max',slug:'iphone-15-pro-max',category:'smartphones',brand:'Apple',price:219999,original_price:null,stock:8,description:'Titanium. A17 Pro chip. Pro camera with 5x optical zoom. USB 3.',specs:{Display:'6.7" Super Retina XDR OLED',Chip:'A17 Pro',RAM:'8GB',Storage:'256GB',Battery:'4422mAh MagSafe'},variants:['Natural Titanium','Blue Titanium','White Titanium'],badge:'New',active:true,images:[]},
  {id:'f3',name:'MacBook Pro 14" M3 Pro',slug:'macbook-pro-m3',category:'laptops',brand:'Apple',price:299999,original_price:319999,stock:5,description:'Supercharged by M3 Pro. 18hr battery. Liquid Retina XDR display.',specs:{Display:'14.2" Liquid Retina XDR',Chip:'Apple M3 Pro',RAM:'18GB',Storage:'512GB SSD',Battery:'18 hours'},variants:['Space Black','Silver'],badge:'New',active:true,images:[]},
  {id:'f4',name:'Apple Watch Ultra 2',slug:'apple-watch-ultra-2',category:'watches',brand:'Apple',price:109999,original_price:null,stock:15,description:'Most rugged Apple Watch. 2000 nits, 60hr battery, titanium case.',specs:{Case:'49mm Titanium',Display:'2000 nits Always-On',GPS:'Dual-frequency L1+L5',Battery:'60 hours',Water:'100m'},variants:['Black Trail Loop','Alpine Loop Green','Ocean Band Orange'],badge:'Hot',active:true,images:[]},
  {id:'f5',name:'Sony WH-1000XM5',slug:'sony-xm5',category:'audio',brand:'Sony',price:34999,original_price:39999,stock:20,description:'Industry-leading ANC. 30hr battery. 8-mic system for crystal calls.',specs:{Type:'Over-ear wireless',ANC:'8-mic industry-leading',Battery:'30 hours',Bluetooth:'5.2 multipoint'},variants:['Midnight Black','Platinum Silver'],badge:'Sale',active:true,images:[]},
  {id:'f6',name:'Galaxy Tab S9 Ultra',slug:'galaxy-tab-s9-ultra',category:'tablets',brand:'Samsung',price:149999,original_price:169999,stock:7,description:'14.6" Dynamic AMOLED 2X. S Pen included. IP68 rated.',specs:{Display:'14.6" Dynamic AMOLED 2X',Processor:'Snapdragon 8 Gen 2',RAM:'12GB',Storage:'256GB',Battery:'11200mAh'},variants:['Graphite','Cream'],badge:'Sale',active:true,images:[]},
  {id:'f7',name:'Dell XPS 15 2024',slug:'dell-xps-15',category:'laptops',brand:'Dell',price:259999,original_price:null,stock:4,description:'Intel Core Ultra 7, 3.5K OLED, RTX 4060. The professional\'s choice.',specs:{Display:'15.6" OLED 3.5K',Processor:'Intel Core Ultra 7',RAM:'32GB',GPU:'RTX 4060 8GB',Storage:'1TB SSD'},variants:['Platinum Silver'],badge:null,active:true,images:[]},
  {id:'f8',name:'Garmin Fenix 7X Pro Solar',slug:'garmin-fenix-7x',category:'watches',brand:'Garmin',price:89999,original_price:99999,stock:9,description:'37-day battery with solar. Multi-band GPS. Built for adventure.',specs:{Case:'51mm Titanium Solar',Battery:'37 days',GPS:'Multi-band GNSS',Water:'100m MIL-STD'},variants:['Carbon Gray','Mineral Blue'],badge:null,active:true,images:[]},
];

const DELIVERY_ZONES = [
  {region:'Nairobi',area:'Nairobi CBD',fee:150,days:'Same day â€“ 24hrs'},
  {region:'Nairobi',area:'Westlands',fee:150,days:'Same day â€“ 24hrs'},
  {region:'Nairobi',area:'Kilimani',fee:150,days:'Same day â€“ 24hrs'},
  {region:'Nairobi',area:'Karen',fee:200,days:'1â€“2 days'},
  {region:'Nairobi',area:'Eastleigh',fee:150,days:'Same day â€“ 24hrs'},
  {region:'Nairobi',area:'South B / South C',fee:200,days:'1â€“2 days'},
  {region:'Nairobi',area:'Langata',fee:200,days:'1â€“2 days'},
  {region:'Nairobi',area:'Kasarani',fee:200,days:'1â€“2 days'},
  {region:'Nairobi',area:'Ruaka / Ruiru',fee:280,days:'1â€“2 days'},
  {region:'Central',area:'Thika',fee:320,days:'1â€“2 days'},
  {region:'Central',area:'Kiambu',fee:320,days:'1â€“2 days'},
  {region:'Central',area:'Nyeri',fee:420,days:'2â€“3 days'},
  {region:'Rift Valley',area:'Nakuru',fee:520,days:'2â€“3 days'},
  {region:'Rift Valley',area:'Eldoret',fee:620,days:'2â€“4 days'},
  {region:'Rift Valley',area:'Kisumu',fee:620,days:'2â€“4 days'},
  {region:'Coast',area:'Mombasa CBD',fee:520,days:'2â€“3 days'},
  {region:'Coast',area:'Mombasa â€“ Nyali/North Coast',fee:620,days:'2â€“4 days'},
  {region:'Eastern',area:'Machakos',fee:420,days:'2â€“3 days'},
  {region:'Eastern',area:'Kitui',fee:520,days:'2â€“4 days'},
  {region:'Western',area:'Kakamega',fee:620,days:'2â€“4 days'},
  {region:'Nyanza',area:'Kisii',fee:620,days:'2â€“4 days'},
  {region:'North Eastern',area:'Garissa',fee:750,days:'3â€“5 days'},
];

const BRANDING_PRESETS = {
  sunset:  { primary: '#F97316', light: '#FFF7ED', mid: '#FED7AA' },
  royal:   { primary: '#2563EB', light: '#EFF6FF', mid: '#BFDBFE' },
  emerald: { primary: '#059669', light: '#ECFDF5', mid: '#A7F3D0' },
  carbon:  { primary: '#111827', light: '#F3F4F6', mid: '#D1D5DB' },
};

const DEFAULT_BRANDING_STATE = {
  preset: 'sunset',
  additions: {
    delivery: true,
    warranty: true,
    payments: true,
    support: false,
  },
};

// ============================================================
// STATE
// ============================================================
let products = [];
let cart = JSON.parse(localStorage.getItem('ltl2_cart') || '[]');
let wishlist = JSON.parse(localStorage.getItem('ltl2_wishlist') || '[]');
let orders = [];
let currentCat = 'all';
let currentProduct = null;
let selectedVariant = null;
let detailQty = 1;
let adminAuth = false;
let ckStep = 1;
let ckData = {};
let deliveryFee = 0;
let deliveryDays = '';
let payMethod = 'paystack';
let dbOnline = false;
let brandingState = {
  preset: DEFAULT_BRANDING_STATE.preset,
  additions: { ...DEFAULT_BRANDING_STATE.additions },
};

// ============================================================
// ICONS
// ============================================================
function catIcon(cat) {
  const m = {
    smartphones:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
    laptops:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="2" y1="20" x2="22" y2="20"/></svg>`,
    watches:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="7"/><polyline points="12 9 12 12 13.5 13.5"/></svg>`,
    audio:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>`,
    tablets:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
    jewerlys:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 20.5 9 12 22 3.5 9 12 2"/><path d="M3.5 9h17"/></svg>`,
  };
  return m[cat] || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
}

const DEFAULT_CATEGORIES = ['smartphones', 'laptops', 'watches', 'audio', 'tablets', 'accessories'];
const CATEGORY_TITLE_MAP = {
  all: 'All Products',
  smartphones: 'Smartphones',
  laptops: 'Laptops',
  watches: 'Watches & Wearables',
  audio: 'Audio',
  tablets: 'Tablets',
  accessories: 'Accessories',
  jewerlys: 'Jewerlys',
};
const CATEGORY_CARD_LABEL_MAP = {
  smartphones: 'Smartphone',
  laptops: 'Laptop',
  watches: 'Watch',
  audio: 'Audio',
  tablets: 'Tablet',
  accessories: 'Accessory',
  jewerlys: 'Jewelry',
};
const HEADER_TOGGLE_CATEGORIES = ['jewerlys'];

function normalizeCategoryValue(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function categoryDisplayName(cat) {
  const slug = normalizeCategoryValue(cat);
  if (!slug) return 'Category';
  if (CATEGORY_TITLE_MAP[slug]) return CATEGORY_TITLE_MAP[slug].replace(' & Wearables', '');
  return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function categoryTitle(cat) {
  const slug = normalizeCategoryValue(cat);
  if (CATEGORY_TITLE_MAP[slug]) return CATEGORY_TITLE_MAP[slug];
  return categoryDisplayName(slug);
}

function cardCategoryLabel(cat) {
  const slug = normalizeCategoryValue(cat);
  return CATEGORY_CARD_LABEL_MAP[slug] || categoryDisplayName(slug);
}

function getAvailableCategories() {
  const dynamic = new Set(products.map((p) => normalizeCategoryValue(p.category)).filter(Boolean));
  const defaults = DEFAULT_CATEGORIES.filter((c) => dynamic.has(c));
  const extras = [...dynamic].filter((c) => !DEFAULT_CATEGORIES.includes(c)).sort();
  return [...defaults, ...extras];
}

function getAvailableBrands() {
  return [...new Set(products.map((p) => String(p.brand || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function getAllowedFilterCategories() {
  return ['all', ...new Set([...getAvailableCategories(), ...HEADER_TOGGLE_CATEGORIES])];
}

function getCategoryFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    return normalizeCategoryValue(params.get('category') || '');
  } catch (_) {
    return '';
  }
}

function getSearchQueryFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    return (params.get('q') || '').trim();
  } catch (_) {
    return '';
  }
}

function syncCategoryInUrl(cat) {
  if (!window.history || typeof window.history.replaceState !== 'function') return;
  const normalized = normalizeCategoryValue(cat) || 'all';
  const url = new URL(window.location.href);
  if (normalized === 'all') url.searchParams.delete('category');
  else url.searchParams.set('category', normalized);
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

function renderCategoryChips() {
  const wrap = document.getElementById('catChips');
  if (!wrap) return;
  const cats = getAvailableCategories();
  const allChip = `
    <a class="cat-chip ${currentCat === 'all' ? 'active' : ''}" href="/?category=all" onclick="event.preventDefault(); setCat('all')" data-f="all">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
      All
    </a>`;
  const chips = cats.map((cat) => `<a class="cat-chip ${currentCat === cat ? 'active' : ''}" href="/?category=${encodeURIComponent(cat)}" onclick="event.preventDefault(); setCat('${cat}')" data-f="${cat}">${categoryDisplayName(cat)}</a>`).join('');
  wrap.innerHTML = allChip + chips;
}

// ============================================================
// SUPABASE â€” Load Products
// ============================================================
async function loadProducts() {
  document.getElementById('productsGrid').innerHTML = `<div class="loader"><div class="spinner"></div> Loading from database...</div>`;
  if (!CFG.ENABLE_SUPABASE) {
    products = FALLBACK_PRODUCTS;
    dbOnline = false;
    document.getElementById('aStatDb').textContent = 'Demo Mode';
    document.getElementById('aStatDb').style.color = 'var(--amber)';
    updateTopbarStats();
    renderCategoryChips();
    if (!getAllowedFilterCategories().includes(currentCat)) currentCat = 'all';
    setCat(currentCat, { closeSidebar: false });
    return;
  }
  try {
    const { data, error } = await sb.from('products').select('*').eq('active', true).order('created_at', {ascending:false});
    if (error) throw error;
    if (data && data.length > 0) {
      products = data;
      dbOnline = true;
      document.getElementById('aStatDb').textContent = 'Connected';
      document.getElementById('aStatDb').style.color = 'var(--green)';
    } else {
      products = FALLBACK_PRODUCTS;
      toast('inf','Using Demo Products','Run supabase-schema.sql to seed your database');
      document.getElementById('aStatDb').textContent = 'No Data';
    }
  } catch(e) {
    console.warn('Supabase error:', e.message);
    products = FALLBACK_PRODUCTS;
    document.getElementById('aStatDb').textContent = 'Using Demo';
    document.getElementById('aStatDb').style.color = 'var(--amber)';
  }
  updateTopbarStats();
  renderCategoryChips();
  if (!getAllowedFilterCategories().includes(currentCat)) currentCat = 'all';
  setCat(currentCat, { closeSidebar: false });
}

async function loadAdminOrders() {
  const tbody = document.getElementById('ordersTableBody');
  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;"><div class="loader" style="padding:0;"><div class="spinner"></div> Loading...</div></td></tr>`;
  if (!CFG.ENABLE_SUPABASE) {
    orders = JSON.parse(localStorage.getItem('ltl2_orders') || '[]');
    renderOrdersTable();
    return;
  }
  try {
    const { data, error } = await sbAdmin.from('orders').select('*').order('created_at', {ascending:false}).limit(50);
    if (error) throw error;
    orders = data || [];
    renderOrdersTable();
    updateTopbarStats();
  } catch(e) {
    orders = JSON.parse(localStorage.getItem('ltl2_orders') || '[]');
    renderOrdersTable();
    toast('inf','Using Local Orders','Supabase orders table may not exist yet');
  }
}

// ============================================================
// PRODUCT RENDERING
// ============================================================
function filterProducts(cat) {
  if (cat === 'all') return products.filter(p => p.active !== false);
  return products.filter(p => normalizeCategoryValue(p.category) === cat && p.active !== false);
}

function renderProducts(list) {
  const grid = document.getElementById('productsGrid');
  if (!list || !list.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">${catIcon('accessories')}<h3>No products found</h3><p>Try a different category or check back soon</p></div>`;
    return;
  }
  grid.innerHTML = list.map(p => {
    const disc = p.original_price ? Math.round((1 - p.price/p.original_price)*100) : 0;
    const inWish = wishlist.includes(String(p.id));
    const img = p.images && p.images.length ? `<img src="${p.images[0]}" alt="${p.name}" loading="lazy" onerror="this.style.display='none'"/>` : `<div class="icon-placeholder">${catIcon(p.category)}</div>`;
    const catLabel = cardCategoryLabel(p.category);
    return `<div class="p-card p-card-wide" onclick="openProduct('${p.id}')">
      <div class="p-card-img">
        ${img}
        <div class="p-card-gradient"></div>
        ${p.badge ? `<div class="p-badge ${p.badge.toLowerCase()}">${p.badge}</div>` : ''}
        <div class="wish-btn ${inWish?'active':''}" onclick="event.stopPropagation();toggleWishlist('${p.id}')">
          <svg viewBox="0 0 24 24" fill="${inWish?'currentColor':'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:${inWish?'var(--red)':'var(--text3)'}"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </div>
        <div class="p-card-body">
          <div class="p-card-brand">${p.brand}</div>
          <div class="p-card-name">${p.name}</div>
          <div class="p-card-meta">
            <span class="p-card-meta-icon">${catIcon(p.category)}</span>
            <span>${catLabel}</span>
          </div>
          <div class="p-card-footer">
            <div>
            <span class="p-card-price">KES ${Number(p.price).toLocaleString()}</span>
            ${p.original_price ? `<span class="p-card-price-orig">KES ${Number(p.original_price).toLocaleString()}</span>` : ''}
            ${disc > 0 ? `<span class="p-card-disc">-${disc}%</span>` : ''}
            </div>
            <div class="p-card-add" onclick="event.stopPropagation();quickAdd('${p.id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }).join('');
}

function setCat(cat, opts = {}) {
  const closeSidebar = opts.closeSidebar !== false;
  const syncUrl = opts.syncUrl !== false;
  currentCat = normalizeCategoryValue(cat) || 'all';
  if (
    !getAllowedFilterCategories().includes(currentCat)
  ) currentCat = 'all';
  document.querySelectorAll('.cat-chip').forEach(c => c.classList.toggle('active', c.dataset.f === currentCat));
  document.querySelectorAll('.nav-item[data-cat]').forEach(n => n.classList.toggle('active', n.dataset.cat === currentCat));
  const tgElectronics = document.getElementById('tgElectronics');
  const tgJewerlys = document.getElementById('tgJewerlys');
  if (tgElectronics && tgJewerlys) {
    const isJewerlys = currentCat === 'jewerlys';
    tgElectronics.classList.toggle('active', !isJewerlys);
    tgJewerlys.classList.toggle('active', isJewerlys);
  }
  const explore = document.querySelector('.nav-item[data-pg="explore"]');
  if (currentCat === 'all') { explore.classList.add('active'); }
  else { explore.classList.remove('active'); }
  document.getElementById('productsTitle').textContent = categoryTitle(currentCat);
  renderProducts(filterProducts(currentCat));
  if (syncUrl) syncCategoryInUrl(currentCat);
  if (closeSidebar) closeMobileSidebar();
}

function doSearch(q) {
  const query = q.trim().toLowerCase();
  if (!query) { renderProducts(filterProducts(currentCat)); return; }
  renderProducts(products.filter(p => p.active !== false && (p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query) || p.category.toLowerCase().includes(query))));
}

// ============================================================
// PRODUCT DETAIL
// ============================================================
function openProduct(id) {
  currentProduct = products.find(p => String(p.id) === String(id));
  if (!currentProduct) return;
  selectedVariant = currentProduct.variants && currentProduct.variants.length ? currentProduct.variants[0] : null;
  detailQty = 1;
  navigate('detail');
  renderDetailGallery(currentProduct);
  renderDetailInfo(currentProduct);
}

function renderDetailGallery(p) {
  const imgs = p.images && p.images.length ? p.images : null;
  document.getElementById('detailGallery').innerHTML = `
    <div class="gallery-main-wrap" id="gallMainWrap">
      ${imgs ? `<img src="${imgs[0]}" id="galMainImg" style="width:100%;height:100%;object-fit:cover"/>` : `<div class="big-placeholder">${catIcon(p.category)}</div>`}
    </div>
    <div class="gallery-thumbs">
      ${[1,2,3,4].map((_,i) => `
        <div class="g-thumb ${i===0?'active':''}" onclick="switchThumb(${i},this)">
          ${imgs && imgs[i] ? `<img src="${imgs[i]}" alt=""/>` : catIcon(p.category)}
        </div>`).join('')}
    </div>`;
}

function switchThumb(idx, el) {
  const p = currentProduct;
  if (p.images && p.images[idx]) { const mi = document.getElementById('galMainImg'); if(mi) mi.src = p.images[idx]; }
  document.querySelectorAll('.g-thumb').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

function renderDetailInfo(p) {
  const disc = p.original_price ? Math.round((1 - p.price/p.original_price)*100) : 0;
  const stock = p.stock;
  const stockCls = stock === 0 ? 'out' : stock < 5 ? 'low' : 'in';
  const stockTxt = stock === 0 ? 'Out of Stock' : stock < 5 ? `Only ${stock} left` : 'In Stock';
  const specs = p.specs || {};
  const variantsHTML = p.variants && p.variants.length ? `
    <div class="d-label">Variant / Colour</div>
    <div class="d-variants" id="variantRow">
      ${p.variants.map(v => `<button class="v-btn ${v===selectedVariant?'active':''}" onclick="selectVariant('${v}',this)">${v}</button>`).join('')}
    </div>` : '';
  document.getElementById('detailInfo').innerHTML = `
    <div class="d-brand">${p.brand} Â· ${p.category.toUpperCase()}</div>
    <div class="d-name">${p.name}</div>
    <div class="d-price-row">
      <span class="d-price">KES ${Number(p.price).toLocaleString()}</span>
      ${p.original_price ? `<span class="d-orig">KES ${Number(p.original_price).toLocaleString()}</span>` : ''}
      ${disc > 0 ? `<span class="d-disc">Save ${disc}%</span>` : ''}
    </div>
    <div class="d-stock ${stockCls}"><span class="dot"></span>${stockTxt}</div>
    ${variantsHTML}
    <div class="d-label">Quantity</div>
    <div class="d-qty-row" style="margin-bottom:20px;">
      <div class="d-qty-btn" onclick="changeDetailQty(-1)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:13px;height:13px"><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </div>
      <div class="d-qty-val" id="detailQtyVal">1</div>
      <div class="d-qty-btn" onclick="changeDetailQty(1)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:13px;height:13px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </div>
    </div>
    <div class="d-actions">
      <button class="btn-secondary" onclick="addToCartDetail()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        Add to Basket
      </button>
      <button class="btn-primary" onclick="buyNow()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        Buy Now
      </button>
      <button class="btn-wa" onclick="waOrder()" title="Order via WhatsApp">
        <svg viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
      </button>
    </div>
    <div class="d-tabs">
      <div class="d-tab active" onclick="switchDTab('desc',this)">Description</div>
      <div class="d-tab" onclick="switchDTab('specs',this)">Specs</div>
      <div class="d-tab" onclick="switchDTab('delivery',this)">Delivery</div>
    </div>
    <div id="dTabDesc" class="d-tab-content">${p.description || 'Premium product by ' + p.brand}</div>
    <div id="dTabSpecs" style="display:none;">
      ${Object.keys(specs).length ? `<div class="specs-table">${Object.entries(specs).map(([k,v])=>`<div class="spec-row"><div class="spec-key">${k}</div><div class="spec-val">${v}</div></div>`).join('')}</div>` : '<p style="color:var(--text3)">Specs not available.</p>'}
    </div>
    <div id="dTabDelivery" style="display:none;">
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:16px;font-size:13px;color:var(--text2);line-height:1.7;">
        <strong style="color:var(--primary)">Delivery Across Kenya</strong><br/>
        Nairobi CBD/Westlands: KES 150 Â· Same day<br/>
        Greater Nairobi: KES 200 Â· 1â€“2 days<br/>
        Major towns (Mombasa, Kisumu, Nakuru): KES 500â€“620 Â· 2â€“4 days<br/>
        Rest of Kenya: KES 420â€“750 Â· 2â€“5 days
      </div>
    </div>`;
}

function switchDTab(tab, el) {
  document.querySelectorAll('.d-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  ['desc','specs','delivery'].forEach(t => {
    const el2 = document.getElementById('dTab'+t.charAt(0).toUpperCase()+t.slice(1));
    if(el2) el2.style.display = t===tab?'':'none';
  });
}
function selectVariant(v, el) {
  selectedVariant = v;
  document.querySelectorAll('.v-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
}
function changeDetailQty(d) {
  detailQty = Math.max(1, Math.min(currentProduct?.stock||99, detailQty + d));
  document.getElementById('detailQtyVal').textContent = detailQty;
}

// ============================================================
// CART
// ============================================================
function cartKey(id, variant) { return id + '::' + (variant||'default'); }
function cartTotal() { return cart.reduce((s,i) => s + i.price * i.qty, 0); }
function cartCount() { return cart.reduce((s,i) => s + i.qty, 0); }

function addToCart(product, qty, variant) {
  const key = cartKey(product.id, variant);
  const ex = cart.find(i => i.key === key);
  if (ex) { ex.qty = Math.min(product.stock||99, ex.qty + qty); }
  else { cart.push({ key, productId:product.id, name:product.name, brand:product.brand, price:Number(product.price), variant:variant||null, qty, image:product.images?.[0]||null, category:product.category }); }
  localStorage.setItem('ltl2_cart', JSON.stringify(cart));
  updateCartUI();
  toast('ok', 'Added to Basket', `${product.name}${variant?' Â· '+variant:''}`);
}

function quickAdd(id) {
  const p = products.find(x => String(x.id) === String(id));
  if (!p) return;
  addToCart(p, 1, p.variants?.[0]||null);
}

function addToCartDetail() {
  if (!currentProduct) return;
  addToCart(currentProduct, detailQty, selectedVariant);
}

function buyNow() {
  addToCartDetail();
  setTimeout(() => { closeCart(); goCheckout(); }, 200);
}

function waOrder() {
  if (!currentProduct) return;
  const p = currentProduct;
  const msg = encodeURIComponent(`Hi, I'd like to order:\n*${p.name}*${selectedVariant?' ('+selectedVariant+')':''}\nQty: ${detailQty}\nPrice: KES ${(p.price*detailQty).toLocaleString()}\n\nPlease assist with ordering and delivery.`);
  window.open(getWhatsAppLink(msg), '_blank');
}

function removeFromCart(key) {
  cart = cart.filter(i => i.key !== key);
  localStorage.setItem('ltl2_cart', JSON.stringify(cart));
  updateCartUI();
  renderCartDrawer();
}

function updateCartItemQty(key, d) {
  const item = cart.find(i => i.key === key);
  if (!item) return;
  item.qty = Math.max(1, item.qty + d);
  localStorage.setItem('ltl2_cart', JSON.stringify(cart));
  updateCartUI();
  renderCartDrawer();
}

function updateCartUI() {
  const count = cartCount();
  [document.getElementById('cartBadge'), document.getElementById('sidebarBadge')].forEach(el => {
    if (!el) return;
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
  document.getElementById('cdCount').textContent = count;
}

function renderCartDrawer() {
  const wrap = document.getElementById('cdItemsWrap');
  const footer = document.getElementById('cdFooter');
  if (!cart.length) {
    wrap.innerHTML = `<div class="cd-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
      <h4>Basket is empty</h4>
      <p>Browse our electronics and add something great</p>
    </div>`;
    footer.innerHTML = '';
    return;
  }
  wrap.innerHTML = cart.map(item => `
    <div class="cd-item">
      <div class="cd-item-img">
        ${item.image ? `<img src="${item.image}" alt="${item.name}" onerror="this.style.display='none'"/>` : catIcon(item.category)}
      </div>
      <div class="cd-item-info">
        <div class="cd-item-name">${item.name}</div>
        <div class="cd-item-variant">${item.brand}${item.variant?' Â· '+item.variant:''}</div>
        <div class="cd-qty-row">
          <div class="cq-btn" onclick="updateCartItemQty('${item.key}',-1)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:11px;height:11px"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
          <div class="cq-val">${item.qty}</div>
          <div class="cq-btn" onclick="updateCartItemQty('${item.key}',1)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:11px;height:11px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
        </div>
      </div>
      <div class="cd-item-right">
        <span class="cd-item-price">KES ${(item.price*item.qty).toLocaleString()}</span>
        <div class="cd-remove" onclick="removeFromCart('${item.key}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </div>
      </div>
    </div>`).join('');
  footer.innerHTML = `
    <div class="cd-total-row"><span>Subtotal (${cartCount()} items)</span><span>KES ${cartTotal().toLocaleString()}</span></div>
    <div class="cd-total-row" style="font-size:11px;color:var(--text4)">Delivery calculated at checkout</div>
    <div class="cd-total-row grand"><span>Estimated Total</span><span class="g-amount">KES ${cartTotal().toLocaleString()}</span></div>
    <button class="btn-cta blue" onclick="closeCart();goCheckout()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
      Checkout
    </button>`;
}

function openCart() {
  renderCartDrawer();
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCart() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ============================================================
// CHECKOUT â€” TIMELINE (4 steps)
// ============================================================
function goCheckout() {
  if (!cart.length) { toast('err','Basket is empty','Add items first'); return; }
  ckStep = 1; ckData = {}; deliveryFee = 0;
  navigate('checkout');
  renderCkTimeline();
  renderCkStep();
  renderCkSummary();
}

function renderCkTimeline() {
  const labels = ['Basket','Your Details','Payment','Done'];
  const progW = [0, 33, 66, 100];
  document.getElementById('tlProgress').style.width = progW[ckStep-1] + '%';
  [1,2,3,4].forEach(i => {
    const dot = document.getElementById('tlDot'+i);
    const lbl = document.getElementById('tlLbl'+i);
    dot.className = 'tl-dot ' + (i < ckStep ? 'done' : i === ckStep ? 'current' : '');
    lbl.className = 'tl-label ' + (i < ckStep ? 'done' : i === ckStep ? 'active' : '');
    if (i < ckStep) {
      dot.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>`;
    } else {
      dot.innerHTML = `<span>${i}</span>`;
    }
  });
}

function renderCkStep() {
  const area = document.getElementById('ckMainArea');
  if (ckStep === 1) {
    // Step 1: Review basket + Delivery zone
    const zoneOpts = Object.entries(DELIVERY_ZONES.reduce((acc,z) => { if(!acc[z.region])acc[z.region]=[]; acc[z.region].push(z); return acc; },{}))
      .map(([r,zones]) => `<optgroup label="${r}">${zones.map(z=>`<option value="${z.area}|${z.fee}|${z.days}">${z.area} â€” KES ${z.fee} (${z.days})</option>`).join('')}</optgroup>`).join('');
    area.innerHTML = `<div class="ck-main">
      <h3>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        Review Your Basket
      </h3>
      ${cart.map(item=>`
        <div class="cd-item" style="padding:12px 0;">
          <div class="cd-item-img">${item.image?`<img src="${item.image}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'"/>`:catIcon(item.category)}</div>
          <div class="cd-item-info">
            <div class="cd-item-name">${item.name}</div>
            <div class="cd-item-variant">${item.brand}${item.variant?' Â· '+item.variant:''} Â· Qty ${item.qty}</div>
          </div>
          <div class="cd-item-price" style="font-family:var(--font-m);font-size:13px;font-weight:700;">KES ${(item.price*item.qty).toLocaleString()}</div>
        </div>`).join('')}
      <div style="border-top:1.5px solid var(--border);padding-top:16px;margin-top:8px;">
        <div class="form-group">
          <label class="form-label">Delivery Location <span class="req">*</span></label>
          <select class="form-select" id="ck1Zone" onchange="updateDeliveryFee(this.value)">
            <option value="">Select your area...</option>
            ${zoneOpts}
          </select>
        </div>
        <div id="ck1FeeInfo" style="display:none;background:var(--primary-lt);border:1px solid var(--primary-md);border-radius:var(--radius-sm);padding:10px 14px;font-size:13px;color:var(--primary);margin-top:-6px;margin-bottom:14px;display:none;align-items:center;gap:8px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;flex-shrink:0"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          <span id="ck1FeeText"></span>
        </div>
      </div>
      <div class="ck-nav-row">
        <button class="btn-cta outline" style="width:auto;padding:11px 20px;" onclick="navigate('explore')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px"><polyline points="15 18 9 12 15 6"/></svg>
          Continue Shopping
        </button>
        <button class="btn-cta blue" style="width:auto;padding:11px 24px;" onclick="ckNext(1)">
          Next: Your Details
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      </div>
    </div>`;
    if (ckData.deliveryZone) {
      document.getElementById('ck1Zone').value = ckData.deliveryZone;
      updateDeliveryFee(ckData.deliveryZone);
    }
  } else if (ckStep === 2) {
    // Step 2: Customer details
    area.innerHTML = `<div class="ck-main">
      <h3>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
        Your Details
      </h3>
      <div style="background:var(--primary-lt);border:1px solid var(--primary-md);border-radius:var(--radius-sm);padding:12px 14px;font-size:12.5px;color:var(--primary);margin-bottom:18px;display:flex;gap:8px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        No account needed. Your email is only used for your order confirmation and invoice.
      </div>
      <div class="form-grid-2">
        <div class="form-group"><label class="form-label">Full Name</label><input class="form-input" id="ck2Name" value="${ckData.name||''}" placeholder="John Doe"/></div>
        <div class="form-group"><label class="form-label">Email <span class="req">*</span></label><input type="email" class="form-input" id="ck2Email" value="${ckData.email||''}" placeholder="john@email.com" required/></div>
        <div class="form-group"><label class="form-label">Phone (M-Pesa / WhatsApp)</label><input type="tel" class="form-input" id="ck2Phone" value="${ckData.phone||''}" placeholder="0700 000 000"/></div>
        <div class="form-group"><label class="form-label">Delivery Area</label><input class="form-input" value="${ckData.deliveryZone ? ckData.deliveryZone.split('|')[0] : ''}" readonly style="background:var(--bg);"/></div>
      </div>
      <div class="form-group"><label class="form-label">Street Address / Building / Landmark</label><input class="form-input" id="ck2Address" value="${ckData.address||''}" placeholder="e.g. Nextgen Mall, 3rd Floor"/></div>
      <div class="ck-nav-row">
        <button class="btn-cta outline" style="width:auto;padding:11px 20px;" onclick="ckBack()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
        <button class="btn-cta blue" style="width:auto;padding:11px 24px;" onclick="ckNext(2)">
          Next: Payment
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      </div>
    </div>`;
  } else if (ckStep === 3) {
    // Step 3: Payment
    area.innerHTML = `<div class="ck-main">
      <h3>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
        Payment Method
      </h3>
      <div class="pay-methods">
        <div class="pay-option selected" id="pm-paystack" onclick="selectPayMethod('paystack')">
          <div class="pay-radio"></div>
          <div class="pay-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          </div>
          <div class="pay-info"><h4>Card / M-Pesa (Paystack)</h4><p>Secure instant payment Â· Get email invoice</p></div>
        </div>
        <div class="pay-option wa-opt" id="pm-whatsapp" onclick="selectPayMethod('whatsapp')">
          <div class="pay-radio"></div>
          <div class="pay-icon">
            <svg viewBox="0 0 24 24" fill="#22C55E"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
          </div>
          <div class="pay-info"><h4>WhatsApp Order</h4><p>Pay on delivery or via M-Pesa Â· Our team calls you</p></div>
        </div>
      </div>
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;margin-bottom:18px;font-size:12.5px;color:var(--text3);">
        <strong style="color:var(--text2);">Order for:</strong> ${ckData.name||ckData.email}<br/>
        <strong style="color:var(--text2);">Deliver to:</strong> ${ckData.deliveryZone ? ckData.deliveryZone.split('|')[0] : 'N/A'} Â· ${deliveryDays}
      </div>
      <div class="ck-nav-row">
        <button class="btn-cta outline" style="width:auto;padding:11px 20px;" onclick="ckBack()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
        <button class="btn-cta blue" id="btnConfirmPay" style="width:auto;padding:11px 28px;" onclick="processPayment()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          Pay KES ${(cartTotal() + deliveryFee).toLocaleString()} via Paystack
        </button>
      </div>
    </div>`;
    // Restore payMethod selection
    if (payMethod === 'whatsapp') selectPayMethod('whatsapp');
  }
}

function renderCkSummary() {
  const total = cartTotal() + deliveryFee;
  document.getElementById('ckSummaryBox').innerHTML = `
    <h4>Order Summary</h4>
    ${cart.map(i=>`
      <div class="ck-item">
        <div class="ck-item-img">${i.image?`<img src="${i.image}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'"/>`:catIcon(i.category)}</div>
        <div class="ck-item-info"><div class="ck-item-name">${i.name}</div><div class="ck-item-meta">${i.brand}${i.variant?' Â· '+i.variant:''} Ã— ${i.qty}</div></div>
        <div class="ck-item-price">KES ${(i.price*i.qty).toLocaleString()}</div>
      </div>`).join('')}
    <div class="ck-totals">
      <div class="ck-tot-row"><span>Subtotal</span><span>KES ${cartTotal().toLocaleString()}</span></div>
      <div class="ck-tot-row"><span>Delivery${ckData.deliveryZone?' ('+ckData.deliveryZone.split('|')[0]+')':''}</span><span>${deliveryFee > 0 ? 'KES '+deliveryFee.toLocaleString() : 'â€”'}</span></div>
      <div class="ck-tot-row grand"><span>Total</span><span class="ck-amount">KES ${total.toLocaleString()}</span></div>
    </div>`;
}

function updateDeliveryFee(val) {
  const info = document.getElementById('ck1FeeInfo');
  const txt = document.getElementById('ck1FeeText');
  if (!val) { deliveryFee = 0; if(info) info.style.display='none'; renderCkSummary(); return; }
  const parts = val.split('|');
  deliveryFee = parseInt(parts[1]);
  deliveryDays = parts[2] || '';
  ckData.deliveryZone = val;
  if (info) { info.style.display='flex'; txt.textContent = `Delivery to ${parts[0]}: KES ${parseInt(parts[1]).toLocaleString()} Â· ${parts[2]}`; }
  renderCkSummary();
}

function selectPayMethod(method) {
  payMethod = method;
  document.querySelectorAll('.pay-option').forEach(o => o.classList.remove('selected'));
  document.getElementById('pm-'+method).classList.add('selected');
  const btn = document.getElementById('btnConfirmPay');
  if (!btn) return;
  const total = cartTotal() + deliveryFee;
  if (method === 'whatsapp') {
    btn.className = 'btn-cta green';
    btn.style.cssText = 'width:auto;padding:11px 28px;';
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="white" style="width:16px;height:16px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg> Send Order via WhatsApp`;
  } else {
    btn.className = 'btn-cta blue';
    btn.style.cssText = 'width:auto;padding:11px 28px;';
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Pay KES ${total.toLocaleString()} via Paystack`;
  }
}

function ckNext(fromStep) {
  if (fromStep === 1) {
    const zone = document.getElementById('ck1Zone')?.value;
    if (!zone) { toast('err','Select Delivery Area','Please choose where to deliver'); return; }
    ckData.deliveryZone = zone;
    const parts = zone.split('|');
    deliveryFee = parseInt(parts[1]);
    deliveryDays = parts[2] || '';
    ckStep = 2;
  } else if (fromStep === 2) {
    const email = document.getElementById('ck2Email')?.value.trim();
    if (!email || !email.includes('@')) { toast('err','Email required','Enter a valid email for order confirmation'); return; }
    ckData.name = document.getElementById('ck2Name')?.value.trim();
    ckData.email = email;
    ckData.phone = document.getElementById('ck2Phone')?.value.trim();
    ckData.address = document.getElementById('ck2Address')?.value.trim();
    ckStep = 3;
  }
  renderCkTimeline();
  renderCkStep();
  renderCkSummary();
  window.scrollTo({top:0,behavior:'smooth'});
}

function ckBack() {
  ckStep = Math.max(1, ckStep - 1);
  renderCkTimeline();
  renderCkStep();
  renderCkSummary();
  window.scrollTo({top:0,behavior:'smooth'});
}

async function processPayment() {
  const total = cartTotal() + deliveryFee;
  const orderNum = 'LTL-' + Date.now().toString(36).toUpperCase().slice(-8);
  if (payMethod === 'whatsapp') {
    const itemsTxt = cart.map(i=>`â€¢ ${i.name}${i.variant?' ('+i.variant+')':''} Ã—${i.qty} â€” KES ${(i.price*i.qty).toLocaleString()}`).join('\n');
    const msg = encodeURIComponent(`*Order #${orderNum}*\n\n*Customer:* ${ckData.name||'N/A'}\n*Email:* ${ckData.email}\n*Phone:* ${ckData.phone||'N/A'}\n*Deliver to:* ${ckData.deliveryZone?ckData.deliveryZone.split('|')[0]:''}\n*Address:* ${ckData.address||'TBD'}\n\n*Items:*\n${itemsTxt}\n\n*Subtotal:* KES ${cartTotal().toLocaleString()}\n*Delivery:* KES ${deliveryFee.toLocaleString()}\n*TOTAL: KES ${total.toLocaleString()}*`);
    await saveOrder(orderNum, 'whatsapp', 'pending', total, null);
    window.open(getWhatsAppLink(msg), '_blank');
    completeOrder(orderNum, 'WhatsApp');
  } else {
    try {
      const handler = PaystackPop.setup({
        key: CFG.PAYSTACK_PK,
        email: ckData.email,
        amount: total * 100,
        currency: 'KES',
        ref: orderNum,
        metadata: {
          custom_fields:[{display_name:'Customer',variable_name:'customer',value:ckData.name||ckData.email},{display_name:'Order',variable_name:'order',value:orderNum}]
        },
        callback: async (response) => {
          await saveOrder(orderNum, 'paystack', 'paid', total, response.reference);
          completeOrder(orderNum, 'Paystack');
        },
        onClose: () => toast('inf','Payment cancelled','Your basket is saved')
      });
      handler.openIframe();
    } catch(e) {
      toast('err','Payment Error','Paystack could not load. Try WhatsApp instead.');
    }
  }
}

async function saveOrder(orderNum, method, payStatus, total, ref) {
  const orderObj = {
    order_number: orderNum,
    customer_name: ckData.name || null,
    customer_email: ckData.email,
    customer_phone: ckData.phone || null,
    delivery_area: ckData.deliveryZone ? ckData.deliveryZone.split('|')[0] : '',
    delivery_address: ckData.address || null,
    items: cart,
    subtotal: cartTotal(),
    delivery_fee: deliveryFee,
    total,
    currency: 'KES',
    payment_method: method,
    payment_status: payStatus,
    paystack_ref: ref || null,
    order_status: 'confirmed',
    created_at: new Date().toISOString()
  };
  // Save to Supabase
  if (CFG.ENABLE_SUPABASE) {
    try {
      const { error } = await sb.from('orders').insert([orderObj]);
      if (error) throw error;
    } catch(e) {
      console.warn('Supabase order save failed:', e.message);
    }
  }
  // Always save locally as backup
  const localOrders = JSON.parse(localStorage.getItem('ltl2_orders') || '[]');
  localOrders.unshift(orderObj);
  localStorage.setItem('ltl2_orders', JSON.stringify(localOrders));
  // Update sidebar
  document.getElementById('lastOrdersLabel').textContent = `Last order: ${orderNum}`;
  updateTopbarStats();
}

function completeOrder(orderNum, method) {
  ckStep = 4;
  renderCkTimeline();
  const total = cartTotal() + deliveryFee;
  const supportMsg = encodeURIComponent(`Hi, I placed order #${orderNum} and need help.`);
  navigate('success');
  document.getElementById('successContent').innerHTML = `
    <div class="success-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    </div>
    <h2>Order Confirmed!</h2>
    <p>Your order has been placed. A confirmation and invoice will be sent to <strong style="color:var(--primary)">${ckData.email}</strong> by our team.</p>
    <div class="order-detail-card">
      <div class="odc-order-num">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        ${orderNum}
      </div>
      <div class="odc-row"><span>Deliver to</span><strong>${ckData.deliveryZone?ckData.deliveryZone.split('|')[0]:''}</strong></div>
      <div class="odc-row"><span>Paid via</span><strong>${method}</strong></div>
      <div class="odc-row"><span>Total</span><strong style="color:var(--primary);font-family:var(--font-m)">KES ${total.toLocaleString()}</strong></div>
      <div class="odc-row"><span>Estimated delivery</span><strong>${deliveryDays}</strong></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:10px;">
      <button class="btn-cta blue" onclick="navigate('explore')" style="justify-content:center;">Continue Shopping</button>
      <a href="${getWhatsAppLink(supportMsg)}" target="_blank" class="btn-cta green" style="justify-content:center;">
        <svg viewBox="0 0 24 24" fill="white" style="width:16px;height:16px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
        WhatsApp Support
      </a>
    </div>`;
  // Clear cart
  cart = [];
  localStorage.setItem('ltl2_cart', JSON.stringify(cart));
  updateCartUI();
}

// ============================================================
// WISHLIST
// ============================================================
function toggleWishlist(id) {
  const sid = String(id);
  if (wishlist.includes(sid)) { wishlist = wishlist.filter(i=>i!==sid); toast('inf','Removed from wishlist',''); }
  else { wishlist.push(sid); toast('ok','Saved to wishlist',''); }
  localStorage.setItem('ltl2_wishlist', JSON.stringify(wishlist));
  renderProducts(filterProducts(currentCat));
}

// ============================================================
// ADMIN PANEL
// ============================================================
function openAdmin() {
  document.getElementById('adminPanel').classList.add('open');
  document.body.classList.add('admin-open');
  if (adminAuth) { showAdminDash(); }
  else {
    document.getElementById('adminLoginScreen').style.display = 'flex';
    document.getElementById('adminDashScreen').style.display = 'none';
    setTimeout(() => document.getElementById('adminPwd').focus(), 200);
  }
  document.body.style.overflow = 'hidden';
}

function closeAdmin() {
  document.getElementById('adminPanel').classList.remove('open');
  document.body.classList.remove('admin-open');
  document.body.style.overflow = '';
}

function doAdminLogin() {
  const pwd = document.getElementById('adminPwd').value;
  if (pwd === CFG.ADMIN_PASS) {
    adminAuth = true;
    document.getElementById('adminErr').classList.remove('show');
    showAdminDash();
  } else {
    document.getElementById('adminErr').classList.add('show');
  }
}

function showAdminDash() {
  document.getElementById('adminLoginScreen').style.display = 'none';
  document.getElementById('adminDashScreen').style.display = 'flex';
  updateAdminStats();
  adminTab('products');
}

function adminTab(tab) {
  ['products','orders','settings'].forEach(t => {
    document.getElementById('admin'+t.charAt(0).toUpperCase()+t.slice(1)).style.display = t===tab ? '' : 'none';
    document.getElementById('at-'+t).classList.toggle('active', t===tab);
  });
  if (tab==='orders') loadAdminOrders();
  if (tab==='products') renderAdminProducts();
}

function updateAdminStats() {
  document.getElementById('aStatProd').textContent = products.filter(p=>p.active!==false).length;
  const lo = JSON.parse(localStorage.getItem('ltl2_orders')||'[]');
  document.getElementById('aStatOrders').textContent = lo.length;
  const rev = lo.filter(o=>o.payment_status==='paid').reduce((s,o)=>s+(o.total||0),0);
  document.getElementById('aStatRev').textContent = rev > 0 ? (rev/1000).toFixed(0)+'K' : '0';
}

function updateTopbarStats() {
  const lo = JSON.parse(localStorage.getItem('ltl2_orders')||'[]');
  document.getElementById('topbarNum').textContent = lo.length;
  document.getElementById('topbarSub').textContent = lo.length === 1 ? 'Order Â· All time' : 'Orders Â· All time';
}

function renderAdminProducts() {
  const tbody = document.getElementById('prodTableBody');
  if (!tbody) return;
  tbody.innerHTML = products.map(p => `
    <tr>
      <td><div class="td-prod"><div class="td-thumb">${catIcon(p.category)}</div><div><div class="td-name">${p.name}</div><div class="td-sub">${p.brand}</div></div></div></td>
      <td><span class="tag-chip">${p.category}</span></td>
      <td style="font-family:var(--font-m)">KES ${Number(p.price).toLocaleString()}</td>
      <td style="font-family:var(--font-m)">${p.stock}</td>
      <td><span class="pill ${p.active!==false?'active':'inactive'}">${p.active!==false?'Active':'Hidden'}</span></td>
      <td><div class="tbl-btns">
        <div class="tbl-btn" onclick="openProdForm('${p.id}')" title="Edit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </div>
        <div class="tbl-btn" onclick="toggleActive('${p.id}')" title="Toggle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/>${p.active!==false?'<line x1="8" y1="8" x2="16" y2="16"/><line x1="16" y1="8" x2="8" y2="16"/>':'<path d="M20 6L9 17l-5-5"/>'}</svg>
        </div>
        <div class="tbl-btn del" onclick="deleteProduct('${p.id}')" title="Delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </div>
      </div></td>
    </tr>`).join('');
  document.getElementById('aStatProd').textContent = products.filter(p=>p.active!==false).length;
}

function renderOrdersTable() {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody) return;
  const allOrders = orders.length ? orders : JSON.parse(localStorage.getItem('ltl2_orders')||'[]');
  if (!allOrders.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text4);">No orders yet</td></tr>`;
    return;
  }
  tbody.innerHTML = allOrders.map(o => `
    <tr>
      <td style="font-family:var(--font-m);color:var(--primary);font-size:12px">${o.order_number}</td>
      <td>${o.customer_name||o.customer_email||'â€”'}</td>
      <td style="font-size:12px">${o.delivery_area||'â€”'}</td>
      <td style="font-family:var(--font-m)">${Number(o.total||0).toLocaleString()}</td>
      <td><span class="pill ${o.payment_status==='paid'?'paid':'pending'}">${o.payment_status}</span></td>
      <td><span class="pill ${o.order_status==='confirmed'?'active':o.order_status==='shipped'?'shipped':'pending'}">${o.order_status||'confirmed'}</span></td>
      <td style="font-size:12px;color:var(--text3)">${new Date(o.created_at).toLocaleDateString('en-KE')}</td>
    </tr>`).join('');
}

function openProdForm(id) {
  const p = id ? products.find(x => String(x.id) === String(id)) : null;
  const wrap = document.getElementById('prodFormWrap');
  const categories = [...new Set([...DEFAULT_CATEGORIES, ...getAvailableCategories()])];
  const brands = getAvailableBrands();
  wrap.style.display = 'block';
  wrap.innerHTML = `<div class="prod-form">
    <h4>${p?'Edit: '+p.name:'Add New Product'}
      <button class="btn-cta outline" style="width:auto;padding:8px 14px;font-size:12px;" onclick="document.getElementById('prodFormWrap').style.display='none'">Cancel</button>
    </h4>
    <div class="form-grid-3">
      <div class="form-group"><label class="form-label">Name</label><input class="form-input" id="pf-name" value="${p?p.name:''}"/></div>
      <div class="form-group"><label class="form-label">Brand</label><input class="form-input" id="pf-brand" list="pf-brand-list" value="${p?p.brand:''}" placeholder="e.g. Samsung"/><datalist id="pf-brand-list">${brands.map((b)=>`<option value="${b}"></option>`).join('')}</datalist></div>
      <div class="form-group"><label class="form-label">Category</label><input class="form-input" id="pf-cat" list="pf-cat-list" value="${p?normalizeCategoryValue(p.category):''}" placeholder="e.g. smartphones"/><datalist id="pf-cat-list">${categories.map((c)=>`<option value="${c}">${categoryDisplayName(c)}</option>`).join('')}</datalist></div>
    </div>
    <div class="form-grid-3">
      <div class="form-group"><label class="form-label">Price (KES)</label><input type="number" class="form-input" id="pf-price" value="${p?p.price:''}"/></div>
      <div class="form-group"><label class="form-label">Original Price</label><input type="number" class="form-input" id="pf-orig" value="${p&&p.original_price?p.original_price:''}"/></div>
      <div class="form-group"><label class="form-label">Stock</label><input type="number" class="form-input" id="pf-stock" value="${p?p.stock:0}"/></div>
    </div>
    <div class="form-grid-2">
      <div class="form-group"><label class="form-label">Badge</label>
        <select class="form-select" id="pf-badge"><option value="">None</option>${['New','Hot','Sale'].map(b=>`<option ${p&&p.badge===b?'selected':''}>${b}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label class="form-label">Variants (comma separated)</label><input class="form-input" id="pf-variants" value="${p&&p.variants?p.variants.join(', '):''}"/></div>
    </div>
    <div class="form-group"><label class="form-label">Description</label><textarea class="form-textarea" id="pf-desc">${p?p.description:''}</textarea></div>
    <div class="form-group"><label class="form-label">Product Images (comma/new-line URLs)</label><input class="form-input" id="pf-images" oninput="updateImgPreviews()" placeholder="Paste links from Pinterest, Postimg, Google Images or direct image URLs" value="${p&&p.images?p.images.join(', '):''}"/>
      <div style="font-size:11.5px;color:var(--text4);margin-top:7px;">Google/Pinterest redirect links are auto-normalized to direct image URLs when possible.</div>
      <div class="prod-img-grid" id="pfImgGrid" style="margin-top:10px;">
        <div class="prod-img-slot" id="pfSlot0"><div class="pis-add"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:18px;height:18px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span>Img 1</span></div></div>
        <div class="prod-img-slot" id="pfSlot1"><div class="pis-add"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:18px;height:18px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span>Img 2</span></div></div>
        <div class="prod-img-slot" id="pfSlot2"><div class="pis-add"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:18px;height:18px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span>Img 3</span></div></div>
        <div class="prod-img-slot" id="pfSlot3"><div class="pis-add"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:18px;height:18px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span>Img 4</span></div></div>
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-top:4px;">
      <button class="btn-cta blue" style="width:auto;padding:11px 22px;" onclick="saveProd('${id||''}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        ${p?'Save Changes':'Add Product'}
      </button>
      <button class="btn-cta outline" style="width:auto;padding:11px 18px;" onclick="document.getElementById('prodFormWrap').style.display='none'">Cancel</button>
    </div>
  </div>`;
  updateImgPreviews();
  wrap.scrollIntoView({behavior:'smooth'});
}

async function saveProd(id) {
  const name  = document.getElementById('pf-name').value.trim();
  const brand = document.getElementById('pf-brand').value.trim();
  const cat   = normalizeCategoryValue(document.getElementById('pf-cat').value);
  const price = parseFloat(document.getElementById('pf-price').value);
  const orig  = parseFloat(document.getElementById('pf-orig').value) || null;
  const stock = parseInt(document.getElementById('pf-stock').value) || 0;
  const badge = document.getElementById('pf-badge').value || null;
  const desc  = document.getElementById('pf-desc').value.trim();
  const variants = document.getElementById('pf-variants').value.split(',').map(v=>v.trim()).filter(Boolean);
  const images   = normalizeImageUrlList(document.getElementById('pf-images').value);
  if (!name||!brand||!price||!cat) { toast('err','Validation error','Name, brand, category and price are required'); return; }
  const obj = { name, slug:name.toLowerCase().replace(/[^a-z0-9]+/g,'-'), category:cat, brand, price, original_price:orig, stock, badge, description:desc, variants, images, active:true };
  if (id) {
    const idx = products.findIndex(p => String(p.id) === String(id));
    if (idx > -1) { products[idx] = {...products[idx], ...obj}; }
    // Upsert to Supabase
    if (CFG.ENABLE_SUPABASE) {
      try { await sbAdmin.from('products').update(obj).eq('id', id); } catch(e) { console.warn('Supabase update failed'); }
    }
    toast('ok','Product Updated', name);
  } else {
    const newP = { ...obj, id:'l'+Date.now() };
    products.unshift(newP);
    // Insert to Supabase
    if (CFG.ENABLE_SUPABASE) {
      try { const {data} = await sbAdmin.from('products').insert([{...obj}]).select(); if(data?.[0]) newP.id = data[0].id; } catch(e) { console.warn('Supabase insert failed'); }
    }
    toast('ok','Product Added', name);
  }
  document.getElementById('prodFormWrap').style.display = 'none';
  renderAdminProducts();
  renderCategoryChips();
  if (!getAllowedFilterCategories().includes(currentCat)) currentCat = 'all';
  setCat(currentCat, { closeSidebar: false });
}

async function toggleActive(id) {
  const p = products.find(x => String(x.id) === String(id));
  if (!p) return;
  p.active = !p.active;
  if (CFG.ENABLE_SUPABASE) {
    try { await sbAdmin.from('products').update({active:p.active}).eq('id', id); } catch(e) {}
  }
  renderAdminProducts();
  renderCategoryChips();
  if (!getAllowedFilterCategories().includes(currentCat)) currentCat = 'all';
  setCat(currentCat, { closeSidebar: false });
  toast('inf', p.active ? 'Product Activated' : 'Product Hidden', p.name);
}

async function deleteProduct(id) {
  const p = products.find(x => String(x.id) === String(id));
  if (!p || !confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
  products = products.filter(x => String(x.id) !== String(id));
  if (CFG.ENABLE_SUPABASE) {
    try { await sbAdmin.from('products').delete().eq('id', id); } catch(e) {}
  }
  renderAdminProducts();
  renderCategoryChips();
  if (!getAllowedFilterCategories().includes(currentCat)) currentCat = 'all';
  setCat(currentCat, { closeSidebar: false });
  toast('err','Deleted', p.name);
}

// ============================================================
// NAVIGATION
// ============================================================
function navigate(page, cat) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-'+page).classList.add('active');
  const siteFooter = document.getElementById('siteFooter');
  document.body.classList.toggle('hide-site-footer', page !== 'explore');
  if (siteFooter) siteFooter.style.display = page === 'explore' ? '' : 'none';
  if (page === 'explore') {
    if (cat) setCat(cat);
    else renderProducts(filterProducts(currentCat));
  }
  document.querySelectorAll('.nav-item[data-pg]').forEach(n => n.classList.toggle('active', n.dataset.pg === page));
  window.scrollTo({top:0,behavior:'smooth'});
  closeMobileSidebar();
}

function topbarToggle(mode) {
  const tgElectronics = document.getElementById('tgElectronics');
  const tgJewerlys = document.getElementById('tgJewerlys');
  if (tgElectronics) tgElectronics.classList.toggle('active', mode === 'electronics');
  if (tgJewerlys) tgJewerlys.classList.toggle('active', mode === 'jewerlys');
  navigate('explore');
  if (mode === 'jewerlys') setCat('jewerlys', { closeSidebar: false });
  else setCat('all', { closeSidebar: false });
}

// ============================================================
// TOAST
// ============================================================
function toast(type, title, msg) {
  const icons = {
    ok:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    err:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    inf:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  };
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<div class="t-icon ${type}">${icons[type]||icons.inf}</div><div class="t-text"><strong>${title}</strong>${msg?`<p>${msg}</p>`:''}</div>`;
  document.getElementById('toastWrap').appendChild(el);
  setTimeout(() => { el.style.transition='all .3s'; el.style.opacity='0'; el.style.transform='translateY(10px)'; setTimeout(()=>el.remove(),300); }, 3200);
}

// ============================================================
// MOBILE SIDEBAR
// ============================================================
function toggleMobileSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('mobOverlay').classList.toggle('show');
}
function closeMobileSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('mobOverlay').classList.remove('show');
}
document.getElementById('mobOverlay').addEventListener('click', closeMobileSidebar);

function setSidebarState(collapsed) {
  if (window.innerWidth <= 900) return;
  document.body.classList.toggle('sidebar-collapsed', collapsed);
  const btn = document.getElementById('sidebarToggle');
  if (btn) btn.setAttribute('aria-pressed', collapsed ? 'true' : 'false');
}

function toggleSidebar() {
  const collapsed = !document.body.classList.contains('sidebar-collapsed');
  setSidebarState(collapsed);
  localStorage.setItem('ltSidebarCollapsed', collapsed ? '1' : '0');
}

function loadSidebarState() {
  setSidebarState(true);
  localStorage.setItem('ltSidebarCollapsed', '1');
}

window.addEventListener('resize', () => {
  if (window.innerWidth <= 900) {
    document.body.classList.remove('sidebar-collapsed');
  }
});

// ============================================================
// INIT
// ============================================================
(async function init() {
  const initialCategory = getCategoryFromUrl();
  if (initialCategory) currentCat = initialCategory;
  const initialQuery = getSearchQueryFromUrl();

  loadSidebarState();
  loadStoreSettings();
  loadBrandingSettings();
  updateCartUI();
  updateTopbarStats();
  await loadProducts();

  if (initialQuery) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = initialQuery;
    doSearch(initialQuery);
  }
})();

// ===== THEME SWITCHER =====
function toggleTheme() {
  const root = document.getElementById('appRoot');
  const isDark = root.getAttribute('data-theme') === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  root.setAttribute('data-theme', newTheme);
  localStorage.setItem('ltTheme', newTheme);
  const track = document.getElementById('tsTrack');
  const icon = document.getElementById('themeIcon');
  const label = document.getElementById('themeLabel');
  if (newTheme === 'dark') {
    track.classList.add('on');
    icon.textContent = 'â˜€ï¸';
    label.textContent = 'Light Mode';
  } else {
    track.classList.remove('on');
    icon.textContent = 'ðŸŒ™';
    label.textContent = 'Dark Mode';
  }
}
// Load saved theme on startup
(function() {
  const saved = localStorage.getItem('ltTheme') || 'light';
  if (saved === 'dark') {
    document.getElementById('appRoot').setAttribute('data-theme', 'dark');
    setTimeout(() => {
      const track = document.getElementById('tsTrack');
      if (track) { track.classList.add('on'); }
      const icon = document.getElementById('themeIcon');
      if (icon) { icon.textContent = 'â˜€ï¸'; }
      const label = document.getElementById('themeLabel');
      if (label) { label.textContent = 'Light Mode'; }
    }, 50);
  }
})();

function getBrandingAdditionsFromControls() {
  return {
    delivery: !!document.getElementById('brandAddDelivery')?.checked,
    warranty: !!document.getElementById('brandAddWarranty')?.checked,
    payments: !!document.getElementById('brandAddPayments')?.checked,
    support: !!document.getElementById('brandAddSupport')?.checked,
  };
}

function normalizeBrandingState(raw) {
  const normalized = {
    preset: DEFAULT_BRANDING_STATE.preset,
    additions: { ...DEFAULT_BRANDING_STATE.additions },
  };
  if (raw && typeof raw === 'object') {
    if (raw.preset && BRANDING_PRESETS[raw.preset]) normalized.preset = raw.preset;
    if (raw.additions && typeof raw.additions === 'object') {
      Object.keys(normalized.additions).forEach((k) => {
        if (typeof raw.additions[k] === 'boolean') normalized.additions[k] = raw.additions[k];
      });
    }
  }
  return normalized;
}

function applyBrandPreset(presetId) {
  const palette = BRANDING_PRESETS[presetId] || BRANDING_PRESETS[DEFAULT_BRANDING_STATE.preset];
  const root = document.getElementById('appRoot') || document.documentElement;
  root.style.setProperty('--primary', palette.primary);
  root.style.setProperty('--primary-lt', palette.light);
  root.style.setProperty('--primary-md', palette.mid);
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.setAttribute('content', palette.primary);
}

function renderBrandSignals(additions) {
  const wrap = document.getElementById('brandSignals');
  if (!wrap) return;
  const labels = [];
  if (additions.delivery) labels.push('Fast Delivery');
  if (additions.warranty) labels.push('Warranty Included');
  if (additions.payments) labels.push('Secure Payments');
  if (additions.support) labels.push('Priority Support');
  wrap.innerHTML = labels.map((label) => `<span class="sf-signal">${label}</span>`).join('');
}

function syncBrandingControls(state) {
  document.querySelectorAll('.brand-preset-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.preset === state.preset);
  });
  const d = state.additions;
  const m = {
    brandAddDelivery: d.delivery,
    brandAddWarranty: d.warranty,
    brandAddPayments: d.payments,
    brandAddSupport: d.support,
  };
  Object.entries(m).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el) el.checked = value;
  });
}

function applyBrandingState(nextState, persist = false, syncControls = true) {
  brandingState = normalizeBrandingState(nextState);
  applyBrandPreset(brandingState.preset);
  renderBrandSignals(brandingState.additions);
  if (syncControls) syncBrandingControls(brandingState);
  if (persist) localStorage.setItem('ltl2_branding', JSON.stringify(brandingState));
}

function previewBrandingFromControls() {
  const activePreset = document.querySelector('.brand-preset-btn.active')?.dataset.preset || brandingState.preset;
  applyBrandingState({ preset: activePreset, additions: getBrandingAdditionsFromControls() }, false, false);
}

function selectBrandPreset(presetId) {
  if (!BRANDING_PRESETS[presetId]) return;
  document.querySelectorAll('.brand-preset-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.preset === presetId);
  });
  previewBrandingFromControls();
}

function loadBrandingSettings() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem('ltl2_branding') || 'null'); } catch (_) {}
  applyBrandingState(saved || DEFAULT_BRANDING_STATE, false, true);
  ['brandAddDelivery', 'brandAddWarranty', 'brandAddPayments', 'brandAddSupport'].forEach((id) => {
    const el = document.getElementById(id);
    if (el && !el.dataset.bound) {
      el.addEventListener('change', previewBrandingFromControls);
      el.dataset.bound = '1';
    }
  });
}

function applyStoreName(name) {
  const clean = String(name || '').trim() || 'Life Time Limited';
  const footerName = document.querySelector('.sf-bottom-left strong');
  if (footerName) footerName.textContent = clean;
  const adminName = document.querySelector('.admin-footer-left strong');
  if (adminName) adminName.textContent = `${clean} Admin`;
}

function loadStoreSettings() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem('ltl2_store_settings') || 'null'); } catch (_) {}
  if (!saved || typeof saved !== 'object') return;
  const wa = document.getElementById('settingsWA');
  const sn = document.getElementById('settingsStoreName');
  const se = document.getElementById('settingsSupportEmail');
  if (wa && saved.whatsapp) wa.value = saved.whatsapp;
  if (sn && saved.storeName) sn.value = saved.storeName;
  if (se && saved.supportEmail) se.value = saved.supportEmail;
  if (saved.whatsapp) CFG.WHATSAPP = String(saved.whatsapp).trim();
  applyStoreName(saved.storeName || 'Life Time Limited');
}

function applyBrandingSettings(showToast = true) {
  const activePreset = document.querySelector('.brand-preset-btn.active')?.dataset.preset || DEFAULT_BRANDING_STATE.preset;
  applyBrandingState({ preset: activePreset, additions: getBrandingAdditionsFromControls() }, true, false);
  if (showToast) toast('ok', 'Branding Applied', 'Preset and additions updated');
}

function saveStoreSettings() {
  const wa = document.getElementById('settingsWA')?.value?.trim() || CFG.WHATSAPP;
  const storeName = document.getElementById('settingsStoreName')?.value?.trim() || 'Life Time Limited';
  const supportEmail = document.getElementById('settingsSupportEmail')?.value?.trim() || 'support@lifetimeltd.co.ke';
  CFG.WHATSAPP = wa;
  applyStoreName(storeName);
  applyBrandingSettings(false);
  localStorage.setItem('ltl2_store_settings', JSON.stringify({
    whatsapp: wa,
    storeName,
    supportEmail,
  }));
  toast('ok', 'Settings Saved', 'Branding presets and additions updated');
}

// ===== BANNER IMAGE MANAGER =====
function applyBannerImg(slot) {
  if (slot === 1) {
    const urlInput = document.getElementById('bs1Url');
    const rawUrl = urlInput?.value || '';
    const url = normalizeImageUrl(rawUrl);
    const title = document.getElementById('bs1Title').value.trim();
    const sub = document.getElementById('bs1Sub').value.trim();
    const heroImg = document.getElementById('heroBanner1Img');
    const overlay = document.getElementById('heroBanner1Overlay');
    const titleEl = document.getElementById('heroBanner1Title');
    const subEl = document.getElementById('heroBanner1Sub');
    if (rawUrl.trim() && !url) { toast('err', 'Invalid Image URL', 'Use a direct image URL or a supported redirect link'); return; }
    if (urlInput && url) urlInput.value = url;
    if (url && heroImg) {
      heroImg.src = url;
      heroImg.style.display = 'block';
      if (overlay) overlay.style.background = 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, transparent 60%)';
    }
    if (titleEl && title) titleEl.innerHTML = title;
    if (subEl && sub) subEl.textContent = sub;
    // Update preview
    updateBannerPreview(1, url);
    toast('ok', 'Banner Updated', 'Hero banner image applied to storefront');
  } else if (slot === 2) {
    const urlInput = document.getElementById('bs2Url');
    const rawUrl = urlInput?.value || '';
    const url = normalizeImageUrl(rawUrl);
    const title = document.getElementById('bs2Title').value.trim();
    const sub = document.getElementById('bs2Sub').value.trim();
    if (rawUrl.trim() && !url) { toast('err', 'Invalid Image URL', 'Use a direct image URL or a supported redirect link'); return; }
    if (urlInput && url) urlInput.value = url;
    if (url) {
      const img = document.getElementById('promoCard1Img');
      if (img) { img.src = url; img.style.display = 'block'; }
      const overlay = document.getElementById('promoCard1Overlay');
      if (overlay) overlay.style.background = 'linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 50%)';
    }
    const t = document.getElementById('promoCard1Title');
    const s = document.getElementById('promoCard1Sub');
    if (t && title) t.innerHTML = title;
    if (s && sub) s.textContent = sub;
    updateBannerPreview(2, url);
    toast('ok', 'Banner Updated', 'Promo card 1 applied');
  } else if (slot === 3) {
    const urlInput = document.getElementById('bs3Url');
    const rawUrl = urlInput?.value || '';
    const url = normalizeImageUrl(rawUrl);
    const title = document.getElementById('bs3Title').value.trim();
    const sub = document.getElementById('bs3Sub').value.trim();
    if (rawUrl.trim() && !url) { toast('err', 'Invalid Image URL', 'Use a direct image URL or a supported redirect link'); return; }
    if (urlInput && url) urlInput.value = url;
    if (url) {
      const img = document.getElementById('promoCard2Img');
      if (img) { img.src = url; img.style.display = 'block'; }
      const overlay = document.getElementById('promoCard2Overlay');
      if (overlay) overlay.style.background = 'linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 50%)';
    }
    const t = document.getElementById('promoCard2Title');
    const s = document.getElementById('promoCard2Sub');
    if (t && title) t.innerHTML = title;
    if (s && sub) s.textContent = sub;
    updateBannerPreview(3, url);
    toast('ok', 'Banner Updated', 'Promo card 2 applied');
  }
}

function updateBannerPreview(slot, url) {
  const prev = document.getElementById('bs' + slot + 'Preview');
  if (!prev || !String(url || '').trim()) return;
  const normalized = normalizeImageUrl(url);
  if (!normalized) {
    prev.innerHTML = `<div class="bsp-placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:24px;height:24px"><rect x="3" y="3" width="18" height="18" rx="2"/></svg><span>Invalid URL</span></div>`;
    return;
  }
  prev.innerHTML = `<img src="${normalized}" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.parentElement.innerHTML='<div class=bsp-placeholder><svg viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'1.5\\' style=\\'width:24px;height:24px\\'><rect x=\\'3\\' y=\\'3\\' width=\\'18\\' height=\\'18\\' rx=\\'2\\'/></svg><span>Invalid URL</span></div>'"/>`;
}

// ===== CATEGORY IMAGE MANAGER =====
function applyCatImg(cat) {
  const input = document.getElementById('catImg-' + cat);
  const rawUrl = input?.value || '';
  const url = normalizeImageUrl(rawUrl);
  if (!rawUrl.trim()) { toast('inf', 'No URL', 'Please paste an image URL first'); return; }
  if (!url) { toast('err', 'Invalid Image URL', 'Could not resolve an image from that link'); return; }
  if (input) input.value = url;
  // Store it
  const card = document.querySelector('[data-cat="' + cat + '"] .cmc-img');
  if (card) {
    card.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;" onerror="this.outerHTML='<div class=cmc-placeholder><svg viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'1.5\' style=\'width:28px;height:28px\'><rect x=\'3\' y=\'3\' width=\'18\' height=\'18\' rx=\'2\'/></svg></div>'"/>`;
  }
  toast('ok', 'Category Image Set', cat + ' banner image updated');
}

// ===== PRODUCT FORM IMAGE PREVIEWS =====
function updateImgPreviews() {
  const input = document.getElementById('pf-images');
  if (!input) return;
  const urls = normalizeImageUrlList(input.value);
  for (let i = 0; i < 4; i++) {
    const slot = document.getElementById('pfSlot' + i);
    if (!slot) continue;
    const url = urls[i];
    if (url) {
      slot.classList.add('has-img');
      slot.querySelector('img') && slot.removeChild(slot.querySelector('img'));
      const img = document.createElement('img');
      img.src = url;
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;position:absolute;inset:0;';
      img.onerror = () => { slot.classList.remove('has-img'); };
      slot.insertBefore(img, slot.firstChild);
    } else {
      slot.classList.remove('has-img');
      const img = slot.querySelector('img');
      if (img) slot.removeChild(img);
    }
  }
}
function focusImgInput() {
  const el = document.getElementById('pf-images');
  if (el) el.focus();
}
