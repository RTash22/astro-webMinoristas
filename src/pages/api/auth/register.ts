import type { APIRoute } from 'astro';
import { supabase } from '../../../db/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { nombre_empresa, correo, telefono, password } = body;

    if (!nombre_empresa || !correo) {
      return new Response(JSON.stringify({ error: 'Nombre de empresa y correo son requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('clientes')
      .select('id_cliente')
      .eq('correo_contacto', correo)
      .single();

    if (existing) {
      return new Response(JSON.stringify({ error: 'Este correo ya está registrado' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Insert new client
    const { data: cliente, error } = await supabase
      .from('clientes')
      .insert({
        nombre_empresa,
        correo_contacto: correo,
        telefono_contacto: telefono || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Register error:', error);
      return new Response(JSON.stringify({ error: 'No se pudo crear la cuenta. Intenta de nuevo.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Auto-login after registration
    cookies.set('id_cliente', cliente.id_cliente, {
      path: '/',
      httpOnly: true,
      secure: false,
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax'
    });
    cookies.set('nombre_empresa', cliente.nombre_empresa, {
      path: '/',
      httpOnly: false,
      secure: false,
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax'
    });

    return new Response(JSON.stringify({
      success: true,
      cliente: {
        id_cliente: cliente.id_cliente,
        nombre_empresa: cliente.nombre_empresa,
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
