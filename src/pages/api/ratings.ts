import type { APIRoute } from 'astro';
import { supabase } from '../../db/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
  const clienteId = cookies.get('id_cliente')?.value;
  if (!clienteId) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const body = await request.json();
    const { id_producto, calificacion, comentario } = body;

    if (!id_producto || !calificacion) {
      return new Response(JSON.stringify({ error: 'Producto y calificación son requeridos' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (calificacion < 1 || calificacion > 5) {
      return new Response(JSON.stringify({ error: 'La calificación debe ser entre 1 y 5' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const { data, error } = await supabase
      .from('ratings_productos')
      .insert({
        id_producto,
        id_cliente: clienteId,
        calificacion,
        comentario: comentario || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Rating error:', error);
      return new Response(JSON.stringify({ error: 'Error al guardar la reseña' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(data), { status: 201, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error del servidor' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
