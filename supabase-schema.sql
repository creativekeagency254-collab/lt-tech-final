-- Life Time Technology Store
-- Supabase schema for products and orders used by the storefront/admin app.

create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null,
  brand text not null,
  price numeric(12,2) not null check (price >= 0),
  original_price numeric(12,2),
  stock integer not null default 0 check (stock >= 0),
  badge text,
  description text,
  variants jsonb not null default '[]'::jsonb,
  images jsonb not null default '[]'::jsonb,
  specs jsonb not null default '{}'::jsonb,
  sku text,
  tagline text,
  highlights jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_active on public.products(active);
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_created_at on public.products(created_at desc);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_name text,
  customer_email text not null,
  customer_phone text,
  delivery_area text,
  delivery_address text,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12,2) not null default 0,
  delivery_fee numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  currency text not null default 'KES',
  payment_method text not null,
  payment_status text not null default 'pending',
  paystack_ref text,
  order_status text not null default 'confirmed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  scope text not null check (scope in ('electronics', 'jewerlys')),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_store_categories_scope on public.store_categories(scope);
create index if not exists idx_store_categories_active on public.store_categories(active);
create index if not exists idx_store_categories_sort on public.store_categories(sort_order, name);

-- Upgrade existing installations (older schemas) safely.
alter table public.products add column if not exists slug text;
alter table public.products add column if not exists category text;
alter table public.products add column if not exists brand text;
alter table public.products add column if not exists price numeric(12,2);
alter table public.products add column if not exists original_price numeric(12,2);
alter table public.products add column if not exists stock integer default 0;
alter table public.products add column if not exists badge text;
alter table public.products add column if not exists description text;
alter table public.products add column if not exists variants jsonb default '[]'::jsonb;
alter table public.products add column if not exists images jsonb default '[]'::jsonb;
alter table public.products add column if not exists specs jsonb default '{}'::jsonb;
alter table public.products add column if not exists sku text;
alter table public.products add column if not exists tagline text;
alter table public.products add column if not exists highlights jsonb default '[]'::jsonb;
alter table public.products add column if not exists active boolean default true;
alter table public.products add column if not exists created_at timestamptz default now();
alter table public.products add column if not exists updated_at timestamptz default now();

update public.products set variants = '[]'::jsonb where variants is null;
update public.products set images = '[]'::jsonb where images is null;
update public.products set specs = '{}'::jsonb where specs is null;
update public.products set highlights = '[]'::jsonb where highlights is null;
update public.products set stock = 0 where stock is null;
update public.products set active = true where active is null;
update public.products
set slug = lower(regexp_replace(coalesce(name, gen_random_uuid()::text), '[^a-z0-9]+', '-', 'g'))
where slug is null or slug = '';

alter table public.products alter column variants set default '[]'::jsonb;
alter table public.products alter column images set default '[]'::jsonb;
alter table public.products alter column specs set default '{}'::jsonb;
alter table public.products alter column highlights set default '[]'::jsonb;
alter table public.products alter column stock set default 0;
alter table public.products alter column active set default true;
alter table public.products alter column created_at set default now();
alter table public.products alter column updated_at set default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_slug_key'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products add constraint products_slug_key unique (slug);
  end if;
exception when others then
  -- keep migration idempotent even if legacy data has duplicate slugs
  null;
end
$$;

alter table public.orders add column if not exists order_number text;
alter table public.orders add column if not exists customer_name text;
alter table public.orders add column if not exists customer_email text;
alter table public.orders add column if not exists customer_phone text;
alter table public.orders add column if not exists delivery_area text;
alter table public.orders add column if not exists delivery_address text;
alter table public.orders add column if not exists items jsonb default '[]'::jsonb;
alter table public.orders add column if not exists subtotal numeric(12,2) default 0;
alter table public.orders add column if not exists delivery_fee numeric(12,2) default 0;
alter table public.orders add column if not exists total numeric(12,2) default 0;
alter table public.orders add column if not exists currency text default 'KES';
alter table public.orders add column if not exists payment_method text;
alter table public.orders add column if not exists payment_status text default 'pending';
alter table public.orders add column if not exists paystack_ref text;
alter table public.orders add column if not exists order_status text default 'confirmed';
alter table public.orders add column if not exists created_at timestamptz default now();
alter table public.orders add column if not exists updated_at timestamptz default now();

