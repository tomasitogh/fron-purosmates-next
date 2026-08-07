# Limpieza de Variables de Entorno: NextAuth → Clerk

## ❌ Variables a ELIMINAR

Estas variables de NextAuth ya no son necesarias:

### De `.env.local`:

```bash
# ❌ ELIMINAR - NextAuth/Google OAuth (ya no se usan)
NEXTAUTH_URL=https://fron-purosmates-next.vercel.app
NEXTAUTH_SECRET="REEMPLAZAR_CON_TU_SECRET"
GOOGLE_CLIENT_ID="REEMPLAZAR_CON_TU_ID.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="REEMPLAZAR_CON_TU_CLIENT_SECRET"

# ❌ ELIMINAR - No se necesita más con Clerk
DATABASE_URL="mysql://..." (solo si era solo para sesiones de NextAuth)
```

## ✅ Variables a MANTENER

### En `.env.local`:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=/api/v1
NEXT_PUBLIC_API_BASE_URL=https://puros-mates-ecom-v3mtd.ondigitalocean.app

# Clerk Authentication (NUEVA)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Analytics
NEXT_PUBLIC_GA_ID=G-ZQG04DRDT3
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=2009949316297888
```

### En `.env`:

```bash
# Development
NODE_OPTIONS=--experimental-vm-modules
NEXT_TELEMETRY_DISABLED=1
```

## 🛠️ Paso a Paso para Limpiar

### 1. En `.env.local` (LOCAL - DESARROLLO):

```bash
# Antes
NEXTAUTH_URL=...
NEXTAUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
DATABASE_URL=... (si solo era para NextAuth)

# Después (eliminar esas líneas)
```

### 2. En `.env` (REPOSITORIO):

```bash
# Antes
# (ninguna variable de NextAuth)

# Después (sin cambios)
```

### 3. En Vercel Dashboard (PRODUCCIÓN):

Go to: **Settings → Environment Variables**

**Eliminar:**

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

**Mantener:**

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_GA_ID`
- `NEXT_PUBLIC_FACEBOOK_PIXEL_ID`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

## ✅ Checklist de Limpieza

- [ ] Actualizar `.env.local` localmente
- [ ] Eliminar DATABASE_URL si solo era para NextAuth
- [ ] Verificar que Clerk vars están presentes
- [ ] Probar `npm run dev` localmente
- [ ] Actualizar variables en Vercel Dashboard
- [ ] Redeploy en Vercel

## 🎯 Resultado Final

Tu `.env.local` debería verse así:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=/api/v1
NEXT_PUBLIC_API_BASE_URL=https://puros-mates-ecom-v3mtd.ondigitalocean.app

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Analytics
NEXT_PUBLIC_GA_ID=G-ZQG04DRDT3
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=2009949316297888
```

## ⚠️ Importante

- **No commites `.env.local` al repo** (ya está en `.gitignore`)
- **DATABASE_URL** solo elimina si era para sesiones NextAuth
- Si usas DATABASE_URL para Prisma, mantenla

## 🔍 Verificar que Todo Funciona

Después de limpiar:

```bash
npm run dev
# Ir a http://localhost:3000
# Probar login con Clerk
# Probar admin panel
```

Si falla → significa que falta alguna variable de Clerk
