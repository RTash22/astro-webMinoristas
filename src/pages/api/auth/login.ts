import type { APIRoute } from 'astro';
import { supabase } from '../../../db/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { correo, password } = body;

    if (!correo || !password) {
      return new Response(JSON.stringify({ error: 'Correo y contraseña son requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Simple login: query clientes table by correo_contacto
    const { data: cliente, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('correo_contacto', correo)
      .single();

    if (error || !cliente) {
      return new Response(JSON.stringify({ error: 'Credenciales inválidas. Verifica tu correo.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // For simple auth without password_hash, just check the client exists
    // In production, you'd verify password_hash here

    // Set session cookies
    cookies.set('id_cliente', cliente.id_cliente, {
      path: '/',
      httpOnly: true,
      secure: false,
      maxAge: 60 * 60 * 24 * 7, // 7 days
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
        correo_contacto: cliente.correo_contacto
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