update public.orders set items = '[]'::jsonb where items is null;
update public.orders set subtotal = 0 where subtotal is null;
update public.orders set delivery_fee = 0 where delivery_fee is null;
update public.orders set total = 0 where total is null;
update public.orders set currency = 'KES' where currency is null or currency = '';
update public.orders set payment_status = 'pending' where payment_status is null or payment_status = '';
update public.orders set order_status = 'confirmed' where order_status is null or order_status = '';
update public.orders
set order_number = concat('LTL-', upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8)))
where order_number is null or order_number = '';

alter table public.orders alter column items set default '[]'::jsonb;
alter table public.orders alter column subtotal set default 0;
alter table public.orders alter column delivery_fee set default 0;
alter table public.orders alter column total set default 0;
alter table public.orders alter column currency set default 'KES';
alter table public.orders alter column payment_status set default 'pending';
alter table public.orders alter column order_status set default 'confirmed';
alter table public.orders alter column created_at set default now();
alter table public.orders alter column updated_at set default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'orders_order_number_key'
      and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders add constraint orders_order_number_key unique (order_number);
  end if;
exception when others then
  -- keep migration idempotent even if legacy data has duplicate order numbers
  null;
end
$$;

alter table public.store_categories add column if not exists slug text;
alter table public.store_categories add column if not exists name text;
alter table public.store_categories add column if not exists scope text;
alter table public.store_categories add column if not exists active boolean default true;
alter table public.store_categories add column if not exists sort_order integer default 0;
alter table public.store_categories add column if not exists created_at timestamptz default now();
alter table public.store_categories add column if not exists updated_at timestamptz default now();

update public.store_categories set name = coalesce(nullif(trim(name), ''), initcap(replace(slug, '-', ' ')));
update public.store_categories
set slug = lower(regexp_replace(coalesce(slug, name, gen_random_uuid()::text), '[^a-z0-9]+', '-', 'g'))
where slug is null or slug = '';
update public.store_categories set scope = 'electronics' where scope is null or scope = '';
update public.store_categories set active = true where active is null;
update public.store_categories set sort_order = 0 where sort_order is null;
update public.store_categories set created_at = now() where created_at is null;
update public.store_categories set updated_at = now() where updated_at is null;
update public.store_categories set scope = 'electronics' where scope not in ('electronics', 'jewerlys');

alter table public.store_categories alter column active set default true;
alter table public.store_categories alter column sort_order set default 0;
alter table public.store_categories alter column created_at set default now();
alter table public.store_categories alter column updated_at set default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'store_categories_slug_key'
      and conrelid = 'public.store_categories'::regclass
  ) then
    alter table public.store_categories add constraint store_categories_slug_key unique (slug);
  end if;
exception when others then
  -- keep migration idempotent even if legacy data has duplicate slugs
  null;
end
$$;

create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_orders_payment_status on public.orders(payment_status);
create index if not exists idx_orders_order_status on public.orders(order_status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists trg_store_categories_updated_at on public.store_categories;
create trigger trg_store_categories_updated_at
before update on public.store_categories
for each row execute function public.set_updated_at();

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.store_categories enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'products' and policyname = 'products_public_all'
  ) then
    create policy products_public_all
      on public.products
      for all
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'orders' and policyname = 'orders_public_all'
  ) then
    create policy orders_public_all
      on public.orders
      for all
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public' and tablename = 'store_categories' and policyname = 'store_categories_public_all'
  ) then
    create policy store_categories_public_all
      on public.store_categories
      for all
      using (true)
      with check (true);
  end if;
end
$$;

