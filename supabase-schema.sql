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

alter table public.products enable row level security;
alter table public.orders enable row level security;

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
end
$$;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.products to anon, authenticated;
grant select, insert, update, delete on public.orders to anon, authenticated;
