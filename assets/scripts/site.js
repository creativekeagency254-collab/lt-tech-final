// ============================================================
// CONFIG — All keys for testing environment
// ============================================================
const savedBootSettings = (() => {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    return JSON.parse(window.localStorage.getItem('ltl2_store_settings') || 'null');
  } catch (_) {
    return null;
  }
})();
const savedBootSupabase = (savedBootSettings && typeof savedBootSettings.supabase === 'object')
  ? savedBootSettings.supabase
  : {};
const savedBootPaystack = (savedBootSettings && typeof savedBootSettings.paystack === 'object')
  ? savedBootSettings.paystack
  : {};
const runtimeBootConfig = (typeof window !== 'undefined' && window.__LIFETIME_CONFIG && typeof window.__LIFETIME_CONFIG === 'object')
  ? window.__LIFETIME_CONFIG
  : {};

const CFG = {
  ENABLE_SUPABASE:  true,
  SUPABASE_URL:     String(runtimeBootConfig.supabaseUrl || savedBootSupabase.url || 'https://fbulitfyarmnyegxduqy.supabase.co').trim(),
  SUPABASE_PUBLISHABLE: String(
    runtimeBootConfig.supabasePublishable
      || savedBootSupabase.publishable
      || savedBootSupabase.key
      || 'sb_publishable_h5pygvIpbj6JaQwCiAnMSw_0MXm8Z7Q'
  ).trim(),
  SUPABASE_ANON:    String(runtimeBootConfig.supabaseAnon || savedBootSupabase.anon || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZidWxpdGZ5YXJtbnllZ3hkdXF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMjE5MDAsImV4cCI6MjA4Nzc5NzkwMH0.K5UwbTYttPQeK4DTx1AO_CzPWg6IuOx4_zTbQcYEWts').trim(),
  PAYSTACK_PK:      String(
    runtimeBootConfig.paystackPublicKey
      || runtimeBootConfig.paystackKey
      || savedBootPaystack.publicKey
      || savedBootSettings?.paystackPublicKey
      || 'pk_test_69283fe06fedab5b485efdae233a92be25d77c6b'
  ).trim(),
  WHATSAPP:         '0705925800',
  ADMIN_EMAIL_HASH: String(
    runtimeBootConfig.adminEmailHash
      || savedBootSettings?.admin?.emailHash
      || '7932b2e116b076a54f452848eaabd5857f61bd957fe8a218faf216f24c9885bb'
  ).trim().toLowerCase(),
  ADMIN_PASS_HASH:  String(
    runtimeBootConfig.adminPassHash
      || savedBootSettings?.admin?.passHash
      || '3000469c6ac090455517d86664eb13cb638069d961445e522a3fbec30f07f066'
  ).trim().toLowerCase(),
};
const SUPABASE_PROJECT_REF = 'fbulitfyarmnyegxduqy';
const SUPABASE_SQL_EDITOR_URL = `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/sql/new`;
const PAYSTACK_INLINE_SOURCES = [
  'https://js.paystack.co/v2/inline.js',
  'https://js.paystack.co/v1/inline.js',
];
const CHECKOUT_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const SENSITIVE_QUERY_PATTERNS = [
  /\b(?:sb_secret_|service[_-]?role)\b/i,
  /\b(?:sk_(?:test|live)_[A-Za-z0-9]+)\b/i,
  /\b(?:pk_(?:test|live)_[A-Za-z0-9]+)\b/i,
  /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/,
  /\b(?:password|passcode|token|secret|api[_-]?key)\b/i,
];

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

function hasValidPaystackKey() {
  return /^pk_(test|live)_/i.test(String(CFG.PAYSTACK_PK || '').trim());
}

function isPaystackPublicKey(value) {
  return /^pk_(test|live)_[A-Za-z0-9]+$/i.test(String(value || '').trim());
}

function hasPaystackV2() {
  return typeof window.Paystack === 'function';
}

function hasPaystackV1() {
  return !!(window.PaystackPop && typeof window.PaystackPop.setup === 'function');
}

function hasPaystackInline() {
  return hasPaystackV2() || hasPaystackV1();
}

function loadScriptOnce(src, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const escapedSrc = String(src || '').replace(/"/g, '\\"');
    const existing = document.querySelector(`script[src="${escapedSrc}"]`);
    if (existing) {
      if (hasPaystackInline()) {
        resolve(true);
        return;
      }
      existing.addEventListener('load', () => resolve(true), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
      window.setTimeout(() => {
        if (hasPaystackInline()) resolve(true);
        else reject(new Error(`Timed out loading ${src}`));
      }, timeoutMs);
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
    window.setTimeout(() => {
      if (hasPaystackInline()) resolve(true);
      else reject(new Error(`Timed out loading ${src}`));
    }, timeoutMs);
  });
}

let paystackLoadPromise = null;
function ensurePaystackLoaded() {
  if (hasPaystackInline()) return Promise.resolve(true);
  if (paystackLoadPromise) return paystackLoadPromise;

  paystackLoadPromise = (async () => {
    let lastError = null;
    for (const src of PAYSTACK_INLINE_SOURCES) {
      try {
        await loadScriptOnce(src, 5500);
        if (hasPaystackInline()) return true;
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error('Paystack script unavailable');
  })().catch((error) => {
    paystackLoadPromise = null;
    throw error;
  });

  return paystackLoadPromise;
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

function specsToMultilineText(specs) {
  if (!specs || typeof specs !== 'object') return '';
  return Object.entries(specs)
    .filter(([k, v]) => String(k || '').trim() && String(v || '').trim())
    .map(([k, v]) => `${String(k).trim()}: ${String(v).trim()}`)
    .join('\n');
}

function parseSpecsText(rawValue) {
  const specs = {};
  String(rawValue || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const parts = line.split(':');
      if (parts.length < 2) return;
      const key = parts.shift().trim();
      const value = parts.join(':').trim();
      if (key && value) specs[key] = value;
    });
  return specs;
}

function splitListValues(rawValue) {
  return String(rawValue || '')
    .split(/[\n,]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function parsePossibleJson(rawValue) {
  const text = String(rawValue || '').trim();
  if (!text) return null;
  if (!((text.startsWith('[') && text.endsWith(']')) || (text.startsWith('{') && text.endsWith('}')))) return null;
  try {
    return JSON.parse(text);
  } catch (_) {
    return null;
  }
}

function normalizeHexColor(rawValue) {
  const value = String(rawValue || '').trim();
  if (!value) return '';
  const hex = value.startsWith('#') ? value : `#${value}`;
  if (/^#([0-9a-fA-F]{3})$/.test(hex)) {
    const short = hex.slice(1).toLowerCase();
    return `#${short[0]}${short[0]}${short[1]}${short[1]}${short[2]}${short[2]}`;
  }
  if (/^#([0-9a-fA-F]{6})$/.test(hex)) return hex.toLowerCase();
  return '';
}

function parseVariantToken(rawToken) {
  const token = String(rawToken || '').trim();
  if (!token) return null;
  let label = token;
  let color = '';

  if (token.includes('|')) {
    const [namePart, colorPart] = token.split('|');
    label = String(namePart || '').trim();
    color = normalizeHexColor(colorPart);
  } else {
    const match = token.match(/^(.*?)(?:\s*[-(]\s*(#[0-9a-fA-F]{3,6})\s*\)?)$/);
    if (match) {
      label = String(match[1] || '').trim();
      color = normalizeHexColor(match[2]);
    }
  }

  if (!label) return null;
  return { label, color };
}

function normalizeVariantEntries(rawVariants) {
  let source = [];
  if (Array.isArray(rawVariants)) {
    source = rawVariants;
  } else if (rawVariants && typeof rawVariants === 'object') {
    source = [rawVariants];
  } else {
    const parsed = parsePossibleJson(rawVariants);
    if (Array.isArray(parsed)) source = parsed;
    else if (parsed && typeof parsed === 'object') source = [parsed];
    else source = splitListValues(rawVariants);
  }
  const normalized = [];
  const seen = new Set();
  source.forEach((item) => {
    let parsed = null;
    if (item && typeof item === 'object') {
      const rawLabel = item.label || item.name || item.value || item.variant || '';
      const rawColor = item.color || item.hex || item.colour || '';
      parsed = parseVariantToken(`${rawLabel}${rawColor ? `|${rawColor}` : ''}`);
    } else {
      parsed = parseVariantToken(item);
    }
    if (!parsed) return;
    const key = parsed.label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    normalized.push(parsed);
  });
  return normalized;
}

function getVariantLabel(variant) {
  if (variant && typeof variant === 'object') return String(variant.label || variant.name || '').trim();
  return String(variant || '').trim();
}

function getVariantColor(variant) {
  if (!variant || typeof variant !== 'object') return '';
  return normalizeHexColor(variant.color || variant.hex || '');
}

function variantEntriesFromProduct(product) {
  return normalizeVariantEntries(product?.variants || []);
}

function variantsToEditorText(rawVariants) {
  return normalizeVariantEntries(rawVariants)
    .map((entry) => (entry.color ? `${entry.label} | ${entry.color}` : entry.label))
    .join('\n');
}

function escapeJsSingleQuote(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeBadgeClass(rawValue) {
  const value = String(rawValue || '').toLowerCase();
  if (value === 'new' || value === 'hot' || value === 'sale') return value;
  return '';
}

// ============================================================
// SUPABASE CLIENT
// ============================================================
function decodeJwtPayloadSegment(token) {
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(String(token || ''))) return null;
  try {
    const payload = String(token).split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch (_) {
    return null;
  }
}

function isSupabaseServiceRoleKey(rawKey) {
  const key = String(rawKey || '').trim();
  if (!key) return false;
  if (/^sb_secret_/i.test(key)) return true;
  if (/service_role/i.test(key)) return true;
  const payload = decodeJwtPayloadSegment(key);
  return String(payload?.role || '').toLowerCase() === 'service_role';
}

function isLikelySupabaseClientKey(rawKey) {
  const key = String(rawKey || '').trim();
  if (!key) return false;
  return /^sb_publishable_/i.test(key) || /^eyJ[A-Za-z0-9_-]*\./.test(key);
}

function resolveSupabaseClientKey() {
  const candidates = [CFG.SUPABASE_PUBLISHABLE, CFG.SUPABASE_ANON];
  for (const candidate of candidates) {
    const key = String(candidate || '').trim();
    if (!key) continue;
    if (isSupabaseServiceRoleKey(key)) continue;
    if (isLikelySupabaseClientKey(key)) return key;
  }
  return '';
}

const createClient = (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function')
  ? window.supabase.createClient
  : null;
const sbUrl = String(CFG.SUPABASE_URL || '').trim();
const sbKey = resolveSupabaseClientKey();
const sb = (CFG.ENABLE_SUPABASE && createClient && sbUrl && sbKey)
  ? createClient(sbUrl, sbKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
  : null;
const sbConfigIssue = (() => {
  if (!CFG.ENABLE_SUPABASE) return '';
  if (!createClient) return 'Supabase SDK could not load from CDN.';
  if (!sbUrl) return 'Supabase URL is missing.';
  if (!sbKey) return 'Supabase key missing or invalid. Use publishable/anon key only.';
  return '';
})();
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
  {id:'f9',name:'Philips Essential Airfryer 6.2L',slug:'philips-airfryer-6l',category:'kitchen-accessories',brand:'Philips',price:32999,original_price:36999,stock:11,description:'Rapid Air technology for crispy cooking with less oil. Family-size basket.',specs:{Capacity:'6.2L',Power:'1700W',Programs:'12 presets',Warranty:'1 year'},variants:['Black'],badge:'Hot',active:true,images:[]},
  {id:'f10',name:'PlayStation 5 Slim Bundle',slug:'ps5-slim-bundle',category:'gaming',brand:'Sony',price:87999,original_price:94999,stock:6,description:'Next-gen console performance with ultra-fast SSD and 4K gaming.',specs:{Storage:'1TB SSD',Video:'4K 120Hz',Controller:'DualSense',Edition:'Disc'},variants:['Standard Bundle'],badge:'Sale',active:true,images:[]},
  {id:'f11',name:'Google Nest Hub 2nd Gen',slug:'nest-hub-2nd-gen',category:'smart-home',brand:'Google',price:18999,original_price:null,stock:14,description:'Smart home display for voice control, routines and media in every room.',specs:{Display:'7-inch touch',Assistant:'Google Assistant',Audio:'Full-range speaker',Connectivity:'Wi-Fi, Bluetooth'},variants:['Chalk','Charcoal'],badge:'New',active:true,images:[]},
  {id:'f12',name:'Gold Layered Necklace Set',slug:'gold-layered-necklace-set',category:'jewelry-necklaces',brand:'LTL Jewelry',price:4999,original_price:6500,stock:24,description:'Elegant layered necklace set for daily wear and occasion styling.',specs:{Material:'Gold-plated alloy',Pieces:'3',Finish:'Polished',Closure:'Lobster clasp'},variants:['Classic Gold'],badge:'Hot',active:true,images:[]},
  {id:'f13',name:'Sterling Silver Ring',slug:'sterling-silver-ring',category:'jewelry-rings',brand:'LTL Jewelry',price:3999,original_price:null,stock:18,description:'Minimal sterling silver ring with comfortable fit and timeless look.',specs:{Material:'925 Sterling Silver',Size:'Adjustable',Weight:'Lightweight',Finish:'Matte'},variants:['Silver'],badge:'New',active:true,images:[]},
  {id:'f14',name:'Crystal Charm Bracelet',slug:'crystal-charm-bracelet',category:'jewelry-bracelets',brand:'LTL Jewelry',price:4599,original_price:5200,stock:21,description:'Adjustable crystal charm bracelet designed for gift-ready elegance.',specs:{Material:'Alloy + crystals',Length:'Adjustable',Closure:'Slide lock',Style:'Charm'},variants:['Rose Gold','Silver'],badge:null,active:true,images:[]},
  {id:'f15',name:'Classic Jewelry Watch',slug:'classic-jewelry-watch',category:'jewelry-watches',brand:'LTL Jewelry',price:8999,original_price:10500,stock:13,description:'Fashion jewelry watch with slim dial and premium strap finish.',specs:{Dial:'34mm',Strap:'Stainless steel',Water:'3ATM',Battery:'Quartz'},variants:['Gold','Silver'],badge:'Sale',active:true,images:[]},
  {id:'f16',name:'Pearl Drop Earrings',slug:'pearl-drop-earrings',category:'jewelry-earrings',brand:'LTL Jewelry',price:3799,original_price:4500,stock:26,description:'Elegant pearl drop earrings with lightweight comfort and classic style.',specs:{Material:'Alloy + faux pearl',Length:'3.2cm',Closure:'Push back',Finish:'Gloss'},variants:['Ivory Pearl','Rose Pearl'],badge:'Hot',active:true,images:[]},
  {id:'f17',name:'Minimalist Hoop Earrings',slug:'minimalist-hoop-earrings',category:'jewelry-earrings',brand:'LTL Jewelry',price:3299,original_price:null,stock:31,description:'Everyday hoop earrings with polished finish for modern casual looks.',specs:{Material:'Gold-plated steel',Diameter:'24mm',Weight:'Lightweight',Closure:'Latch back'},variants:['Gold','Silver'],badge:'New',active:true,images:[]},
  {id:'f18',name:'Infinity Pendant Necklace',slug:'infinity-pendant-necklace',category:'jewelry-necklaces',brand:'LTL Jewelry',price:5499,original_price:6200,stock:17,description:'Infinity pendant necklace crafted for gifting and premium daily styling.',specs:{Material:'Stainless steel',Chain:'Adjustable 40-45cm',Plating:'18K gold',Closure:'Lobster clasp'},variants:['Gold','Silver'],badge:'Sale',active:true,images:[]},
  {id:'f19',name:'Cubic Zirconia Ring Set',slug:'cz-ring-set',category:'jewelry-rings',brand:'LTL Jewelry',price:4699,original_price:5300,stock:22,description:'Sparkling cubic zirconia ring set with stackable slim-band design.',specs:{Material:'Sterling silver',Stone:'Cubic zirconia',Sizes:'6-9',Finish:'High polish'},variants:['Silver','Rose Gold'],badge:'Hot',active:true,images:[]},
];

const DELIVERY_ZONES = [
  {region:'Nairobi',area:'Nairobi CBD',fee:150,days:'Same day – 24hrs'},
  {region:'Nairobi',area:'Westlands',fee:150,days:'Same day – 24hrs'},
  {region:'Nairobi',area:'Kilimani',fee:150,days:'Same day – 24hrs'},
  {region:'Nairobi',area:'Karen',fee:200,days:'1–2 days'},
  {region:'Nairobi',area:'Eastleigh',fee:150,days:'Same day – 24hrs'},
  {region:'Nairobi',area:'South B / South C',fee:200,days:'1–2 days'},
  {region:'Nairobi',area:'Langata',fee:200,days:'1–2 days'},
  {region:'Nairobi',area:'Kasarani',fee:200,days:'1–2 days'},
  {region:'Nairobi',area:'Ruaka / Ruiru',fee:280,days:'1–2 days'},
  {region:'Central',area:'Thika',fee:320,days:'1–2 days'},
  {region:'Central',area:'Kiambu',fee:320,days:'1–2 days'},
  {region:'Central',area:'Nyeri',fee:420,days:'2–3 days'},
  {region:'Rift Valley',area:'Nakuru',fee:520,days:'2–3 days'},
  {region:'Rift Valley',area:'Eldoret',fee:620,days:'2–4 days'},
  {region:'Rift Valley',area:'Kisumu',fee:620,days:'2–4 days'},
  {region:'Coast',area:'Mombasa CBD',fee:520,days:'2–3 days'},
  {region:'Coast',area:'Mombasa – Nyali/North Coast',fee:620,days:'2–4 days'},
  {region:'Eastern',area:'Machakos',fee:420,days:'2–3 days'},
  {region:'Eastern',area:'Kitui',fee:520,days:'2–4 days'},
  {region:'Western',area:'Kakamega',fee:620,days:'2–4 days'},
  {region:'Nyanza',area:'Kisii',fee:620,days:'2–4 days'},
  {region:'North Eastern',area:'Garissa',fee:750,days:'3–5 days'},
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
const DEFAULT_MARQUEE_IMAGES = {
  electronics: [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1400&q=90',
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1400&q=90',
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=1400&q=90',
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=1400&q=90',
    'https://images.unsplash.com/photo-1585060544812-6b45742d762f?auto=format&fit=crop&w=1400&q=90',
    'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?auto=format&fit=crop&w=1400&q=90',
  ],
  jewerlys: [
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1400&q=90',
    'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?auto=format&fit=crop&w=1400&q=90',
    'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=1400&q=90',
    'https://images.unsplash.com/photo-1602752275500-3f7f295b1cf7?auto=format&fit=crop&w=1400&q=90',
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1400&q=90',
    'https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=1400&q=90',
  ],
};
const MARQUEE_ICON_CATEGORIES = {
  electronics: ['smartphones', 'laptops', 'watches', 'audio', 'tablets', 'smart-home', 'gaming', 'kitchen-accessories'],
  jewerlys: ['jewerlys', 'jewelry-necklaces', 'jewelry-rings', 'jewelry-bracelets', 'jewelry-earrings', 'jewelry-watches'],
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
let adminLoginFailures = 0;
let adminLockedUntilTs = 0;
let ckStep = 1;
let ckData = {};
let deliveryFee = 0;
let deliveryDays = '';
let payMethod = 'paystack';
let dbOnline = false;
let storefrontMode = 'electronics';
let adminCatalogMode = 'electronics';
let currentPage = 'explore';
let activeSearchQuery = '';
let displayedProducts = [];
let likedViewActive = false;
let supabaseHealth = {
  productsTable: false,
  ordersTable: false,
  schemaMissing: false,
  schemaOutdated: false,
};
let brandingState = {
  preset: DEFAULT_BRANDING_STATE.preset,
  additions: { ...DEFAULT_BRANDING_STATE.additions },
};
let marqueeImageState = {
  electronics: [...DEFAULT_MARQUEE_IMAGES.electronics],
  jewerlys: [...DEFAULT_MARQUEE_IMAGES.jewerlys],
};
let customCategoryState = {
  electronics: [],
  jewerlys: [],
};
let customBrandState = {
  electronics: [],
  jewerlys: [],
};

function setDbStatus(label, color) {
  const el = document.getElementById('aStatDb');
  if (!el) return;
  el.textContent = label;
  if (color) el.style.color = color;
}

function updateSupabaseSetupUi(message = '') {
  const msg = document.getElementById('supabaseSetupMsg');
  const seedBtn = document.getElementById('btnSeedSupabaseProducts');
  const syncBtn = document.getElementById('btnSyncSupabaseProducts');
  const applyBtn = document.getElementById('btnOpenSupabaseEditor');
  const copyBtn = document.getElementById('btnCopySupabaseSchema');
  const checkBtn = document.getElementById('btnCheckSupabaseSchema');
  if (!msg) return;

  if (!canUseSupabase()) {
    msg.textContent = sbConfigIssue || 'Supabase client unavailable. Check URL/key configuration first.';
    if (seedBtn) seedBtn.disabled = true;
    if (syncBtn) syncBtn.disabled = true;
    if (applyBtn) applyBtn.disabled = false;
    if (copyBtn) copyBtn.disabled = false;
    if (checkBtn) checkBtn.disabled = true;
    return;
  }

  const hasSchemaProblem = !!(supabaseHealth.schemaMissing || supabaseHealth.schemaOutdated);
  if (message) {
    msg.textContent = message;
  } else if (hasSchemaProblem) {
    msg.textContent = supabaseHealth.schemaOutdated
      ? 'Schema is outdated. Run the latest supabase-schema.sql in SQL Editor, then recheck.'
      : 'Schema missing in Supabase. Open SQL Editor, run supabase-schema.sql, then recheck.';
  } else if (supabaseHealth.productsTable && supabaseHealth.ordersTable) {
    msg.textContent = 'Schema looks ready. You can seed products if your catalog is still empty.';
  } else {
    msg.textContent = 'Checking schema health...';
  }

  if (seedBtn) seedBtn.disabled = hasSchemaProblem;
  if (syncBtn) syncBtn.disabled = hasSchemaProblem;
  if (applyBtn) applyBtn.disabled = false;
  if (copyBtn) copyBtn.disabled = false;
  if (checkBtn) checkBtn.disabled = false;
}

function canUseSupabase() {
  return !!(CFG.ENABLE_SUPABASE && sb);
}

function isTransientDbError(error) {
  const status = Number(error?.status || error?.code || 0);
  if (status === 408 || status === 425 || status === 429) return true;
  if (status >= 500 && status <= 599) return true;
  const msg = String(error?.message || error || '').toLowerCase();
  return (
    msg.includes('network') ||
    msg.includes('fetch') ||
    msg.includes('timeout') ||
    msg.includes('failed to fetch') ||
    msg.includes('temporar')
  );
}

function isSchemaMissingError(error) {
  const code = String(error?.code || '').toUpperCase();
  const msg = String(error?.message || '').toLowerCase();
  return (
    code === 'PGRST205' ||
    code === '42P01' ||
    msg.includes('could not find the table') ||
    (msg.includes('relation') && msg.includes('does not exist'))
  );
}

function isSchemaOutdatedError(error) {
  const code = String(error?.code || '').toUpperCase();
  const msg = String(error?.message || '').toLowerCase();
  return (
    code === 'PGRST204' ||
    code === '42703' ||
    (msg.includes('column') && msg.includes('does not exist'))
  );
}

function isSchemaProblemError(error) {
  return isSchemaMissingError(error) || isSchemaOutdatedError(error);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runDbWithRetry(factoryFn, options = {}) {
  const retries = Number.isInteger(options.retries) ? options.retries : 2;
  const baseDelayMs = options.baseDelayMs || 300;
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const result = await factoryFn();
      if (result?.error) throw result.error;
      return result;
    } catch (error) {
      lastError = error;
      const retryable = isTransientDbError(error);
      if (!retryable || attempt === retries) break;
      await wait(baseDelayMs * (attempt + 1));
    }
  }
  throw lastError || new Error('Unknown database error');
}

async function fetchProductsFromSupabase() {
  const tries = [
    () => sb.from('products').select('*').eq('active', true).order('created_at', { ascending: false }),
    () => sb.from('products').select('*').eq('active', true).order('id', { ascending: false }),
    () => sb.from('products').select('*').eq('active', true),
  ];
  let lastError = null;
  for (const query of tries) {
    try {
      const { data } = await runDbWithRetry(query, { retries: 1 });
      return Array.isArray(data) ? data : [];
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('Could not load products from Supabase');
}

async function fetchOrdersFromSupabase() {
  const tries = [
    () => sbAdmin.from('orders').select('*').order('created_at', { ascending: false }).limit(50),
    () => sbAdmin.from('orders').select('*').limit(50),
  ];
  let lastError = null;
  for (const query of tries) {
    try {
      const { data } = await runDbWithRetry(query, { retries: 1 });
      return Array.isArray(data) ? data : [];
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('Could not load orders from Supabase');
}

async function runSupabaseWrite(factoryFn, options = {}) {
  const { silent = false, fallbackNotice = 'Saved locally only. Supabase sync failed.' } = options;
  if (!canUseSupabase()) return false;
  try {
    await runDbWithRetry(factoryFn, { retries: 1, baseDelayMs: 250 });
    setDbStatus('Connected', 'var(--green)');
    dbOnline = true;
    if (supabaseHealth.schemaMissing || supabaseHealth.schemaOutdated) {
      supabaseHealth = { productsTable: true, ordersTable: true, schemaMissing: false, schemaOutdated: false };
      updateSupabaseSetupUi('Schema appears ready. You can continue syncing data.');
    }
    return true;
  } catch (error) {
    console.warn('Supabase write failed:', error?.message || error);
    const schemaMissing = isSchemaMissingError(error);
    const schemaOutdated = isSchemaOutdatedError(error);
    const schemaIssue = schemaMissing || schemaOutdated;
    setDbStatus('Offline / Demo', 'var(--amber)');
    if (schemaIssue) {
      supabaseHealth = { productsTable: false, ordersTable: false, schemaMissing, schemaOutdated };
      updateSupabaseSetupUi('Supabase setup is pending. Demo/local mode is active until schema is applied.');
    }
    dbOnline = false;
    if (!silent) {
      const message = schemaIssue
        ? 'Supabase setup is pending. App is running in demo/local mode.'
        : fallbackNotice;
      toast('inf', schemaIssue ? 'Supabase Setup Pending' : 'Supabase Sync Issue', message);
    }
    return false;
  }
}

async function checkSupabaseHealth(showToast = false) {
  if (!canUseSupabase()) {
    supabaseHealth = { productsTable: false, ordersTable: false, schemaMissing: false, schemaOutdated: false };
    updateSupabaseSetupUi(sbConfigIssue || 'Supabase client unavailable. Check URL/key and internet connection.');
    if (showToast) toast('err', 'Supabase Not Ready', sbConfigIssue || 'Client is not initialized.');
    return supabaseHealth;
  }

  let productsTable = false;
  let ordersTable = false;
  let schemaMissing = false;
  let schemaOutdated = false;
  let lastError = null;

  try {
    const { error } = await sb.from('products').select('id').limit(1);
    if (error) throw error;
    productsTable = true;
  } catch (error) {
    lastError = error;
    if (isSchemaMissingError(error)) schemaMissing = true;
    if (isSchemaOutdatedError(error)) schemaOutdated = true;
  }

  try {
    const { error } = await sb.from('orders').select('id').limit(1);
    if (error) throw error;
    ordersTable = true;
  } catch (error) {
    lastError = error;
    if (isSchemaMissingError(error)) schemaMissing = true;
    if (isSchemaOutdatedError(error)) schemaOutdated = true;
  }

  supabaseHealth = { productsTable, ordersTable, schemaMissing, schemaOutdated };

  if (schemaMissing || schemaOutdated) {
    setDbStatus('Offline / Demo', 'var(--amber)');
    updateSupabaseSetupUi('Supabase setup is pending. Demo/local mode is active until schema is applied.');
    if (showToast) toast('inf', 'Supabase Setup Pending', 'Run supabase-schema.sql in Supabase SQL Editor, then Recheck.');
  } else if (productsTable && ordersTable) {
    setDbStatus('Connected', 'var(--green)');
    updateSupabaseSetupUi('Schema is ready. You can now sync and seed products.');
    if (showToast) toast('ok', 'Supabase Ready', 'Products and orders tables are available.');
  } else {
    setDbStatus('Sync Issue', 'var(--amber)');
    updateSupabaseSetupUi('Could not confirm schema health. Check network and permissions.');
    if (showToast) {
      const msg = String(lastError?.message || 'Unknown schema check issue');
      toast('inf', 'Supabase Check Incomplete', msg);
    }
  }

  return supabaseHealth;
}

function openSupabaseSqlEditor() {
  window.open(SUPABASE_SQL_EDITOR_URL, '_blank');
}

async function copySupabaseSchemaSql() {
  try {
    const res = await fetch('./supabase-schema.sql', { cache: 'no-store' });
    if (!res.ok) throw new Error('Could not read supabase-schema.sql');
    const sql = await res.text();
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(sql);
      toast('ok', 'Schema Copied', 'Paste into Supabase SQL Editor and run.');
    } else {
      toast('inf', 'Clipboard Unavailable', 'Open supabase-schema.sql in this repo and copy manually.');
    }
  } catch (error) {
    toast('err', 'Copy Failed', error?.message || 'Could not copy schema SQL.');
  }
}

function mapFallbackToSupabaseProduct(product) {
  const variants = normalizeVariantEntries(product.variants).map((entry) => (
    entry.color ? { label: entry.label, color: entry.color } : { label: entry.label }
  ));
  return {
    name: product.name,
    slug: product.slug || String(product.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
    category: normalizeCategoryValue(product.category) || 'accessories',
    brand: product.brand || 'Unknown',
    price: Number(product.price || 0),
    original_price: product.original_price ? Number(product.original_price) : null,
    stock: Number.isFinite(Number(product.stock)) ? Number(product.stock) : 0,
    badge: product.badge || null,
    description: product.description || '',
    variants,
    images: Array.isArray(product.images) ? product.images : [],
    specs: product.specs && typeof product.specs === 'object' ? product.specs : {},
    sku: product.sku || null,
    tagline: product.tagline || null,
    highlights: Array.isArray(product.highlights) ? product.highlights : [],
    active: product.active !== false,
  };
}

async function seedSupabaseProducts() {
  if (!canUseSupabase()) {
    toast('err', 'Supabase Not Ready', sbConfigIssue || 'Client is not initialized.');
    return;
  }
  const health = await checkSupabaseHealth(false);
  if (health.schemaMissing || health.schemaOutdated) {
    toast('inf', 'Supabase Setup Pending', 'Run supabase-schema.sql first, then seed products.');
    return;
  }

  let count = 0;
  try {
    const { count: c, error } = await sb.from('products').select('id', { head: true, count: 'exact' });
    if (error) throw error;
    count = Number(c || 0);
  } catch (error) {
    toast('err', 'Count Failed', error?.message || 'Could not count products.');
    return;
  }

  if (count > 0 && !confirm(`Supabase already has ${count} products. Continue seeding with upsert by slug?`)) return;

  const payload = FALLBACK_PRODUCTS.map(mapFallbackToSupabaseProduct);
  try {
    const { error } = await sbAdmin.from('products').upsert(payload, { onConflict: 'slug' });
    if (error) throw error;
    toast('ok', 'Seed Completed', `${payload.length} products synced to Supabase.`);
    await loadProducts();
    if (adminAuth) renderAdminProducts();
    await checkSupabaseHealth(false);
  } catch (error) {
    toast('err', 'Seed Failed', error?.message || 'Could not seed products.');
  }
}

async function syncAllProductsToSupabase() {
  if (!canUseSupabase()) {
    toast('err', 'Supabase Not Ready', sbConfigIssue || 'Client is not initialized.');
    return;
  }
  const health = await checkSupabaseHealth(false);
  if (health.schemaMissing || health.schemaOutdated) {
    toast('inf', 'Supabase Setup Pending', 'Run supabase-schema.sql before syncing catalog.');
    return;
  }

  const sourceProducts = Array.isArray(products) && products.length ? products : FALLBACK_PRODUCTS;
  const payload = sourceProducts.map(mapFallbackToSupabaseProduct);
  if (!payload.length) {
    toast('inf', 'No Products', 'There are no products to sync right now.');
    return;
  }

  const synced = await runSupabaseWrite(
    async () => {
      const { error } = await sbAdmin.from('products').upsert(payload, { onConflict: 'slug' });
      if (error) throw error;
      return { data: payload };
    },
    { silent: true, fallbackNotice: 'Could not sync catalog to Supabase. Try again.' }
  );

  if (!synced) {
    toast('inf', 'Sync Incomplete', 'Catalog stayed local. Retry after your connection is stable.');
    return;
  }

  toast('ok', 'Catalog Synced', `${payload.length} products synced to Supabase.`);
  await loadProducts();
  if (adminAuth) renderAdminProducts();
  await checkSupabaseHealth(false);
}

async function seedJewelryDemoProducts() {
  const seedTemplates = FALLBACK_PRODUCTS.filter((p) => isJewelryCategory(p.category)).slice(0, 6);
  if (!seedTemplates.length) {
    toast('err', 'No Jewelry Templates', 'Could not find jewelry seed products.');
    return;
  }

  const existingJewelryCount = products.filter((p) => isJewelryCategory(p.category)).length;
  if (existingJewelryCount > 0 && !confirm(`You already have ${existingJewelryCount} jewelry products. Add ${seedTemplates.length} more demo items?`)) {
    return;
  }

  const stamp = Date.now().toString(36);
  const knownSlugs = new Set(products.map((p) => String(p.slug || '').toLowerCase()).filter(Boolean));
  const seededProducts = seedTemplates.map((template, idx) => {
    const baseSlug = normalizeCategoryValue(template.slug || template.name || `jewelry-item-${idx + 1}`) || `jewelry-item-${idx + 1}`;
    let slug = `${baseSlug}-demo-${stamp}-${idx + 1}`;
    while (knownSlugs.has(slug)) slug = `${slug}-x`;
    knownSlugs.add(slug);
    return {
      ...template,
      id: `jw-demo-${stamp}-${idx + 1}`,
      slug,
      active: true,
      images: Array.isArray(template.images) ? [...template.images] : [],
      variants: Array.isArray(template.variants) ? [...template.variants] : [],
      highlights: Array.isArray(template.highlights) ? [...template.highlights] : [],
      specs: template.specs && typeof template.specs === 'object' ? { ...template.specs } : {},
    };
  });

  products = [...seededProducts, ...products];

  let dbSynced = !canUseSupabase();
  let insertedRows = [];
  if (canUseSupabase()) {
    const payload = seededProducts.map(mapFallbackToSupabaseProduct);
    dbSynced = await runSupabaseWrite(
      async () => {
        const { data, error } = await sbAdmin.from('products').insert(payload).select();
        if (error) throw error;
        insertedRows = Array.isArray(data) ? data : [];
        return { data };
      },
      { silent: true }
    );
    if (dbSynced && insertedRows.length) {
      const bySlug = new Map(insertedRows.map((row) => [String(row.slug || '').toLowerCase(), row]));
      seededProducts.forEach((product) => {
        const row = bySlug.get(String(product.slug || '').toLowerCase());
        if (row?.id) product.id = row.id;
      });
    }
  }

  renderAdminProducts();
  renderCategoryChips();
  if (!getAllowedFilterCategories().includes(currentCat)) currentCat = storefrontMode === 'jewerlys' ? 'jewerlys' : 'all';
  setCat(currentCat, { closeSidebar: false });
  updateAdminStats();

  if (canUseSupabase() && !dbSynced) {
    toast('inf', 'Supabase Sync Issue', 'Jewelry samples added locally but not synced to Supabase yet.');
  }
  toast('ok', 'Jewelry Samples Added', `${seededProducts.length} sample jewelry products added. You can delete them from Admin.`);
}

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
    cameras:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h4l2-3h4l2 3h4a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z"/><circle cx="12" cy="13" r="3.5"/></svg>`,
    'tv-home-entertainment':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4" width="19" height="13" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>`,
    networking:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18h18"/><path d="M6 18v-4"/><path d="M10 18v-7"/><path d="M14 18v-5"/><path d="M18 18v-9"/></svg>`,
    'computer-accessories':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="10" rx="2"/><path d="M8 20h8"/><path d="M12 14v6"/></svg>`,
    'kitchen-accessories':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v7a3 3 0 0 0 6 0V3"/><line x1="9" y1="3" x2="9" y2="10"/><path d="M14 3h1a3 3 0 0 1 3 3v15"/><line x1="4" y1="21" x2="20" y2="21"/></svg>`,
    gaming:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12h4"/><path d="M8 10v4"/><path d="M15 13h.01"/><path d="M18 11h.01"/><path d="M7 6h10a4 4 0 0 1 3.9 4.9l-1.1 5a3 3 0 0 1-2.93 2.35h-1.2a2 2 0 0 1-1.79-1.1l-.56-1.13a2 2 0 0 0-1.79-1.1h-.06a2 2 0 0 0-1.79 1.1l-.56 1.12a2 2 0 0 1-1.79 1.11h-1.2a3 3 0 0 1-2.93-2.34l-1.1-5A4 4 0 0 1 7 6z"/></svg>`,
    'smart-home':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.8V21h14V9.8"/><path d="M9 21v-5a3 3 0 0 1 6 0v5"/></svg>`,
    'jewelry-necklaces':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 5a5 5 0 0 1 10 0v4a5 5 0 0 1-10 0z"/><circle cx="12" cy="19" r="3"/></svg>`,
    'jewelry-rings':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="16" r="5"/><circle cx="16" cy="16" r="5"/></svg>`,
    'jewelry-bracelets':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2"/></svg>`,
    'jewelry-earrings':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 7a4 4 0 0 1 8 0v4a4 4 0 0 1-8 0z"/><circle cx="9" cy="19" r="2"/><circle cx="15" cy="19" r="2"/></svg>`,
    'jewelry-watches':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="4" rx="1"/><rect x="9" y="18" width="6" height="4" rx="1"/><circle cx="12" cy="12" r="5"/><polyline points="12 10 12 12 13.5 13.5"/></svg>`,
    'jewelry-pendants':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v7"/><circle cx="12" cy="15" r="5"/></svg>`,
    'jewelry-anklets':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="7"/><path d="M16 7.5h.01"/></svg>`,
    'jewelry-brooches':`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 7h7l-5.5 4.2L18.5 21 12 16.8 5.5 21l2-7.8L2 9h7z"/></svg>`,
    jewerlys:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 20.5 9 12 22 3.5 9 12 2"/><path d="M3.5 9h17"/></svg>`,
  };
  return m[cat] || `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
}

const DEFAULT_ELECTRONICS_CATEGORIES = [
  'smartphones',
  'laptops',
  'watches',
  'audio',
  'tablets',
  'cameras',
  'tv-home-entertainment',
  'networking',
  'computer-accessories',
  'kitchen-accessories',
  'gaming',
  'smart-home',
  'accessories',
];
const DEFAULT_JEWELRY_CATEGORIES = [
  'jewerlys',
  'jewelry-necklaces',
  'jewelry-rings',
  'jewelry-bracelets',
  'jewelry-earrings',
  'jewelry-watches',
  'jewelry-pendants',
  'jewelry-anklets',
  'jewelry-brooches',
];
const DEFAULT_CATEGORIES = [...DEFAULT_ELECTRONICS_CATEGORIES, ...DEFAULT_JEWELRY_CATEGORIES];
const CATEGORY_TITLE_MAP = {
  all: 'All Products',
  smartphones: 'Smartphones',
  laptops: 'Laptops',
  watches: 'Watches & Wearables',
  audio: 'Audio',
  tablets: 'Tablets',
  cameras: 'Cameras',
  'tv-home-entertainment': 'TV & Home Entertainment',
  networking: 'Networking',
  'computer-accessories': 'Computer Accessories',
  'kitchen-accessories': 'Kitchen Accessories',
  gaming: 'Gaming Gear',
  'smart-home': 'Smart Home',
  accessories: 'Accessories',
  jewerlys: 'Jewelry',
  'jewelry-necklaces': 'Necklaces',
  'jewelry-rings': 'Rings',
  'jewelry-bracelets': 'Bracelets',
  'jewelry-earrings': 'Earrings',
  'jewelry-watches': 'Jewelry Watches',
  'jewelry-pendants': 'Pendants',
  'jewelry-anklets': 'Anklets',
  'jewelry-brooches': 'Brooches',
};
const CATEGORY_CARD_LABEL_MAP = {
  smartphones: 'Smartphone',
  laptops: 'Laptop',
  watches: 'Watch',
  audio: 'Audio',
  tablets: 'Tablet',
  cameras: 'Camera',
  'tv-home-entertainment': 'TV',
  networking: 'Networking',
  'computer-accessories': 'Accessories',
  'kitchen-accessories': 'Kitchen',
  gaming: 'Gaming',
  'smart-home': 'Smart Home',
  accessories: 'Accessory',
  jewerlys: 'Jewelry',
  'jewelry-necklaces': 'Necklace',
  'jewelry-rings': 'Ring',
  'jewelry-bracelets': 'Bracelet',
  'jewelry-earrings': 'Earrings',
  'jewelry-watches': 'Jewelry Watch',
  'jewelry-pendants': 'Pendant',
  'jewelry-anklets': 'Anklet',
  'jewelry-brooches': 'Brooch',
};
const HEADER_TOGGLE_CATEGORIES = [...DEFAULT_JEWELRY_CATEGORIES];
const SEO_BASE_URL = 'https://lifetimetechnology.store';
const SEO_SITE_NAME = 'Lifetime Technology';
const SEO_DEFAULT_IMAGE = `${SEO_BASE_URL}/assets/images/logo-original.png`;
const CATEGORY_SEO_COPY = {
  all: {
    title: 'Electronics, Phones and Smart Devices Store',
    description: 'Shop phones, laptops, tablets, audio, smart home gadgets and jewelry with secure checkout and assisted support.',
    keywords: 'electronics store, phones, laptops, smart devices, tablets, jewelry, online shop',
  },
  smartphones: {
    title: 'Smartphones in Kenya',
    description: 'Buy premium smartphones in Kenya from Samsung, Apple and top brands with trusted delivery.',
    keywords: 'smartphones Kenya, iPhone Kenya, Samsung Kenya',
  },
  laptops: {
    title: 'Laptops and Computers',
    description: 'Shop performance laptops and notebooks in Kenya for business, school and gaming.',
    keywords: 'laptops Kenya, notebooks Kenya, MacBook Kenya, Dell XPS Kenya',
  },
  watches: {
    title: 'Smart Watches and Wearables',
    description: 'Discover smart watches and wearables with fitness tracking, GPS and long battery life.',
    keywords: 'smart watches Kenya, wearables Kenya, Apple Watch Kenya, Garmin Kenya',
  },
  audio: {
    title: 'Audio Devices and Headphones',
    description: 'Shop headphones, earbuds and audio accessories with clear sound and reliable connectivity.',
    keywords: 'audio Kenya, headphones Kenya, earbuds Kenya',
  },
  tablets: {
    title: 'Tablets in Kenya',
    description: 'Browse powerful tablets for work, entertainment and school with fast delivery options.',
    keywords: 'tablets Kenya, iPad Kenya, Galaxy Tab Kenya',
  },
  'kitchen-accessories': {
    title: 'Kitchen Accessories and Appliances',
    description: 'Find quality kitchen accessories and smart appliances for everyday cooking and convenience.',
    keywords: 'kitchen accessories Kenya, air fryer Kenya, kitchen appliances Kenya',
  },
  gaming: {
    title: 'Gaming Consoles and Accessories',
    description: 'Shop gaming consoles, controllers and accessories built for high performance play.',
    keywords: 'gaming Kenya, PlayStation Kenya, gaming accessories Kenya',
  },
  'smart-home': {
    title: 'Smart Home Devices',
    description: 'Upgrade your home with smart displays, voice assistants and connected home electronics.',
    keywords: 'smart home Kenya, smart display Kenya, home automation Kenya',
  },
  jewerlys: {
    title: 'Jewelry Collection',
    description: 'Explore stylish jewelry pieces including necklaces, rings, bracelets, earrings and watches.',
    keywords: 'jewelry Kenya, necklaces Kenya, rings Kenya, bracelets Kenya',
  },
  'jewelry-necklaces': {
    title: 'Necklaces Collection',
    description: 'Shop elegant necklace designs for daily wear, events and gifting.',
    keywords: 'necklaces Kenya, jewelry necklaces Kenya',
  },
  'jewelry-rings': {
    title: 'Rings Collection',
    description: 'Discover minimalist and statement rings crafted for style and comfort.',
    keywords: 'rings Kenya, jewelry rings Kenya',
  },
  'jewelry-bracelets': {
    title: 'Bracelets Collection',
    description: 'Browse adjustable and charm bracelets designed for gifting and daily wear.',
    keywords: 'bracelets Kenya, jewelry bracelets Kenya',
  },
  'jewelry-earrings': {
    title: 'Earrings Collection',
    description: 'Find elegant earrings that pair with modern and classic looks.',
    keywords: 'earrings Kenya, jewelry earrings Kenya',
  },
  'jewelry-watches': {
    title: 'Jewelry Watches',
    description: 'Shop jewelry watches that blend fashion styling with everyday practicality.',
    keywords: 'jewelry watches Kenya, fashion watches Kenya',
  },
};
const FOOTER_INFO_CONTENT = {
  'about-us': {
    title: 'About Lifetime Technology Store',
    text: 'Lifetime Technology Store is a Nairobi-based team curating premium electronics and jewelry. We focus on authentic products, transparent pricing, and assisted customer support.',
  },
  careers: {
    title: 'Careers',
    text: 'We welcome people in sales, fulfillment, customer support, and e-commerce operations. Share your profile with us through support for future openings.',
  },
  press: {
    title: 'Press',
    text: 'For media requests, interviews, and product launch coverage, contact our support desk and include your publication details.',
  },
  partners: {
    title: 'Partners',
    text: 'We collaborate with trusted brands, distributors, and logistics partners to keep quality and delivery standards high across Kenya.',
  },
  'privacy-policy': {
    title: 'Privacy Policy',
    text: 'We use customer data only for order processing, delivery updates, payment verification, and support. We do not sell customer data to third parties.',
  },
  'returns-policy': {
    title: 'Returns Policy',
    text: 'If an item is damaged, incorrect, or not as expected, contact support promptly with your order number. Our team will guide you through replacement or return steps.',
  },
  'warranty-info': {
    title: 'Warranty Info',
    text: 'Eligible products include supplier or manufacturer warranty support. Keep your order confirmation and serial details for faster warranty assistance.',
  },
  faqs: {
    title: 'FAQs',
    text: 'Common answers: delivery timelines vary by region, payment is secured by Paystack/M-Pesa, and orders can be assisted via WhatsApp support.',
  },
  'blog-smartphones': {
    title: 'Blog: Smartphone Buying Guide',
    text: 'Compare display quality, camera sensors, chipset generation, battery health, and update support before choosing your next phone.',
    category: 'smartphones',
    query: 'buying guide camera battery chipset',
  },
  'blog-laptops': {
    title: 'Blog: Laptop Checklist Guide',
    text: 'For laptops, prioritize CPU class, RAM upgrade path, SSD speed, thermal design, and battery endurance based on your workload.',
    category: 'laptops',
    query: 'laptop checklist performance battery display',
  },
  'blog-jewelry': {
    title: 'Blog: Jewelry Care Guide',
    text: 'Store jewelry dry, avoid chemical sprays, clean gently with soft cloth, and separate pieces to protect finish and clasp quality.',
    category: 'jewerlys',
    query: 'jewelry care guide',
  },
  'blog-gaming': {
    title: 'Blog: Gaming Setup Tips',
    text: 'Build a stable gaming setup with low-latency display, reliable controller response, cooling airflow, and power-safe accessories.',
    category: 'gaming',
    query: 'gaming setup guide accessories',
  },
};

function normalizeCategoryValue(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (['jewelry', 'jewelery', 'jewellery', 'jewelrys', 'jewelries', 'jewelry-picks'].includes(normalized)) {
    return 'jewerlys';
  }
  return normalized;
}

function toPublicCategorySlug(category) {
  const normalized = normalizeCategoryValue(category);
  if (normalized === 'jewerlys') return 'jewelry';
  return normalized;
}

function humanizeCategorySlug(slug) {
  return String(slug || '')
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function normalizeBrandName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function normalizeCustomCategoryState(raw) {
  const next = { electronics: [], jewerlys: [] };
  if (!raw || typeof raw !== 'object') return next;
  ['electronics', 'jewerlys'].forEach((scope) => {
    const list = Array.isArray(raw[scope]) ? raw[scope] : [];
    const seen = new Set();
    list.forEach((entry) => {
      const slug = normalizeCategoryValue(entry?.slug || entry?.name || entry);
      if (!slug || seen.has(slug)) return;
      seen.add(slug);
      const name = String(entry?.name || humanizeCategorySlug(slug)).trim() || humanizeCategorySlug(slug);
      next[scope].push({ slug, name });
    });
    next[scope].sort((a, b) => a.name.localeCompare(b.name));
  });
  return next;
}

function saveCustomCategoryState() {
  try {
    localStorage.setItem('ltl2_custom_categories', JSON.stringify(customCategoryState));
  } catch (_) {}
}

function loadCustomCategoryState() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem('ltl2_custom_categories') || 'null'); } catch (_) {}
  customCategoryState = normalizeCustomCategoryState(saved);
}

function getCustomCategoryEntries(scope) {
  const key = scope === 'jewerlys' ? 'jewerlys' : 'electronics';
  return Array.isArray(customCategoryState[key]) ? customCategoryState[key] : [];
}

function getAllCustomCategorySlugs() {
  return [
    ...getCustomCategoryEntries('electronics').map((c) => c.slug),
    ...getCustomCategoryEntries('jewerlys').map((c) => c.slug),
  ];
}

function normalizeCustomBrandState(raw) {
  const next = { electronics: [], jewerlys: [] };
  if (!raw || typeof raw !== 'object') return next;
  ['electronics', 'jewerlys'].forEach((scope) => {
    const list = Array.isArray(raw[scope]) ? raw[scope] : [];
    const seen = new Set();
    list.forEach((entry) => {
      const slug = normalizeCategoryValue(entry?.slug || entry?.name || entry);
      if (!slug || seen.has(slug)) return;
      seen.add(slug);
      const name = normalizeBrandName(entry?.name || humanizeCategorySlug(slug));
      if (!name) return;
      next[scope].push({ slug, name });
    });
    next[scope].sort((a, b) => a.name.localeCompare(b.name));
  });
  return next;
}

function saveCustomBrandState() {
  try {
    localStorage.setItem('ltl2_custom_brands', JSON.stringify(customBrandState));
  } catch (_) {}
}

function loadCustomBrandState() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem('ltl2_custom_brands') || 'null'); } catch (_) {}
  customBrandState = normalizeCustomBrandState(saved);
}

function getCustomBrandEntries(scope) {
  const key = scope === 'jewerlys' ? 'jewerlys' : 'electronics';
  return Array.isArray(customBrandState[key]) ? customBrandState[key] : [];
}

function getAllCustomBrandNames() {
  return [
    ...getCustomBrandEntries('electronics').map((entry) => entry.name),
    ...getCustomBrandEntries('jewerlys').map((entry) => entry.name),
  ];
}

function getBrandScopeFromCategory(category) {
  return isJewelryCategory(category) ? 'jewerlys' : 'electronics';
}

function hasCustomBrand(name, scope) {
  const clean = normalizeBrandName(name).toLowerCase();
  if (!clean) return false;
  return getCustomBrandEntries(scope).some((entry) => normalizeBrandName(entry.name).toLowerCase() === clean);
}

async function syncCustomBrandsFromSupabase() {
  if (!canUseSupabase()) return;
  try {
    const { data, error } = await sbAdmin
      .from('store_brands')
      .select('slug,name,scope,active')
      .eq('active', true)
      .order('name', { ascending: true });
    if (error) throw error;
    if (!Array.isArray(data) || !data.length) return;
    const merged = normalizeCustomBrandState(customBrandState);
    data.forEach((row) => {
      const scope = row?.scope === 'jewerlys' ? 'jewerlys' : 'electronics';
      const slug = normalizeCategoryValue(row?.slug || row?.name || '');
      const name = normalizeBrandName(row?.name || humanizeCategorySlug(slug));
      if (!slug || !name) return;
      const idx = merged[scope].findIndex((entry) => entry.slug === slug);
      if (idx > -1) merged[scope][idx] = { slug, name };
      else merged[scope].push({ slug, name });
    });
    merged.electronics.sort((a, b) => a.name.localeCompare(b.name));
    merged.jewerlys.sort((a, b) => a.name.localeCompare(b.name));
    customBrandState = merged;
    saveCustomBrandState();
  } catch (error) {
    if (!isSchemaProblemError(error)) {
      console.warn('Custom brands sync skipped:', error?.message || error);
    }
  }
}

async function upsertCustomBrand(name, scope, syncSupabase = true) {
  const cleanName = normalizeBrandName(name);
  const cleanScope = scope === 'jewerlys' ? 'jewerlys' : 'electronics';
  const slug = normalizeCategoryValue(cleanName);
  if (!cleanName || !slug) return false;
  if (hasCustomBrand(cleanName, cleanScope)) return true;

  customBrandState[cleanScope] = [...getCustomBrandEntries(cleanScope), { slug, name: cleanName }]
    .filter((entry, idx, arr) => entry.slug && arr.findIndex((x) => x.slug === entry.slug) === idx)
    .sort((a, b) => a.name.localeCompare(b.name));
  saveCustomBrandState();

  if (syncSupabase && canUseSupabase()) {
    try {
      const { error } = await sbAdmin.from('store_brands').upsert([{
        slug,
        name: cleanName,
        scope: cleanScope,
        active: true,
      }], { onConflict: 'slug' });
      if (error) throw error;
    } catch (error) {
      if (!isSchemaProblemError(error)) {
        console.warn('Could not sync brand to Supabase:', error?.message || error);
      }
    }
  }
  return true;
}

function getCustomCategoryName(slug) {
  const target = normalizeCategoryValue(slug);
  for (const scope of ['electronics', 'jewerlys']) {
    const match = getCustomCategoryEntries(scope).find((entry) => entry.slug === target);
    if (match) return match.name;
  }
  return '';
}

async function syncCustomCategoriesFromSupabase() {
  if (!canUseSupabase()) return;
  try {
    const { data, error } = await sbAdmin
      .from('store_categories')
      .select('slug,name,scope,active')
      .eq('active', true)
      .order('name', { ascending: true });
    if (error) throw error;
    if (!Array.isArray(data) || !data.length) return;
    const merged = normalizeCustomCategoryState(customCategoryState);
    data.forEach((row) => {
      const scope = row?.scope === 'jewerlys' ? 'jewerlys' : 'electronics';
      const slug = normalizeCategoryValue(row?.slug || row?.name || '');
      if (!slug) return;
      const name = String(row?.name || humanizeCategorySlug(slug)).trim() || humanizeCategorySlug(slug);
      const idx = merged[scope].findIndex((entry) => entry.slug === slug);
      if (idx > -1) merged[scope][idx] = { slug, name };
      else merged[scope].push({ slug, name });
    });
    merged.electronics.sort((a, b) => a.name.localeCompare(b.name));
    merged.jewerlys.sort((a, b) => a.name.localeCompare(b.name));
    customCategoryState = merged;
    saveCustomCategoryState();
  } catch (error) {
    if (!isSchemaProblemError(error)) {
      console.warn('Custom categories sync skipped:', error?.message || error);
    }
  }
}

function isCustomJewelryCategory(cat) {
  const slug = normalizeCategoryValue(cat);
  return getCustomCategoryEntries('jewerlys').some((entry) => entry.slug === slug);
}

function categoryDisplayName(cat) {
  const slug = normalizeCategoryValue(cat);
  if (!slug) return 'Category';
  if (CATEGORY_TITLE_MAP[slug]) return CATEGORY_TITLE_MAP[slug].replace(' & Wearables', '');
  const custom = getCustomCategoryName(slug);
  if (custom) return custom;
  return humanizeCategorySlug(slug);
}

function categoryTitle(cat) {
  const slug = normalizeCategoryValue(cat);
  if (CATEGORY_TITLE_MAP[slug]) return CATEGORY_TITLE_MAP[slug];
  return categoryDisplayName(slug);
}

function cardCategoryLabel(cat) {
  const slug = normalizeCategoryValue(cat);
  return CATEGORY_CARD_LABEL_MAP[slug] || getCustomCategoryName(slug) || categoryDisplayName(slug);
}

function isJewelryCategory(cat) {
  const slug = normalizeCategoryValue(cat);
  return DEFAULT_JEWELRY_CATEGORIES.includes(slug) || isCustomJewelryCategory(slug) || slug.startsWith('jewelry-');
}

function getAllKnownCategories() {
  const dynamic = new Set(products.map((p) => normalizeCategoryValue(p.category)).filter(Boolean));
  return [...new Set([...DEFAULT_CATEGORIES, ...getAllCustomCategorySlugs(), ...dynamic])];
}

function getAvailableCategories(mode = storefrontMode) {
  const all = getAllKnownCategories();
  const isJewelryMode = mode === 'jewerlys';
  const defaults = isJewelryMode ? DEFAULT_JEWELRY_CATEGORIES : DEFAULT_ELECTRONICS_CATEGORIES;
  const custom = getCustomCategoryEntries(mode).map((entry) => entry.slug);
  const scoped = all.filter((cat) => (isJewelryMode ? isJewelryCategory(cat) : !isJewelryCategory(cat)));
  const mergedBase = [...new Set([...defaults, ...custom])];
  const extras = scoped.filter((cat) => !mergedBase.includes(cat)).sort((a, b) => a.localeCompare(b));
  return [...mergedBase, ...extras];
}

function getAvailableBrands(mode = adminCatalogMode) {
  const scope = mode === 'jewerlys' ? 'jewerlys' : 'electronics';
  const names = [
    ...getCustomBrandEntries(scope).map((entry) => normalizeBrandName(entry.name)),
    ...products
      .filter((p) => getBrandScopeFromCategory(p.category) === scope)
      .map((p) => normalizeBrandName(p.brand)),
  ].filter(Boolean);
  const seen = new Set();
  const unique = [];
  names.forEach((name) => {
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    unique.push(name);
  });
  return unique.sort((a, b) => a.localeCompare(b));
}

function getAllowedFilterCategories() {
  return ['all', ...new Set([...getAllKnownCategories(), ...HEADER_TOGGLE_CATEGORIES])];
}

function getCategoryFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    return normalizeCategoryValue(params.get('category') || '');
  } catch (_) {
    return '';
  }
}

function isSensitiveQueryValue(rawValue) {
  const clean = String(rawValue || '').trim();
  if (!clean) return false;
  if (CHECKOUT_EMAIL_RE.test(clean)) return true;
  if (clean.length > 120) return true;
  return SENSITIVE_QUERY_PATTERNS.some((re) => re.test(clean));
}

function sanitizeSearchQuery(rawValue) {
  const clean = String(rawValue || '').trim();
  if (!clean) return '';
  if (isSensitiveQueryValue(clean)) return '';
  return clean;
}

function scrubSensitiveQueryFromUrl() {
  if (!window.history || typeof window.history.replaceState !== 'function') return false;
  const url = new URL(window.location.href);
  const query = String(url.searchParams.get('q') || '').trim();
  if (!query || !isSensitiveQueryValue(query)) return false;
  url.searchParams.delete('q');
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  return true;
}

function getSearchQueryFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    return sanitizeSearchQuery(params.get('q') || '');
  } catch (_) {
    return '';
  }
}

function getProductSlugFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    return String(params.get('product') || '').trim().toLowerCase();
  } catch (_) {
    return '';
  }
}

function prefersReducedMotion() {
  return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

function updateHeadMeta(id, value) {
  const el = document.getElementById(id);
  if (!el || !value) return;
  el.setAttribute('content', value);
}

function setRobotsMeta(content) {
  const el = document.querySelector('meta[name="robots"]');
  if (!el || !content) return;
  el.setAttribute('content', content);
}

function updateLinkHref(id, value) {
  const el = document.getElementById(id);
  if (!el || !value) return;
  el.setAttribute('href', value);
}

function setSeoTitle(text) {
  if (!text) return;
  document.title = text;
  const t = document.getElementById('seoTitle');
  if (t) t.textContent = text;
}

function buildCanonical(params = {}) {
  const url = new URL(SEO_BASE_URL);
  const category = normalizeCategoryValue(params.category || '');
  const publicCategory = toPublicCategorySlug(category);
  const query = sanitizeSearchQuery(params.query || '');
  const product = String(params.product || '').trim();
  if (publicCategory && publicCategory !== 'all') url.searchParams.set('category', publicCategory);
  if (query) url.searchParams.set('q', query);
  if (product) url.searchParams.set('product', product);
  return url.toString();
}

function syncSearchInUrl(query) {
  if (!window.history || typeof window.history.replaceState !== 'function') return;
  const clean = sanitizeSearchQuery(query || '');
  const url = new URL(window.location.href);
  if (clean) url.searchParams.set('q', clean);
  else url.searchParams.delete('q');
  if (!clean) url.searchParams.delete('product');
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

function syncProductInUrl(productSlug) {
  if (!window.history || typeof window.history.replaceState !== 'function') return;
  const clean = String(productSlug || '').trim();
  const url = new URL(window.location.href);
  if (clean) url.searchParams.set('product', clean);
  else url.searchParams.delete('product');
  if (clean) url.searchParams.delete('q');
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

function ensureActiveChipVisible() {
  const wrap = document.getElementById('catChips');
  const active = wrap?.querySelector('.cat-chip.active');
  if (!wrap || !active) return;
  if (window.innerWidth > 900) return;
  const opts = { block: 'nearest', inline: 'center', behavior: prefersReducedMotion() ? 'auto' : 'smooth' };
  active.scrollIntoView(opts);
}

function buildProductOfferSchema(product, canonicalUrl) {
  const stock = Number(product?.stock || 0);
  return {
    '@type': 'Offer',
    priceCurrency: 'KES',
    price: Number(product?.price || 0),
    availability: stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    itemCondition: 'https://schema.org/NewCondition',
    url: canonicalUrl,
  };
}

function getCurrentSeoCategory() {
  const normalized = normalizeCategoryValue(currentCat);
  if (normalized) return normalized;
  return storefrontMode === 'jewerlys' ? 'jewerlys' : 'all';
}

function getCategorySeoPayload(cat) {
  const slug = normalizeCategoryValue(cat) || 'all';
  const fallbackKey = storefrontMode === 'jewerlys' ? 'jewerlys' : 'all';
  const copy = CATEGORY_SEO_COPY[slug] || CATEGORY_SEO_COPY[fallbackKey] || CATEGORY_SEO_COPY.all;
  return {
    slug,
    title: copy.title,
    description: copy.description,
    keywords: copy.keywords,
  };
}

function getSearchResultsForSchema() {
  if (!Array.isArray(displayedProducts)) return [];
  return displayedProducts.filter((p) => p && p.active !== false).slice(0, 12);
}

function buildDynamicSchema(context) {
  const canonicalUrl = context.canonical;
  if (context.type === 'product' && context.product) {
    const product = context.product;
    const images = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
    return {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Product',
          name: product.name,
          description: product.description || `${product.name} by ${product.brand}`,
          category: categoryDisplayName(product.category),
          sku: product.sku || undefined,
          brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
          image: images.length ? images : [SEO_DEFAULT_IMAGE],
          offers: buildProductOfferSchema(product, canonicalUrl),
          url: canonicalUrl,
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: SEO_BASE_URL },
            { '@type': 'ListItem', position: 2, name: categoryTitle(product.category), item: buildCanonical({ category: product.category }) },
            { '@type': 'ListItem', position: 3, name: product.name, item: canonicalUrl },
          ],
        },
      ],
    };
  }

  const items = getSearchResultsForSchema();
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: context.heading,
        description: context.description,
        url: canonicalUrl,
        isPartOf: { '@id': `${SEO_BASE_URL}/#website` },
      },
      {
        '@type': 'ItemList',
        name: `${context.heading} Product List`,
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        numberOfItems: items.length,
        itemListElement: items.map((p, idx) => {
          const slug = String(p.slug || p.id || '').trim();
          return {
            '@type': 'ListItem',
            position: idx + 1,
            name: p.name,
            url: buildCanonical({ category: p.category, product: slug }),
            item: {
              '@type': 'Product',
              name: p.name,
              brand: p.brand ? { '@type': 'Brand', name: p.brand } : undefined,
              category: categoryDisplayName(p.category),
              image: Array.isArray(p.images) && p.images.length ? p.images[0] : SEO_DEFAULT_IMAGE,
              offers: buildProductOfferSchema(p, buildCanonical({ category: p.category, product: slug })),
            },
          };
        }),
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'How fast is delivery in Kenya?',
            acceptedAnswer: { '@type': 'Answer', text: 'Delivery timelines depend on location. Nairobi areas can be same-day or 1-2 days, while upcountry deliveries are usually 2-5 days.' },
          },
          {
            '@type': 'Question',
            name: 'Can I order through WhatsApp?',
            acceptedAnswer: { '@type': 'Answer', text: 'Yes. You can order via checkout or use WhatsApp support for assisted ordering.' },
          },
        ],
      },
      {
        '@type': 'AboutPage',
        name: 'About Lifetime Technology Store',
        description: 'Nairobi-based electronics and jewelry store focused on quality products and guided support.',
        url: `${SEO_BASE_URL}/about`,
      },
      {
        '@type': 'Blog',
        name: 'Lifetime Tech Buyer Guides',
        description: 'Short buying and care guides for smartphones, laptops, gaming, and jewelry in Kenya.',
        url: `${SEO_BASE_URL}/blog`,
      },
    ],
  };
}

function updateDynamicSeo(context) {
  if (!context) return;
  setRobotsMeta(context.noindex ? 'noindex,follow,max-image-preview:large' : 'index,follow,max-image-preview:large');
  setSeoTitle(context.title);
  updateHeadMeta('seoDescription', context.description);
  updateHeadMeta('seoKeywords', context.keywords);
  updateHeadMeta('seoOgTitle', context.title);
  updateHeadMeta('seoOgDescription', context.description);
  updateHeadMeta('seoOgUrl', context.canonical);
  updateHeadMeta('seoOgImage', context.image || SEO_DEFAULT_IMAGE);
  updateHeadMeta('seoOgImageAlt', context.imageAlt || context.heading || SEO_SITE_NAME);
  updateHeadMeta('seoTwitterTitle', context.title);
  updateHeadMeta('seoTwitterDescription', context.description);
  updateHeadMeta('seoTwitterImage', context.image || SEO_DEFAULT_IMAGE);
  updateLinkHref('seoCanonical', context.canonical);

  const schemaEl = document.getElementById('dynamic-seo-schema');
  if (schemaEl) schemaEl.textContent = JSON.stringify(buildDynamicSchema(context));
}

function updateSeoForCurrentView() {
  const page = currentPage || 'explore';
  if (page === 'detail' && currentProduct) {
    const productSlug = String(currentProduct.slug || currentProduct.id || '').trim();
    const canonical = buildCanonical({ category: currentProduct.category, product: productSlug });
    const title = `${currentProduct.name} | ${SEO_SITE_NAME}`;
    const description = currentProduct.description
      ? `${currentProduct.description} Price: KES ${Number(currentProduct.price || 0).toLocaleString()}.`
      : `${currentProduct.name} by ${currentProduct.brand}. Shop now at ${SEO_SITE_NAME}.`;
    updateDynamicSeo({
      type: 'product',
      title,
      heading: currentProduct.name,
      description,
      keywords: `${currentProduct.name}, ${currentProduct.brand}, ${categoryDisplayName(currentProduct.category)}, Kenya`,
      canonical,
      image: Array.isArray(currentProduct.images) && currentProduct.images.length ? currentProduct.images[0] : SEO_DEFAULT_IMAGE,
      imageAlt: currentProduct.name,
      product: currentProduct,
    });
    return;
  }

  if (page === 'checkout') {
    const canonical = buildCanonical({ category: getCurrentSeoCategory() });
    updateDynamicSeo({
      type: 'collection',
      title: `Secure Checkout | ${SEO_SITE_NAME}`,
      heading: 'Checkout',
      description: 'Complete your order with secure payment and fast delivery options in Kenya.',
      keywords: 'checkout Kenya, secure payment Kenya, electronics checkout',
      canonical,
      image: SEO_DEFAULT_IMAGE,
      imageAlt: 'Secure checkout',
      noindex: true,
    });
    return;
  }

  if (likedViewActive) {
    const canonical = buildCanonical({ category: getCurrentSeoCategory() });
    updateDynamicSeo({
      type: 'collection',
      title: `Liked Products | ${SEO_SITE_NAME}`,
      heading: 'Liked Products',
      description: 'Review your liked products and continue shopping from your saved picks.',
      keywords: 'liked products, wishlist products, favorites',
      canonical,
      image: SEO_DEFAULT_IMAGE,
      imageAlt: 'Liked products',
      noindex: true,
    });
    return;
  }

  const cat = getCurrentSeoCategory();
  const catSeo = getCategorySeoPayload(cat);
  const cleanSearch = sanitizeSearchQuery(activeSearchQuery || '');
  const canonical = buildCanonical({ category: cat, query: cleanSearch });
  if (cleanSearch) {
    updateDynamicSeo({
      type: 'collection',
      title: `"${cleanSearch}" Results | ${SEO_SITE_NAME}`,
      heading: `Search: ${cleanSearch}`,
      description: `Search results for "${cleanSearch}" in ${categoryTitle(cat)}. Compare products, prices and features quickly.`,
      keywords: `${cleanSearch}, product search Kenya, ${catSeo.keywords}`,
      canonical,
      image: SEO_DEFAULT_IMAGE,
      imageAlt: `Search results for ${cleanSearch}`,
      noindex: true,
    });
    return;
  }

  updateDynamicSeo({
    type: 'collection',
    title: `${catSeo.title} | ${SEO_SITE_NAME}`,
    heading: categoryTitle(cat),
    description: catSeo.description,
    keywords: `${catSeo.keywords}, ${SEO_SITE_NAME}`,
    canonical,
    image: SEO_DEFAULT_IMAGE,
    imageAlt: categoryTitle(cat),
  });
}

function syncCategoryInUrl(cat) {
  if (!window.history || typeof window.history.replaceState !== 'function') return;
  const normalized = normalizeCategoryValue(cat) || 'all';
  const publicCategory = toPublicCategorySlug(normalized);
  const url = new URL(window.location.href);
  if (normalized === 'all') url.searchParams.delete('category');
  else url.searchParams.set('category', publicCategory);
  url.searchParams.delete('product');
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

function setStorefrontMode(mode, opts = {}) {
  const preserveCategory = opts.preserveCategory !== false;
  storefrontMode = mode === 'jewerlys' ? 'jewerlys' : 'electronics';
  const tgElectronics = document.getElementById('tgElectronics');
  const tgJewerlys = document.getElementById('tgJewelry') || document.getElementById('tgJewerlys');
  if (tgElectronics) tgElectronics.classList.toggle('active', storefrontMode === 'electronics');
  if (tgJewerlys) tgJewerlys.classList.toggle('active', storefrontMode === 'jewerlys');
  renderImageMarquee(storefrontMode);
  if (!preserveCategory) return;
  if (storefrontMode === 'jewerlys' && !isJewelryCategory(currentCat)) currentCat = 'jewerlys';
  if (storefrontMode === 'electronics' && isJewelryCategory(currentCat)) currentCat = 'all';
}

function renderCategoryChips() {
  const wrap = document.getElementById('catChips');
  if (!wrap) return;
  const mode = storefrontMode === 'jewerlys' ? 'jewerlys' : 'electronics';
  const cats = getAvailableCategories(mode);
  const primaryCat = mode === 'jewerlys' ? 'jewerlys' : 'all';
  const primaryLabel = mode === 'jewerlys' ? 'All Jewelry' : 'All';
  const allChip = `
    <a class="cat-chip ${currentCat === primaryCat ? 'active' : ''}" href="/?category=${encodeURIComponent(primaryCat)}" onclick="event.preventDefault(); setCat('${primaryCat}')" data-f="${primaryCat}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
      ${primaryLabel}
    </a>`;
  const chips = cats
    .filter((cat) => cat !== primaryCat)
    .map((cat) => `<a class="cat-chip ${currentCat === cat ? 'active' : ''}" href="/?category=${encodeURIComponent(cat)}" onclick="event.preventDefault(); setCat('${cat}')" data-f="${cat}">${categoryDisplayName(cat)}</a>`)
    .join('');
  wrap.innerHTML = allChip + chips;
  requestAnimationFrame(ensureActiveChipVisible);
}

// ============================================================
// SUPABASE — Load Products
// ============================================================
function productSkeletonMarkup(count = 8) {
  const total = Math.max(4, Math.min(12, Number(count) || 8));
  return Array.from({ length: total }, () => `
    <div class="p-card p-card-skeleton" aria-hidden="true">
      <div class="p-card-img">
        <div class="sk sk-media"></div>
        <div class="p-card-body">
          <div class="sk sk-line sk-brand"></div>
          <div class="sk sk-line sk-name"></div>
          <div class="sk sk-line sk-tag"></div>
          <div class="p-card-footer">
            <div class="sk sk-line sk-price"></div>
            <div class="sk sk-btn"></div>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function renderProductSkeletonCards(count = 8) {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  grid.innerHTML = productSkeletonMarkup(count);
}

async function loadProducts() {
  renderProductSkeletonCards(8);
  if (!canUseSupabase()) {
    products = FALLBACK_PRODUCTS;
    dbOnline = false;
    const hasConfigIssue = !!(CFG.ENABLE_SUPABASE && sbConfigIssue);
    const statusLabel = CFG.ENABLE_SUPABASE ? (hasConfigIssue ? 'Config Issue' : 'Offline / Demo') : 'Demo Mode';
    setDbStatus(statusLabel, hasConfigIssue ? 'var(--red)' : 'var(--amber)');
    updateTopbarStats();
    renderCategoryChips();
    if (!getAllowedFilterCategories().includes(currentCat)) currentCat = storefrontMode === 'jewerlys' ? 'jewerlys' : 'all';
    setCat(currentCat, { closeSidebar: false, preserveSearch: true });
    return;
  }
  setDbStatus('Syncing...', 'var(--primary)');
  try {
    const data = await fetchProductsFromSupabase();
    if (data && data.length > 0) {
      products = data;
      dbOnline = true;
      setDbStatus('Connected', 'var(--green)');
    } else {
      products = FALLBACK_PRODUCTS;
      dbOnline = false;
      toastOnce('demo-products', 'inf', 'Using Demo Products', 'Run supabase-schema.sql to seed your database');
      setDbStatus('Connected (No Data)', 'var(--amber)');
    }
  } catch(e) {
    console.warn('Supabase error:', e.message);
    products = FALLBACK_PRODUCTS;
    dbOnline = false;
    if (isSchemaProblemError(e)) {
      setDbStatus('Offline / Demo', 'var(--amber)');
      toastOnce('supabase-schema-fallback', 'inf', 'Using Demo Mode', 'Supabase schema is not ready yet, so local/demo data is active.');
    } else {
      setDbStatus('Offline / Demo', 'var(--amber)');
    }
  }
  updateTopbarStats();
  renderCategoryChips();
  if (!getAllowedFilterCategories().includes(currentCat)) currentCat = storefrontMode === 'jewerlys' ? 'jewerlys' : 'all';
  setCat(currentCat, { closeSidebar: false, preserveSearch: true });
}

async function loadAdminOrders() {
  const tbody = document.getElementById('ordersTableBody');
  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;"><div class="loader" style="padding:0;"><div class="spinner"></div> Loading...</div></td></tr>`;
  if (!canUseSupabase()) {
    orders = JSON.parse(localStorage.getItem('ltl2_orders') || '[]');
    renderOrdersTable();
    return;
  }
  try {
    orders = await fetchOrdersFromSupabase();
    dbOnline = true;
    setDbStatus('Connected', 'var(--green)');
    renderOrdersTable();
    updateTopbarStats();
  } catch(e) {
    console.warn('Supabase orders load failed:', e.message);
    dbOnline = false;
    setDbStatus('Offline / Demo', 'var(--amber)');
    orders = JSON.parse(localStorage.getItem('ltl2_orders') || '[]');
    renderOrdersTable();
    if (isSchemaProblemError(e)) toastOnce('supabase-schema-fallback-orders', 'inf', 'Using Local Orders', 'Supabase schema is not ready yet, so local orders are shown.');
    else toastOnce('local-orders-fallback', 'inf', 'Using Local Orders', 'Supabase orders table may not exist yet');
  }
}

// ============================================================
// PRODUCT RENDERING
// ============================================================
function filterProducts(cat) {
  if (cat === 'all') {
    return products.filter((p) => p.active !== false && !isJewelryCategory(p.category));
  }
  if (cat === 'jewerlys') {
    return products.filter((p) => p.active !== false && isJewelryCategory(p.category));
  }
  return products.filter((p) => normalizeCategoryValue(p.category) === cat && p.active !== false);
}

function handleProductCardKeydown(event, productId) {
  if (!event) return;
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    openProduct(productId);
  }
}

function renderProducts(list) {
  const grid = document.getElementById('productsGrid');
  displayedProducts = Array.isArray(list) ? [...list] : [];
  if (!list || !list.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">${catIcon('accessories')}<h3>No products found</h3><p>Try a different category or check back soon</p></div>`;
    return;
  }
  grid.innerHTML = list.map(p => {
    const disc = p.original_price ? Math.round((1 - p.price/p.original_price)*100) : 0;
    const safeId = escapeJsSingleQuote(String(p.id || ''));
    const safeName = escapeHtml(p.name);
    const safeBrand = escapeHtml(p.brand);
    const safeTagline = escapeHtml(String(p.tagline || '').trim());
    const safeCatLabel = escapeHtml(cardCategoryLabel(p.category));
    const badgeClass = safeBadgeClass(p.badge);
    const safeBadge = escapeHtml(p.badge || '');
    const inWish = wishlist.includes(String(p.id));
    const img = p.images && p.images.length ? `<img src="${escapeHtml(p.images[0])}" alt="${safeName}" loading="lazy" onerror="this.style.display='none'"/>` : '';
    return `<div class="p-card p-card-wide" role="button" tabindex="0" aria-label="Open ${safeName} details" onclick="openProduct('${safeId}')" onkeydown="handleProductCardKeydown(event,'${safeId}')">
      <div class="p-card-img">
        ${img}
        <div class="p-card-gradient"></div>
        ${safeBadge ? `<div class="p-badge ${badgeClass}">${safeBadge}</div>` : ''}
        <div class="wish-btn ${inWish?'active':''}" onclick="event.stopPropagation();toggleWishlist('${safeId}')">
          <svg viewBox="0 0 24 24" fill="${inWish?'currentColor':'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:${inWish?'var(--red)':'var(--text3)'}"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </div>
        <div class="p-card-body">
          <div class="p-card-brand">${safeBrand}</div>
          <div class="p-card-name">${safeName}</div>
          ${safeTagline ? `<div class="p-card-tagline">${safeTagline}</div>` : ''}
          <div class="p-card-meta">
            <span>${safeCatLabel}</span>
          </div>
          <div class="p-card-footer">
            <div>
            <span class="p-card-price">KES ${Number(p.price).toLocaleString()}</span>
            ${p.original_price ? `<span class="p-card-price-orig">KES ${Number(p.original_price).toLocaleString()}</span>` : ''}
            ${disc > 0 ? `<span class="p-card-disc">-${disc}%</span>` : ''}
            </div>
            <div class="p-card-add" onclick="event.stopPropagation();quickAdd('${safeId}')">
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
  const preserveSearch = opts.preserveSearch === true;
  currentPage = 'explore';
  likedViewActive = false;
  if (!preserveSearch) {
    activeSearchQuery = '';
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    syncSearchInUrl('');
  }
  currentCat = normalizeCategoryValue(cat) || (storefrontMode === 'jewerlys' ? 'jewerlys' : 'all');
  const nextMode = isJewelryCategory(currentCat) ? 'jewerlys' : 'electronics';
  if (nextMode !== storefrontMode) {
    setStorefrontMode(nextMode, { preserveCategory: false });
    renderCategoryChips();
  }
  if (!getAllowedFilterCategories().includes(currentCat)) currentCat = storefrontMode === 'jewerlys' ? 'jewerlys' : 'all';
  if (storefrontMode === 'jewerlys' && !isJewelryCategory(currentCat)) currentCat = 'jewerlys';
  if (storefrontMode === 'electronics' && isJewelryCategory(currentCat)) currentCat = 'all';
  let filteredProducts = filterProducts(currentCat);
  if (!filteredProducts.length && !activeSearchQuery) {
    const fallbackCat = storefrontMode === 'jewerlys' ? 'jewerlys' : 'all';
    if (currentCat !== fallbackCat) {
      const fallbackProducts = filterProducts(fallbackCat);
      if (fallbackProducts.length) {
        currentCat = fallbackCat;
        filteredProducts = fallbackProducts;
      }
    }
  }
  document.querySelectorAll('.cat-chip').forEach(c => c.classList.toggle('active', c.dataset.f === currentCat));
  document.querySelectorAll('.nav-item[data-cat]').forEach(n => n.classList.toggle('active', n.dataset.cat === currentCat));
  setStorefrontMode(storefrontMode, { preserveCategory: false });
  const explore = document.querySelector('.nav-item[data-pg="explore"]');
  if (currentCat === 'all') { explore.classList.add('active'); }
  else { explore.classList.remove('active'); }
  document.getElementById('productsTitle').textContent = categoryTitle(currentCat);
  renderProducts(filteredProducts);
  if (syncUrl) syncCategoryInUrl(currentCat);
  requestAnimationFrame(ensureActiveChipVisible);
  updateSeoForCurrentView();
  if (closeSidebar) closeMobileSidebar();
}

function doSearch(q) {
  const searchEl = document.getElementById('searchInput');
  const isUserSearchFocus = document.activeElement === searchEl;
  if (currentPage !== 'explore' && !isUserSearchFocus) return;
  const query = sanitizeSearchQuery(q || '').toLowerCase();
  if (currentPage !== 'explore') navigate('explore');
  currentPage = 'explore';
  likedViewActive = false;
  activeSearchQuery = query;
  if (!query) {
    document.getElementById('productsTitle').textContent = categoryTitle(currentCat);
    renderProducts(filterProducts(currentCat));
    syncSearchInUrl('');
    updateSeoForCurrentView();
    return;
  }
  const normalizedCurrentCat = normalizeCategoryValue(currentCat);
  const results = products.filter((p) => {
    if (p.active === false) return false;
    if (storefrontMode === 'jewerlys' && !isJewelryCategory(p.category)) return false;
    if (storefrontMode === 'electronics' && isJewelryCategory(p.category)) return false;
    if (normalizedCurrentCat === 'jewerlys' && !isJewelryCategory(p.category)) return false;
    if (normalizedCurrentCat !== 'all' && normalizedCurrentCat !== 'jewerlys' && normalizeCategoryValue(p.category) !== normalizedCurrentCat) return false;
    const specsText = p.specs && typeof p.specs === 'object' ? Object.values(p.specs).join(' ') : '';
    const highlightsText = Array.isArray(p.highlights) ? p.highlights.join(' ') : '';
    const haystack = [
      p.name,
      p.brand,
      p.category,
      p.tagline || '',
      p.sku || '',
      specsText,
      highlightsText,
    ].join(' ').toLowerCase();
    return haystack.includes(query);
  });
  document.getElementById('productsTitle').textContent = `Search Results (${results.length})`;
  renderProducts(results);
  syncSearchInUrl(query);
  updateSeoForCurrentView();
}

// ============================================================
// PRODUCT DETAIL
// ============================================================
function openProduct(id) {
  currentProduct = products.find(p => String(p.id) === String(id));
  if (!currentProduct) return;
  likedViewActive = false;
  const variantEntries = variantEntriesFromProduct(currentProduct);
  selectedVariant = variantEntries.length ? variantEntries[0].label : null;
  detailQty = 1;
  navigate('detail');
  renderDetailGallery(currentProduct);
  renderDetailInfo(currentProduct);
  syncProductInUrl(String(currentProduct.slug || currentProduct.id || ''));
  updateSeoForCurrentView();
}

function renderDetailGallery(p) {
  const imgs = p.images && p.images.length ? p.images : null;
  const safeName = escapeHtml(p.name);
  document.getElementById('detailGallery').innerHTML = `
    <div class="gallery-main-wrap" id="gallMainWrap">
      ${imgs ? `<img src="${escapeHtml(imgs[0])}" alt="${safeName}" id="galMainImg" style="width:100%;height:100%;object-fit:cover"/>` : `<div class="big-placeholder">${catIcon(p.category)}</div>`}
    </div>
    <div class="gallery-thumbs">
      ${[1,2,3,4].map((_,i) => `
        <div class="g-thumb ${i===0?'active':''}" onclick="switchThumb(${i},this)">
          ${imgs && imgs[i] ? `<img src="${escapeHtml(imgs[i])}" alt="${safeName} thumbnail"/>` : catIcon(p.category)}
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
  const safeBrand = escapeHtml(p.brand);
  const safeCategory = escapeHtml(String(p.category || '').toUpperCase());
  const safeName = escapeHtml(p.name);
  const safeTagline = escapeHtml(p.tagline || '');
  const stock = p.stock;
  const stockCls = stock === 0 ? 'out' : stock < 5 ? 'low' : 'in';
  const stockTxt = stock === 0 ? 'Out of Stock' : stock < 5 ? `Only ${stock} left` : 'In Stock';
  const specs = p.specs || {};
  const highlights = Array.isArray(p.highlights) ? p.highlights.filter(Boolean) : [];
  const descWithHighlights = `${escapeHtml(p.description || `Premium product by ${p.brand}`)}${
    highlights.length
      ? `<ul class="d-highlights">${highlights.slice(0, 4).map((h) => `<li>${escapeHtml(h)}</li>`).join('')}</ul>`
      : ''
  }`;
  const variantEntries = variantEntriesFromProduct(p);
  const variantsHTML = variantEntries.length ? `
    <div class="d-label">Variant / Colour</div>
    <div class="d-variants" id="variantRow">
      ${variantEntries.map((entry) => `
        <button class="v-btn ${entry.label===selectedVariant?'active':''} ${entry.color ? 'has-color' : ''}" onclick="selectVariant('${escapeJsSingleQuote(entry.label)}',this)" ${entry.color ? `style="--v-color:${entry.color}"` : ''}>
          ${entry.color ? '<span class="v-swatch" aria-hidden="true"></span>' : ''}
          ${escapeHtml(entry.label)}
        </button>
      `).join('')}
    </div>` : '';
  document.getElementById('detailInfo').innerHTML = `
    <div class="d-brand">${safeBrand} · ${safeCategory}</div>
    <div class="d-name">${safeName}</div>
    ${safeTagline ? `<div class="d-tagline">${safeTagline}</div>` : ''}
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
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 7H7"/></svg>
        Add to Cart
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
    <div id="dTabDesc" class="d-tab-content">${descWithHighlights}</div>
    <div id="dTabSpecs" style="display:none;">
      ${Object.keys(specs).length ? `<div class="specs-table">${Object.entries(specs).map(([k,v])=>`<div class="spec-row"><div class="spec-key">${escapeHtml(k)}</div><div class="spec-val">${escapeHtml(v)}</div></div>`).join('')}</div>` : '<p style="color:var(--text3)">Specs not available.</p>'}
    </div>
    <div id="dTabDelivery" style="display:none;">
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:16px;font-size:13px;color:var(--text2);line-height:1.7;">
        <strong style="color:var(--primary)">Delivery Across Kenya</strong><br/>
        Nairobi CBD/Westlands: KES 150 · Same day<br/>
        Greater Nairobi: KES 200 · 1–2 days<br/>
        Major towns (Mombasa, Kisumu, Nakuru): KES 500–620 · 2–4 days<br/>
        Rest of Kenya: KES 420–750 · 2–5 days
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
function cartKey(id, variant) {
  const variantLabel = getVariantLabel(variant);
  return id + '::' + (variantLabel || 'default');
}
function cartTotal() { return cart.reduce((s,i) => s + i.price * i.qty, 0); }
function cartCount() { return cart.reduce((s,i) => s + i.qty, 0); }

function addToCart(product, qty, variant) {
  const variantLabel = getVariantLabel(variant) || null;
  const key = cartKey(product.id, variantLabel);
  const ex = cart.find(i => i.key === key);
  if (ex) { ex.qty = Math.min(product.stock||99, ex.qty + qty); }
  else { cart.push({ key, productId:product.id, name:product.name, brand:product.brand, price:Number(product.price), variant:variantLabel, qty, image:product.images?.[0]||null, category:product.category }); }
  localStorage.setItem('ltl2_cart', JSON.stringify(cart));
  updateCartUI();
  toast('ok', 'Added to Cart', `${product.name}${variantLabel?' · '+variantLabel:''}`);
}

function quickAdd(id) {
  const p = products.find(x => String(x.id) === String(id));
  if (!p) return;
  const firstVariant = variantEntriesFromProduct(p)[0]?.label || null;
  addToCart(p, 1, firstVariant);
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

function removeFromCheckout(key) {
  removeFromCart(key);
  if (!cart.length) {
    toast('inf', 'Cart Updated', 'Your cart is now empty.');
    navigate('explore');
    return;
  }
  renderCkStep();
  renderCkSummary();
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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 7H7"/></svg>
      <h4>Your cart is empty</h4>
      <p>Add products to your cart to view pricing and checkout details.</p>
      <button class="btn-cta outline" style="width:auto;padding:10px 16px;" onclick="closeCart();navigate('explore')">Explore Products</button>
    </div>`;
    footer.innerHTML = '';
    return;
  }
  wrap.innerHTML = cart.map(item => {
    const safeKey = escapeJsSingleQuote(item.key);
    const safeName = escapeHtml(item.name);
    const safeImage = escapeHtml(item.image || '');
    const safeVariant = escapeHtml(getVariantLabel(item.variant));
    const safeBrand = escapeHtml(item.brand);
    return `
    <div class="cd-item">
      <div class="cd-item-img">
        ${item.image ? `<img src="${safeImage}" alt="${safeName}" onerror="this.style.display='none'"/>` : catIcon(item.category)}
      </div>
      <div class="cd-item-info">
        <div class="cd-item-name">${safeName}</div>
        <div class="cd-item-variant">${safeBrand}${safeVariant?' · '+safeVariant:''}</div>
        <div class="cd-qty-row">
          <div class="cq-btn" onclick="updateCartItemQty('${safeKey}',-1)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:11px;height:11px"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
          <div class="cq-val">${item.qty}</div>
          <div class="cq-btn" onclick="updateCartItemQty('${safeKey}',1)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:11px;height:11px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
        </div>
        <div class="cd-item-meta">
          <span>Unit: KES ${Number(item.price).toLocaleString()}</span>
          <span class="cd-line-total">Line: KES ${(item.price * item.qty).toLocaleString()}</span>
        </div>
      </div>
      <div class="cd-item-right">
        <span class="cd-item-price">KES ${(item.price*item.qty).toLocaleString()}</span>
        <div class="cd-remove" onclick="removeFromCart('${safeKey}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </div>
      </div>
    </div>`;
  }).join('');
  const subtotal = cartTotal();
  const deliveryText = 'Calculated at checkout';
  footer.innerHTML = `
    <div class="cd-summary-card">
      <div class="cd-total-row"><span>Subtotal (${cartCount()} items)</span><span>KES ${subtotal.toLocaleString()}</span></div>
      <div class="cd-total-row"><span>Delivery</span><span>${deliveryText}</span></div>
      <div class="cd-total-row grand"><span>Estimated Total</span><span class="g-amount">KES ${subtotal.toLocaleString()}</span></div>
    </div>
    <button class="btn-cta blue cd-checkout-btn" onclick="closeCart();goCheckout()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
      Proceed to Checkout
    </button>
    <button class="btn-cta outline cd-continue-btn" onclick="closeCart();navigate('explore')">Continue Shopping</button>`;
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
// CHECKOUT — TIMELINE (4 steps)
// ============================================================
function goCheckout() {
  if (!cart.length) { toast('err','Cart is empty','Add items first'); return; }
  ckStep = 1; ckData = {}; deliveryFee = 0;
  navigate('checkout');
  renderCkTimeline();
  renderCkStep();
  renderCkSummary();
}

function renderCkTimeline() {
  const labels = ['Cart','Your Details','Payment','Done'];
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
    // Step 1: Review cart + Delivery zone
    const zoneOpts = Object.entries(DELIVERY_ZONES.reduce((acc,z) => { if(!acc[z.region])acc[z.region]=[]; acc[z.region].push(z); return acc; },{}))
      .map(([r,zones]) => `<optgroup label="${r}">${zones.map(z=>`<option value="${z.area}|${z.fee}|${z.days}">${z.area} — KES ${z.fee} (${z.days})</option>`).join('')}</optgroup>`).join('');
    area.innerHTML = `<div class="ck-main">
      <h3>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 7H7"/></svg>
        Review Your Cart
      </h3>
      ${cart.map(item => {
        const safeKey = escapeJsSingleQuote(item.key);
        const safeName = escapeHtml(item.name);
        const safeBrand = escapeHtml(item.brand);
        const safeVariant = escapeHtml(getVariantLabel(item.variant));
        const safeImage = escapeHtml(item.image || '');
        return `
        <div class="cd-item" style="padding:12px 0;">
          <div class="cd-item-img">${item.image?`<img src="${safeImage}" alt="${safeName}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'"/>`:catIcon(item.category)}</div>
          <div class="cd-item-info">
            <div class="cd-item-name">${safeName}</div>
            <div class="cd-item-variant">${safeBrand}${safeVariant?' · '+safeVariant:''} · Qty ${item.qty}</div>
          </div>
          <div class="ck-review-item-actions">
            <div class="cd-item-price" style="font-family:var(--font-m);font-size:13px;font-weight:700;">KES ${(item.price*item.qty).toLocaleString()}</div>
            <button type="button" class="ck-remove-btn" onclick="removeFromCheckout('${safeKey}')">Delete</button>
          </div>
        </div>`;
      }).join('')}
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
        <div class="form-group"><label class="form-label">Full Name</label><input class="form-input" id="ck2Name" name="name" autocomplete="name" value="${escapeHtml(ckData.name||'')}" placeholder="John Doe"/></div>
        <div class="form-group"><label class="form-label">Email <span class="req">*</span></label><input type="email" class="form-input" id="ck2Email" name="email" autocomplete="email" value="${escapeHtml(ckData.email||'')}" placeholder="john@email.com" required/></div>
        <div class="form-group"><label class="form-label">Phone (M-Pesa / WhatsApp)</label><input type="tel" class="form-input" id="ck2Phone" name="tel" autocomplete="tel" value="${escapeHtml(ckData.phone||'')}" placeholder="0700 000 000"/></div>
        <div class="form-group"><label class="form-label">Delivery Area</label><input class="form-input" value="${escapeHtml(ckData.deliveryZone ? ckData.deliveryZone.split('|')[0] : '')}" readonly style="background:var(--bg);"/></div>
      </div>
      <div class="form-group"><label class="form-label">Street Address / Building / Landmark</label><input class="form-input" id="ck2Address" name="street-address" autocomplete="street-address" value="${escapeHtml(ckData.address||'')}" placeholder="e.g. Nextgen Mall, 3rd Floor"/></div>
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
          <div class="pay-info"><h4>Card / M-Pesa (Paystack)</h4><p>Secure instant payment · Get email invoice</p></div>
        </div>
        <div class="pay-option wa-opt" id="pm-whatsapp" onclick="selectPayMethod('whatsapp')">
          <div class="pay-radio"></div>
          <div class="pay-icon">
            <svg viewBox="0 0 24 24" fill="#22C55E"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
          </div>
          <div class="pay-info"><h4>WhatsApp Order</h4><p>Pay on delivery or via M-Pesa · Our team calls you</p></div>
        </div>
      </div>
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:14px;margin-bottom:18px;font-size:12.5px;color:var(--text3);">
        <strong style="color:var(--text2);">Order for:</strong> ${escapeHtml(ckData.name||ckData.email)}<br/>
        <strong style="color:var(--text2);">Deliver to:</strong> ${escapeHtml(ckData.deliveryZone ? ckData.deliveryZone.split('|')[0] : 'N/A')} · ${escapeHtml(deliveryDays)}
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
  const supportLabel = escapeHtml(ckData.deliveryZone ? ckData.deliveryZone.split('|')[0] : 'your delivery area');
  const safeDeliveryArea = escapeHtml(ckData.deliveryZone ? ckData.deliveryZone.split('|')[0] : '');
  document.getElementById('ckSummaryBox').innerHTML = `
    <h4>Order Summary</h4>
    ${cart.map(i=>{
      const safeName = escapeHtml(i.name);
      const safeBrand = escapeHtml(i.brand);
      const safeVariant = escapeHtml(getVariantLabel(i.variant));
      const safeImage = escapeHtml(i.image || '');
      return `
      <div class="ck-item">
        <div class="ck-item-img">${i.image?`<img src="${safeImage}" alt="${safeName}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'"/>`:catIcon(i.category)}</div>
        <div class="ck-item-info"><div class="ck-item-name">${safeName}</div><div class="ck-item-meta">${safeBrand}${safeVariant?' · '+safeVariant:''} × ${i.qty}</div></div>
        <div class="ck-item-price">KES ${(i.price*i.qty).toLocaleString()}</div>
      </div>`;
    }).join('')}
    <div class="ck-totals">
      <div class="ck-tot-row"><span>Subtotal</span><span>KES ${cartTotal().toLocaleString()}</span></div>
      <div class="ck-tot-row"><span>Delivery${ckData.deliveryZone?' ('+safeDeliveryArea+')':''}</span><span>${deliveryFee > 0 ? 'KES '+deliveryFee.toLocaleString() : '—'}</span></div>
      <div class="ck-tot-row grand"><span>Total</span><span class="ck-amount">KES ${total.toLocaleString()}</span></div>
    </div>
    <div class="ck-help-box">
      <h5>Need help at checkout?</h5>
      <p>Chat with us for delivery, payment, or product help for ${supportLabel}.</p>
      <button type="button" class="btn-cta green ck-help-btn" onclick="checkoutHelp()">
        <svg viewBox="0 0 24 24" fill="white" style="width:16px;height:16px"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
        Checkout Help
      </button>
    </div>`;
}

function checkoutHelpMessage() {
  const stepLabel = ['Cart', 'Your Details', 'Payment', 'Done'][Math.max(0, Math.min(3, ckStep - 1))];
  const area = ckData.deliveryZone ? ckData.deliveryZone.split('|')[0] : 'Not selected yet';
  const total = (cartTotal() + deliveryFee).toLocaleString();
  const topItems = cart.slice(0, 4).map((item) => `${item.name} x${item.qty}`).join(', ') || 'No items yet';
  return encodeURIComponent(`Hi, I need help with checkout. Step: ${stepLabel}. Delivery area: ${area}. Total so far: KES ${total}. Items: ${topItems}.`);
}

function checkoutHelp() {
  window.open(getWhatsAppLink(checkoutHelpMessage()), '_blank');
}

function updateDeliveryFee(val) {
  const info = document.getElementById('ck1FeeInfo');
  const txt = document.getElementById('ck1FeeText');
  if (!val) { deliveryFee = 0; if(info) info.style.display='none'; renderCkSummary(); return; }
  const parts = val.split('|');
  deliveryFee = parseInt(parts[1]);
  deliveryDays = parts[2] || '';
  ckData.deliveryZone = val;
  if (info) { info.style.display='flex'; txt.textContent = `Delivery to ${parts[0]}: KES ${parseInt(parts[1]).toLocaleString()} · ${parts[2]}`; }
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

function isValidCheckoutEmail(email) {
  return CHECKOUT_EMAIL_RE.test(String(email || '').trim());
}

function toPaystackAmount(totalKes) {
  const normalized = Number(totalKes);
  if (!Number.isFinite(normalized)) return 0;
  const amount = Math.round(normalized * 100);
  return amount > 0 ? amount : 0;
}

function isLocalRuntime() {
  const host = String(window.location.hostname || '').toLowerCase();
  return host === 'localhost' || host === '127.0.0.1';
}

async function verifyPaystackTransaction(reference, total) {
  const expectedAmount = toPaystackAmount(total);
  const payload = {
    reference: String(reference || '').trim(),
    expectedAmount,
    expectedCurrency: 'KES',
  };

  const response = await fetch('/api/paystack-verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result?.ok || !result?.verified) {
    throw new Error(String(result?.error || 'Paystack verification failed.'));
  }
  return result;
}

function buildInvoiceRecord(orderNum, method, total, reference) {
  const suffix = Date.now().toString(36).toUpperCase().slice(-4);
  const orderCode = String(orderNum || '').replace(/[^A-Z0-9]/gi, '').slice(-8).toUpperCase();
  const invoiceNumber = `INV-${orderCode || 'LTL'}-${suffix}`;
  return {
    invoice_number: invoiceNumber,
    order_number: orderNum,
    payment_reference: reference || null,
    payment_method: method,
    payment_status: String(method || '').toLowerCase() === 'paystack' ? 'paid' : 'pending',
    customer_email: ckData.email || '',
    customer_name: ckData.name || '',
    total: Number(total || 0),
    currency: 'KES',
    issued_at: new Date().toISOString(),
    items: cart.map((item) => ({
      name: item.name,
      brand: item.brand,
      variant: getVariantLabel(item.variant),
      qty: item.qty,
      price: Number(item.price || 0),
      line_total: Number(item.price || 0) * Number(item.qty || 0),
    })),
  };
}

function saveInvoiceRecord(invoice) {
  if (!invoice || typeof invoice !== 'object') return;
  const current = JSON.parse(localStorage.getItem('ltl2_invoices') || '[]');
  current.unshift(invoice);
  localStorage.setItem('ltl2_invoices', JSON.stringify(current.slice(0, 200)));
}

function downloadInvoice(orderNum) {
  const source = JSON.parse(localStorage.getItem('ltl2_invoices') || '[]');
  const invoice = source.find((entry) => String(entry.order_number) === String(orderNum));
  if (!invoice) {
    toast('inf', 'Invoice Pending', 'Invoice will be available after payment is confirmed.');
    return;
  }
  const rows = Array.isArray(invoice.items) ? invoice.items : [];
  const lines = rows.map((item, idx) => `${idx + 1}. ${item.name}${item.variant ? ` (${item.variant})` : ''} x${item.qty} - KES ${Number(item.line_total || 0).toLocaleString()}`);
  const text = [
    `Lifetime Technology Store Invoice`,
    `Invoice No: ${invoice.invoice_number}`,
    `Order No: ${invoice.order_number}`,
    `Issued: ${new Date(invoice.issued_at).toLocaleString()}`,
    `Customer: ${invoice.customer_name || 'N/A'}`,
    `Email: ${invoice.customer_email || 'N/A'}`,
    `Method: ${invoice.payment_method}`,
    `Status: ${invoice.payment_status}`,
    ``,
    `Items:`,
    ...lines,
    ``,
    `Total: KES ${Number(invoice.total || 0).toLocaleString()}`,
    `Thank you for shopping with Lifetime Technology Store.`,
  ].join('\n');
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${invoice.invoice_number}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}

function startPaystackCheckout(orderNum, total, onSuccess, onCancel, onError) {
  const cleanEmail = String(ckData.email || '').trim().toLowerCase();
  const cleanName = String(ckData.name || '').trim();
  const nameParts = cleanName.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  const amount = toPaystackAmount(total);
  if (!amount) throw new Error('Invalid checkout amount');

  const metadata = {
    custom_fields: [
      { display_name: 'Customer', variable_name: 'customer', value: cleanName || cleanEmail },
      { display_name: 'Order', variable_name: 'order', value: orderNum },
      { display_name: 'Store', variable_name: 'store', value: 'lifetimetechnology.store' },
    ],
  };

  if (hasPaystackV2()) {
    const popup = new window.Paystack();
    popup.newTransaction({
      key: CFG.PAYSTACK_PK,
      email: cleanEmail,
      amount,
      currency: 'KES',
      reference: orderNum,
      firstName,
      lastName,
      metadata,
      onSuccess: (transaction) => onSuccess(String(transaction?.reference || orderNum)),
      onCancel: () => onCancel(),
      onError: (error) => onError(error),
    });
    return;
  }

  if (hasPaystackV1()) {
    const handler = window.PaystackPop.setup({
      key: CFG.PAYSTACK_PK,
      email: cleanEmail,
      amount,
      currency: 'KES',
      ref: orderNum,
      metadata,
      callback: (response) => onSuccess(String(response?.reference || response?.trxref || orderNum)),
      onClose: () => onCancel(),
    });
    if (!handler || typeof handler.openIframe !== 'function') {
      throw new Error('Paystack handler was not initialized');
    }
    handler.openIframe();
    return;
  }

  throw new Error('Paystack inline API not available');
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
    const email = document.getElementById('ck2Email')?.value.trim().toLowerCase();
    if (!isValidCheckoutEmail(email)) { toast('err','Email required','Enter a valid email for order confirmation'); return; }
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
  const cleanEmail = String(ckData.email || '').trim().toLowerCase();
  if (!isValidCheckoutEmail(cleanEmail)) {
    ckStep = 2;
    renderCkTimeline();
    renderCkStep();
    renderCkSummary();
    toast('err', 'Email required', 'Enter a valid email before starting payment.');
    return;
  }
  ckData.email = cleanEmail;
  if (payMethod === 'whatsapp') {
    const itemsTxt = cart.map(i=>`• ${i.name}${getVariantLabel(i.variant)?' ('+getVariantLabel(i.variant)+')':''} ×${i.qty} — KES ${(i.price*i.qty).toLocaleString()}`).join('\n');
    const msg = encodeURIComponent(`*Order #${orderNum}*\n\n*Customer:* ${ckData.name||'N/A'}\n*Email:* ${ckData.email}\n*Phone:* ${ckData.phone||'N/A'}\n*Deliver to:* ${ckData.deliveryZone?ckData.deliveryZone.split('|')[0]:''}\n*Address:* ${ckData.address||'TBD'}\n\n*Items:*\n${itemsTxt}\n\n*Subtotal:* KES ${cartTotal().toLocaleString()}\n*Delivery:* KES ${deliveryFee.toLocaleString()}\n*TOTAL: KES ${total.toLocaleString()}*`);
    const invoice = buildInvoiceRecord(orderNum, 'WhatsApp', total, null);
    saveInvoiceRecord(invoice);
    await saveOrder(orderNum, 'whatsapp', 'pending', total, null);
    window.open(getWhatsAppLink(msg), '_blank');
    completeOrder(orderNum, 'WhatsApp', invoice);
  } else {
    if (!hasValidPaystackKey()) {
      toast('err', 'Payment Error', 'Paystack key is missing or invalid in settings.');
      return;
    }
    if (!toPaystackAmount(total)) {
      toast('err', 'Payment Error', 'Checkout total is invalid. Please refresh your cart and retry.');
      return;
    }
    let paystackReady = false;
    try {
      paystackReady = await ensurePaystackLoaded();
    } catch (error) {
      console.warn('Paystack load error:', error?.message || error);
      paystackReady = false;
    }
    if (!paystackReady) {
      toast('err', 'Payment Error', 'Paystack failed to load. Check internet/ad blocker and retry.');
      return;
    }
    try {
      startPaystackCheckout(
        orderNum,
        total,
        async (reference) => {
          const ref = String(reference || orderNum).trim();
          const liveMode = /^pk_live_/i.test(String(CFG.PAYSTACK_PK || '').trim());
          let verified = false;
          try {
            await verifyPaystackTransaction(ref, total);
            verified = true;
          } catch (verifyError) {
            const verifyMsg = String(verifyError?.message || 'Verification failed').trim();
            if (!liveMode && isLocalRuntime()) {
              console.warn('Paystack verification skipped on local test mode:', verifyMsg);
              verified = true;
            } else {
              toast('err', 'Payment Verification Failed', verifyMsg);
              return;
            }
          }
          if (!verified) return;
          const invoice = buildInvoiceRecord(orderNum, 'Paystack', total, ref);
          saveInvoiceRecord(invoice);
          await saveOrder(orderNum, 'paystack', 'paid', total, ref);
          completeOrder(orderNum, 'Paystack', invoice);
        },
        () => toast('inf','Payment cancelled','Your cart is saved'),
        (error) => {
          const details = String(error?.message || '').trim();
          toast('err', 'Payment Error', details ? `Paystack error: ${details}` : 'Payment failed. Retry payment or use WhatsApp.');
        }
      );
    } catch (e) {
      const details = String(e?.message || '').trim();
      console.warn('Paystack init error:', details || e);
      toast('err', 'Payment Error', details ? `Paystack could not start: ${details}` : 'Paystack could not start. Retry payment or use WhatsApp.');
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
  if (canUseSupabase()) {
    await runSupabaseWrite(
      () => sb.from('orders').insert([orderObj]),
      { silent: true }
    );
  }
  // Always save locally as backup
  const localOrders = JSON.parse(localStorage.getItem('ltl2_orders') || '[]');
  localOrders.unshift(orderObj);
  localStorage.setItem('ltl2_orders', JSON.stringify(localOrders));
  // Update sidebar
  document.getElementById('lastOrdersLabel').textContent = `Last order: ${orderNum}`;
  updateTopbarStats();
}

function completeOrder(orderNum, method, invoice) {
  ckStep = 4;
  renderCkTimeline();
  const total = cartTotal() + deliveryFee;
  const supportMsg = encodeURIComponent(`Hi, I placed order #${orderNum} and need help.`);
  const invoiceNumber = invoice?.invoice_number || '';
  const safeEmail = escapeHtml(ckData.email || '');
  const safeOrderNum = escapeHtml(orderNum);
  const safeArea = escapeHtml(ckData.deliveryZone ? ckData.deliveryZone.split('|')[0] : '');
  const safeMethod = escapeHtml(method);
  const safeDeliveryDays = escapeHtml(deliveryDays || '');
  const safeInvoice = escapeHtml(invoiceNumber);
  navigate('success');
  document.getElementById('successContent').innerHTML = `
    <div class="success-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    </div>
    <h2>Order Confirmed!</h2>
    <p>Your order has been placed. A confirmation has been recorded for <strong style="color:var(--primary)">${safeEmail}</strong> and your invoice is ready below.</p>
    <div class="order-detail-card">
      <div class="odc-order-num">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        ${safeOrderNum}
      </div>
      <div class="odc-row"><span>Deliver to</span><strong>${safeArea}</strong></div>
      <div class="odc-row"><span>Paid via</span><strong>${safeMethod}</strong></div>
      ${safeInvoice ? `<div class="odc-row"><span>Invoice No</span><strong>${safeInvoice}</strong></div>` : ''}
      <div class="odc-row"><span>Total</span><strong style="color:var(--primary);font-family:var(--font-m)">KES ${total.toLocaleString()}</strong></div>
      <div class="odc-row"><span>Estimated delivery</span><strong>${safeDeliveryDays}</strong></div>
    </div>
    <div style="display:flex;flex-direction:column;gap:10px;">
      <button class="btn-cta blue" onclick="navigate('explore')" style="justify-content:center;">Continue Shopping</button>
      <button class="btn-cta outline" onclick="downloadInvoice('${safeOrderNum}')" style="justify-content:center;">Download Invoice</button>
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
  updateWishlistBadge();
  renderProducts(filterProducts(currentCat));
}

function updateWishlistBadge() {
  const badge = document.getElementById('sidebarWishBadge');
  if (!badge) return;
  const count = wishlist.length;
  badge.textContent = count;
  badge.style.display = count ? 'flex' : 'none';
}

function showLikedProducts() {
  navigate('explore');
  likedViewActive = true;
  activeSearchQuery = '';
  syncSearchInUrl('');
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';
  const liked = products.filter((p) => p.active !== false && wishlist.includes(String(p.id)));
  document.getElementById('productsTitle').textContent = 'Liked Products';
  renderProducts(liked);
  document.querySelectorAll('.cat-chip').forEach((c) => c.classList.remove('active'));
  document.querySelectorAll('.nav-item[data-cat]').forEach((n) => n.classList.remove('active'));
  document.querySelectorAll('.nav-item[data-pg]').forEach((n) => n.classList.toggle('active', n.dataset.pg === 'liked'));
  updateSeoForCurrentView();
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
    setTimeout(() => document.getElementById('adminEmail').focus(), 200);
  }
  document.body.style.overflow = 'hidden';
}

function closeAdmin() {
  document.getElementById('adminPanel').classList.remove('open');
  document.body.classList.remove('admin-open');
  document.body.style.overflow = '';
}

function safeHashCompare(a, b) {
  const left = String(a || '').trim().toLowerCase();
  const right = String(b || '').trim().toLowerCase();
  if (!left || !right || left.length !== right.length) return false;
  let mismatch = 0;
  for (let i = 0; i < left.length; i += 1) {
    mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  }
  return mismatch === 0;
}

async function sha256Hex(value) {
  const input = String(value || '');
  if (!window.crypto || !window.crypto.subtle || typeof TextEncoder === 'undefined') return '';
  const bytes = new TextEncoder().encode(input);
  const digest = await window.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function verifyAdminCredentials(email, pwd) {
  const allowedEmailHash = String(CFG.ADMIN_EMAIL_HASH || '').trim().toLowerCase();
  const allowedPassHash = String(CFG.ADMIN_PASS_HASH || '').trim().toLowerCase();
  if (!allowedEmailHash || !allowedPassHash) return false;
  const [emailHash, passHash] = await Promise.all([
    sha256Hex(String(email || '').trim().toLowerCase()),
    sha256Hex(String(pwd || '')),
  ]);
  return safeHashCompare(emailHash, allowedEmailHash) && safeHashCompare(passHash, allowedPassHash);
}

async function doAdminLogin() {
  const now = Date.now();
  if (adminLockedUntilTs > now) {
    const secs = Math.ceil((adminLockedUntilTs - now) / 1000);
    toast('err', 'Admin Locked', `Too many attempts. Try again in ${secs}s.`);
    document.getElementById('adminErr').classList.add('show');
    return;
  }
  const email = document.getElementById('adminEmail').value.trim().toLowerCase();
  const pwd = document.getElementById('adminPwd').value;
  if (!window.crypto || !window.crypto.subtle || typeof TextEncoder === 'undefined') {
    toast('err', 'Admin Unavailable', 'Secure login is not supported in this browser.');
    document.getElementById('adminErr').classList.add('show');
    return;
  }
  const isValid = await verifyAdminCredentials(email, pwd);
  if (isValid) {
    adminAuth = true;
    adminLoginFailures = 0;
    adminLockedUntilTs = 0;
    document.getElementById('adminErr').classList.remove('show');
    showAdminDash();
  } else {
    adminLoginFailures += 1;
    if (adminLoginFailures >= 5) {
      adminLockedUntilTs = Date.now() + (5 * 60 * 1000);
      adminLoginFailures = 0;
      toast('err', 'Admin Locked', 'Too many failed logins. Locked for 5 minutes.');
    }
    document.getElementById('adminErr').classList.add('show');
  }
}

function showAdminDash() {
  document.getElementById('adminLoginScreen').style.display = 'none';
  document.getElementById('adminDashScreen').style.display = 'flex';
  setAdminCatalogMode(adminCatalogMode, { rerenderProducts: false, rerenderSettings: true });
  updateAdminStats();
  adminTab('products');
  checkSupabaseHealth(false);
}

function isProductInAdminMode(product, mode = adminCatalogMode) {
  const category = normalizeCategoryValue(product?.category);
  if (!category) return mode !== 'jewerlys';
  return mode === 'jewerlys' ? isJewelryCategory(category) : !isJewelryCategory(category);
}

function setAdminCatalogMode(mode, opts = {}) {
  const rerenderProducts = opts.rerenderProducts !== false;
  const rerenderSettings = opts.rerenderSettings !== false;
  adminCatalogMode = mode === 'jewerlys' ? 'jewerlys' : 'electronics';

  const btnE = document.getElementById('adminCatalogElectronics');
  const btnJ = document.getElementById('adminCatalogJewerlys');
  if (btnE) btnE.classList.toggle('active', adminCatalogMode === 'electronics');
  if (btnJ) btnJ.classList.toggle('active', adminCatalogMode === 'jewerlys');

  const scope = document.getElementById('adminScopeLabel');
  if (scope) scope.textContent = adminCatalogMode === 'jewerlys' ? 'Jewelry' : 'Electronics';

  const heading = document.getElementById('adminProductsHeading');
  if (heading) heading.textContent = adminCatalogMode === 'jewerlys' ? 'Jewelry Catalogue' : 'Electronics Catalogue';
  const catScope = document.getElementById('catAddScopeLabel');
  if (catScope) catScope.textContent = adminCatalogMode === 'jewerlys' ? 'Jewelry' : 'Electronics';
  const brandScope = document.getElementById('brandAddScopeLabel');
  if (brandScope) brandScope.textContent = adminCatalogMode === 'jewerlys' ? 'Jewelry' : 'Electronics';

  const seedBtn = document.getElementById('btnSeedJewelryAdmin');
  if (seedBtn) seedBtn.style.display = adminCatalogMode === 'jewerlys' ? 'inline-flex' : 'none';

  if (rerenderSettings) renderCategoryManagerCards(adminCatalogMode);
  if (rerenderProducts && document.getElementById('adminProducts')?.style.display !== 'none') renderAdminProducts();
  updateAdminStats();
}

function scrollAdminBodyTo(targetEl, behavior = 'auto') {
  const adminBody = document.querySelector('#adminDashScreen .admin-body');
  if (!adminBody || !targetEl) return;
  const bodyRect = adminBody.getBoundingClientRect();
  const targetRect = targetEl.getBoundingClientRect();
  const nextTop = adminBody.scrollTop + (targetRect.top - bodyRect.top) - 10;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  adminBody.scrollTo({ top: Math.max(0, nextTop), behavior: reduceMotion ? 'auto' : behavior });
}

function adminTab(tab) {
  ['products','orders','settings'].forEach(t => {
    document.getElementById('admin'+t.charAt(0).toUpperCase()+t.slice(1)).style.display = t===tab ? '' : 'none';
    document.getElementById('at-'+t).classList.toggle('active', t===tab);
  });
  if (tab==='orders') loadAdminOrders();
  if (tab==='products') renderAdminProducts();
  if (tab==='settings') renderCategoryManagerCards(adminCatalogMode);
  const adminBody = document.querySelector('#adminDashScreen .admin-body');
  if (adminBody) adminBody.scrollTop = 0;
}

function updateAdminStats() {
  document.getElementById('aStatProd').textContent = products.filter((p) => p.active !== false && isProductInAdminMode(p)).length;
  const lo = JSON.parse(localStorage.getItem('ltl2_orders')||'[]');
  document.getElementById('aStatOrders').textContent = lo.length;
  const rev = lo.filter(o=>o.payment_status==='paid').reduce((s,o)=>s+(o.total||0),0);
  document.getElementById('aStatRev').textContent = rev > 0 ? (rev/1000).toFixed(0)+'K' : '0';
}

function updateTopbarStats() {
  const lo = JSON.parse(localStorage.getItem('ltl2_orders')||'[]');
  document.getElementById('topbarNum').textContent = lo.length;
  document.getElementById('topbarSub').textContent = lo.length === 1 ? 'Order · All time' : 'Orders · All time';
}

function renderAdminProducts() {
  const tbody = document.getElementById('prodTableBody');
  if (!tbody) return;
  const scopedProducts = products.filter((p) => isProductInAdminMode(p));
  if (!scopedProducts.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:34px;color:var(--text4);">No products in ${adminCatalogMode === 'jewerlys' ? 'Jewelry' : 'Electronics'} yet.</td></tr>`;
  } else {
    tbody.innerHTML = scopedProducts.map(p => {
    const safeId = escapeJsSingleQuote(String(p.id || ''));
    const safeName = escapeHtml(p.name);
    const safeBrand = escapeHtml(p.brand);
    const safeSku = escapeHtml(p.sku || '');
    const safeCategory = escapeHtml(p.category);
    const safeImage = escapeHtml(p.images?.[0] || '');
    return `
    <tr>
      <td><div class="td-prod"><div class="td-thumb">${p.images && p.images[0] ? `<img src="${safeImage}" alt="${safeName}" style="width:100%;height:100%;object-fit:cover;" onerror="this.outerHTML='${catIcon(p.category).replace(/'/g, '&#39;')}'"/>` : catIcon(p.category)}</div><div><div class="td-name">${safeName}</div><div class="td-sub">${safeBrand}${p.sku ? ' | SKU: ' + safeSku : ''}${p.images?.length ? ' | ' + p.images.length + ' image' + (p.images.length === 1 ? '' : 's') : ''}</div></div></div></td>
      <td><span class="tag-chip">${safeCategory}</span></td>
      <td style="font-family:var(--font-m)">KES ${Number(p.price).toLocaleString()}</td>
      <td style="font-family:var(--font-m)">${p.stock}</td>
      <td><span class="pill ${p.active!==false?'active':'inactive'}">${p.active!==false?'Active':'Hidden'}</span></td>
      <td><div class="tbl-btns">
        <div class="tbl-btn" onclick="openProdForm('${safeId}')" title="Edit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </div>
        <div class="tbl-btn" onclick="toggleActive('${safeId}')" title="Toggle">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/>${p.active!==false?'<line x1="8" y1="8" x2="16" y2="16"/><line x1="16" y1="8" x2="8" y2="16"/>':'<path d="M20 6L9 17l-5-5"/>'}</svg>
        </div>
        <div class="tbl-btn del" onclick="deleteProduct('${safeId}')" title="Delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        </div>
      </div></td>
    </tr>`;
  }).join('');
  }
  document.getElementById('aStatProd').textContent = scopedProducts.filter((p) => p.active !== false).length;
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
      <td style="font-family:var(--font-m);color:var(--primary);font-size:12px">${escapeHtml(o.order_number)}</td>
      <td>${escapeHtml(o.customer_name||o.customer_email||'—')}</td>
      <td style="font-size:12px">${escapeHtml(o.delivery_area||'—')}</td>
      <td style="font-family:var(--font-m)">${Number(o.total||0).toLocaleString()}</td>
      <td><span class="pill ${o.payment_status==='paid'?'paid':'pending'}">${escapeHtml(o.payment_status)}</span></td>
      <td><span class="pill ${o.order_status==='confirmed'?'active':o.order_status==='shipped'?'shipped':'pending'}">${escapeHtml(o.order_status||'confirmed')}</span></td>
      <td style="font-size:12px;color:var(--text3)">${new Date(o.created_at).toLocaleDateString('en-KE')}</td>
    </tr>`).join('');
}

function openProdForm(id) {
  const p = id ? products.find(x => String(x.id) === String(id)) : null;
  const wrap = document.getElementById('prodFormWrap');
  const currentCat = normalizeCategoryValue(p?.category || '');
  const currentBrand = normalizeBrandName(p?.brand || '');
  const scopedCats = getAvailableCategories(adminCatalogMode);
  const categories = [...new Set([...scopedCats, currentCat].filter(Boolean))];
  const selectedCat = currentCat || categories[0] || (adminCatalogMode === 'jewerlys' ? 'jewerlys' : 'smartphones');
  const brands = [...new Set([...getAvailableBrands(adminCatalogMode), currentBrand].filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const images = Array.isArray(p?.images) ? p.images.filter(Boolean) : [];
  const mainImage = images[0] || '';
  const extraImages = images.slice(1).join('\n');
  const specsText = specsToMultilineText(p?.specs || {});
  const variantsText = variantsToEditorText(p?.variants || []);
  const highlights = Array.isArray(p?.highlights) ? p.highlights.join(', ') : '';

  wrap.style.display = 'block';
  wrap.innerHTML = `<div class="prod-form">
    <h4>${p?`Edit: ${escapeHtml(p.name)}`:'Add New Product'}
      <button class="btn-cta outline" style="width:auto;padding:8px 14px;font-size:12px;" onclick="document.getElementById('prodFormWrap').style.display='none'">Cancel</button>
    </h4>
    <div class="form-grid-3">
      <div class="form-group"><label class="form-label">Name</label><input class="form-input" id="pf-name" value="${escapeHtml(p?p.name:'')}"/></div>
      <div class="form-group"><label class="form-label">Brand</label><input class="form-input" id="pf-brand" list="pf-brand-list" value="${escapeHtml(p?p.brand:'')}" placeholder="e.g. Samsung"/><datalist id="pf-brand-list">${brands.map((b)=>`<option value="${escapeHtml(b)}"></option>`).join('')}</datalist></div>
      <div class="form-group"><label class="form-label">Category</label><input class="form-input" id="pf-cat" list="pf-cat-list" value="${selectedCat}" placeholder="${adminCatalogMode === 'jewerlys' ? 'e.g. jewelry-necklaces' : 'e.g. smartphones'}"/><datalist id="pf-cat-list">${categories.map((c)=>`<option value="${c}">${categoryDisplayName(c)}</option>`).join('')}</datalist></div>
    </div>
    <div class="form-grid-3">
      <div class="form-group"><label class="form-label">Price (KES)</label><input type="number" class="form-input" id="pf-price" value="${p?p.price:''}"/></div>
      <div class="form-group"><label class="form-label">Original Price</label><input type="number" class="form-input" id="pf-orig" value="${p&&p.original_price?p.original_price:''}"/></div>
      <div class="form-group"><label class="form-label">Stock</label><input type="number" class="form-input" id="pf-stock" value="${p?p.stock:0}"/></div>
    </div>
    <div class="form-grid-3">
      <div class="form-group"><label class="form-label">Badge</label>
        <select class="form-select" id="pf-badge"><option value="">None</option>${['New','Hot','Sale'].map(b=>`<option ${p&&p.badge===b?'selected':''}>${b}</option>`).join('')}</select>
      </div>
      <div class="form-group"><label class="form-label">SKU / Model Code</label><input class="form-input" id="pf-sku" placeholder="e.g. SM-S928B" value="${escapeHtml(p?.sku || '')}"/></div>
      <div class="form-group">
        <label class="form-label">Variant / Colour (multiple)</label>
        <textarea class="form-textarea" id="pf-variants" placeholder="One per line. Example:&#10;Titanium Black | #1f2937&#10;Silver | #c0c0c0">${escapeHtml(variantsText)}</textarea>
        <div style="font-size:11px;color:var(--text4);margin-top:6px;">Format: <code>Variant Name | #HEXCOLOR</code> (color is optional)</div>
      </div>
    </div>
    <div class="form-grid-2">
      <div class="form-group"><label class="form-label">Card Tagline</label><input class="form-input" id="pf-tagline" placeholder="Short line shown on product cards" value="${escapeHtml(p?.tagline || '')}"/></div>
      <div class="form-group"><label class="form-label">Highlights (comma separated)</label><input class="form-input" id="pf-highlights" placeholder="e.g. 120Hz Display, 50MP Camera, 5000mAh" value="${escapeHtml(highlights)}"/></div>
    </div>
    <div class="form-grid-2">
      <div class="form-group"><label class="form-label">Description</label><textarea class="form-textarea" id="pf-desc">${escapeHtml(p?p.description:'')}</textarea></div>
      <div class="form-group"><label class="form-label">Specs (one per line: Key: Value)</label><textarea class="form-textarea" id="pf-specs" placeholder="Display: 6.7 AMOLED&#10;RAM: 12GB&#10;Storage: 256GB">${escapeHtml(specsText)}</textarea></div>
    </div>
    <div class="form-group">
      <label class="form-label">Main Image URL</label>
      <input class="form-input" id="pf-main-image" placeholder="https://... (primary image)" value="${escapeHtml(mainImage)}"/>
    </div>
    <div class="form-group">
      <label class="form-label">Additional Image URLs</label>
      <textarea class="form-textarea pf-img-textarea" id="pf-gallery-images" placeholder="One URL per line, or comma separated">${escapeHtml(extraImages)}</textarea>
      <div class="pf-img-tools">
        <button type="button" class="btn-cta outline pf-mini-btn" onclick="normalizeProductImageInputs(true)">Normalize Image URLs</button>
        <span class="pf-img-status" id="pfImgStatus">No images yet</span>
      </div>
      <div class="pf-quick-url-row">
        <input class="form-input" id="pf-quick-image" placeholder="Paste one image URL and click Add URL" onkeydown="if(event.key==='Enter'){event.preventDefault();addQuickProductImage();}"/>
        <button type="button" class="btn-cta blue pf-mini-btn" onclick="addQuickProductImage()">Add URL</button>
      </div>
      <div class="pf-url-help">
        <div class="pf-url-help-head">Where to get product image URLs</div>
        <div class="pf-url-help-links">
          <a href="https://unsplash.com" target="_blank" rel="noopener">Unsplash</a>
          <a href="https://www.pexels.com" target="_blank" rel="noopener">Pexels</a>
          <a href="https://postimages.org" target="_blank" rel="noopener">Postimages</a>
        </div>
        <p>Use direct image links (jpg/png/webp). Google, Pinterest, and Postimg links can still work after you click "Normalize Image URLs".</p>
      </div>
      <input type="hidden" id="pf-images" value="${escapeHtml(images.join(', '))}"/>
      <div style="font-size:11.5px;color:var(--text4);margin-top:7px;">Google/Pinterest redirect links are auto-normalized to direct image URLs when possible.</div>
      <div class="prod-img-grid" id="pfImgGrid" style="margin-top:10px;">
        <div class="prod-img-slot" id="pfSlot0" onclick="focusMainImageInput()"><div class="pis-add"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:18px;height:18px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span>Main</span></div></div>
        <div class="prod-img-slot" id="pfSlot1" onclick="focusGalleryImageInput()"><div class="pis-add"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:18px;height:18px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span>Img 2</span></div></div>
        <div class="prod-img-slot" id="pfSlot2" onclick="focusGalleryImageInput()"><div class="pis-add"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:18px;height:18px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span>Img 3</span></div></div>
        <div class="prod-img-slot" id="pfSlot3" onclick="focusGalleryImageInput()"><div class="pis-add"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:18px;height:18px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span>Img 4</span></div></div>
      </div>
    </div>
    <div class="pf-preview-wrap">
      <div class="pf-preview-head">Live Product Card Preview</div>
      <div id="pfCardPreview" class="pf-card-preview"></div>
    </div>
    <div style="display:flex;gap:10px;margin-top:4px;">
      <button class="btn-cta blue" style="width:auto;padding:11px 22px;" onclick="saveProd('${id||''}')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
        ${p?'Save Changes':'Add Product'}
      </button>
      <button class="btn-cta outline" style="width:auto;padding:11px 18px;" onclick="document.getElementById('prodFormWrap').style.display='none'">Cancel</button>
    </div>
  </div>`;
  bindProdFormLivePreview();
  normalizeProductImageInputs(false);
  updateProductFormPreview();
  requestAnimationFrame(() => scrollAdminBodyTo(wrap, 'auto'));
}

async function saveProd(id) {
  const name  = document.getElementById('pf-name').value.trim();
  const brand = normalizeBrandName(document.getElementById('pf-brand').value);
  const cat   = normalizeCategoryValue(document.getElementById('pf-cat').value);
  const price = parseFloat(document.getElementById('pf-price').value);
  const orig  = parseFloat(document.getElementById('pf-orig').value) || null;
  const stock = parseInt(document.getElementById('pf-stock').value) || 0;
  const badge = document.getElementById('pf-badge').value || null;
  const sku = document.getElementById('pf-sku').value.trim();
  const tagline = document.getElementById('pf-tagline').value.trim();
  const desc  = document.getElementById('pf-desc').value.trim();
  const specs = parseSpecsText(document.getElementById('pf-specs').value);
  const variants = normalizeVariantEntries(document.getElementById('pf-variants').value)
    .map((entry) => (entry.color ? { label: entry.label, color: entry.color } : { label: entry.label }));
  const highlights = splitListValues(document.getElementById('pf-highlights').value);
  const images   = normalizeProductImageInputs(false);
  if (!name||!brand||!price||!cat) { toast('err','Validation error','Name, brand, category and price are required'); return; }
  if (!images.length) toast('inf', 'No product image', 'You can still save, but cards look better with at least one image URL.');
  const baseObj = { name, slug:name.toLowerCase().replace(/[^a-z0-9]+/g,'-'), category:cat, brand, price, original_price:orig, stock, badge, description:desc, variants, images, active:true };
  const obj = {
    ...baseObj,
    specs,
    sku: sku || null,
    tagline: tagline || null,
    highlights,
  };
  const productScope = getBrandScopeFromCategory(cat);
  if (!DEFAULT_CATEGORIES.includes(cat) && !getCustomCategoryEntries(productScope).some((entry) => entry.slug === cat)) {
    customCategoryState[productScope] = [...getCustomCategoryEntries(productScope), { slug: cat, name: humanizeCategorySlug(cat) }]
      .filter((entry, idx, arr) => entry.slug && arr.findIndex((x) => x.slug === entry.slug) === idx)
      .sort((a, b) => a.name.localeCompare(b.name));
    saveCustomCategoryState();
    if (canUseSupabase()) {
      try {
        const { error } = await sbAdmin.from('store_categories').upsert([{
          slug: cat,
          name: humanizeCategorySlug(cat),
          scope: productScope,
          active: true,
        }], { onConflict: 'slug' });
        if (error) throw error;
      } catch (error) {
        if (!isSchemaProblemError(error)) console.warn('Could not sync product category to Supabase:', error?.message || error);
      }
    }
  }
  await upsertCustomBrand(brand, productScope, true);
  let dbSynced = !canUseSupabase();
  if (id) {
    const idx = products.findIndex(p => String(p.id) === String(id));
    if (idx > -1) { products[idx] = {...products[idx], ...obj}; }
    // Upsert to Supabase
    if (canUseSupabase()) {
      dbSynced = await runSupabaseWrite(
        () => sbAdmin.from('products').update(obj).eq('id', id),
        { silent: true }
      );
      if (!dbSynced) {
        dbSynced = await runSupabaseWrite(
          () => sbAdmin.from('products').update(baseObj).eq('id', id),
          { silent: true }
        );
        if (dbSynced) {
          toast('inf', 'Saved with core fields', 'Your table may not yet have sku/tagline/highlights/specs columns.');
        }
      }
    }
    toast(dbSynced ? 'ok' : 'inf', dbSynced ? 'Product Updated' : 'Updated Locally', name);
  } else {
    const newP = { ...obj, id:'l'+Date.now() };
    products.unshift(newP);
    // Insert to Supabase
    if (canUseSupabase()) {
      let insertedRow = null;
      dbSynced = await runSupabaseWrite(
        async () => {
          const { data, error } = await sbAdmin.from('products').insert([{...obj}]).select();
          if (error) throw error;
          if (data?.[0]) insertedRow = data[0];
          return { data };
        },
        { silent: true }
      );
      if (!dbSynced) {
        dbSynced = await runSupabaseWrite(
          async () => {
            const { data, error } = await sbAdmin.from('products').insert([{...baseObj}]).select();
            if (error) throw error;
            if (data?.[0]) insertedRow = data[0];
            return { data };
          },
          { silent: true }
        );
        if (dbSynced) {
          toast('inf', 'Saved with core fields', 'Your table may not yet have sku/tagline/highlights/specs columns.');
        }
      }
      if (insertedRow?.id) newP.id = insertedRow.id;
    }
    toast(dbSynced ? 'ok' : 'inf', dbSynced ? 'Product Added' : 'Added Locally', name);
  }
  if (canUseSupabase() && !dbSynced) {
    toast('inf', 'Supabase Sync Issue', 'This product is updated locally but did not sync to Supabase yet.');
  }
  document.getElementById('prodFormWrap').style.display = 'none';
  renderAdminProducts();
  renderCategoryChips();
  if (!getAllowedFilterCategories().includes(currentCat)) currentCat = storefrontMode === 'jewerlys' ? 'jewerlys' : 'all';
  setCat(currentCat, { closeSidebar: false });
}

async function toggleActive(id) {
  const p = products.find(x => String(x.id) === String(id));
  if (!p) return;
  p.active = !p.active;
  const dbSynced = canUseSupabase()
    ? await runSupabaseWrite(
        () => sbAdmin.from('products').update({active:p.active}).eq('id', id),
        { silent: true }
      )
    : true;
  renderAdminProducts();
  renderCategoryChips();
  if (!getAllowedFilterCategories().includes(currentCat)) currentCat = storefrontMode === 'jewerlys' ? 'jewerlys' : 'all';
  setCat(currentCat, { closeSidebar: false });
  if (canUseSupabase() && !dbSynced) {
    toast('inf', 'Supabase Sync Issue', 'Status changed locally but did not sync to Supabase.');
  }
  toast('inf', p.active ? 'Product Activated' : 'Product Hidden', p.name);
}

async function deleteProduct(id) {
  const p = products.find(x => String(x.id) === String(id));
  if (!p || !confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
  products = products.filter(x => String(x.id) !== String(id));
  const dbSynced = canUseSupabase()
    ? await runSupabaseWrite(
        () => sbAdmin.from('products').delete().eq('id', id),
        { silent: true }
      )
    : true;
  renderAdminProducts();
  renderCategoryChips();
  if (!getAllowedFilterCategories().includes(currentCat)) currentCat = storefrontMode === 'jewerlys' ? 'jewerlys' : 'all';
  setCat(currentCat, { closeSidebar: false });
  if (canUseSupabase() && !dbSynced) {
    toast('inf', 'Supabase Sync Issue', 'Deleted locally, but Supabase delete did not complete.');
  }
  toast('err','Deleted', p.name);
}

// ============================================================
// NAVIGATION
// ============================================================
function navigate(page, cat) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-'+page).classList.add('active');
  const siteFooter = document.getElementById('siteFooter');
  document.body.classList.toggle('hide-site-footer', page !== 'explore');
  if (siteFooter) siteFooter.style.display = page === 'explore' ? '' : 'none';
  if (page === 'explore') {
    syncProductInUrl('');
    if (cat) setCat(cat);
    else renderProducts(filterProducts(currentCat));
    if (!cat) updateSeoForCurrentView();
  } else if (page !== 'detail') {
    syncProductInUrl('');
  }
  document.querySelectorAll('.nav-item[data-pg]').forEach(n => n.classList.toggle('active', n.dataset.pg === page));
  window.scrollTo({top:0,behavior:'smooth'});
  closeMobileSidebar();
  if (page !== 'explore') updateSeoForCurrentView();
}

function topbarToggle(mode) {
  setStorefrontMode(mode, { preserveCategory: true });
  renderCategoryChips();
  navigate('explore');
  if (mode === 'jewerlys') {
    setCat(isJewelryCategory(currentCat) ? currentCat : 'jewerlys', { closeSidebar: false });
  } else {
    setCat(!isJewelryCategory(currentCat) ? currentCat : 'all', { closeSidebar: false });
  }
}

function openFooterInfo(topic = 'about-us') {
  const key = String(topic || 'about-us').trim().toLowerCase();

  if (key === 'track-order') {
    goCheckout();
    return;
  }
  if (key === 'contact-us') {
    const waMsg = encodeURIComponent('Hello, I need support with my order and product enquiry.');
    window.open(getWhatsAppLink(waMsg), '_blank');
    return;
  }
  if (key === 'shemi') {
    openAdmin();
    return;
  }

  const payload = FOOTER_INFO_CONTENT[key] || FOOTER_INFO_CONTENT['about-us'];
  const titleEl = document.getElementById('footerBlogTitle');
  const textEl = document.getElementById('footerBlogText');
  if (titleEl) titleEl.textContent = payload.title;
  if (textEl) textEl.textContent = payload.text;

  if (payload.category) {
    setCat(payload.category, { closeSidebar: false, preserveSearch: true });
  }
  if (payload.query) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = payload.query;
    doSearch(payload.query);
  }

  const blogCard = document.getElementById('footerMiniBlog');
  if (blogCard && typeof blogCard.scrollIntoView === 'function') {
    blogCard.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'nearest' });
  }
}

// ============================================================
// TOAST
// ============================================================
const TOAST_ONCE_PREFIX = 'ltl_toast_once_';
const toastRecent = new Map();

function toast(type, title, msg, options = {}) {
  const dedupeMs = Number.isFinite(Number(options?.dedupeMs)) ? Number(options.dedupeMs) : 1200;
  const dedupeKey = `${String(type || 'inf')}|${String(title || '').trim()}|${String(msg || '').trim()}`;
  const now = Date.now();
  const lastShown = toastRecent.get(dedupeKey) || 0;
  if (dedupeMs > 0 && now - lastShown < dedupeMs) return;
  toastRecent.set(dedupeKey, now);

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

function toastOnce(cacheKey, type, title, msg, ttlMs = 2 * 60 * 60 * 1000) {
  if (!cacheKey) {
    toast(type, title, msg);
    return;
  }
  try {
    const key = `${TOAST_ONCE_PREFIX}${cacheKey}`;
    const now = Date.now();
    const prev = Number(localStorage.getItem(key) || '0');
    if (prev && now - prev < ttlMs) return;
    localStorage.setItem(key, String(now));
  } catch (_) {}
  toast(type, title, msg);
}

// ============================================================
// INSTALL PROMPT (PWA DOWNLOAD)
// ============================================================
const INSTALL_PROMPT_DELAY_MS = 7000;
const INSTALL_PROMPT_DISMISS_KEY = 'lt_install_prompt_dismiss_until';
const INSTALL_PROMPT_SNOOZE_MS = 18 * 60 * 60 * 1000;
let deferredInstallPrompt = null;
let installPromptTimer = null;

function isStandaloneApp() {
  return Boolean(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
    || window.navigator.standalone === true;
}

function installPromptElements() {
  return {
    wrap: document.getElementById('installPrompt'),
    close: document.getElementById('installPromptClose'),
    action: document.getElementById('installPromptBtn'),
    later: document.getElementById('installPromptLater'),
  };
}

function shouldShowInstallPrompt() {
  const { wrap } = installPromptElements();
  if (!wrap) return false;
  if (isStandaloneApp()) return false;
  try {
    const dismissUntil = Number(localStorage.getItem(INSTALL_PROMPT_DISMISS_KEY) || '0');
    if (dismissUntil && Date.now() < dismissUntil) return false;
  } catch (_) {}
  return true;
}

function hideInstallPrompt(snoozeMs = INSTALL_PROMPT_SNOOZE_MS) {
  const { wrap } = installPromptElements();
  if (!wrap) return;
  wrap.classList.remove('show');
  wrap.setAttribute('aria-hidden', 'true');
  if (Number.isFinite(Number(snoozeMs)) && Number(snoozeMs) > 0) {
    try {
      localStorage.setItem(INSTALL_PROMPT_DISMISS_KEY, String(Date.now() + Number(snoozeMs)));
    } catch (_) {}
  }
}

function showInstallPrompt() {
  if (!shouldShowInstallPrompt()) return;
  const { wrap } = installPromptElements();
  if (!wrap) return;
  wrap.classList.add('show');
  wrap.setAttribute('aria-hidden', 'false');
}

function scheduleInstallPrompt() {
  if (!shouldShowInstallPrompt()) return;
  if (installPromptTimer) window.clearTimeout(installPromptTimer);
  installPromptTimer = window.setTimeout(() => {
    showInstallPrompt();
  }, INSTALL_PROMPT_DELAY_MS);
}

async function triggerInstallPrompt() {
  if (deferredInstallPrompt) {
    try {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      if (choice?.outcome === 'accepted') {
        hideInstallPrompt(7 * 24 * 60 * 60 * 1000);
        toast('ok', 'App Installed', 'Lifetime Technology app is ready on your device.');
        return;
      }
      hideInstallPrompt(INSTALL_PROMPT_SNOOZE_MS);
      return;
    } catch (_) {
      hideInstallPrompt(INSTALL_PROMPT_SNOOZE_MS);
      toast('inf', 'Install Tip', 'Use your browser menu and choose Install app.');
      return;
    }
  }

  hideInstallPrompt(INSTALL_PROMPT_SNOOZE_MS);
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) {
    toast('inf', 'Install Tip', 'Open Share and tap Add to Home Screen.');
  } else {
    toast('inf', 'Install Tip', 'Open browser menu and choose Install app.');
  }
}

function bindInstallPromptUi() {
  const { wrap, close, action, later } = installPromptElements();
  if (!wrap) return;
  wrap.setAttribute('aria-hidden', 'true');

  if (close && !close.dataset.bound) {
    close.addEventListener('click', () => hideInstallPrompt(INSTALL_PROMPT_SNOOZE_MS));
    close.dataset.bound = '1';
  }
  if (later && !later.dataset.bound) {
    later.addEventListener('click', () => hideInstallPrompt(INSTALL_PROMPT_SNOOZE_MS));
    later.dataset.bound = '1';
  }
  if (action && !action.dataset.bound) {
    action.addEventListener('click', triggerInstallPrompt);
    action.dataset.bound = '1';
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    scheduleInstallPrompt();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    hideInstallPrompt(7 * 24 * 60 * 60 * 1000);
  });

  scheduleInstallPrompt();
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Service worker registration failed:', error?.message || error);
    });
  });
}

// ============================================================
// MOBILE SIDEBAR
// ============================================================
function isMobileViewport() {
  return window.matchMedia('(max-width: 900px)').matches;
}

function setMobileSidebarOpen(open) {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('mobOverlay');
  if (!sidebar || !overlay) return;
  const isOpen = Boolean(open);
  sidebar.classList.toggle('open', isOpen);
  overlay.classList.toggle('show', isOpen);
  document.body.classList.toggle('mobile-sidebar-open', isOpen);
}

function toggleMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  setMobileSidebarOpen(!sidebar.classList.contains('open'));
}
function closeMobileSidebar() {
  setMobileSidebarOpen(false);
}
document.getElementById('mobOverlay').addEventListener('click', closeMobileSidebar);

function setSidebarState(collapsed) {
  if (isMobileViewport()) {
    document.body.classList.remove('sidebar-collapsed');
    const mobileBtn = document.getElementById('sidebarToggle');
    if (mobileBtn) mobileBtn.setAttribute('aria-pressed', 'false');
    return;
  }
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
  const saved = localStorage.getItem('ltSidebarCollapsed');
  const collapsed = saved === null ? true : saved === '1';
  setSidebarState(collapsed);
}

function syncSidebarForViewport() {
  if (isMobileViewport()) {
    document.body.classList.remove('sidebar-collapsed');
    setMobileSidebarOpen(false);
    const btn = document.getElementById('sidebarToggle');
    if (btn) btn.setAttribute('aria-pressed', 'false');
    return;
  }
  closeMobileSidebar();
}

window.addEventListener('resize', syncSidebarForViewport);

// ============================================================
// INIT
// ============================================================
(function bindConnectionRecovery() {
  window.addEventListener('online', () => {
    ensurePaystackLoaded().catch(() => {});
    if (!canUseSupabase()) return;
    setDbStatus('Reconnecting...', 'var(--primary)');
    loadProducts();
    if (adminAuth) loadAdminOrders();
    checkSupabaseHealth(false);
  });
})();

(async function init() {
  registerServiceWorker();
  bindInstallPromptUi();
  const removedSensitiveQuery = scrubSensitiveQueryFromUrl();
  const initialCategory = getCategoryFromUrl();
  if (initialCategory) currentCat = initialCategory;
  storefrontMode = isJewelryCategory(currentCat) ? 'jewerlys' : 'electronics';
  const initialQuery = getSearchQueryFromUrl();
  const initialProductSlug = getProductSlugFromUrl();

  loadSidebarState();
  syncSidebarForViewport();
  setStorefrontMode(storefrontMode, { preserveCategory: true });
  loadStoreSettings();
  loadCustomCategoryState();
  loadCustomBrandState();
  loadBrandingSettings();
  ensurePaystackLoaded().catch(() => {});
  updateSupabaseSetupUi('Checking schema health...');
  if (CFG.ENABLE_SUPABASE && !sb) {
    setDbStatus('Config Issue', 'var(--red)');
    toastOnce('supabase-not-ready-init', 'inf', 'Supabase Not Ready', sbConfigIssue || 'Using local/demo data until Supabase client is available.');
  }
  updateCartUI();
  updateWishlistBadge();
  updateTopbarStats();
  await syncCustomCategoriesFromSupabase();
  await syncCustomBrandsFromSupabase();
  await loadProducts();
  await checkSupabaseHealth(false);

  if (initialProductSlug) {
    const match = products.find((p) => String(p.slug || '').toLowerCase() === initialProductSlug || String(p.id || '').toLowerCase() === initialProductSlug);
    if (match) {
      openProduct(match.id);
      return;
    }
  }

  if (initialQuery) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = initialQuery;
    doSearch(initialQuery);
  } else if (removedSensitiveQuery) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    toastOnce('sensitive-query-removed', 'inf', 'Protected URL Cleaned', 'Sensitive text was removed from the link.');
  }
})();

// ===== THEME SWITCHER =====
function getThemeToggleIconSvg(theme) {
  if (theme === 'dark') {
    return '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2.5"/><path d="M12 19.5V22"/><path d="M4.93 4.93 6.7 6.7"/><path d="M17.3 17.3 19.07 19.07"/><path d="M2 12h2.5"/><path d="M19.5 12H22"/><path d="M4.93 19.07 6.7 17.3"/><path d="M17.3 6.7 19.07 4.93"/></svg>';
  }
  return '<svg viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8z"/></svg>';
}

function syncThemeToggleUi(theme) {
  const track = document.getElementById('tsTrack');
  const icon = document.getElementById('themeIcon');
  const label = document.getElementById('themeLabel');
  if (track) track.classList.toggle('on', theme === 'dark');
  if (icon) icon.innerHTML = getThemeToggleIconSvg(theme);
  if (label) label.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
}

function toggleTheme() {
  const root = document.getElementById('appRoot');
  const isDark = root.getAttribute('data-theme') === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  root.setAttribute('data-theme', newTheme);
  localStorage.setItem('ltTheme', newTheme);
  syncThemeToggleUi(newTheme);
}
// Load saved theme on startup
(function() {
  const saved = localStorage.getItem('ltTheme') || 'light';
  document.getElementById('appRoot').setAttribute('data-theme', saved === 'dark' ? 'dark' : 'light');
  syncThemeToggleUi(saved === 'dark' ? 'dark' : 'light');
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
  const clean = String(name || '').trim() || 'Lifetime Limited';
  const footerName = document.querySelector('.sf-bottom-left strong');
  if (footerName) footerName.textContent = clean;
  const adminName = document.querySelector('.admin-footer-left strong');
  if (adminName) adminName.textContent = `${clean} Admin`;
}

function syncSupabaseSettingInputs() {
  const sbUrlInput = document.getElementById('settingsSbUrl');
  const sbKeyInput = document.getElementById('settingsSbKey');
  if (sbUrlInput) sbUrlInput.value = String(CFG.SUPABASE_URL || '').trim();
  if (sbKeyInput) sbKeyInput.value = String(CFG.SUPABASE_PUBLISHABLE || CFG.SUPABASE_ANON || '').trim();
}

function normalizeMarqueeUrls(rawValue, fallbackUrls = []) {
  const sourceList = Array.isArray(rawValue) ? rawValue : splitListValues(rawValue);
  const urls = [];
  const seen = new Set();
  sourceList.forEach((value) => {
    const normalized = normalizeImageUrl(value);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      urls.push(normalized);
    }
  });
  if (urls.length) return urls.slice(0, 12);
  return Array.isArray(fallbackUrls) ? [...fallbackUrls] : [];
}

function syncMarqueeInputControls() {
  const electronicsInput = document.getElementById('marqueeUrlsElectronics');
  const jewerlysInput = document.getElementById('marqueeUrlsJewerlys');
  if (electronicsInput) electronicsInput.value = marqueeImageState.electronics.join('\n');
  if (jewerlysInput) jewerlysInput.value = marqueeImageState.jewerlys.join('\n');
}

function openMarqueeCategory(cat) {
  const targetCat = normalizeCategoryValue(cat);
  if (!targetCat) return;
  if (currentPage !== 'explore') navigate('explore');
  setCat(targetCat, { preserveSearch: false });
}

function handleMarqueeTileKeydown(event, cat) {
  if (!event) return;
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    openMarqueeCategory(cat);
  }
}

function renderImageMarquee(mode = storefrontMode) {
  const track = document.getElementById('imageMarqueeTrack');
  if (!track) return;
  const scope = mode === 'jewerlys' ? 'jewerlys' : 'electronics';
  const sourceUrls = marqueeImageState[scope]?.length ? marqueeImageState[scope] : DEFAULT_MARQUEE_IMAGES[scope];
  if (!Array.isArray(sourceUrls) || !sourceUrls.length) {
    track.innerHTML = '';
    return;
  }
  const repeatedUrls = [...sourceUrls, ...sourceUrls];
  const iconCats = MARQUEE_ICON_CATEGORIES[scope] || MARQUEE_ICON_CATEGORIES.electronics;
  const scopeLabel = scope === 'jewerlys' ? 'Jewelry' : 'Electronics';
  track.innerHTML = repeatedUrls.map((url, index) => {
    const cat = iconCats[index % iconCats.length];
    const safeUrl = escapeHtml(url);
    const safeAlt = escapeHtml(`${scopeLabel} product image ${index % sourceUrls.length + 1}`);
    const safeCategoryLabel = escapeHtml(categoryDisplayName(cat));
    const safeCat = escapeHtml(cat);
    return `
      <div class="image-tile" role="button" tabindex="0" aria-label="Open ${safeCategoryLabel} products" title="View ${safeCategoryLabel}" onclick="openMarqueeCategory('${safeCat}')" onkeydown="handleMarqueeTileKeydown(event,'${safeCat}')">
        <img src="${safeUrl}" alt="${safeAlt}" loading="lazy" onerror="this.style.display='none'"/>
        <span class="image-tile-icon" aria-hidden="true">${catIcon(cat)}</span>
      </div>
    `;
  }).join('');
}

function applyMarqueeSettings(showToast = true) {
  const electronicsRaw = document.getElementById('marqueeUrlsElectronics')?.value ?? marqueeImageState.electronics;
  const jewerlysRaw = document.getElementById('marqueeUrlsJewerlys')?.value ?? marqueeImageState.jewerlys;
  marqueeImageState = {
    electronics: normalizeMarqueeUrls(electronicsRaw, DEFAULT_MARQUEE_IMAGES.electronics),
    jewerlys: normalizeMarqueeUrls(jewerlysRaw, DEFAULT_MARQUEE_IMAGES.jewerlys),
  };
  syncMarqueeInputControls();
  renderImageMarquee(storefrontMode);
  if (showToast) toast('ok', 'Strip Updated', 'Moving strip images updated for Electronics and Jewelry.');
}

function loadStoreSettings() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem('ltl2_store_settings') || 'null'); } catch (_) {}
  syncSupabaseSettingInputs();
  const pkInput = document.getElementById('settingsPaystack');
  if (pkInput) pkInput.value = String(CFG.PAYSTACK_PK || '').trim();
  if (!saved || typeof saved !== 'object') {
    syncMarqueeInputControls();
    renderImageMarquee(storefrontMode);
    return;
  }
  const wa = document.getElementById('settingsWA');
  const sn = document.getElementById('settingsStoreName');
  const se = document.getElementById('settingsSupportEmail');
  if (wa && saved.whatsapp) wa.value = saved.whatsapp;
  if (sn && saved.storeName) sn.value = saved.storeName;
  if (se && saved.supportEmail) se.value = saved.supportEmail;
  if (saved.whatsapp) CFG.WHATSAPP = String(saved.whatsapp).trim();
  const storedPaystack = String(saved.paystackPublicKey || saved?.paystack?.publicKey || '').trim();
  if (storedPaystack) {
    CFG.PAYSTACK_PK = storedPaystack;
    if (pkInput) pkInput.value = storedPaystack;
  }
  if (saved.supabase && typeof saved.supabase === 'object') {
    const storedUrl = String(saved.supabase.url || '').trim();
    const storedKey = String(saved.supabase.publishable || saved.supabase.key || '').trim();
    const storedAnon = String(saved.supabase.anon || '').trim();
    if (storedUrl) CFG.SUPABASE_URL = storedUrl;
    if (storedKey) CFG.SUPABASE_PUBLISHABLE = storedKey;
    if (storedAnon) CFG.SUPABASE_ANON = storedAnon;
    syncSupabaseSettingInputs();
  }
  if (saved.marquee && typeof saved.marquee === 'object') {
    marqueeImageState.electronics = normalizeMarqueeUrls(saved.marquee.electronics, DEFAULT_MARQUEE_IMAGES.electronics);
    marqueeImageState.jewerlys = normalizeMarqueeUrls(saved.marquee.jewerlys, DEFAULT_MARQUEE_IMAGES.jewerlys);
  }
  syncMarqueeInputControls();
  renderImageMarquee(storefrontMode);
  applyStoreName(saved.storeName || 'Lifetime Limited');
}

function applyBrandingSettings(showToast = true) {
  const activePreset = document.querySelector('.brand-preset-btn.active')?.dataset.preset || DEFAULT_BRANDING_STATE.preset;
  applyBrandingState({ preset: activePreset, additions: getBrandingAdditionsFromControls() }, true, false);
  if (showToast) toast('ok', 'Branding Applied', 'Preset and additions updated');
}

function saveStoreSettings() {
  const wa = document.getElementById('settingsWA')?.value?.trim() || CFG.WHATSAPP;
  const storeName = document.getElementById('settingsStoreName')?.value?.trim() || 'Lifetime Limited';
  const supportEmail = document.getElementById('settingsSupportEmail')?.value?.trim() || 'support@lifetimeltd.co.ke';
  const paystackKey = String(document.getElementById('settingsPaystack')?.value || CFG.PAYSTACK_PK || '').trim();
  const sbUrlInput = String(document.getElementById('settingsSbUrl')?.value || CFG.SUPABASE_URL || '').trim();
  const sbKeyInput = String(document.getElementById('settingsSbKey')?.value || CFG.SUPABASE_PUBLISHABLE || CFG.SUPABASE_ANON || '').trim();
  const previousSbUrl = String(CFG.SUPABASE_URL || '').trim();
  const previousSbKey = String(CFG.SUPABASE_PUBLISHABLE || CFG.SUPABASE_ANON || '').trim();

  if (/^(sk_|sb_secret_)/i.test(paystackKey)) {
    toast('err', 'Unsafe Paystack Key', 'Do not use secret keys (sk_/sb_secret_) in the browser.');
    return;
  }
  if (!isPaystackPublicKey(paystackKey)) {
    toast('err', 'Invalid Paystack Key', 'Use a valid public key in the format pk_test_... or pk_live_...');
    return;
  }
  if (!/^https?:\/\//i.test(sbUrlInput)) {
    toast('err', 'Invalid Supabase URL', 'Use a full https:// URL for your Supabase project.');
    return;
  }
  if (isSupabaseServiceRoleKey(sbKeyInput)) {
    toast('err', 'Unsafe Supabase Key', 'Use publishable/anon key only. Never use service-role or sb_secret keys in browser.');
    return;
  }
  if (!isLikelySupabaseClientKey(sbKeyInput)) {
    toast('err', 'Invalid Supabase Key', 'Use a valid Supabase publishable key or anon JWT.');
    return;
  }

  applyMarqueeSettings(false);
  CFG.WHATSAPP = wa;
  CFG.PAYSTACK_PK = paystackKey;
  CFG.SUPABASE_URL = sbUrlInput;
  CFG.SUPABASE_PUBLISHABLE = sbKeyInput;
  if (/^eyJ[A-Za-z0-9_-]*\./.test(sbKeyInput)) CFG.SUPABASE_ANON = sbKeyInput;
  applyStoreName(storeName);
  applyBrandingSettings(false);
  const supabaseChanged = sbUrlInput !== previousSbUrl || sbKeyInput !== previousSbKey;
  localStorage.setItem('ltl2_store_settings', JSON.stringify({
    whatsapp: wa,
    storeName,
    supportEmail,
    paystackPublicKey: paystackKey,
    paystack: {
      publicKey: paystackKey,
      mode: /^pk_live_/i.test(paystackKey) ? 'live' : 'test',
    },
    supabase: {
      url: sbUrlInput,
      publishable: sbKeyInput,
      anon: CFG.SUPABASE_ANON,
    },
    marquee: {
      electronics: [...marqueeImageState.electronics],
      jewerlys: [...marqueeImageState.jewerlys],
    },
  }));
  if (supabaseChanged) {
    toast('inf', 'Supabase Updated', 'Reloading page to apply new Supabase credentials.');
    window.setTimeout(() => window.location.reload(), 700);
    return;
  }
  toast('ok', 'Settings Saved', /^pk_live_/i.test(paystackKey) ? 'Live Paystack key saved. Store is ready for live payment attempts.' : 'Test Paystack key saved. Switch to pk_live for real charges.');
}

// ===== BANNER IMAGE MANAGER =====
function applyBannerImg(slot) {
  const safeTitleHtml = (value) => escapeHtml(value).replace(/\n/g, '<br/>');
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
    if (titleEl && title) titleEl.innerHTML = safeTitleHtml(title);
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
    if (t && title) t.innerHTML = safeTitleHtml(title);
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
    if (t && title) t.innerHTML = safeTitleHtml(title);
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
  prev.innerHTML = `<img src="${escapeHtml(normalized)}" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.parentElement.innerHTML='<div class=bsp-placeholder><svg viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'1.5\\' style=\\'width:24px;height:24px\\'><rect x=\\'3\\' y=\\'3\\' width=\\'18\\' height=\\'18\\' rx=\\'2\\'/></svg><span>Invalid URL</span></div>'"/>`;
}

// ===== CATEGORY IMAGE MANAGER =====
function renderCategoryManagerCards(mode = adminCatalogMode) {
  const grid = document.getElementById('catManagerGrid');
  if (!grid) return;
  const previousValues = {};
  grid.querySelectorAll('input[id^="catImg-"]').forEach((el) => { previousValues[el.id] = el.value || ''; });
  const cats = getAvailableCategories(mode);
  grid.innerHTML = cats.map((cat) => `
    <div class="cat-manager-card" data-cat="${cat}">
      <div class="cmc-img"><div class="cmc-placeholder">${catIcon(cat)}</div></div>
      <div class="cmc-body">
        <div class="cmc-name">${categoryDisplayName(cat)}</div>
        <div class="cmc-url">
          <input class="form-input" id="catImg-${cat}" placeholder="Direct or shared image URL" style="font-size:11.5px;padding:7px 10px;" value="${escapeHtml(previousValues['catImg-' + cat] || '')}"/>
          <button onclick="applyCatImg('${cat}')">Set</button>
        </div>
      </div>
    </div>
  `).join('');
  renderCustomCategoryList(mode);
  renderCustomBrandList(mode);
}

function renderCustomCategoryList(mode = adminCatalogMode) {
  const wrap = document.getElementById('customCategoryList');
  const scopeLabel = document.getElementById('catAddScopeLabel');
  const input = document.getElementById('newCategoryName');
  if (scopeLabel) scopeLabel.textContent = mode === 'jewerlys' ? 'Jewelry' : 'Electronics';
  if (input) input.placeholder = mode === 'jewerlys' ? 'e.g. Jewelry Pendants' : 'e.g. Cameras';
  if (!wrap) return;
  const customEntries = getCustomCategoryEntries(mode);
  if (!customEntries.length) {
    wrap.innerHTML = `<div class="custom-cat-empty">No custom categories yet for ${mode === 'jewerlys' ? 'Jewelry' : 'Electronics'}.</div>`;
    return;
  }
  wrap.innerHTML = customEntries.map((entry) => `
    <div class="custom-cat-item">
      <div class="custom-cat-text">
        <strong>${escapeHtml(entry.name)}</strong>
        <span>${escapeHtml(entry.slug)}</span>
      </div>
      <button type="button" class="custom-cat-remove" onclick="removeCustomCategory('${escapeHtml(entry.slug)}', '${mode}')">Remove</button>
    </div>
  `).join('');
}

function renderCustomBrandList(mode = adminCatalogMode) {
  const wrap = document.getElementById('customBrandList');
  const scopeLabel = document.getElementById('brandAddScopeLabel');
  const input = document.getElementById('newBrandName');
  if (scopeLabel) scopeLabel.textContent = mode === 'jewerlys' ? 'Jewelry' : 'Electronics';
  if (input) input.placeholder = mode === 'jewerlys' ? 'e.g. LTL Jewelry' : 'e.g. Samsung';
  if (!wrap) return;
  const entries = getCustomBrandEntries(mode);
  if (!entries.length) {
    wrap.innerHTML = `<div class="custom-cat-empty">No custom brands yet for ${mode === 'jewerlys' ? 'Jewelry' : 'Electronics'}.</div>`;
    return;
  }
  wrap.innerHTML = entries.map((entry) => `
    <div class="custom-cat-item">
      <div class="custom-cat-text">
        <strong>${escapeHtml(entry.name)}</strong>
        <span>${escapeHtml(entry.slug)}</span>
      </div>
      <button type="button" class="custom-cat-remove" onclick="removeCustomBrand('${escapeHtml(entry.slug)}', '${mode}')">Remove</button>
    </div>
  `).join('');
}

async function addCustomCategory() {
  const input = document.getElementById('newCategoryName');
  if (!input) return;
  const rawName = String(input.value || '').trim();
  if (!rawName) {
    toast('inf', 'Category Needed', 'Enter a category name first.');
    return;
  }
  const mode = adminCatalogMode === 'jewerlys' ? 'jewerlys' : 'electronics';
  const slug = normalizeCategoryValue(rawName);
  if (!slug) {
    toast('err', 'Invalid Category', 'Use letters and numbers for category name.');
    return;
  }
  const allExisting = new Set(getAllKnownCategories());
  if (allExisting.has(slug)) {
    toast('inf', 'Category Exists', `${categoryDisplayName(slug)} already exists.`);
    input.value = '';
    return;
  }
  const entry = { slug, name: rawName };
  customCategoryState[mode] = [...getCustomCategoryEntries(mode), entry]
    .map((item) => ({ slug: normalizeCategoryValue(item.slug), name: String(item.name || humanizeCategorySlug(item.slug)).trim() }))
    .filter((item, idx, arr) => item.slug && arr.findIndex((x) => x.slug === item.slug) === idx)
    .sort((a, b) => a.name.localeCompare(b.name));
  saveCustomCategoryState();

  renderCategoryManagerCards(mode);
  renderCategoryChips();
  if (!getAllowedFilterCategories().includes(currentCat)) currentCat = storefrontMode === 'jewerlys' ? 'jewerlys' : 'all';
  setCat(currentCat, { closeSidebar: false, preserveSearch: true });
  input.value = '';

  if (canUseSupabase()) {
    try {
      const { error } = await sbAdmin.from('store_categories').upsert([{
        slug,
        name: entry.name,
        scope: mode,
        active: true,
      }], { onConflict: 'slug' });
      if (error) throw error;
    } catch (error) {
      if (!isSchemaProblemError(error)) console.warn('Could not sync category to Supabase:', error?.message || error);
    }
  }
  toast('ok', 'Category Added', `${entry.name} added to ${mode === 'jewerlys' ? 'Jewelry' : 'Electronics'}.`);
}

async function addCustomBrand() {
  const input = document.getElementById('newBrandName');
  if (!input) return;
  const rawName = String(input.value || '').trim();
  const brandName = normalizeBrandName(rawName);
  if (!brandName) {
    toast('inf', 'Brand Needed', 'Enter a brand name first.');
    return;
  }
  const mode = adminCatalogMode === 'jewerlys' ? 'jewerlys' : 'electronics';
  const existingNames = new Set(getAvailableBrands(mode).map((name) => normalizeBrandName(name).toLowerCase()));
  if (hasCustomBrand(brandName, mode) || existingNames.has(brandName.toLowerCase())) {
    toast('inf', 'Brand Exists', `${brandName} already exists.`);
    input.value = '';
    return;
  }
  const saved = await upsertCustomBrand(brandName, mode, true);
  if (!saved) {
    toast('err', 'Invalid Brand', 'Use letters and numbers for brand name.');
    return;
  }
  renderCustomBrandList(mode);
  input.value = '';
  toast('ok', 'Brand Added', `${brandName} added to ${mode === 'jewerlys' ? 'Jewelry' : 'Electronics'}.`);
}

async function removeCustomCategory(slug, mode = adminCatalogMode) {
  const cleanSlug = normalizeCategoryValue(slug);
  if (!cleanSlug) return;
  const scope = mode === 'jewerlys' ? 'jewerlys' : 'electronics';
  const existing = getCustomCategoryEntries(scope).find((entry) => entry.slug === cleanSlug);
  if (!existing) return;
  if (!confirm(`Remove category "${existing.name}"?`)) return;

  customCategoryState[scope] = getCustomCategoryEntries(scope).filter((entry) => entry.slug !== cleanSlug);
  saveCustomCategoryState();
  if (normalizeCategoryValue(currentCat) === cleanSlug) {
    currentCat = scope === 'jewerlys' ? 'jewerlys' : 'all';
  }

  renderCategoryManagerCards(scope);
  renderCategoryChips();
  setCat(currentCat, { closeSidebar: false, preserveSearch: true });

  if (canUseSupabase()) {
    try {
      const { error } = await sbAdmin.from('store_categories').delete().eq('slug', cleanSlug);
      if (error) throw error;
    } catch (error) {
      if (!isSchemaProblemError(error)) console.warn('Could not remove category from Supabase:', error?.message || error);
    }
  }
  toast('inf', 'Category Removed', existing.name);
}

async function removeCustomBrand(slug, mode = adminCatalogMode) {
  const cleanSlug = normalizeCategoryValue(slug);
  if (!cleanSlug) return;
  const scope = mode === 'jewerlys' ? 'jewerlys' : 'electronics';
  const existing = getCustomBrandEntries(scope).find((entry) => entry.slug === cleanSlug);
  if (!existing) return;
  if (!confirm(`Remove brand "${existing.name}"?`)) return;

  customBrandState[scope] = getCustomBrandEntries(scope).filter((entry) => entry.slug !== cleanSlug);
  saveCustomBrandState();
  renderCustomBrandList(scope);

  if (canUseSupabase()) {
    try {
      const { error } = await sbAdmin.from('store_brands').delete().eq('slug', cleanSlug);
      if (error) throw error;
    } catch (error) {
      if (!isSchemaProblemError(error)) console.warn('Could not remove brand from Supabase:', error?.message || error);
    }
  }
  toast('inf', 'Brand Removed', existing.name);
}

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
    card.innerHTML = `<img src="${escapeHtml(url)}" style="width:100%;height:100%;object-fit:cover;" onerror="this.outerHTML='<div class=cmc-placeholder><svg viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'1.5\' style=\'width:28px;height:28px\'><rect x=\'3\' y=\'3\' width=\'18\' height=\'18\' rx=\'2\'/></svg></div>'"/>`;
  }
  toast('ok', 'Category Image Set', cat + ' banner image updated');
}

// ===== PRODUCT FORM IMAGE PREVIEWS =====
function collectProductImageUrlsFromInputs() {
  const mainInput = document.getElementById('pf-main-image');
  const galleryInput = document.getElementById('pf-gallery-images');
  const mainRaw = mainInput ? mainInput.value.trim() : '';
  const galleryRaw = galleryInput ? galleryInput.value : '';
  const mainUrl = normalizeImageUrl(mainRaw);
  const galleryUrls = normalizeImageUrlList(galleryRaw);
  const urls = [];
  const seen = new Set();

  if (mainUrl && !seen.has(mainUrl)) {
    urls.push(mainUrl);
    seen.add(mainUrl);
  }
  galleryUrls.forEach((url) => {
    if (!seen.has(url)) {
      urls.push(url);
      seen.add(url);
    }
  });

  const rawGalleryCount = splitListValues(galleryRaw).length;
  const invalidMainCount = mainRaw && !mainUrl ? 1 : 0;
  const invalidGalleryCount = Math.max(0, rawGalleryCount - galleryUrls.length);

  return {
    urls,
    mainUrl,
    galleryUrls,
    invalidCount: invalidMainCount + invalidGalleryCount,
  };
}

function normalizeProductImageInputs(showToast = false) {
  const mainInput = document.getElementById('pf-main-image');
  const galleryInput = document.getElementById('pf-gallery-images');
  const hiddenInput = document.getElementById('pf-images');
  if (!hiddenInput) return [];

  const { urls, mainUrl, galleryUrls, invalidCount } = collectProductImageUrlsFromInputs();
  if (mainInput && mainUrl) mainInput.value = mainUrl;
  if (galleryInput) {
    const extras = galleryUrls.filter((url) => url !== mainUrl);
    galleryInput.value = extras.join('\n');
  }
  hiddenInput.value = urls.join(', ');

  const statusEl = document.getElementById('pfImgStatus');
  if (statusEl) {
    if (!urls.length) {
      statusEl.textContent = invalidCount ? `0 valid images (${invalidCount} invalid URL${invalidCount === 1 ? '' : 's'})` : 'No images yet';
    } else {
      statusEl.textContent = `${urls.length} valid image URL${urls.length === 1 ? '' : 's'}${invalidCount ? ` (${invalidCount} invalid ignored)` : ''}`;
    }
  }

  updateImgPreviews();
  if (showToast) {
    if (urls.length) toast('ok', 'Images normalized', `${urls.length} image URL${urls.length === 1 ? '' : 's'} ready`);
    else toast('err', 'No valid image URLs', 'Paste direct image links or supported redirect links.');
  }
  return urls;
}

function addQuickProductImage() {
  const quickInput = document.getElementById('pf-quick-image');
  const mainInput = document.getElementById('pf-main-image');
  const galleryInput = document.getElementById('pf-gallery-images');
  if (!quickInput || !mainInput || !galleryInput) return;

  const rawUrl = quickInput.value.trim();
  if (!rawUrl) {
    toast('inf', 'No URL entered', 'Paste an image URL first.');
    return;
  }

  const normalized = normalizeImageUrl(rawUrl);
  if (!normalized) {
    toast('err', 'Invalid Image URL', 'Use a direct image URL or a supported redirect link.');
    return;
  }

  const mainCurrent = normalizeImageUrl(mainInput.value.trim());
  const galleryCurrent = normalizeImageUrlList(galleryInput.value);
  const combined = [];
  const seen = new Set();
  const addUnique = (url) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    combined.push(url);
  };

  addUnique(mainCurrent);
  galleryCurrent.forEach(addUnique);
  addUnique(normalized);

  mainInput.value = combined[0] || '';
  galleryInput.value = combined.slice(1).join('\n');
  quickInput.value = '';

  normalizeProductImageInputs(true);
  updateProductFormPreview();
  quickInput.focus();
}

function updateImgPreviews() {
  const input = document.getElementById('pf-images');
  if (!input) return;
  const urls = normalizeImageUrlList(input.value);
  const statusEl = document.getElementById('pfImgStatus');
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
      img.onerror = () => {
        slot.classList.remove('has-img');
        if (statusEl && !statusEl.textContent.includes('invalid')) {
          statusEl.textContent = `${urls.length} image URL${urls.length === 1 ? '' : 's'} loaded (1 failed)`;
        }
      };
      slot.insertBefore(img, slot.firstChild);
    } else {
      slot.classList.remove('has-img');
      const img = slot.querySelector('img');
      if (img) slot.removeChild(img);
    }
  }
}

function updateProductFormPreview() {
  const preview = document.getElementById('pfCardPreview');
  if (!preview) return;

  const name = document.getElementById('pf-name')?.value.trim() || 'Product Name';
  const brand = document.getElementById('pf-brand')?.value.trim() || 'Brand';
  const cat = normalizeCategoryValue(document.getElementById('pf-cat')?.value || 'accessories');
  const price = parseFloat(document.getElementById('pf-price')?.value || '0') || 0;
  const original = parseFloat(document.getElementById('pf-orig')?.value || '0') || 0;
  const badge = document.getElementById('pf-badge')?.value || '';
  const tagline = document.getElementById('pf-tagline')?.value.trim() || '';
  const stock = parseInt(document.getElementById('pf-stock')?.value || '0', 10) || 0;
  const sku = document.getElementById('pf-sku')?.value.trim() || '';
  const highlights = splitListValues(document.getElementById('pf-highlights')?.value || '').slice(0, 3);
  const variantEntries = normalizeVariantEntries(document.getElementById('pf-variants')?.value || '').slice(0, 4);
  const imageUrls = normalizeImageUrlList(document.getElementById('pf-images')?.value || '');
  const leadImage = imageUrls[0];
  const discount = original > price && price > 0 ? Math.round((1 - price / original) * 100) : 0;
  const stockText = stock <= 0 ? 'Out of stock' : stock < 5 ? `Only ${stock} left` : 'In stock';

  preview.innerHTML = `
    <div class="pfp-shell">
      <div class="pfp-media ${leadImage ? '' : 'pfp-fallback'}">
        ${leadImage ? `<img src="${escapeHtml(leadImage)}" alt="${escapeHtml(name)}" onerror="this.remove(); this.parentElement.classList.add('pfp-fallback')"/>` : ''}
        ${catIcon(cat)}
        ${badge ? `<span class="pfp-badge">${escapeHtml(badge)}</span>` : ''}
      </div>
      <div class="pfp-body">
        <div class="pfp-brand">${escapeHtml(brand)}</div>
        <div class="pfp-name">${escapeHtml(name)}</div>
        ${tagline ? `<div class="pfp-tagline">${escapeHtml(tagline)}</div>` : ''}
        <div class="pfp-meta">${escapeHtml(categoryDisplayName(cat))}${sku ? ` | SKU: ${escapeHtml(sku)}` : ''}</div>
        ${highlights.length ? `<div class="pfp-highlights">${highlights.map((h) => `<span>${escapeHtml(h)}</span>`).join('')}</div>` : ''}
        ${variantEntries.length ? `<div class="pfp-variants">${variantEntries.map((entry) => `
          <span class="pfp-variant ${entry.color ? 'has-color' : ''}" ${entry.color ? `style="--v-color:${entry.color}"` : ''}>
            ${entry.color ? '<span class="pfp-variant-dot" aria-hidden="true"></span>' : ''}
            ${escapeHtml(entry.label)}
          </span>
        `).join('')}</div>` : ''}
        <div class="pfp-footer">
          <div>
            <strong>KES ${price ? price.toLocaleString() : '0'}</strong>
            ${original > 0 ? `<small>KES ${original.toLocaleString()}</small>` : ''}
            ${discount > 0 ? `<em>-${discount}%</em>` : ''}
          </div>
          <span class="pfp-stock">${stockText}</span>
        </div>
      </div>
    </div>`;
}

function bindProdFormLivePreview() {
  const inputIds = [
    'pf-name', 'pf-brand', 'pf-cat', 'pf-price', 'pf-orig', 'pf-stock',
    'pf-badge', 'pf-sku', 'pf-tagline', 'pf-desc', 'pf-specs', 'pf-variants', 'pf-highlights',
  ];
  inputIds.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const evt = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(evt, updateProductFormPreview);
  });

  const mainImageInput = document.getElementById('pf-main-image');
  if (mainImageInput) {
    mainImageInput.addEventListener('input', () => {
      normalizeProductImageInputs(false);
      updateProductFormPreview();
    });
  }

  const galleryInput = document.getElementById('pf-gallery-images');
  if (galleryInput) {
    galleryInput.addEventListener('input', () => {
      normalizeProductImageInputs(false);
      updateProductFormPreview();
    });
  }
}

function focusMainImageInput() {
  const el = document.getElementById('pf-main-image');
  if (el) el.focus();
}

function focusGalleryImageInput() {
  const el = document.getElementById('pf-gallery-images');
  if (el) el.focus();
}

function focusImgInput() {
  focusGalleryImageInput();
}

