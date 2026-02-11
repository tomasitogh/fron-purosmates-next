# 🔒 Seguridad y Arquitectura - Auth.js

## ✅ **Arquitectura Final (Segura)**

```
┌───────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js)                                       │
│  Puerto: 3000                                             │
│                                                           │
│  Base de Datos: ecom_auth                                │
│  ├─ auth_users                                           │
│  ├─ auth_accounts                                        │
│  ├─ auth_sessions                                        │
│  └─ auth_verification_tokens                             │
│                                                           │
│  Acceso: Solo Prisma (Auth.js)                           │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│  BACKEND (Spring Boot)                                    │
│  Puerto: 8080                                             │
│                                                           │
│  Base de Datos: ecom                                     │
│  ├─ products                                             │
│  ├─ categories                                           │
│  ├─ orders                                               │
│  ├─ product_images                                       │
│  └─ user (backend)                                       │
│                                                           │
│  Acceso: Solo JPA/Hibernate                              │
└───────────────────────────────────────────────────────────┘
```

## 🛡️ **Garantías de Seguridad**

### **1. Aislamiento Total**
- ✅ Prisma **NUNCA** puede acceder a `ecom`
- ✅ Spring Boot **NUNCA** accede a `ecom_auth`
- ✅ Si Prisma hace `db push`, solo afecta `ecom_auth`
- ✅ Tus datos de negocio están protegidos

### **2. Credenciales NO Expuestas**
- ✅ `DATABASE_URL` **NO** está en el código
- ✅ `DATABASE_URL` **NO** se sube a Git
- ✅ `DATABASE_URL` **NO** llega al navegador
- ✅ Solo se usa en el servidor de Next.js

### **3. Variables de Entorno**

**❌ LO QUE NUNCA PASA:**
```javascript
// ❌ NUNCA se embebe en el bundle del navegador
DATABASE_URL="mysql://..."
NEXTAUTH_SECRET="..."
GOOGLE_CLIENT_SECRET="..."
```

**✅ LO QUE SÍ PASA:**
```javascript
// ✅ Solo existe en el servidor Next.js
// El navegador NUNCA ve estas variables
process.env.DATABASE_URL  // Server-side only
```

**✅ LO QUE SÍ SE EXPONE (Y ESTÁ BIEN):**
```javascript
// ✅ Variables públicas (diseñadas para ser públicas)
NEXT_PUBLIC_API_URL="/api/v1"
GOOGLE_CLIENT_ID="..." // OAuth requiere que sea público
```

## 🔐 **Protección en Producción**

### **Variables en Vercel/Railway:**
```
Dashboard → Environment Variables
├─ DATABASE_URL (encriptado en tránsito)
├─ NEXTAUTH_SECRET (nunca se loggea)
└─ GOOGLE_CLIENT_SECRET (nunca se expone)
```

### **SSL/TLS:**
```
Cliente → HTTPS → Vercel (SSL)
           ↓
      Next.js Server (lee DATABASE_URL)
           ↓
      MySQL (conexión encriptada)
```

## 📊 **Flujo de Datos Seguro**

```
NAVEGADOR
  │
  ├─ Cookie: next-auth.session-token (httpOnly)
  │  └─ JavaScript NO puede leer
  │
  ↓ Request a /api/auth/session
  
NEXT.JS SERVER
  │
  ├─ Lee DATABASE_URL (del servidor)
  ├─ Conecta a ecom_auth
  ├─ Valida sesión
  │
  ↓ Respuesta (sin credenciales)
  
NAVEGADOR
  └─ Recibe { user: { email, name } }
     Sin DATABASE_URL ✓
     Sin NEXTAUTH_SECRET ✓
```

## 🧪 **Verificación de Seguridad**

### **Test 1: Variables NO en el Bundle**
```bash
# Build de producción
npm run build

# Buscar en el bundle
grep -r "DATABASE_URL" .next/
# Resultado: NO debe aparecer ✅

grep -r "Totito12" .next/
# Resultado: NO debe aparecer ✅
```

### **Test 2: Variables NO en el Navegador**
```javascript
// DevTools Console
console.log(process.env.DATABASE_URL)
// undefined ✅

console.log(process.env.NEXTAUTH_SECRET)
// undefined ✅
```

### **Test 3: Solo Variables Públicas**
```javascript
// DevTools Console
console.log(process.env.NEXT_PUBLIC_API_URL)
// "/api/v1" ✅ (correcto, es pública)
```

## ⚠️ **Lo Que Aprendimos del Error**

### **Problema:**
- ❌ Usé la misma BD (`ecom`) para frontend y backend
- ❌ Prisma borró las tablas del backend

### **Solución:**
- ✅ Dos bases de datos separadas
- ✅ `ecom_auth` para Auth.js (frontend)
- ✅ `ecom` para Spring Boot (backend)
- ✅ Aislamiento total

## 📝 **Checklist de Seguridad**

### **Desarrollo:**
- [x] `.env` NO está en Git
- [x] `.env` está en `.gitignore`
- [x] Variables sin `NEXT_PUBLIC_` no se exponen
- [x] Password de DB tiene caracteres especiales URL-encoded
- [x] Bases de datos separadas (auth vs negocio)

### **Producción:**
- [ ] Variables configuradas en dashboard del hosting
- [ ] `NEXTAUTH_SECRET` diferente de desarrollo
- [ ] SSL/TLS habilitado
- [ ] Conexión a DB encriptada
- [ ] Backups automáticos habilitados

## 🎯 **Comparación: Tu Preocupación vs Realidad**

| Tu Preocupación | Realidad |
|----------------|----------|
| "Password en el frontend" | ❌ NO está en el frontend, está en el **servidor** de Next.js |
| "Alguien puede ver mi DB_URL" | ❌ NO, solo está en variables de entorno server-side |
| "Se sube a Git" | ❌ NO, `.env` está en `.gitignore` |
| "Llega al navegador" | ❌ NO, solo variables `NEXT_PUBLIC_*` llegan al navegador |
| "Prisma puede borrar todo" | ✅ AHORA NO, está en BD separada |

## ✅ **Conclusión**

**Es seguro porque:**

1. ✅ Las credenciales **NUNCA** llegan al navegador
2. ✅ Las credenciales **NUNCA** se suben a Git
3. ✅ Las credenciales **SOLO** existen en el servidor
4. ✅ Bases de datos separadas = aislamiento total
5. ✅ Mismo nivel de seguridad que Spring Boot

**Next.js distingue:**
- **Server-side** (como Spring Boot): Acceso a DB, secrets, APIs
- **Client-side** (navegador): Solo recibe datos procesados

Es **exactamente igual** que tener las credenciales en `application.properties` de Spring Boot.

---

**Fecha:** 2026-02-10  
**Versión:** 1.0 (Arquitectura Segura con BDs Separadas)
