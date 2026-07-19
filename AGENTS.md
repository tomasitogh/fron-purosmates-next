# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a Next.js 16 e-commerce application for "Puros Mates" - an online store selling Argentine artisanal mates. The frontend is built with Next.js App Router, TypeScript, and Tailwind CSS, and communicates with a backend API (typically running on `localhost:8080`).

## Development Commands

### Essential Commands
```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server (must build first)
npm start

# Run linter
npm run lint
```

### Backend Connection
The application expects a backend API running on `http://localhost:8080`. The Next.js server proxies API requests from `/api/v1/*` to the backend via rewrites configured in `next.config.ts`.

## Architecture Overview

### State Management
- **Redux Toolkit**: Central state management with the following slices:
  - `authSlice`: User session info (email/role) synced from Clerk. Does NOT store JWTs.
  - `cartSlice`: Shopping cart with localStorage persistence
  - `adminSlice`: Admin operations (products, orders)
  - `productSlice`: Product data fetching
  - `categorySlice`: Category data
  - `fileSlice`: File upload handling
  
- **Store Location**: `redux/store.ts`
- **Provider Setup**: Redux is wrapped in `components/Providers.tsx` and mounted in `app/layout.tsx`

### Authentication System
- **Implementation**: Clerk (`@clerk/nextjs`). The backend validates Clerk session JWTs as an OAuth2 resource server.
- **Context**: `context/AuthContext.tsx` provides the `useAuth()` hook (`user`, `getToken`, `isAdmin`, `isAuthenticated`, `logout`).
- **Tokens — CRITICAL RULE**: Clerk session JWTs expire after ~60 seconds. NEVER cache the result of `getToken()` in state, Redux, or localStorage. Always call `getToken()` immediately before each request (the Clerk SDK caches and auto-renews internally, so this is cheap).
- **Helper**: `lib/apiClient.ts` exposes `TokenGetter`, `requireFreshToken(getToken)`, and `withAuthRetry(getToken, req)` (fresh token per request + one retry on 401). All authenticated thunks/components receive `getToken` (the function) instead of a token string.
- **Roles**: `USER` and `ADMIN` roles, read from `clerkUser.publicMetadata.role`. The backend (`JwtAuthConverter`) reads the role from the JWT claims, which requires the Clerk session token to be customized (Clerk Dashboard → Sessions) to include `publicMetadata`.

### API Communication
All Redux slices use axios for API calls with the following patterns:
- **Base URLs**: 
  - Products/Categories: `NEXT_PUBLIC_API_BASE_URL` or `http://localhost:8080`
  - Auth: `NEXT_PUBLIC_API_URL` or `http://localhost:8080/api/v1/auth`
  - Orders: `http://localhost:8080/api/v1/orders`
- **Authentication**: Bearer tokens in `Authorization` header
- **Proxy**: Next.js rewrites `/api/v1/*` requests to backend in `next.config.ts`

### Page Structure (App Router)
- **Root Layout**: `app/layout.tsx` - includes Navbar, Footer, CartDrawer, and providers
- **Home Page**: `app/page.tsx` - Server Component that fetches products/categories and passes to `ShopContent.tsx` client component
- **Admin Panel**: `app/admin/page.tsx` - Protected route for product/order management
- **Checkout Flow**: `app/checkout/` with success/failure/pending pages

### Key Components
- **Navbar**: `components/Navbar.tsx` - Navigation with auth modals
- **CartDrawer**: `components/CartDrawer.tsx` - Sliding cart panel
- **AuthModal**: `components/AuthModal.tsx` - Login/register modal
- **ImageUploader**: `components/ImageUploader.tsx` - Product image upload with drag-and-drop
- **ProductImageEditor**: `components/ProductImageEditor.tsx` - Image transformation (scale, position)
- **AdminLayout**: `components/admin/AdminLayout.tsx` - Admin panel layout with tabs
- **AdminProducts**: `components/admin/AdminProducts.tsx` - Admin product CRUD
- **AdminOrders**: `components/admin/AdminOrders.tsx` - Admin order management
- **AdminSettings**: `components/admin/AdminSettings.tsx` - Admin settings (banners, home images, categories, testimonials, push notifications)
- **FilterTabs**: `components/FilterTabs.tsx` - Category filtering

### Image Handling
Product images support transformations (scale, x, y positioning) stored in the database:
```typescript
{
  url: string;
  scale?: number;
  x?: number;
  y?: number;
}
```

### Styling
- **Framework**: Tailwind CSS v4 with PostCSS
- **Configuration**: Uses `@tailwindcss/postcss` plugin
- **Theme Colors**: Primary brand color is `#2d5d52` (green)
- **Global Styles**: `app/globals.css`

