import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

export default function LoginPage() {
  const navigate  = useNavigate()
  const { signIn, isLoading, error, clearError, user } = useAuthStore()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate('/summary-report', { replace: true })
  }, [user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    try {
      await signIn(email, password)
      navigate('/summary-report', { replace: true })
    } catch {
      // error already set in store
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-100 rounded-full opacity-40 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-100 rounded-full opacity-40 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-dropdown border border-gray-100 p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-3 shadow-md">
              <span className="text-white font-bold text-xl">T</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">TEFA Presensi</h1>
            <p className="text-sm text-gray-400 mt-0.5">Admin Panel</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs text-red-600 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => { clearError(); setEmail(e.target.value) }}
                placeholder="admin@nano.co.id"
                required
                autoComplete="email"
                className="input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => { clearError(); setPassword(e.target.value) }}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="input text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 w-3.5 h-3.5" />
                <span className="text-xs text-gray-500">Remember me</span>
              </label>
              <button type="button" className="text-xs text-blue-600 hover:underline font-medium">
                Lupa password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full btn-primary justify-center py-2.5 text-sm mt-1"
            >
              {isLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Masuk...
                </>
              ) : 'Masuk'}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-[11px] text-gray-400 mt-6">
            PT Nano Indonesia Sakti · Jember, Jawa Timur
          </p>
        </div>

        {/* Demo hint */}
        <div className="mt-3 text-center">
          <p className="text-[11px] text-gray-400">
            Hubungi superadmin untuk mendapatkan akses
          </p>
        </div>
      </div>
    </div>
  )
}