-- Seed starter jewelry catalog (idempotent via slug).
insert into public.products (
  name, slug, category, brand, price, original_price, stock, badge, description,
  variants, images, specs, sku, tagline, highlights, active
)
values
  (
    'Gold Layered Necklace Set', 'gold-layered-necklace-set', 'jewelry-necklaces', 'LTL Jewelry',
    4999, 6500, 24, 'Hot', 'Elegant layered necklace set for daily wear and occasion styling.',
    '["Classic Gold"]'::jsonb, '[]'::jsonb,
    '{"Material":"Gold-plated alloy","Pieces":"3","Finish":"Polished","Closure":"Lobster clasp"}'::jsonb,
    'LTL-NK-001', 'Layered elegance for everyday styling',
    '["Gift ready","Lightweight","Daily wear"]'::jsonb, true
  ),
  (
    'Sterling Silver Ring', 'sterling-silver-ring', 'jewelry-rings', 'LTL Jewelry',
    3999, null, 18, 'New', 'Minimal sterling silver ring with comfortable fit and timeless look.',
    '["Silver"]'::jsonb, '[]'::jsonb,
    '{"Material":"925 Sterling Silver","Size":"Adjustable","Weight":"Lightweight","Finish":"Matte"}'::jsonb,
    'LTL-RG-013', 'Minimal ring with timeless finish',
    '["Adjustable fit","Gift option"]'::jsonb, true
  ),
  (
    'Crystal Charm Bracelet', 'crystal-charm-bracelet', 'jewelry-bracelets', 'LTL Jewelry',
    4599, 5200, 21, null, 'Adjustable crystal charm bracelet designed for gift-ready elegance.',
    '["Rose Gold","Silver"]'::jsonb, '[]'::jsonb,
    '{"Material":"Alloy + crystals","Length":"Adjustable","Closure":"Slide lock","Style":"Charm"}'::jsonb,
    'LTL-BR-021', 'Charm bracelet with crystal accents',
    '["Adjustable","Polished finish"]'::jsonb, true
  ),
  (
    'Classic Jewelry Watch', 'classic-jewelry-watch', 'jewelry-watches', 'LTL Jewelry',
    8999, 10500, 13, 'Sale', 'Fashion jewelry watch with slim dial and premium strap finish.',
    '["Gold","Silver"]'::jsonb, '[]'::jsonb,
    '{"Dial":"34mm","Strap":"Stainless steel","Water":"3ATM","Battery":"Quartz"}'::jsonb,
    'LTL-JW-034', 'Fashion watch with elegant dial',
    '["Gift option","Slim profile"]'::jsonb, true
  ),
  (
    'Pearl Drop Earrings', 'pearl-drop-earrings', 'jewelry-earrings', 'LTL Jewelry',
    3799, 4500, 26, 'Hot', 'Elegant pearl drop earrings with lightweight comfort and classic style.',
    '["Ivory Pearl","Rose Pearl"]'::jsonb, '[]'::jsonb,
    '{"Material":"Alloy + faux pearl","Length":"3.2cm","Closure":"Push back","Finish":"Gloss"}'::jsonb,
    'LTL-ER-032', 'Classic pearl drop earrings',
    '["Lightweight","Occasion ready"]'::jsonb, true
  ),
  (
    'Minimalist Hoop Earrings', 'minimalist-hoop-earrings', 'jewelry-earrings', 'LTL Jewelry',
    3299, null, 31, 'New', 'Everyday hoop earrings with polished finish for modern casual looks.',
    '["Gold","Silver"]'::jsonb, '[]'::jsonb,
    '{"Material":"Gold-plated steel","Diameter":"24mm","Weight":"Lightweight","Closure":"Latch back"}'::jsonb,
    'LTL-ER-024', 'Clean modern hoop style',
    '["Everyday use","Lightweight"]'::jsonb, true
  ),
  (
    'Infinity Pendant Necklace', 'infinity-pendant-necklace', 'jewelry-necklaces', 'LTL Jewelry',
    5499, 6200, 17, 'Sale', 'Infinity pendant necklace crafted for gifting and premium daily styling.',
    '["Gold","Silver"]'::jsonb, '[]'::jsonb,
    '{"Material":"Stainless steel","Chain":"Adjustable 40-45cm","Plating":"18K gold","Closure":"Lobster clasp"}'::jsonb,
    'LTL-NK-045', 'Infinity pendant with premium plating',
    '["Adjustable chain","Gift ready"]'::jsonb, true
  ),
  (
    'Cubic Zirconia Ring Set', 'cz-ring-set', 'jewelry-rings', 'LTL Jewelry',
    4699, 5300, 22, 'Hot', 'Sparkling cubic zirconia ring set with stackable slim-band design.',
    '["Silver","Rose Gold"]'::jsonb, '[]'::jsonb,
    '{"Material":"Sterling silver","Stone":"Cubic zirconia","Sizes":"6-9","Finish":"High polish"}'::jsonb,
    'LTL-RG-069', 'Stackable CZ ring set',
    '["Stackable design","Premium sparkle"]'::jsonb, true
  )
on conflict (slug) do update
set
  category = excluded.category,
  brand = excluded.brand,
  price = excluded.price,
  original_price = excluded.original_price,
  stock = excluded.stock,
  badge = excluded.badge,
  description = excluded.description,
  variants = excluded.variants,
  specs = excluded.specs,
  sku = excluded.sku,
  tagline = excluded.tagline,
  highlights = excluded.highlights,
  active = excluded.active,
  updated_at = now();

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.products to anon, authenticated;
grant select, insert, update, delete on public.orders to anon, authenticated;
grant select, insert, update, delete on public.store_categories to anon, authenticated;