### TypeScript Configuration
- **Target**: ES2017
- **Module Resolution**: Bundler mode
- **Path Alias**: `@/*` maps to project root
- **Strict Mode**: Enabled

## Important Development Patterns

### Server vs Client Components
- Server Components fetch data (e.g., `app/page.tsx` with `getProducts()`, `getCategories()`)
- Client Components handle interactivity (marked with `'use client'`)
- Redux and React Context can only be used in Client Components

### Data Fetching
- **Server-side**: Use native `fetch()` with `cache: 'no-store'` or `next: { revalidate: seconds }`
- **Client-side**: Use Redux Toolkit async thunks with axios

### Admin Route Protection
The `app/admin/` route checks:
1. `middleware.ts` requires an active Clerk session (`auth.protect()`)
2. `app/admin/page.tsx` verifies `clerkUser.publicMetadata.role === 'ADMIN'` and redirects to home otherwise
3. The admin page passes Clerk's `getToken` down to `AdminProducts`/`AdminOrders`/`AdminSettings`; every API call obtains a fresh token (see "Tokens — CRITICAL RULE" above)

### Environment Variables
The application uses the following environment variables:
- `NEXT_PUBLIC_API_BASE_URL`: Base URL for products/categories API
- `NEXT_PUBLIC_API_URL`: Base URL for auth API (defaults to `http://localhost:8080/api/v1/auth`)

These should be defined in `.env.local` (git-ignored).

### Cart Persistence
Cart items are automatically persisted to localStorage via a store subscription in `redux/store.ts`. The subscription runs only on the client side (`typeof window !== 'undefined'`).

### Image Configuration
Remote image patterns are whitelisted in `next.config.ts`:
- `localhost:8080` (development backend)
- `**.cloudinary.com` (production CDN)

## Common Workflows

### Adding a New Product (Admin)
1. Navigate to `/admin`
2. Click "+ Agregar Producto"
3. Upload images with `ImageUploader` (supports drag-and-drop)
4. Adjust image scale/position with `ProductImageEditor`
5. Product data sent to `POST /products` via `createProduct` thunk

### Updating Product Status
Products have an `active` boolean field:
- `true` or `undefined`: Visible to users
- `false`: Hidden from public view (shown as "INACTIVO" in admin)

### Order Management
Orders are managed through `AdminOrders` component:
- Fetched via `fetchAllOrders` thunk from `/api/v1/orders`
- Desktop view shows full table; mobile view shows simplified cards with order ID, status, and action buttons
- Status filters are shown as a dropdown select
- Can be updated or deleted by admin users

## Testing Notes

This project does not currently have a test framework configured. When adding tests in the future, consider:
- Jest for unit tests
- React Testing Library for component tests
- Playwright or Cypress for E2E tests

## Code Style

- **Linting**: ESLint with Next.js recommended config
- **Formatting**: Follow existing patterns in the codebase
- **Language**: UI text and comments are primarily in Spanish (es-AR)
- **TypeScript**: Prefer explicit types over `any` where possible

## Known Architecture Details

### Metadata
SEO metadata is configured in `app/layout.tsx` with Spanish locale (`es_AR`) and keywords targeting Argentine mate culture.

### Hydration
The root layout uses `suppressHydrationWarning` to prevent hydration mismatches from auth state initialization.

### Dynamic Routes
The home (`/`) and shop (`/shop`) pages use ISR with `export const revalidate = 60`, so they are prerendered statically and the backend is hit at most once per 60s per data fetch. Home content (banners, home images, testimonials) is fetched via cached getters in `lib/data/home.ts` (native `fetch` + `next.revalidate`). `ShopContent` uses `useSearchParams`, so it is wrapped in a `<Suspense>` boundary in `app/shop/page.tsx` instead of forcing dynamic rendering. Cloudinary-hosted images (hero, category grid, product images) bypass the Next.js image optimizer via `cloudinaryLoader` (`lib/cloudinary.ts`) and are served directly from the Cloudinary CDN with `f_auto,q_auto,w_*` transformations.

### On-Demand Revalidation
Admin mutations invalidate the ISR cache immediately via `revalidatePath`, so storefront changes are visible instantly (no need to wait for the 60s window):
- Server actions in `lib/actions/home.actions.ts` (banners, home images, testimonials, categories) call `revalidatePath('/')` or `revalidatePath('/shop')` after a successful backend mutation.
- Client-side mutations (product CRUD in `redux/adminSlice.ts`, direct fetches in `components/admin/AdminSettings.tsx`) call the `revalidateStorefront(paths)` server action from `lib/actions/revalidate.actions.ts`, which verifies the caller has the `ADMIN` role via Clerk session claims before revalidating. These calls are fire-and-forget so they never block the admin UI.
