// ============================================================
// lib/utils/response.ts
// Standar API response helper — konsisten di semua endpoint
// Format ini dipakai oleh web dan Flutter
// ============================================================
import { NextResponse } from 'next/server'
import { ApiResponse, PaginationMeta } from '@/types/api'

// ── Success Responses ──────────────────────────────────────

export function ok<T>(data: T, message?: string) {
  return NextResponse.json<ApiResponse<T>>(
    { success: true, data, message },
    { status: 200 }
  )
}

export function okWithPagination<T>(
  data: T,
  meta: PaginationMeta,
  message?: string
) {
  return NextResponse.json<ApiResponse<T>>(
    { success: true, data, meta, message },
    { status: 200 }
  )
}

export function created<T>(data: T, message?: string) {
  return NextResponse.json<ApiResponse<T>>(
    { success: true, data, message },
    { status: 201 }
  )
}

export function noContent() {
  return new NextResponse(null, { status: 204 })
}

// ── Client Error Responses ─────────────────────────────────

export function badRequest(error: string) {
  return NextResponse.json<ApiResponse>(
    { success: false, error },
    { status: 400 }
  )
}

export function unauthorized(error = 'Sesi tidak valid. Silakan login kembali.') {
  return NextResponse.json<ApiResponse>(
    { success: false, error },
    { status: 401 }
  )
}

export function forbidden(error = 'Anda tidak memiliki akses ke fitur ini.') {
  return NextResponse.json<ApiResponse>(
    { success: false, error },
    { status: 403 }
  )
}

export function notFound(resource = 'Data') {
  return NextResponse.json<ApiResponse>(
    { success: false, error: `${resource} tidak ditemukan.` },
    { status: 404 }
  )
}

export function conflict(error: string) {
  return NextResponse.json<ApiResponse>(
    { success: false, error },
    { status: 409 }
  )
}

export function unprocessable(error: string) {
  return NextResponse.json<ApiResponse>(
    { success: false, error },
    { status: 422 }
  )
}

// ── Server Error Response ──────────────────────────────────

export function serverError(error: unknown) {
  // Log error di server, jangan expose detail ke client
  console.error('[API Error]', error)

  const message = error instanceof Error
    ? error.message
    : 'Terjadi kesalahan pada server.'

  // Di production, jangan expose pesan error internal
  const clientMessage = process.env.NODE_ENV === 'production'
    ? 'Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.'
    : message

  return NextResponse.json<ApiResponse>(
    { success: false, error: clientMessage },
    { status: 500 }
  )
}

// ── Pagination Helper ──────────────────────────────────────

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  return {
    page,
    limit,
    total,
    total_pages: Math.ceil(total / limit),
  }
}

// ── Parse pagination query params ─────────────────────────

export function parsePagination(searchParams: URLSearchParams) {
  const page  = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
  const offset = (page - 1) * limit
  return { page, limit, offset }
}
