import type { APIRoute } from 'astro';
import { supabase } from '../../db/supabase';

export const GET: APIRoute = async ({ cookies }) => {
  const clienteId = cookies.get('id_cliente')?.value;
  if (!clienteId) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const { data, error } = await supabase
    .from('solicitudes_cotizacion')
    .select('*')
    .eq('id_cliente', clienteId)
    .order('created_at', { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify(data || []), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  const clienteId = cookies.get('id_cliente')?.value;
  if (!clienteId) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const body = await request.json();
    const { descripcion_articulo, especificaciones_req, nivel_urgencia } = body;

    if (!descripcion_articulo) {
      return new Response(JSON.stringify({ error: 'La descripción es requerida' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const { data, error } = await supabase
      .from('solicitudes_cotizacion')
      .insert({
        id_cliente: clienteId,
        descripcion_articulo,
        especificaciones_req: especificaciones_req || {},
        nivel_urgencia: nivel_urgencia || 'media',
        estado_solicitud: 'pendiente',
      })
      .select()
      .single();

    if (error) {
      console.error('Create solicitud error:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(data), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error del servidor' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
