"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Building2, 
  User, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Globe,
  Loader2,
  Lock,
  Mail,
  Check
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export default function SetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // Progress states for animation/feedback
  const [progressMsg, setProgressMsg] = useState('')

  // Form State
  const [formData, setFormData] = useState({
    company_name: '',
    slug: '',
    timezone: 'Asia/Jakarta',
    admin_name: '',
    admin_email: '',
    admin_password: '',
    admin_password_confirm: ''
  })

  // Auto-generate slug
  useEffect(() => {
    if (step === 1) {
      const generatedSlug = formData.company_name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
      setFormData(prev => ({ ...prev, slug: generatedSlug }))
    }
  }, [formData.company_name, step])

  const handleNext = () => setStep(prev => prev + 1)
  const handleBack = () => setStep(prev => prev - 1)

  const handleSubmit = async () => {
    if (formData.admin_password !== formData.admin_password_confirm) {
      alert('Konfirmasi kata sandi tidak cocok!')
      return
    }

    setLoading(true)
    
    // Process steps simulation (as per requirements)
    setProgressMsg('Membuat data perusahaan...')
    await new Promise(r => setTimeout(r, 600))
    
    setProgressMsg('Mendaftarkan akun admin...')
    await new Promise(r => setTimeout(r, 600))
    
    setProgressMsg('Menyiapkan data awal...')
    await new Promise(r => setTimeout(r, 600))

    try {
      const res = await fetch('/api/setup/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: formData.company_name,
          slug: formData.slug,
          timezone: formData.timezone,
          admin_name: formData.admin_name,
          admin_email: formData.admin_email,
          admin_password: formData.admin_password
        })
      })

      const result = await res.json()
      if (result.ok) {
        setProgressMsg('Selesai! Mengarahkan ke login...')
        setTimeout(() => {
          router.push('/login?setup=success')
        }, 800)
      } else if (res.status === 409 || result.error?.includes('terkonfigurasi')) {
        alert('Sistem sudah terkonfigurasi. Mengarahkan Anda ke halaman login.')
        router.push('/login')
      } else {
        alert(result.error || 'Terjadi kesalahan saat setup.')
        setLoading(false)
        setStep(1)
      }
    } catch (err) {
      alert('Koneksi gagal. Silakan coba lagi.')
      setLoading(false)
      setStep(1)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Decorative Panel */}
      <div className="w-full md:w-[400px] bg-sidebar p-12 text-white flex flex-col relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -ml-32 -mb-32" />
        
        <div className="relative z-10">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-8 border border-white/10 shadow-2xl">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          
          <h1 className="text-3xl font-black mb-4">Setup Awal NanoApp HR</h1>
          <p className="text-white/60 text-sm leading-relaxed mb-12">
            Selamat datang! Mari konfigurasikan sistem HR perusahaan Anda dalam beberapa langkah mudah.
          </p>

          <div className="space-y-8">
            {[
              { id: 1, label: 'Informasi Perusahaan', sub: 'Nama & URL Sistem' },
              { id: 2, label: 'Akun Administrator', sub: 'Keamanan Akses Utama' },
              { id: 3, label: 'Konfirmasi', sub: 'Tinjau & Aktivasi' },
            ].map((s) => (
              <div key={s.id} className={cn(
                "flex items-start gap-4 transition-all duration-300",
                step === s.id ? "opacity-100 scale-105" : "opacity-40"
              )}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-colors",
                  step === s.id ? "bg-primary border-primary text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "border-white/20 text-white"
                )}>
                  {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                </div>
                <div>
                  <p className="font-bold text-sm tracking-wide">{s.label}</p>
                  <p className="text-[11px] text-white/40 uppercase font-medium mt-0.5">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto relative z-10 pt-12">
          <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">Powered by NanoApp Sensitivitas</p>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-12 relative">
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border p-8 md:p-12 animate-in slide-in-from-right duration-500">
          
          {/* Step Bubbles (Top) */}
          <div className="flex justify-center mb-12">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <React.Fragment key={s}>
                  <div className={cn(
                    "w-3 h-3 rounded-full transition-all duration-500",
                    step >= s ? "bg-primary w-8" : "bg-muted"
                  )} />
                  {s < 3 && <div className="w-4 h-[2px] bg-muted/30" />}
                </React.Fragment>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-primary/10 rounded-full animate-spin" />
                <Loader2 className="w-10 h-10 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold mt-8 text-slate-800">{progressMsg}</h3>
              <p className="text-muted-foreground text-sm mt-2">Mohon tunggu sebentar, sistem sedang dikonfigurasi...</p>
            </div>
          ) : (
            <>
              {step === 1 && (
                <div className="space-y-8 animate-in slide-in-from-right duration-300">
                  <div className="text-left">
                    <h2 className="text-2xl font-black text-slate-900 leading-tight">Informasi Perusahaan</h2>
                    <p className="text-muted-foreground mt-2">Identitas dasar untuk sistem HR Anda.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-1.5 text-left">
                      <label className="text-sm font-bold text-slate-700">Nama Perusahaan</label>
                      <div className="relative group">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input 
                          type="text" 
                          required
                          value={formData.company_name}
                          onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                          placeholder="Contoh: PT Teknologi Indonesia"
                          className="w-full pl-12 pr-4 py-3 bg-muted/30 border-2 border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-2xl text-sm transition-all outline-none font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="text-sm font-bold text-slate-700">URL Sistem (Slug)</label>
                      <div className="relative group">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input 
                          type="text" 
                          required
                          value={formData.slug}
                          onChange={(e) => setFormData({...formData, slug: e.target.value})}
                          className="w-full pl-12 pr-4 py-3 bg-muted/30 border-2 border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-2xl text-sm transition-all outline-none font-bold text-primary"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2 font-medium">
                        Akses Sistem: <span className="text-primary font-bold">nanoapp.com/{formData.slug || 'slug-anda'}</span>
                      </p>
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="text-sm font-bold text-slate-700">Zona Waktu Default</label>
                      <select 
                        value={formData.timezone}
                        onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                        className="w-full px-4 py-3 bg-muted/30 border-2 border-transparent focus:bg-white focus:border-primary rounded-2xl text-sm outline-none appearance-none cursor-pointer font-medium"
                      >
                        <option value="Asia/Jakarta">WIB — Asia/Jakarta (GMT+7)</option>
                        <option value="Asia/Makassar">WITA — Asia/Makassar (GMT+8)</option>
                        <option value="Asia/Jayapura">WIT — Asia/Jayapura (GMT+9)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button 
                      onClick={handleNext}
                      disabled={!formData.company_name || !formData.slug}
                      className="w-full btn-primary py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 group"
                    >
                      Lanjutkan
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8 animate-in slide-in-from-right duration-300">
                  <div className="text-left">
                    <h2 className="text-2xl font-black text-slate-900 leading-tight">Akun Administrator</h2>
                    <p className="text-muted-foreground mt-2">Pemegang kontrol penuh sistem pertama kali.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-1.5 text-left">
                      <label className="text-sm font-bold text-slate-700">Nama Lengkap Admin</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input 
                          type="text" 
                          required
                          value={formData.admin_name}
                          onChange={(e) => setFormData({...formData, admin_name: e.target.value})}
                          placeholder="Nama Lengkap"
                          className="w-full pl-12 pr-4 py-3 bg-muted/30 border-2 border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-2xl text-sm transition-all outline-none font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 text-left">
                      <label className="text-sm font-bold text-slate-700">Email Utama (Username)</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input 
                          type="email" 
                          required
                          value={formData.admin_email}
                          onChange={(e) => setFormData({...formData, admin_email: e.target.value})}
                          placeholder="admin@perusahaan.com"
                          className="w-full pl-12 pr-4 py-3 bg-muted/30 border-2 border-transparent focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-2xl text-sm transition-all outline-none font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5 text-left">
                        <label className="text-sm font-bold text-slate-700">Kata Sandi</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input 
                            type={showPassword ? "text" : "password"} 
                            required
                            value={formData.admin_password}
                            onChange={(e) => setFormData({...formData, admin_password: e.target.value})}
                            className="w-full pl-12 pr-12 py-3 bg-muted/30 border-2 border-transparent focus:bg-white focus:border-primary rounded-2xl text-sm outline-none"
                          />
                          <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-900 transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-left">
                        <label className="text-sm font-bold text-slate-700">Konfirmasi Sandi</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input 
                            type={showPassword ? "text" : "password"} 
                            required
                            value={formData.admin_password_confirm}
                            onChange={(e) => setFormData({...formData, admin_password_confirm: e.target.value})}
                            className="w-full pl-12 pr-4 py-3 bg-muted/30 border-2 border-transparent focus:bg-white focus:border-primary rounded-2xl text-sm outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 flex gap-4">
                    <button onClick={handleBack} className="btn-outline px-6 rounded-2xl font-bold">
                      <ArrowLeft className="mr-2 w-4 h-4" />
                      Kembali
                    </button>
                    <button 
                      onClick={handleNext}
                      disabled={!formData.admin_name || !formData.admin_email || formData.admin_password.length < 8}
                      className="flex-1 btn-primary py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 group"
                    >
                      Lanjutkan
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8 animate-in slide-in-from-right duration-300">
                  <div className="text-left">
                    <h2 className="text-2xl font-black text-slate-900 leading-tight">Konfirmasi & Aktivasi</h2>
                    <p className="text-muted-foreground mt-2">Ditinjau kembali sebelum memulai konfigurasi otomatis.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-muted/30 p-6 rounded-2xl space-y-4 border border-slate-100 flex flex-col text-left">
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Perusahaan</p>
                      <div>
                        <p className="text-xs text-muted-foreground">Nama</p>
                        <p className="text-sm font-bold truncate">{formData.company_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Domain / Slug</p>
                        <p className="text-sm font-black text-primary uppercase tracking-tighter">{formData.slug}</p>
                      </div>
                    </div>

                    <div className="bg-muted/30 p-6 rounded-2xl space-y-4 border border-slate-100 flex flex-col text-left">
                      <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Administrator</p>
                      <div>
                        <p className="text-xs text-muted-foreground">Nama</p>
                        <p className="text-sm font-bold truncate">{formData.admin_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="text-sm font-bold truncate">{formData.admin_email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-amber-900">Keamanan Data</p>
                      <p className="text-[11px] text-amber-700/80 leading-relaxed mt-1 font-medium">
                        Pastikan email dan kata sandi dicatat dengan benar. Setelah proses ini selesai, Anda akan diminta untuk masuk ke sistem menggunakan kredensial tersebut.
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 flex gap-4">
                    <button onClick={handleBack} className="btn-outline px-6 rounded-2xl font-bold">
                      <ArrowLeft className="mr-2 w-4 h-4" />
                      Kembali
                    </button>
                    <button 
                      onClick={handleSubmit}
                      className="flex-1 btn-primary py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 group"
                    >
                      Mulai Setup Sistem
                      <CheckCircle2 className="ml-2 w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Social / Support Links (Optional) */}
          <div className="mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-muted-foreground font-medium uppercase tracking-widest">
            <p>© 2026 NanoApp Sensitivitas</p>
            <div className="flex gap-6">
              <span className="hover:text-primary transition-colors cursor-pointer">Dokumentasi</span>
              <span className="hover:text-primary transition-colors cursor-pointer">Hubungi Support</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
