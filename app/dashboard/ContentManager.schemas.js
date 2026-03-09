/**
 * ContentManager.schemas.js
 * Esquemas para cada tipo de negocio (niche)
 */

import { UtensilsCrossed, Dumbbell, Scissors, Package } from "lucide-react";

export const NICHE_SCHEMAS = {
  gastronomia: {
    label: "Restaurante / Gastronomía",
    Icon: UtensilsCrossed,
    itemLabel: "Plato",
    itemsLabel: "Menú y Productos",
    categoryField: "categoria",
    priceField: "precio",
    fields: [
      { key: "nombre", label: "Nombre del plato", type: "text", required: true, placeholder: "Ej: Pizza Margarita" },
      { key: "categoria", label: "Categoría", type: "select", required: true, options: ["Lomitos", "Hamburguesas", "Milanesas", "Pizzas", "Bebidas", "Entradas", "Postres", "Combos"] },
      { key: "precio", label: "Precio ($)", type: "price", required: true, placeholder: "0.00", mono: true },
      { key: "descripcion", label: "Descripción", type: "textarea", required: false, placeholder: "Ingredientes, alérgenos, etc." },
      { key: "image_url", label: "URL de la foto", type: "text", required: false, placeholder: "https://... (Supabase Storage o GitHub raw)" },
      { key: "destacado", label: "Plato destacado (badge en la web)", type: "toggle", required: false },
      { key: "disponible", label: "Disponible hoy", type: "toggle", required: false },
    ],
    extraColumns: ["categoria"],
  },

  gimnasio: {
    label: "Gimnasio / Centro Deportivo",
    Icon: Dumbbell,
    itemLabel: "Clase",
    itemsLabel: "Clases y Horarios",
    categoryField: "disciplina",
    priceField: "cuota",
    fields: [
      { key: "nombre", label: "Nombre de la clase", type: "text", required: true, placeholder: "Ej: CrossFit Avanzado" },
      { key: "disciplina", label: "Disciplina", type: "select", required: true, options: ["Cardio", "Musculación", "Yoga", "Pilates", "Crossfit", "Boxeo", "Spinning", "Natación"] },
      { key: "cuota", label: "Cuota mensual ($)", type: "price", required: true, placeholder: "0.00", mono: true },
      { key: "horario", label: "Días y horario", type: "text", required: true, placeholder: "Lun/Mié/Vie 07:00-08:00" },
      { key: "instructor", label: "Instructor", type: "text", required: true, placeholder: "Nombre del instructor" },
      { key: "capacidad", label: "Cupo máximo", type: "number", required: false, placeholder: "20" },
      { key: "descripcion", label: "Descripción", type: "textarea", required: false, placeholder: "Nivel, equipamiento necesario..." },
      { key: "disponible", label: "Inscripciones abiertas", type: "toggle", required: false },
    ],
    extraColumns: ["disciplina", "instructor", "horario"],
  },

  estetica: {
    label: "Salón de Belleza / Estética",
    Icon: Scissors,
    itemLabel: "Servicio",
    itemsLabel: "Servicios del Salón",
    categoryField: "categoria",
    priceField: "precio",
    fields: [
      { key: "nombre", label: "Nombre del servicio", type: "text", required: true, placeholder: "Ej: Manicura Gel" },
      { key: "categoria", label: "Categoría", type: "select", required: true, options: ["Uñas", "Cabello", "Masajes", "Facial", "Depilación", "Maquillaje", "Combos"] },
      { key: "precio", label: "Precio ($)", type: "price", required: true, placeholder: "0.00", mono: true },
      { key: "duracion", label: "Duración (minutos)", type: "number", required: true, placeholder: "60" },
      { key: "profesional", label: "Profesional a cargo", type: "text", required: false, placeholder: "Nombre del/la profesional" },
      { key: "descripcion", label: "Descripción", type: "textarea", required: false, placeholder: "Materiales usados, cuidados post-servicio..." },
      { key: "reserva", label: "Requiere turno previo", type: "toggle", required: false },
      { key: "disponible", label: "Disponible", type: "toggle", required: false },
    ],
    extraColumns: ["categoria", "duracion", "profesional"],
  },

  servicios: {
    label: "Servicios / Reparaciones",
    Icon: Package,
    itemLabel: "Servicio",
    itemsLabel: "Servicios",
    categoryField: "categoria",
    priceField: "precio",
    fields: [
      { key: "nombre", label: "Nombre del servicio", type: "text", required: true, placeholder: "Ej: Mantenimiento de AC" },
      { key: "categoria", label: "Categoría", type: "select", required: true, options: ["Electricidad", "Plomería", "Construcción", "Limpieza", "Reparación", "Instalación"] },
      { key: "precio", label: "Precio base ($)", type: "price", required: true, placeholder: "0.00", mono: true },
      { key: "descripcion", label: "Descripción", type: "textarea", required: false, placeholder: "Detalles del servicio..." },
      { key: "disponible", label: "Disponible", type: "toggle", required: false },
    ],
    extraColumns: ["categoria"],
  },
};
