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

    // Get all cotizaciones for this solicitud that were accepted by the provider
    const { data: cotizaciones, error: cotError } = await supabase
      .from('cotizaciones_downlabs')
      .select('*')
      .eq('id_solicitud', solicitudId)
      .eq('estado', 'aceptada');

    if (cotError) {
      return new Response(JSON.stringify({ error: 'Error obteniendo cotizaciones' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    if (!cotizaciones || cotizaciones.length === 0) {
      return new Response(JSON.stringify({ error: 'No hay cotizaciones aceptadas para procesar' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Create pedidos_creditos for each accepted cotizacion
    const pedidos = cotizaciones.map(cot => ({
      id_cotizacion: cot.id_cotizacion,
      monto_original: cot.precio_final_cliente * (cot.cantidad || 1),
      interes: solicitud.interes_propuesto || 15, // default 15%
      plazo_meses: solicitud.plazo_propuesto_meses || 3, // default 3 months
      estado_credito: 'pendiente',
    }));

    const { error: pedidoError } = await supabase
      .from('pedidos_creditos')
      .insert(pedidos);

    if (pedidoError) {
      console.error('Error creating pedidos:', pedidoError);
      return new Response(JSON.stringify({ error: 'Error al crear los pedidos' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // Update solicitud status to 'completada'
    await supabase
      .from('solicitudes_cotizacion')
      .update({ estado_solicitud: 'completada' })
      .eq('id_solicitud', solicitudId);

    return new Response(JSON.stringify({ success: true, message: 'Cotización aceptada y pedidos creados' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Accept error:', err);
    return new Response(JSON.stringify({ error: 'Error del servidor' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
