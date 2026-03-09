-- =============================================================================
-- JL Studios CMS - Supabase Schema
-- SEGURO para ejecutar multiples veces (ON CONFLICT DO NOTHING en todos los INSERT)
-- =============================================================================

create extension if not exists "pgcrypto";

-- =============================================================================
-- TABLAS
-- =============================================================================

create table if not exists clients (
  id                   uuid primary key default gen_random_uuid(),
  username             text unique not null,
  password_hash        text not null,
  business_name        text not null,
  emoji                text,
  niche                text not null default 'gastronomia',
  plan                 text not null default 'starter',
  accent_color         text default '#f59e0b',
  domain               text,
  tagline              text,
  whatsapp             text,
  phone                text,
  instagram            text,
  facebook             text,
  address              text,
  city                 text,
  google_maps_embed    text,
  google_maps_short    text,
  hero_badge           text,
  hero_title           text,
  hero_title_highlight text,
  hero_subtitle        text,
  rating_score         text default '9.2',
  rating_quote         text,
  rating_quote_body    text,
  last_publish         timestamptz,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

create table if not exists schedules (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients(id) on delete cascade,
  day_key     text not null,
  closed      boolean not null default false,
  t1_open     text,
  t1_close    text,
  t1_active   boolean not null default true,
  t2_open     text,
  t2_close    text,
  t2_active   boolean not null default false,
  unique (client_id, day_key)
);

create table if not exists menu_items (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients(id) on delete cascade,
  nombre      text not null,
  categoria   text not null,
  precio      numeric(10,2) not null default 0,
  descripcion text,
  image_url   text,
  emoji       text,
  destacado   boolean not null default false,
  disponible  boolean not null default true,
  activo      boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists why_cards (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients(id) on delete cascade,
  emoji       text,
  title       text not null,
  description text not null,
  sort_order  integer not null default 0
);

-- =============================================================================
-- DATOS DE ROCHAS
-- ON CONFLICT DO NOTHING = si ya existe, no hace nada, no tira error
-- =============================================================================

insert into clients (
  username, password_hash, business_name, niche, plan, accent_color,
  domain, tagline, whatsapp, phone, instagram,
  address, city, google_maps_short,
  hero_badge, hero_title, hero_title_highlight, hero_subtitle,
  rating_score, rating_quote, rating_quote_body
) values (
  'rochas',
  'rochas2026',
  'Rocha Rotiseria',
  'gastronomia',
  'profesional',
  '#ea580c',
  'rochasrotiseria.com',
  'Comida casera, abundante y a precios justos.',
  '543546488351',
  '+54 9 3546 48-8351',
  'rochasrotiseria',
  'Calle 3 755 (entre 14 y 16)',
  'Santa Rosa de Calamuchita, Cordoba',
  'https://maps.app.goo.gl/QmARWF93kgw1FR8C9',
  'Santa Rosa de Calamuchita - Cordoba',
  'El sabor de casa,',
  'listo para llevar.',
  'Comida casera, abundante y a precios justos. Hace tu pedido por WhatsApp y pasa a buscarlo en Calle 3 755.',
  '9.2',
  'La mejor relacion calidad-precio de la zona',
  'Porciones generosas, precios justos y el sabor de la comida de siempre. Por eso nuestros clientes vuelven.'
)
on conflict (username) do nothing;


-- Horarios (doble turno: mediodia y noche)
insert into schedules (client_id, day_key, closed, t1_open, t1_close, t1_active, t2_open, t2_close, t2_active)
select c.id, d.day_key, d.closed::boolean, d.t1_open, d.t1_close, d.t1_active::boolean, d.t2_open, d.t2_close, d.t2_active::boolean
from clients c
cross join (values
  ('lun', 'false', '11:30', '15:00', 'true',  '20:30', '00:30', 'true'),
  ('mar', 'false', '11:30', '15:00', 'true',  '20:30', '00:30', 'true'),
  ('mie', 'false', '11:30', '15:00', 'true',  '20:30', '00:30', 'true'),
  ('jue', 'false', '11:30', '15:00', 'true',  '20:30', '00:30', 'true'),
  ('vie', 'false', '11:30', '15:00', 'true',  '20:30', '00:30', 'true'),
  ('sab', 'false', '11:30', '15:00', 'true',  '20:30', '00:30', 'true'),
  ('dom', 'true',  null,    null,    'false', null,    null,    'false')
) as d(day_key, closed, t1_open, t1_close, t1_active, t2_open, t2_close, t2_active)
where c.username = 'rochas'
on conflict (client_id, day_key) do nothing;


-- Menu completo
insert into menu_items (client_id, nombre, categoria, precio, descripcion, image_url, emoji, destacado, sort_order)
select c.id, m.nombre, m.categoria, m.precio::numeric, m.descripcion, m.image_url, m.emoji, m.destacado::boolean, m.sort_order::int
from clients c
cross join (values
  ('Lomito Americano',  'Lomitos',      '3500', 'Pan, lechuga, tomate, bife, cheddar, cebolla, huevo y panceta + papas fritas', 'https://raw.githubusercontent.com/zzzJanozzz/Comida/main/SaveClip.App_369996308_18283054210122984_257038325478517335_n.jpg', '🥩', 'true',  '1'),
  ('Lomito Clasico',    'Lomitos',      '3000', 'Pan, lechuga, tomate, bife, jamon, queso, huevo + papas fritas',               'https://raw.githubusercontent.com/zzzJanozzz/Comida/main/SaveClip.App_568508155_18189018340327863_7996907510168956897_n.jpg', '🥩', 'false', '2'),
  ('XL Completa',       'Hamburguesas', '3200', 'Pan, lechuga, tomate, medallon XL, jamon, queso, huevo + papas fritas',        'https://raw.githubusercontent.com/zzzJanozzz/Comida/main/Hamburguesa-348-1-1024x1024.jpg',                                   '🍔', 'true',  '3'),
  ('XL Americana',      'Hamburguesas', '3000', 'Pan, lechuga, tomate, cheddar, panceta, cebolla, huevo + papas fritas',        'https://raw.githubusercontent.com/zzzJanozzz/Comida/main/Q2PIASNR4BD67KDXFWFX7C22LM.jpg',                                    '🍔', 'false', '4'),
  ('Sandwich de mila',  'Milanesas',    '2800', 'Pan, lechuga, tomate, mila de ternera, jamon, queso, huevo + papas fritas',    'https://raw.githubusercontent.com/zzzJanozzz/Comida/main/milanesa-italianajpg.jpg',                                           '🥪', 'false', '5'),
  ('Mila Clasica',      'Milanesas',    '2800', 'Mila de ternera + guarnicion fritas/ensalada/pure',                            'https://raw.githubusercontent.com/zzzJanozzz/Comida/main/milanesa-italianajpg.jpg',                                           '🍖', 'false', '6'),
  ('Mila Napolitana',   'Milanesas',    '3000', 'Mila de ternera, salsa, oregano, muzza + guarnicion fritas/ensalada/pure',     'https://raw.githubusercontent.com/zzzJanozzz/Comida/main/milanesa-a-la-napolitana-con-guarnicion-de-papas-VLWFAANIWBGPFO4CSUHS7RYVVQ.avif', '🍖', 'true', '7'),
  ('Mila Americana',    'Milanesas',    '3200', 'Mila de ternera, cheddar, panceta, cebolla, huevo + guarnicion',               'https://raw.githubusercontent.com/zzzJanozzz/Comida/main/453452355_18189018340327863_7996907510168956897_n.jpg',               '🍖', 'false', '8'),
  ('4 Quesos',          'Milanesas',    '2800', 'Mila de ternera, queso azul, tybo, muzza, provolone + guarnicion',             'https://raw.githubusercontent.com/zzzJanozzz/Comida/main/pizza-4quesos-scaled.jpg',                                           '🧀', 'false', '9'),
  ('Pizza Muzzarella',  'Pizzas',       '2500', 'Pizza con abundante queso muzzarella y piso crocante',                         'https://raw.githubusercontent.com/zzzJanozzz/Comida/main/santo-bar-pizzas-1jpg.jpg',                                          '🍕', 'false', '10'),
  ('Pizza Especial',    'Pizzas',       '2600', 'Salsa, jamon, muzza, tomates, aceitunas y oregano',                            'https://raw.githubusercontent.com/zzzJanozzz/Comida/main/pizza-especial-salsa.jpg',                                           '🍕', 'true',  '11'),
  ('Pizza Fugazzeta',   'Pizzas',       '2400', 'Salsa, muzza, cebolla caramelizada, oregano y aceitunas',                      'https://raw.githubusercontent.com/zzzJanozzz/Comida/main/image-592.png',                                                      '🍕', 'false', '12'),
  ('Pizza 4 Quesos',    'Pizzas',       '2800', 'Salsa, muzza, tybo, azul, cheddar, aceitunas y oregano',                      'https://raw.githubusercontent.com/zzzJanozzz/Comida/main/pizza-4quesos-scaled.jpg',                                           '🍕', 'false', '13'),
  ('Coca-Cola',         'Bebidas',       '800', 'Disponible: 500ml, 1L y 2.5L',                                                 'https://raw.githubusercontent.com/zzzJanozzz/Comida/main/cocacola.jpg',                                                       '🥤', 'false', '14'),
  ('Sprite',            'Bebidas',       '800', 'Disponible: 500ml y 2L',                                                       'https://raw.githubusercontent.com/zzzJanozzz/Comida/main/sprite.jpg',                                                         '🥤', 'false', '15'),
  ('Cerveza',           'Bebidas',      '1200', 'Disponible: Corona 330ml, Brahma 500ml y Cordoba 473ml',                       'https://raw.githubusercontent.com/zzzJanozzz/Comida/main/2-Coronas.jpg',                                                      '🍺', 'false', '16')
) as m(nombre, categoria, precio, descripcion, image_url, emoji, destacado, sort_order)
where c.username = 'rochas'
on conflict do nothing;


-- Why cards
insert into why_cards (client_id, emoji, title, description, sort_order)
select c.id, w.emoji, w.title, w.description, w.sort_order::int
from clients c
cross join (values
  ('🫙', 'Porciones abundantes',     'Nunca vas a quedar con hambre. Servimos como en casa, con la generosidad de siempre.',    '1'),
  ('🪙', 'Precios justos',            'Comida rica y en cantidad no tiene por que ser cara. Asi lo entendemos nosotros.',         '2'),
  ('🥬', 'Ingredientes frescos',      'Compramos y preparamos a diario. Sin congelados, sin atajos, el sabor se nota.',           '3'),
  ('🏠', 'Sabor casero real',         'La receta de siempre, con el carino de siempre. Como lo hacia la abuela, pero listo para llevar.', '4'),
  ('⚡', 'Listo rapido',              'Pedi por WhatsApp y pasa a buscarlo. Sin esperas largas ni sorpresas.',                    '5'),
  ('📍', 'En el barrio',              'Estamos en Villa Incor desde hace anos. Somos parte de la comunidad.',                     '6')
) as w(emoji, title, description, sort_order)
where c.username = 'rochas'
on conflict do nothing;


-- =============================================================================
-- TRIGGER updated_at automatico
-- =============================================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists clients_updated_at    on clients;
drop trigger if exists menu_items_updated_at on menu_items;

create trigger clients_updated_at
  before update on clients
  for each row execute function set_updated_at();

create trigger menu_items_updated_at
  before update on menu_items
  for each row execute function set_updated_at();
