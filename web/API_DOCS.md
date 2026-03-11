# HR System — API Documentation
**Phase 1: Foundation & Auth**

Base URL: `https://your-domain.com/api`

---

## Authentication

Sistem mendukung **dua mode autentikasi** secara bersamaan:

| Client | Mode | Header |
|--------|------|--------|
| Web Admin Panel | Cookie Session | Otomatis via browser |
| Flutter Mobile | Bearer Token | `Authorization: Bearer <token>` |
| Flutter Mobile | Client Marker | `X-Client: mobile` |

---

## Standard Response Format

Semua endpoint mengembalikan format yang sama:

```json
// Success
{
  "success": true,
  "data": { ... },
  "message": "Pesan opsional",
  "meta": {             // hanya untuk list endpoint
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}

// Error
{
  "success": false,
  "error": "Pesan error dalam Bahasa Indonesia"
}
```

## HTTP Status Codes

| Code | Arti |
|------|------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request (validasi gagal) |
| 401 | Unauthorized (belum login / token expired) |
| 403 | Forbidden (tidak punya akses) |
| 404 | Not Found |
| 409 | Conflict (data sudah ada) |
| 500 | Internal Server Error |

---

## Endpoints — Phase 1

### `POST /api/auth/login`

Login untuk web dan mobile.

**Request Headers (mobile only):**
```
X-Client: mobile
```

**Request Body:**
```json
{
  "email": "admin@majubersama.com",
  "password": "password123"
}
```

**Response (Web):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@majubersama.com",
      "full_name": "Siti Rahayu",
      "tenant_id": "uuid",
      "role_name": "HR Manager",
      "employee_id": "uuid",
      "is_active": true
    }
  },
  "message": "Login berhasil."
}
```

**Response (Mobile — X-Client: mobile):**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "access_token": "eyJhbGci...",
    "refresh_token": "eyJhbGci...",
    "expires_at": 1735689600
  },
  "message": "Login berhasil."
}
```

**Error Responses:**
- `401` — Email atau password salah
- `401` — Akun tidak aktif
- `401` — Akun dikunci

---

### `POST /api/auth/logout`

Logout dan invalidasi session.

**Auth:** Required

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Logout berhasil."
}
```

---

### `GET /api/auth/me`

Ambil profil user yang sedang login beserta permissions.

**Auth:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "siti@majubersama.com",
      "full_name": "Siti Rahayu",
      "tenant_id": "uuid",
      "role_name": "HR Manager",
      "employee_id": "uuid",
      "is_active": true
    },
    "tenant": {
      "id": "uuid",
      "name": "PT Maju Bersama",
      "slug": "maju-bersama",
      "logo_url": null,
      "timezone": "Asia/Jakarta",
      "subscription_plan": "starter"
    },
    "permissions": [
      "attendance:read",
      "attendance:write",
      "leave:read",
      "leave:approve",
      "employee:read",
      "employee:write",
      "payroll:read",
      "payroll:write",
      "dashboard:read",
      "report:export"
    ]
  }
}
```

---

### `GET /api/health`

Health check endpoint. Tidak butuh autentikasi.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-03-11T08:00:00.000Z",
    "version": "0.1.0",
    "services": {
      "database": {
        "status": "ok",
        "latency_ms": 12
      },
      "api": {
        "status": "ok"
      }
    }
  }
}
```

---

## Flutter Integration Guide

### 1. Login

```dart
final response = await dio.post(
  '/api/auth/login',
  data: {'email': email, 'password': password},
  options: Options(headers: {'X-Client': 'mobile'}),
);

final accessToken = response.data['data']['access_token'];
// Simpan ke secure storage
await secureStorage.write(key: 'access_token', value: accessToken);
```

### 2. Authenticated Request

```dart
final token = await secureStorage.read(key: 'access_token');
final response = await dio.get(
  '/api/auth/me',
  options: Options(headers: {'Authorization': 'Bearer $token'}),
);
```

### 3. Token Refresh

Gunakan `refresh_token` dari response login untuk refresh via Supabase SDK:
```dart
final supabase = Supabase.instance.client;
await supabase.auth.refreshSession(refreshToken);
// Ambil token baru dari supabase.auth.currentSession
```

---

## Coming in Phase 2

```
POST   /api/employees          Create employee
GET    /api/employees          List employees (with pagination + filter)
GET    /api/employees/:id      Employee detail
PATCH  /api/employees/:id      Update employee
DELETE /api/employees/:id      Soft delete employee
POST   /api/employees/:id/face Register face
```
