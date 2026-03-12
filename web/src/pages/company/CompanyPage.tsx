import { useState, useRef, useEffect } from 'react'
import { Edit, Upload, RefreshCw } from 'lucide-react'
import { useCompany } from '../../hooks/useCompany'
import { differenceInDays, parseISO, format } from 'date-fns'

export default function CompanyPage() {
  const { tenant, isSaving, isUploading, saveError, uploadError, successMsg, setSaveError, save, uploadLogoFile } = useCompany()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({
    name:         '',
    phone:        '',
    email:        '',
    address:      '',
    cut_off_date: '',
  })

  // Sync form when tenant data loads
  useEffect(() => {
    if (tenant) {
      setForm({
        name:         (tenant as any).name         ?? '',
        phone:        (tenant as any).phone        ?? '',
        email:        (tenant as any).email        ?? '',
        address:      (tenant as any).address      ?? '',
        cut_off_date: (tenant as any).cut_off_date ?? '',
      })
    }
  }, [tenant])

  const handleSave = async () => {
    const { error } = await save({
      name:         form.name,
      phone:        form.phone        || null,
      email:        form.email        || null,
      address:      form.address      || null,
      cut_off_date: form.cut_off_date || null,
    })
    if (!error) setEditMode(false)
  }

  const handleLogoClick = () => {
    if (editMode) fileInputRef.current?.click()
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadLogoFile(file)
    e.target.value = ''
  }

  const plan        = (tenant as any)?.plan        ?? '—'
  const expiresAt   = (tenant as any)?.expires_at
  const onboardedAt = (tenant as any)?.onboarded_at
  const logoUrl     = (tenant as any)?.logo_url
  const tenantId    = (tenant as any)?.id          ?? '—'

  let daysLeft      = 0
  let onboardedFrom = '—'
  let onboardedTo   = '—'
  if (onboardedAt) onboardedFrom = format(parseISO(onboardedAt), 'dd MMMM yyyy')
  if (expiresAt) {
    onboardedTo = format(parseISO(expiresAt), 'dd MMMM yyyy')
    daysLeft    = Math.max(0, differenceInDays(parseISO(expiresAt), new Date()))
  }

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      {/* Company Data Card */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-gray-900">Company Data</h2>
          {!editMode && (
            <button onClick={() => { setSaveError(null); setEditMode(true) }} className="btn-primary text-xs">
              <Edit size={13} /> Edit Data
            </button>
          )}
          {editMode && (
            <div className="flex gap-2">
              <button onClick={() => setEditMode(false)} className="btn-secondary text-xs">Cancel</button>
              <button onClick={handleSave} disabled={isSaving} className="btn-primary text-xs">
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {successMsg && !editMode && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">{successMsg}</div>
        )}
        {(saveError || uploadError) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
            {saveError || uploadError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-8">
          {/* Left: Logo */}
          <div>
            <div className="text-xs font-medium text-gray-500 mb-3">Company Logo</div>
            <div className="flex items-start gap-4">
              <div
                onClick={handleLogoClick}
                className={`w-20 h-20 rounded-xl border-2 border-gray-200 flex items-center justify-center bg-gray-50 overflow-hidden relative group ${editMode ? 'cursor-pointer' : ''}`}
              >
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="grid grid-cols-2 gap-0.5 p-2">
                    <div className="w-7 h-7 bg-orange-400 rounded-sm" />
                    <div className="w-7 h-7 bg-purple-500 rounded-sm" />
                    <div className="w-7 h-7 bg-teal-400 rounded-sm" />
                    <div className="w-7 h-7 bg-yellow-400 rounded-sm" />
                  </div>
                )}
                {editMode && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                    <Upload size={18} className="text-white" />
                  </div>
                )}
              </div>

              {editMode && (
                <div>
                  <button onClick={handleLogoClick} disabled={isUploading} className="btn-secondary text-xs">
                    <Upload size={12} /> {isUploading ? 'Uploading...' : 'Upload Logo'}
                  </button>
                  <p className="text-[11px] text-gray-400 mt-1">PNG, JPG max 2MB</p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={handleLogoChange}
              />
            </div>
          </div>

          {/* Right: Fields */}
          <div className="space-y-4">
            <div>
              <div className="text-xs text-gray-400 mb-1">Company Name</div>
              {editMode
                ? <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input text-sm" />
                : <div className="text-sm font-medium text-gray-800">{(tenant as any)?.name ?? '—'}</div>
              }
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">Company Phone</div>
              {editMode
                ? <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="input text-sm" placeholder="Nomor telepon" />
                : <div className="text-sm text-gray-500">{(tenant as any)?.phone || <span className="text-gray-300">—</span>}</div>
              }
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mt-5 pt-5 border-t border-gray-100">
          <div>
            <div className="text-xs text-gray-400 mb-1">Company ID</div>
            <div className="text-sm font-mono text-gray-700 text-xs">{tenantId}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Cut-off Date</div>
            {editMode
              ? <input value={form.cut_off_date} onChange={e => setForm(p => ({ ...p, cut_off_date: e.target.value }))} className="input text-sm w-24" type="number" min="1" max="31" />
              : <div className="text-sm text-gray-700">{(tenant as any)?.cut_off_date ?? '—'}</div>
            }
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Company Email</div>
            {editMode
              ? <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="input text-sm" placeholder="email@perusahaan.com" />
              : <div className="text-sm text-gray-500">{(tenant as any)?.email || <span className="text-gray-300">—</span>}</div>
            }
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Company Address</div>
            {editMode
              ? <textarea value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="input text-sm resize-none" rows={2} />
              : <div className="text-sm text-gray-700 leading-relaxed">{(tenant as any)?.address || <span className="text-gray-300">—</span>}</div>
            }
          </div>
        </div>
      </div>

      {/* Subscription Card */}
      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-semibold text-gray-900">Appsensi Status :</h2>
              <span className="text-base font-bold text-blue-600">{plan}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mt-4">
          <div>
            <div className="text-xs text-gray-400 mb-2">Onboarded Period</div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-700">
                {onboardedFrom} — {onboardedTo}
              </div>
              {daysLeft > 0 && (
                <span className="badge badge-info text-[11px] font-semibold">{daysLeft} days left</span>
              )}
            </div>
            <button className="btn-primary text-xs mt-3">
              <RefreshCw size={12} /> Update Plan
            </button>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-2">Contact Email (PIC)</div>
            <div className="text-sm text-gray-700">{(tenant as any)?.pic_email ?? '—'}</div>
            <button className="btn-secondary text-xs mt-3">Change PIC</button>
          </div>
        </div>
      </div>

      {/* Features info */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Plan Features — {String(plan).toUpperCase()}</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Max Employees', value: '50' },
            { label: 'Face Recognition', value: '✓ Aktif' },
            { label: 'GPS Validation', value: '✓ Aktif' },
            { label: 'Payroll Module', value: '✗ Tidak tersedia' },
            { label: 'Multi Location', value: '✗ Tidak tersedia' },
            { label: 'Custom Report', value: '✗ Tidak tersedia' },
          ].map(f => (
            <div key={f.label} className="bg-gray-50 rounded-lg p-3">
              <div className="text-[11px] text-gray-400 mb-0.5">{f.label}</div>
              <div className={`text-xs font-semibold ${f.value.startsWith('✓') ? 'text-green-600' : f.value.startsWith('✗') ? 'text-gray-400' : 'text-gray-800'}`}>
                {f.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
