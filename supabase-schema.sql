-- ─────────────────────────────────────────────────────────────────────────────
-- JL Studios CMS — Supabase Schema
-- Modelado a partir de la demo estática de Rocha's Rotisería.
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Habilitar extensión para UUIDs
create extension if not exists "pgcrypto";


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLA: clients
-- Un registro por negocio cliente de JL Studios.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists clients (
  id              uuid primary key default gen_random_uuid(),
  username        text unique not null,
  password_hash   text not null,           -- bcrypt hash, nunca texto plano
  business_name   text not null,
  emoji           text,
  niche           text not null check (niche in ('gastronomia','gimnasio','estetica','servicios')),
  plan            text not null default 'starter' check (plan in ('starter','profesional')),
  accent_color    text default '#f59e0b',
  domain          text,
  tagline         text,

  -- Contacto
  whatsapp        text,
  phone           text,
  instagram       text,
  facebook        text,
  address         text,
  city            text,
  google_maps_embed text,
  google_maps_short text,

  -- Hero
  hero_badge      text,
  hero_title      text,
  hero_title_highlight text,
  hero_subtitle   text,

  -- Rating strip
  rating_score    text default '9.2',
  rating_quote    text,
  rating_quote_body text,

  -- Infraestructura
  ssl_status      text default 'active' check (ssl_status in ('active','pending','inactive')),
  ssl_issuer      text default 'Cloudflare',
  ssl_expires_at  date,
  cdn_status      text default 'active',
  cdn_cache_hit   text default '0%',

  last_publish    timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Fila inicial: Rocha's Rotisería
insert into clients (
  username, password_hash, business_name, emoji, niche, plan, accent_color,
  domain, tagline,
  whatsapp, instagram, address, city,
  google_maps_embed, google_maps_short,
  hero_badge, hero_title, hero_title_highlight, hero_subtitle,
  rating_score, rating_quote, rating_quote_body,
  ssl_status, ssl_expires_at, cdn_cache_hit
) values (
  'rochas',
  '$2a$12$placeholder_hash_replace_with_bcrypt',  -- TODO: reemplazar con bcrypt('rochas2026')
  'Rocha''s Rotisería',
  '🍖',
  'gastronomia',
  'profesional',
  '#ea580c',
  'rochasrotiseria.com',
  'Comida casera, abundante y a precios justos.',
  '543546488351',
  'rochasrotiseria',
  'Calle 3 755 (entre 14 y 16)',
  'Santa Rosa de Calamuchita, Córdoba',
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3384.8261485789093!2d-64.5370502!3d-32.0825436!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95d2bb4b13c80831%3A0x5e3f200d15bd900d!2sRocha''s%20rotiseria!5e0!3m2!1ses!2sar!4v1709567490000',
  'https://maps.app.goo.gl/QmARWF93kgw1FR8C9',
  'Santa Rosa de Calamuchita · Córdoba',
  'El sabor de casa,',
  'listo para llevar.',
  'Comida casera, abundante y a precios justos. Hacé tu pedido por WhatsApp y pasá a buscarlo en Calle 3 755.',
  '9.2',
  'La mejor relación calidad–precio de la zona',
  'Porciones generosas, precios justos y el sabor de la comida de siempre. Por eso nuestros clientes vuelven.',
  'active',
  '2027-01-01',
  '94%'
);


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLA: schedules
-- Horarios por día con soporte de doble turno.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists schedules (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients(id) on delete cascade,
  day_key     text not null check (day_key in ('lun','mar','mié','jue','vie','sáb','dom')),
  closed      boolean not null default false,
  t1_open     time,
  t1_close    time,
  t1_active   boolean not null default true,
  t2_open     time,
  t2_close    time,
  t2_active   boolean not null default false,
  unique (client_id, day_key)
);

-- Horarios iniciales de Rocha's
insert into schedules (client_id, day_key, closed, t1_open, t1_close, t1_active, t2_open, t2_close, t2_active)
select
  c.id,
  d.day_key,
  d.closed,
  d.t1_open::time,
  d.t1_close::time,
  d.t1_active,
  d.t2_open::time,
  d.t2_close::time,
  d.t2_active
from clients c
cross join (values
  ('lun', false, '11:30', '15:00', true,  '20:30', '00:30', true),
  ('mar', false, '11:30', '15:00', true,  '20:30', '00:30', true),
  ('mié', false, '11:30', '15:00', true,  '20:30', '00:30', true),
  ('jue', false, '11:30', '15:00', true,  '20:30', '00:30', true),
  ('vie', false, '11:30', '15:00', true,  '20:30', '00:30', true),
  ('sáb', false, '11:30', '15:00', true,  '20:30', '00:30', true),
  ('dom', true,  null,    null,    false, null,    null,    false)
) as d(day_key, closed, t1_open, t1_close, t1_active, t2_open, t2_close, t2_active)
where c.username = 'rochas';


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLA: menu_items
-- Ítems del menú (gastronomía). Extensible a otros nichos con `item_type`.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists menu_items (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients(id) on delete cascade,
  nombre      text not null,
  categoria   text not null,
  precio      numeric(10,2) not null default 0,
  descripcion text,
  image_url   text,
  emoji       text default '🍽️',
  destacado   boolean not null default false,
  disponible  boolean not null default true,
  activo      boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Menú inicial de Rocha's
insert into menu_items (client_id, nombre, categoria, precio, descripcion, image_url, emoji, destacado, disponible, activo, sort_order)
select
  c.id,
  m.nombre, m.categoria, m.precio::numeric, m.descripcion, m.image_url, m.emoji,
  m.destacado, m.disponible, true, m.sort_order
from clients c
cross join (values
  ('Lomito Americano',  'Lomitos',      3500, 'Pan, lechuga, tomate, bife, cheddar, cebolla, huevo y panceta + papas fritas!!!',                    'https://raw.githubusercontent.com/zzzJanozzz/Comida/main/SaveClip.App_369996308_18283054210122984_257038325478517335_n.jpg', '🥩', true,  true,  1),
  ('Lomito Clasico',    'Lomitos',      3000, 'Pan, lechuga, tomate, bife, jamon, queso, huevo + papas fritas!!!',                                   'https://raw.githubusercontent.com/zzzJanozzz/Comida/main/SaveClip.App_568508155_18189018340327863_7996907510168956897_n.jpg', '🥩', false, true,  2),
  ('XL Completa',       'Hamburguesas', 3200, 'Pan, lechuga, tomate, medallon XL, jamon, queso, huevo + papas fritas!!!',                            'https://raw.githubusercontent.com/zzzJanozzz/Comida/main/Hamburguesa-348-1-1024x1024.jpg',                                   '🍔', true,  true,  3),
  ('XL Americana',      'Hamburguesas', 3000, 'Pan, lechuga, tomate, cheddar, panceta, cebolla, huevo + papas fritas!!!',                            'https://raw.githubusercontent.com/zzzJanozzz/Comida/main/Q2PIASNR4BD67KDXFWFX7C22LM.jpg',                                    '🍔', false, true,  4),
  ('Sandwich de mila',  'Milanesas',    2800, 'Pan, lechuga, tomate, mila de ternera, jamon, queso, huevo + papas fritas!!!',                        'https://raw.githubusercontent.com/zzzJanozzz/Comida/main/milanesa-italianajpg.jpg',                                           '🥪', false, true,  5),
  ('Mila Clasica',      'Milanesas',    2800, 'Mila de ternera + guarnicion fritas/ensalada/pure!!!',                                                'https://raw.githubusercontent.com/zzzJanozzz/Comida/main/milanesa-italianajpg.jpg',                                           '🍖', false, true,  6),
  ('Mila Napolitana',   'Milanesas',    3000, 'Mila de ternera, salsa, oregano, muzza + guarnicion fritas/ensalada/pure!!!',                         'https://raw.githubusercontent.com/zzzJanozzz/Comida/main/milanesa-a-la-napolitana-con-guarnicion-de-papas-VLWFAANIWBGPFO4CSUHS7RYVVQ.avif', '🍖', true, true, 7),
  ('Mila Americana',    'Milanesas',    3200, 'Mila de ternera, cheddar, panceta, cebolla, huevo + guarnicion fritas/ensalada/pure!!!',              'https://raw.githubusercontent.com/zzzJanozzz/Comida/main/453452355_18189018340327863_7996907510168956897_n.jpg',               '🍖', false, true,  8),
  ('4 Quesos',          'Milanesas',    2800, 'Mila de ternera, queso azul, tybo, muzza, provolone + fritas/ensalada/pure!!!',                       'https://raw.githubusercontent.com/zzzJanozzz/Comida/main/pizza-4quesos-scaled.jpg',                                           '🧀', false, true,  9),
  ('Pizza Muzzarella',  'Pizzas',       2500, 'Pizza con abundante queso muzzarella y piso crocante',                                                'https://raw.githubusercontent.com/zzzJanozzz/Comida/main/santo-bar-pizzas-1jpg.jpg',                                          '🍕', false, true,  10),
  ('Pizza Especial',    'Pizzas',       2600, 'Salsa, jamon, muzza, tomates, aceitunas y oregano',                                                   'https://raw.githubusercontent.com/zzzJanozzz/Comida/main/pizza-especial-salsa.jpg',                                           '🍕', true,  true,  11),
  ('Pizza Fugazzeta',   'Pizzas',       2400, 'Salsa, muzza, cebolla caramelizada, oregano y aceitunas',                                             'https://raw.githubusercontent.com/zzzJanozzz/Comida/main/image-592.png',                                                      '🍕', false, true,  12),
  ('Pizza 4 Quesos',    'Pizzas',       2800, 'Salsa, muzza, tybo, azul, cheddar, aceitunas y oregano',                                             'https://raw.githubusercontent.com/zzzJanozzz/Comida/main/pizza-4quesos-scaled.jpg',                                           '🍕', false, true,  13),
  ('Coca-Cola',         'Bebidas',       800, 'Disponible : 500ml, 1L y 2.5L',                                                                       'https://raw.githubusercontent.com/zzzJanozzz/Comida/main/cocacola.jpg',                                                       '🥤', false, true,  14),
  ('Sprite',            'Bebidas',       800, 'Disponible : 500ml y 2L',                                                                             'https://raw.githubusercontent.com/zzzJanozzz/Comida/main/sprite.jpg',                                                         '🥤', false, true,  15),
  ('Cerveza',           'Bebidas',      1200, 'Disponible : Corona 330ml, Brahma 500ml y Cordoba 473ml',                                             'https://raw.githubusercontent.com/zzzJanozzz/Comida/main/2-Coronas.jpg',                                                      '🍺', false, true,  16)
) as m(nombre, categoria, precio, descripcion, image_url, emoji, destacado, disponible, sort_order)
where c.username = 'rochas';


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLA: why_cards
-- Tarjetas de la sección "Por qué elegirnos".
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists why_cards (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients(id) on delete cascade,
  emoji       text not null,
  title       text not null,
  description text not null,
  sort_order  integer not null default 0
);

insert into why_cards (client_id, emoji, title, description, sort_order)
select c.id, w.emoji, w.title, w.description, w.sort_order
from clients c
cross join (values
  ('🫙', 'Porciones abundantes',     'Nunca vas a quedar con hambre. Servimos como en casa — con la generosidad de siempre.',    1),
  ('🪙', 'Precios justos',            'Comida rica y en cantidad no tiene por qué ser cara. Así lo entendemos nosotros.',          2),
  ('🥬', 'Ingredientes frescos',      'Compramos y preparamos a diario. Sin congelados, sin atajos — el sabor se nota.',           3),
  ('🏠', 'Sabor casero real',         'La receta de siempre, con el cariño de siempre. Como lo hacía la abuela, pero listo para llevar.', 4),
  ('⚡', 'Listo rápido',              'Pedí por WhatsApp y pasá a buscarlo. Sin esperas largas ni sorpresas.',                    5),
  ('📍', 'En el corazón del barrio', 'Estamos en Villa Incor desde hace años. Somos parte de la comunidad.',                     6)
) as w(emoji, title, description, sort_order)
where c.username = 'rochas';


-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- Cada cliente solo puede leer y escribir sus propios datos.
-- ─────────────────────────────────────────────────────────────────────────────
alter table clients    enable row level security;
alter table schedules  enable row level security;
alter table menu_items enable row level security;
alter table why_cards  enable row level security;

-- Política: el cliente autenticado solo accede a su propio registro
create policy "clients: own row only"
  on clients for all
  using (username = auth.jwt() ->> 'sub');

create policy "schedules: own client only"
  on schedules for all
  using (client_id = (select id from clients where username = auth.jwt() ->> 'sub'));

create policy "menu_items: own client only"
  on menu_items for all
  using (client_id = (select id from clients where username = auth.jwt() ->> 'sub'));

create policy "why_cards: own client only"
  on why_cards for all
  using (client_id = (select id from clients where username = auth.jwt() ->> 'sub'));


-- ─────────────────────────────────────────────────────────────────────────────
-- TRIGGER: updated_at automático
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger clients_updated_at    before update on clients    for each row execute function set_updated_at();
create trigger menu_items_updated_at before update on menu_items for each row execute function set_updated_at();
