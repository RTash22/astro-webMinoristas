import type { APIRoute } from 'astro';
import { supabase } from '../../../db/supabase';

export const POST: APIRoute = async ({ params, cookies }) => {
  const clienteId = cookies.get('id_cliente')?.value;
  if (!clienteId) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const solicitudId = params.id;

  try {
    // Get the solicitud and verify it belongs to this client
    const { data: solicitud, error: solError } = await supabase
      .from('solicitudes_cotizacion')
      .select('*')
      .eq('id_solicitud', solicitudId)
      .eq('id_cliente', clienteId)
      .single();

    if (solError || !solicitud) {
      return new Response(JSON.stringify({ error: 'Solicitud no encontrada' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Update solicitud status to indicate rejection
    await supabase
      .from('solicitudes_cotizacion')
      .update({ estado_solicitud: 'pendiente' }) // Go back to pending so operator can revise
      .eq('id_solicitud', solicitudId);

    return new Response(JSON.stringify({ success: true, message: 'Cotización rechazada' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error del servidor' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
