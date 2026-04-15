import type { APIRoute } from 'astro';
import { supabase } from '../../db/supabase';

export const GET: APIRoute = async ({ cookies }) => {
  const clienteId = cookies.get('id_cliente')?.value;
  if (!clienteId) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    // Get all notificaciones for this client, newest first
    const { data, error } = await supabase
      .from('notificaciones_cliente')
      .select('*')
      .eq('id_cliente', clienteId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      // Table might not exist yet — return empty array
      return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(data || []), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch {
    return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
};

export const PATCH: APIRoute = async ({ request, cookies }) => {
  const clienteId = cookies.get('id_cliente')?.value;
  if (!clienteId) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const body = await request.json();
    const { id_notificacion } = body;

    const { error } = await supabase
      .from('notificaciones_cliente')
      .update({ leida: true })
      .eq('id_notificacion', id_notificacion)
      .eq('id_cliente', clienteId);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch {
    return new Response(JSON.stringify({ error: 'Error del servidor' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
