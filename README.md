# 🧉 Puros Mates - E-commerce

E-commerce de mates artesanales argentinos construido con Next.js 15, Auth.js y Spring Boot.

## 🚀 Quick Start

```bash
# 1. Verificar configuración
./scripts/verify-setup.sh

# 2. Configurar variables de entorno (ver QUICKSTART.md)
# - Google OAuth credentials
# - Database URL

# 3. Ejecutar migraciones
npx prisma db push

# 4. Iniciar aplicación
npm run dev
```

Visita: http://localhost:3000

## 🔐 Autenticación

Este proyecto usa **Auth.js (NextAuth v5)** con Google OAuth.

**No hay login manual** - Los usuarios se autentican con su cuenta Google.

### Setup Completo:
- **Quick Start:** `QUICKSTART.md` (5 min)
- **Frontend:** `AUTH_SETUP.md` (detallado)
- **Backend:** `BACKEND_CONFIG.md` (Spring Boot)
- **Arquitectura:** `ARCHITECTURE.md` (diagramas)

## 📋 Características

- ✅ Login con Google OAuth (1-click)
- ✅ Gestión de productos (CRUD)
- ✅ Carrito de compras persistente
- ✅ Panel de administración
- ✅ Integración con MercadoPago
- ✅ Upload de imágenes (Cloudinary)
- ✅ Roles de usuario (USER/ADMIN)
- ✅ Protección de rutas server-side

## 🏗️ Stack Tecnológico

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Auth:** Auth.js (NextAuth v5)
- **State:** Redux Toolkit
- **Database:** PostgreSQL + Prisma
- **Styling:** Tailwind CSS v4
- **Language:** TypeScript

### Backend
- **Framework:** Spring Boot 3.1
- **Security:** Spring Security + OAuth2 Resource Server
- **Database:** MySQL
- **Payments:** MercadoPago SDK
- **Images:** Cloudinary

## 📂 Estructura del Proyecto

```
fron-purosmates-next/
├── app/                    # Next.js App Router
│   ├── admin/             # Panel de administración
│   ├── api/auth/          # Auth.js routes
│   └── checkout/          # Flujo de compra
├── components/            # React components
├── auth.ts                # Auth.js config
├── middleware.ts          # Route protection
├── prisma/                # Database schema
└── redux/                 # State management
```

## 🔧 Scripts Útiles

```bash
# Verificar setup
./scripts/verify-setup.sh

# Generar nuevo secret
./scripts/generate-secret.sh

# Promover usuario a admin
node scripts/promote-admin.js

# Prisma Studio (DB viewer)
npx prisma studio
```

## 🌐 Variables de Entorno

Copia `.env.local` y configura:

```bash
# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Database
DATABASE_URL="postgresql://..."

# Auth.js
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# Backend API
NEXT_PUBLIC_API_BASE_URL="http://localhost:8080"
```

## 📚 Documentación

| Archivo | Descripción |
|---------|-------------|
| `QUICKSTART.md` | Inicio rápido (3 pasos) |
| `MIGRATION_COMPLETE.md` | Checklist completo |
| `AUTH_SETUP.md` | Setup Auth.js frontend |
| `BACKEND_CONFIG.md` | Setup Spring Boot |
| `ARCHITECTURE.md` | Diagramas y flujos |
| `AGENTS.md` | Guía para AI agents |

## 🧪 Testing

### Verificar sesión
```javascript
// En DevTools Console
fetch('/api/auth/session')
  .then(r => r.json())
  .then(console.log)
```

### Debug endpoint
```
GET /api/debug/session
⚠️ Eliminar en producción
```

## 🛡️ Seguridad

- ✅ JWT firmado con HMAC-SHA256
- ✅ Cookies httpOnly + secure
- ✅ CSRF protection
- ✅ Middleware server-side
- ✅ OAuth2 Resource Server (backend)
- ✅ Rol-based authorization

## 🚀 Deploy

### Frontend (Vercel)
```bash
vercel --prod
```

### Backend (Railway/Render)
```bash
# Configurar NEXTAUTH_SECRET en variables de entorno
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y de uso académico.

## 🆘 Soporte

- Issues: GitHub Issues
- Docs: Ver archivos `.md` en el repo
- Auth.js: https://authjs.dev/

---

**Built with ❤️ in Argentina 🇦🇷**

