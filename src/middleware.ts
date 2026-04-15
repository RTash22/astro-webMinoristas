import { defineMiddleware } from 'astro:middleware';

const protectedRoutes = ['/dashboard', '/solicitudes', '/cotizaciones', '/pedidos', '/notificaciones'];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const clienteId = context.cookies.get('id_cliente')?.value;

  // Check if the route needs protection
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtected && !clienteId) {
    return context.redirect('/?login=required');
  }

  // If user is logged in and visits the landing page, redirect to dashboard
  if (pathname === '/' && clienteId) {
    return context.redirect('/dashboard');
  }

  return next();
});
