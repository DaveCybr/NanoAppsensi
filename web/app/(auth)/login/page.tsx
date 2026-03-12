"use client"

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const router                          = useRouter()
  const searchParams                    = useSearchParams()
  const setupSuccess                    = searchParams.get('setup') === 'success'

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      })
      const json = await res.json()
      if (json.success) {
        router.push('/dashboard')
      } else {
        setError(json.error || 'Email atau password salah.')
      }
    } catch {
      setError('Terjadi kesalahan koneksi. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>

      {/* ── Left panel ── */}
      <div style={{
        width: '420px',
        minWidth: '420px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '40px',
        backgroundColor: '#0f172a',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Glow blobs */}
        <div style={{
          position: 'absolute', top: '-60px', right: '-60px',
          width: '260px', height: '260px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-60px', left: '-60px',
          width: '200px', height: '200px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '10px',
            backgroundColor: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(37,99,235,0.4)',
          }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>N</span>
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '14px', lineHeight: 1 }}>NanoApp</div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', fontWeight: 500, letterSpacing: '0.12em', marginTop: '3px', textTransform: 'uppercase' }}>HR System</div>
          </div>
        </div>

        {/* Hero text */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{
            color: '#fff', fontSize: '28px', fontWeight: 600,
            lineHeight: 1.35, letterSpacing: '-0.02em', margin: 0,
          }}>
            Kelola SDM Lebih<br />Efisien Dengan<br />
            <span style={{ color: '#60a5fa' }}>NanoApp</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '13px', marginTop: '14px', lineHeight: 1.6 }}>
            Sistem HR terintegrasi untuk absensi, cuti, shift, dan penggajian dalam satu platform.
          </p>
        </div>

        {/* Features */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {['Absensi wajah real-time', 'Manajemen cuti otomatis', 'Laporan kehadiran lengkap'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '16px', height: '16px', borderRadius: '50%',
                backgroundColor: 'rgba(59,130,246,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#60a5fa' }} />
              </div>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px' }}>{f}</span>
            </div>
          ))}
        </div>

        <div style={{ position: 'relative', zIndex: 1, color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>
          © {new Date().getFullYear()} NanoApp Sensitivitas
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px',
      }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>

          {/* Header */}
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#111827', margin: 0, letterSpacing: '-0.015em' }}>
              Masuk ke akun Anda
            </h2>
            <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '6px' }}>
              Gunakan email perusahaan untuk melanjutkan
            </p>
          </div>

          {/* Setup success */}
          {setupSuccess && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '10px',
              padding: '12px 14px', backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0', borderRadius: '8px',
              color: '#166534', marginBottom: '20px',
            }}>
              <CheckCircle2 size={15} style={{ marginTop: '1px', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: '12px', fontWeight: 600, margin: 0 }}>Setup berhasil!</p>
                <p style={{ fontSize: '12px', color: '#15803d', margin: '3px 0 0' }}>Login menggunakan akun admin yang baru dibuat.</p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 14px', backgroundColor: '#fef2f2',
              border: '1px solid #fecaca', borderRadius: '8px',
              color: '#dc2626', marginBottom: '20px',
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <p style={{ fontSize: '12px', margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin}>
            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@perusahaan.com"
                required
                style={{
                  width: '100%', padding: '10px 12px', boxSizing: 'border-box',
                  backgroundColor: '#fff', border: '1px solid #e5e7eb',
                  borderRadius: '8px', fontSize: '13px', color: '#111827',
                  outline: 'none', transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = '#3b82f6')}
                onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#374151' }}>Kata Sandi</label>
                <a href="#" style={{ fontSize: '12px', color: '#2563eb', textDecoration: 'none' }}>Lupa sandi?</a>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%', padding: '10px 40px 10px 12px', boxSizing: 'border-box',
                    backgroundColor: '#fff', border: '1px solid #e5e7eb',
                    borderRadius: '8px', fontSize: '13px', color: '#111827',
                    outline: 'none', transition: 'border-color 0.15s',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#3b82f6')}
                  onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '2px',
                  }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <input type="checkbox" id="remember" style={{ width: '14px', height: '14px', accentColor: '#2563eb' }} />
              <label htmlFor="remember" style={{ fontSize: '12px', color: '#6b7280', cursor: 'pointer' }}>
                Ingat saya di perangkat ini
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '10px',
                backgroundColor: loading ? '#93c5fd' : '#2563eb',
                color: '#fff', border: 'none', borderRadius: '8px',
                fontSize: '13px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: '0 2px 8px rgba(37,99,235,0.3)', transition: 'background-color 0.15s',
              }}
            >
              {loading ? <><Loader2 size={15} className="animate-spin" /> Memproses...</> : 'Masuk'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '20px' }}>
            Kesulitan masuk?{' '}
            <a href="#" style={{ color: '#2563eb', fontWeight: 500, textDecoration: 'none' }}>Hubungi IT Support</a>
          </p>
        </div>
      </div>
    </main>
  )
}