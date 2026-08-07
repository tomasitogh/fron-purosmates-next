# Migración NextAuth → Clerk

## Resumen de Cambios

Se ha migrado la autenticación de NextAuth a Clerk, manteniendo la misma visualización y funcionalidad.

### Cambios de Código

**Modificados (9):**

- `app/layout.tsx` - Agregado ClerkProvider
- `middleware.ts` - Reemplazado con clerkMiddleware
- `context/AuthContext.tsx` - Hooks de Clerk (useUser, getToken)
- `components/AuthModal.tsx` - SignIn/SignUp de Clerk
- `components/Navbar.tsx` - UserButton de Clerk
- `components/Providers.tsx` - Removido SessionProvider
- `components/OrdersPanel.tsx` - getToken async
- `app/ShopContent.tsx` - useUser de Clerk
- `app/admin/page.tsx` - useUser de Clerk

**Eliminados (3):**

- `auth.ts` - Config NextAuth
- `app/api/auth/[...nextauth]/` - Routes NextAuth
- `types/next-auth.d.ts` - Types NextAuth

**Dependencias:**

- ✅ Instalada: `@clerk/nextjs@7.2.2`
- ✅ Removidas: `next-auth`, `@auth/prisma-adapter`

### Configuración Requerida

1. **Frontend (.env.local):**

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

2. **Backend (application.properties):**

```env
JWT_JWK_SET_URI=https://<tu-clerk-domain>.clerk.accounts.cloud/.well-known/jwks.json
JWT_ISSUER_URI=https://<tu-clerk-domain>.clerk.accounts.cloud
```

### Setup Clerk

1. Crear cuenta en https://dashboard.clerk.com/
2. Crear proyecto "Puros Mates"
3. Configurar OAuth providers (Google, Apple)
4. Configurar JWT Template con claims: email, role
5. Copiar credentials a .env.local

### Características Preservadas

✅ Modal login con imagen lado izquierdo  
✅ Gestión de roles en BD  
✅ Integración backend Spring Boot  
✅ Admin panel y órdenes  
✅ TypeScript compatible

### Soportados

- Google OAuth
- Apple OAuth
- Email/Contraseña

**Status:** Listo para setup de Clerk credentials
