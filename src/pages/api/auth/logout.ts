import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete('id_cliente', { path: '/' });
  cookies.delete('nombre_empresa', { path: '/' });
  return redirect('/');
};
