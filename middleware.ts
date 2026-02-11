import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const session = req.auth;
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
  
  // Proteger rutas de admin
  if (isAdminRoute) {
    if (!session?.user) {
      return NextResponse.redirect(new URL('/', req.url));
    }
    
    if (session.user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*'],
};
