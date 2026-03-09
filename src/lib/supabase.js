/**
 * supabase.js
 * Cliente de Supabase para el CMS
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Variables de Supabase no configuradas. Usando datos mock.');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');

/**
 * Obtener datos de cliente (negocio) por username
 */
export async function getClientByUsername(username) {
  try {
    console.log('🔍 Buscando usuario:', username);
    
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('username', username);

    if (error) {
      console.error('❌ Error de Supabase:', error.message);
      throw error;
    }
    
    console.log('📊 Resultados encontrados:', data?.length);
    
    if (!data || data.length === 0) {
      console.warn('⚠️ Usuario no encontrado:', username);
      return null;
    }
    
    if (data.length > 1) {
      console.warn('⚠️ Múltiples usuarios encontrados, usando el primero');
    }
    
    console.log('✅ Usuario encontrado:', data[0].username);
    return data[0];
  } catch (error) {
    console.error('Error fetching client:', error);
    return null;
  }
}

/**
 * Obtener tarjetas "Por qué elegirnos" de un cliente
 */
export async function getWhyCards(clientId) {
  try {
    const { data, error } = await supabase
      .from('why_cards')
      .select('*')
      .eq('client_id', clientId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching why cards:', error);
    return [];
  }
}

/**
 * Obtener items del menú
 */
export async function getMenuItems(clientId) {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('client_id', clientId)
      .eq('activo', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return [];
  }
}

/**
 * Obtener horarios
 */
export async function getSchedules(clientId) {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('client_id', clientId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return [];
  }
}

/**
 * Autenticar usuario (login)
 */
export async function loginUser(username, password) {
  try {
    // Buscar usuario por username y verificar contraseña
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !data) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    // Verificar contraseña (en producción, usar Supabase Auth)
    // Por ahora, comparar texto simple (NO RECOMENDADO en producción)
    if (data.password_hash !== password) {
      return { success: false, error: 'Contraseña incorrecta' };
    }

    return { success: true, user: data };
  } catch (error) {
    console.error('Error in loginUser:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Actualizar tarjetas "Por qué elegirnos"
 */
export async function updateWhyCards(clientId, whyCards) {
  try {
    // Primero, eliminar las antiguas
    await supabase
      .from('why_cards')
      .delete()
      .eq('client_id', clientId);

    // Luego, insertar las nuevas
    const { data, error } = await supabase
      .from('why_cards')
      .insert(
        whyCards.map((card, idx) => ({
          client_id: clientId,
          emoji: card.emoji,
          title: card.title,
          description: card.desc,
          sort_order: idx,
        }))
      );

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating why cards:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Actualizar datos del cliente (rating, info, etc)
 */
export async function updateClient(clientId, updates) {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', clientId);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating client:', error);
    return { success: false, error: error.message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPABASE STORAGE — Image upload/delete helpers
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_BUCKET = 'media';

/**
 * Upload an image to Supabase Storage.
 * @param {string} storagePath  e.g. "rochas/items/abc123.webp"
 * @param {File}   file         Browser File object
 * @returns {string} Public URL of the uploaded image
 */
export async function uploadImage(storagePath, file) {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, {
      upsert: true,
      contentType: file.type,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(storagePath);

  return urlData.publicUrl;
}

/**
 * Delete an image from Supabase Storage.
 * @param {string} storagePath  e.g. "rochas/items/abc123.webp"
 */
export async function deleteStorageImage(storagePath) {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([storagePath]);
  if (error) console.error('Error deleting image:', error);
}

/**
 * Get the file extension from a MIME type
 */
export function extFromMime(mimeType) {
  const map = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
  return map[mimeType] || 'jpg';
}

/**
 * Update fixed slot URL (logo, hero) in the clients table
 */
export async function updateClientMediaSlot(clientId, slotKey, url) {
  const column = slotKey === 'logo' ? 'logo_url'
               : slotKey === 'portada' ? 'hero_url'
               : null;
  if (!column) return; // Only logo and hero are persisted to clients table

  const { error } = await supabase
    .from('clients')
    .update({ [column]: url })
    .eq('id', clientId);

  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────────────────────
// MENU ITEMS — CRUD helpers for Dashboard
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Map Supabase menu_item row → UI field names
 */
function mapMenuItemFromDB(item) {
  return {
    ...item,
    desc: item.descripcion,
    imageUrl: item.image_url,
  };
}

/**
 * Map UI field names → Supabase column names (only defined keys)
 */
function mapMenuItemToDB(item) {
  const mapped = {};
  if (item.nombre !== undefined)     mapped.nombre = item.nombre;
  if (item.categoria !== undefined)  mapped.categoria = item.categoria;
  if (item.precio !== undefined)     mapped.precio = parseFloat(item.precio);
  if (item.desc !== undefined)       mapped.descripcion = item.desc;
  if (item.imageUrl !== undefined)   mapped.image_url = item.imageUrl || null;
  if (item.emoji !== undefined)      mapped.emoji = item.emoji;
  if (item.activo !== undefined)     mapped.activo = item.activo;
  if (item.destacado !== undefined)  mapped.destacado = item.destacado;
  if (item.disponible !== undefined) mapped.disponible = item.disponible;
  if (item.sort_order !== undefined) mapped.sort_order = item.sort_order;
  return mapped;
}

/**
 * Obtener TODOS los items del menú (incluyendo inactivos) — para el Dashboard
 */
export async function getAllMenuItems(clientId) {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('client_id', clientId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data || []).map(mapMenuItemFromDB);
  } catch (error) {
    console.error('Error fetching all menu items:', error);
    return [];
  }
}

/**
 * Crear item en menu_items
 */
export async function createMenuItem(clientId, itemData) {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .insert({
        client_id: clientId,
        ...mapMenuItemToDB(itemData),
      })
      .select()
      .single();

    if (error) throw error;
    return mapMenuItemFromDB(data);
  } catch (error) {
    console.error('Error creating menu item:', error);
    throw error;
  }
}

/**
 * Actualizar item en menu_items
 */
export async function updateMenuItem(itemId, updates, clientId) {
  try {
    let query = supabase
      .from('menu_items')
      .update(mapMenuItemToDB(updates))
      .eq('id', itemId);

    if (clientId) query = query.eq('client_id', clientId);

    const { data, error } = await query.select().single();
    if (error) throw error;
    return mapMenuItemFromDB(data);
  } catch (error) {
    console.error('Error updating menu item:', error);
    throw error;
  }
}

/**
 * Eliminar item de menu_items
 */
export async function deleteMenuItem(itemId, clientId) {
  try {
    let query = supabase
      .from('menu_items')
      .delete()
      .eq('id', itemId);

    if (clientId) query = query.eq('client_id', clientId);

    const { error } = await query;
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting menu item:', error);
    throw error;
  }
}