// ============================================================
// lib/facepp/client.ts
// Face++ API wrapper — semua call ke Face++ lewat sini
// API key TIDAK pernah keluar dari server
// ============================================================

const BASE_URL = 'https://api-cn.faceplusplus.com/facepp/v3'

function getCredentials() {
  const api_key    = process.env.FACEPP_API_KEY
  const api_secret = process.env.FACEPP_API_SECRET

  if (!api_key || !api_secret) {
    throw new Error('Face++ credentials tidak dikonfigurasi.')
  }

  return { api_key, api_secret }
}

// ── Detect face dari base64 image ─────────────────────────
// Return: face_token jika ditemukan, null jika tidak ada wajah
export async function detectFace(imageBase64: string): Promise<{
  face_token: string | null
  face_count: number
  error?: string
}> {
  try {
    const creds = getCredentials()
    const form  = new URLSearchParams({
      ...creds,
      image_base64:       imageBase64,
      return_attributes: 'none',
    })

    const res  = await fetch(`${BASE_URL}/detect`, { method: 'POST', body: form })
    const data = await res.json()

    if (data.error_message) {
      return { face_token: null, face_count: 0, error: data.error_message }
    }

    const faces: any[] = data.faces ?? []
    return {
      face_token: faces.length === 1 ? faces[0].face_token : null,
      face_count: faces.length,
    }
  } catch (err) {
    console.error('[Face++ detect error]', err)
    return { face_token: null, face_count: 0, error: 'Gagal menghubungi Face++ API' }
  }
}

// ── Compare dua face token ────────────────────────────────
// Return: confidence score 0-100
export async function compareFaces(
  faceToken1: string,
  faceToken2: string
): Promise<{ confidence: number; error?: string }> {
  try {
    const creds = getCredentials()
    const form  = new URLSearchParams({
      ...creds,
      face_token1: faceToken1,
      face_token2: faceToken2,
    })

    const res  = await fetch(`${BASE_URL}/compare`, { method: 'POST', body: form })
    const data = await res.json()

    if (data.error_message) {
      return { confidence: 0, error: data.error_message }
    }

    return { confidence: data.confidence ?? 0 }
  } catch (err) {
    console.error('[Face++ compare error]', err)
    return { confidence: 0, error: 'Gagal menghubungi Face++ API' }
  }
}

// ── Hapus face token dari Face++ ──────────────────────────
// Dipanggil saat foto referensi karyawan diganti
export async function deleteFace(faceToken: string): Promise<boolean> {
  try {
    const creds        = getCredentials()
    const faceset_token = process.env.FACEPP_FACESET_TOKEN
    if (!faceset_token) return false

    const form = new URLSearchParams({
      ...creds,
      faceset_token,
      face_tokens: faceToken,
    })

    const res  = await fetch(`${BASE_URL}/faceset/removeface`, { method: 'POST', body: form })
    const data = await res.json()

    return !data.error_message
  } catch {
    return false
  }
}
