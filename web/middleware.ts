// ============================================================
// middleware.ts
// Auth guard untuk web + passthrough untuk API (Bearer token)
// ============================================================
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_ROUTES = [
  '/login',
  '/setup',
  '/api/setup',
  '/api/auth/login',
  '/api/health',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── API Setup: Always allow ───────────────────────────
  if (pathname.startsWith('/api/setup')) return NextResponse.next()

  // ── Setup Wizard Check ─────────────────────────────────
  // Cek setup berlaku untuk halaman web (bukan static files yang sudah difilter matcher)
  try {
    const checkRes = await fetch(new URL('/api/setup/check', request.url))
    const json = await checkRes.json()
    const needsSetup = json.data?.needs_setup

    // 1. Jika butuh setup tapi TIDAK di halaman setup -> redirect ke /setup
    if (needsSetup && pathname !== '/setup' && !pathname.startsWith('/api/')) {
      return NextResponse.redirect(new URL('/setup', request.url))
    }
    
    // 2. Jika SUDAH setup tapi akses halaman /setup -> redirect ke /login
    if (!needsSetup && pathname === '/setup') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  } catch (err) {
    console.error('Setup check failed:', err)
  }

  const isPublic = PUBLIC_ROUTES.some(route => pathname.startsWith(route))
  if (isPublic) return NextResponse.next()

  // ── API routes: passthrough ────────────────────────────
  if (pathname.startsWith('/api/')) {
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
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value }: any) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          cookiesToSet.forEach(({ name, value, options }: any) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}