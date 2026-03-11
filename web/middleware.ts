// ============================================================
// middleware.ts
// Auth guard untuk web + passthrough untuk API (Bearer token)
// ============================================================
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Route yang tidak butuh autentikasi
const PUBLIC_ROUTES = [
  '/login',
  '/api/auth/login',
  '/api/health',
]

// Route API — middleware tidak inject redirect, hanya refresh session
// Auth di API Route Handler ditangani sendiri via requireAuth()
const API_PREFIX = '/api/'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Skip public routes ─────────────────────────────────
  const isPublic = PUBLIC_ROUTES.some(route => pathname.startsWith(route))
  if (isPublic) return NextResponse.next()

  // ── API routes: passthrough, auth ditangani di handler ─
  // Tapi tetap refresh session jika ada cookie
  if (pathname.startsWith(API_PREFIX)) {
    // Jika ada Bearer token → passthrough langsung
    const authHeader = request.headers.get('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      return NextResponse.next()
    }
    // Jika tidak ada token sama sekali → biarkan handler yang reject
    // (supaya response format tetap JSON, bukan redirect)
    return NextResponse.next()
  }

  // ── Web routes: cek session + redirect ────────────────
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session (penting untuk SSR)
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect ke login jika belum auth
  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect dari login ke dashboard jika sudah auth
  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match semua request kecuali:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - file dengan ekstensi (svg, png, jpg, dll)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}
