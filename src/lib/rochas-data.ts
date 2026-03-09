/**
 * rochas-data.js
 * Datos iniciales de Rocha's Rotisería.
 * En producción, estos datos vienen de Supabase.
 */

const BASE_IMG = "https://raw.githubusercontent.com/zzzJanozzz/Comida/main/";

export const ROCHAS_DATA = {
  businessName: "Rocha's Rotisería",
  emoji: "🍖",
  tagline: "Comida casera, abundante y a precios justos.",

  whatsapp: "543546488351",
  instagram: "rochasrotiseria",
  facebook: "",
  address: "Calle 3 755 (entre 14 y 16)",
  city: "Santa Rosa de Calamuchita, Córdoba",
  googleMapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3384.8261485789093!2d-64.5370502!3d-32.0825436!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95d2bb4b13c80831%3A0x5e3f200d15bd900d!2sRocha's%20rotiseria!5e0!3m2!1ses!2sar!4v1709567490000",
  googleMapsShort: "https://maps.app.goo.gl/QmARWF93kgw1FR8C9",

  hero: {
    badge: "Santa Rosa de Calamuchita · Córdoba",
    title: "El sabor de casa,",
    titleHighlight: "listo para llevar.",
    subtitle: "Comida casera, abundante y a precios justos. Hacé tu pedido por WhatsApp y pasá a buscarlo en Calle 3 755.",
    stats: [
      { icon: "⭐", value: "9.2", label: "puntuación local" },
      { icon: "📍", value: "Calle 3 755", label: "Villa Incor" },
      { icon: "🏠", value: "Comida casera", label: "cordobesa" },
    ],
  },

  schedule: {
    lun: { t1: { open: "11:30", close: "15:00", active: true  }, t2: { open: "20:30", close: "00:30", active: true  }, closed: false },
    mar: { t1: { open: "11:30", close: "15:00", active: true  }, t2: { open: "20:30", close: "00:30", active: true  }, closed: false },
    mie: { t1: { open: "11:30", close: "15:00", active: true  }, t2: { open: "20:30", close: "00:30", active: true  }, closed: false },
    jue: { t1: { open: "11:30", close: "15:00", active: true  }, t2: { open: "20:30", close: "00:30", active: true  }, closed: false },
    vie: { t1: { open: "11:30", close: "15:00", active: true  }, t2: { open: "20:30", close: "00:30", active: true  }, closed: false },
    sab: { t1: { open: "11:30", close: "15:00", active: true  }, t2: { open: "20:30", close: "00:30", active: true  }, closed: false },
    dom: { t1: { open: "11:30", close: "15:00", active: true  }, t2: { open: "20:30", close: "00:30", active: true  }, closed: false },
  },

  menuItems: [
    { id: 1,  nombre: "Lomito Americano",  categoria: "Lomitos",      precio: "3500", desc: "Pan, lechuga, tomate, bife, cheddar, cebolla, huevo y panceta + papas fritas!!!", imageUrl: BASE_IMG + "SaveClip.App_369996308_18283054210122984_257038325478517335_n.jpg", destacado: true,  disponible: true,  activo: true,  emoji: "🥩" },
    { id: 2,  nombre: "Lomito Clasico",    categoria: "Lomitos",      precio: "3000", desc: "Pan, lechuga, tomate, bife, jamon, queso, huevo + papas fritas!!!",                                   imageUrl: BASE_IMG + "SaveClip.App_568508155_18189018340327863_7996907510168956897_n.jpg", destacado: false, disponible: true,  activo: true,  emoji: "🥩" },
    { id: 3,  nombre: "XL Completa",       categoria: "Hamburguesas", precio: "3200", desc: "Pan, lechuga, tomate, medallon XL, jamon, queso, huevo + papas fritas!!!",                            imageUrl: BASE_IMG + "Hamburguesa-348-1-1024x1024.jpg",                                   destacado: true,  disponible: true,  activo: true,  emoji: "🍔" },
    { id: 4,  nombre: "XL Americana",      categoria: "Hamburguesas", precio: "3000", desc: "Pan, lechuga, tomate, cheddar, panceta, cebolla, huevo + papas fritas!!!",                            imageUrl: BASE_IMG + "Q2PIASNR4BD67KDXFWFX7C22LM.jpg",                                    destacado: false, disponible: true,  activo: true,  emoji: "🍔" },
    { id: 5,  nombre: "Sandwich de mila",  categoria: "Milanesas",    precio: "2800", desc: "Pan, lechuga, tomate, mila de ternera, jamon, queso, huevo + papas fritas!!!",                        imageUrl: BASE_IMG + "milanesa-italianajpg.jpg",                                           destacado: false, disponible: true,  activo: true,  emoji: "🥪" },
    { id: 6,  nombre: "Mila Clasica",      categoria: "Milanesas",    precio: "2800", desc: "Mila de ternera + guarnicion fritas/ensalada/pure!!!",                                                imageUrl: BASE_IMG + "milanesa-italianajpg.jpg",                                           destacado: false, disponible: true,  activo: true,  emoji: "🍖" },
    { id: 7,  nombre: "Mila Napolitana",   categoria: "Milanesas",    precio: "3000", desc: "Mila de ternera, salsa, oregano, muzza + guarnicion fritas/ensalada/pure!!!",                         imageUrl: BASE_IMG + "milanesa-a-la-napolitana-con-guarnicion-de-papas-VLWFAANIWBGPFO4CSUHS7RYVVQ.avif", destacado: true, disponible: true, activo: true, emoji: "🍖" },
    { id: 8,  nombre: "Mila Americana",    categoria: "Milanesas",    precio: "3200", desc: "Mila de ternera, cheddar, panceta, cebolla, huevo + guarnicion fritas/ensalada/pure!!!",              imageUrl: BASE_IMG + "453452355_18189018340327863_7996907510168956897_n.jpg",               destacado: false, disponible: true,  activo: true,  emoji: "🍖" },
    { id: 9,  nombre: "4 Quesos",          categoria: "Milanesas",    precio: "2800", desc: "Mila de ternera, queso azul, tybo, muzza, provolone + fritas/ensalada/pure!!!",                       imageUrl: BASE_IMG + "pizza-4quesos-scaled.jpg",                                           destacado: false, disponible: true,  activo: true,  emoji: "🧀" },
    { id: 10, nombre: "Pizza Muzzarella",  categoria: "Pizzas",       precio: "2500", desc: "Pizza con abundante queso muzzarella y piso crocante",                                                imageUrl: BASE_IMG + "santo-bar-pizzas-1jpg.jpg",                                          destacado: false, disponible: true,  activo: true,  emoji: "🍕" },
    { id: 11, nombre: "Pizza Especial",    categoria: "Pizzas",       precio: "2600", desc: "Salsa, jamon, muzza, tomates, aceitunas y oregano",                                                   imageUrl: BASE_IMG + "pizza-especial-salsa.jpg",                                           destacado: true,  disponible: true,  activo: true,  emoji: "🍕" },
    { id: 12, nombre: "Pizza Fugazzeta",   categoria: "Pizzas",       precio: "2400", desc: "Salsa, muzza, cebolla caramelizada, oregano y aceitunas",                                             imageUrl: BASE_IMG + "image-592.png",                                                      destacado: false, disponible: true,  activo: true,  emoji: "🍕" },
    { id: 13, nombre: "Pizza 4 Quesos",    categoria: "Pizzas",       precio: "2800", desc: "Salsa, muzza, tybo, azul, cheddar, aceitunas y oregano",                                             imageUrl: BASE_IMG + "pizza-4quesos-scaled.jpg",                                           destacado: false, disponible: true,  activo: true,  emoji: "🍕" },
    { id: 14, nombre: "Coca-Cola",         categoria: "Bebidas",      precio: "800",  desc: "Disponible : 500ml, 1L y 2.5L",                                                                       imageUrl: BASE_IMG + "cocacola.jpg",                                                       destacado: false, disponible: true,  activo: true,  emoji: "🥤" },
    { id: 15, nombre: "Sprite",            categoria: "Bebidas",      precio: "800",  desc: "Disponible : 500ml y 2L",                                                                             imageUrl: BASE_IMG + "sprite.jpg",                                                         destacado: false, disponible: true,  activo: true,  emoji: "🥤" },
    { id: 16, nombre: "Cerveza",           categoria: "Bebidas",      precio: "1200", desc: "Disponible : Corona 330ml, Brahma 500ml y Cordoba 473ml",                                             imageUrl: BASE_IMG + "2-Coronas.jpg",                                                      destacado: false, disponible: true,  activo: true,  emoji: "🍺" },
  ],

  whyCards: [
    { emoji: "🫙", title: "Porciones abundantes",       desc: "Nunca vas a quedar con hambre. Servimos como en casa — con la generosidad de siempre." },
    { emoji: "🪙", title: "Precios justos",              desc: "Comida rica y en cantidad no tiene por qué ser cara. Así lo entendemos nosotros." },
    { emoji: "🥬", title: "Ingredientes frescos",        desc: "Compramos y preparamos a diario. Sin congelados, sin atajos — el sabor se nota." },
    { emoji: "🏠", title: "Sabor casero real",           desc: "La receta de siempre, con el cariño de siempre. Como lo hacía la abuela, pero listo para llevar." },
    { emoji: "⚡", title: "Listo rápido",                desc: "Pedí por WhatsApp y pasá a buscarlo. Sin esperas largas ni sorpresas." },
    { emoji: "📍", title: "En el corazón del barrio",   desc: "Estamos en Villa Incor desde hace años. Somos parte de la comunidad." },
  ],

  rating: {
    score: "9.2",
    quote: "La mejor relación calidad–precio de la zona",
    quoteBody: "Porciones generosas, precios justos y el sabor de la comida de siempre. Por eso nuestros clientes vuelven.",
  },
};