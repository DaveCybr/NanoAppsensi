import { useEffect, useRef, useState } from 'react'
import { Plus, Edit, Trash2, Download } from 'lucide-react'
import { useZones } from '../../hooks/useZones'
import type { ZoneRow } from '../../lib/zonesService'

const STREET_TILE_URL  = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const SATELIT_TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

export default function ZonesPage() {
  const mapRef         = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const streetTileRef  = useRef<any>(null)
  const satelitTileRef = useRef<any>(null)
  const markersRef     = useRef<any[]>([])

  const [search, setSearch]       = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editZone, setEditZone]   = useState<ZoneRow | null>(null)
  const [form, setForm]           = useState({ officeName: '', officeAddress: '', latitude: '', longitude: '', radiusMeters: '200' })
  const [mapLayer, setMapLayer]   = useState<'peta' | 'satelit'>('peta')
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const { zones, isLoading, error, isSaving, isDeleting, saveError, setSaveError, create, update, remove } = useZones()

  // ── Init map ──
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    import('leaflet').then(L => {
      const map = L.map(mapRef.current!, {
        center: [-8.2005, 113.6793],
        zoom: 14,
        zoomControl: true,
      })

      const street  = L.tileLayer(STREET_TILE_URL,  { attribution: '© OpenStreetMap' })
      const satelit = L.tileLayer(SATELIT_TILE_URL, { attribution: '© Esri' })

      street.addTo(map)
      streetTileRef.current  = street
      satelitTileRef.current = satelit
      mapInstanceRef.current = map

      // Map click → auto-fill coordinates in form
      map.on('click', (e: any) => {
        setForm(prev => ({
          ...prev,
          latitude:  String(e.latlng.lat.toFixed(7)),
          longitude: String(e.latlng.lng.toFixed(7)),
        }))
      })
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // ── Switch tile layer ──
  useEffect(() => {
    const map     = mapInstanceRef.current
    const street  = streetTileRef.current
    const satelit = satelitTileRef.current
    if (!map || !street || !satelit) return

    if (mapLayer === 'peta') {
      satelit.remove()
      street.addTo(map)
    } else {
      street.remove()
      satelit.addTo(map)
    }
  }, [mapLayer])

  // ── Redraw zone circles when data changes ──
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    import('leaflet').then(L => {
      markersRef.current.forEach(m => m.remove())
      markersRef.current = []

      zones.forEach(zone => {
        const circle = L.circle([zone.latitude, zone.longitude], {
          color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.12,
          weight: 2, dashArray: '6 4', radius: zone.radius_meters,
        }).addTo(map)

        const icon = L.divIcon({
          className: '',
          html: `<div style="width:36px;height:36px;background:#2563eb;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>`,
          iconSize: [36, 36], iconAnchor: [18, 18],
        })

        const marker = L.marker([zone.latitude, zone.longitude], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;min-width:200px">
              <div style="font-weight:700;color:#1d4ed8;margin-bottom:4px">${zone.name}</div>
              <div style="color:#6b7280;font-size:11px;line-height:1.4">${zone.address ?? ''}</div>
              <div style="margin-top:6px">
                <span style="background:#dbeafe;color:#1d4ed8;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:500">Radius: ${zone.radius_meters}m</span>
              </div>
            </div>
          `, { maxWidth: 280 })

        markersRef.current.push(circle, marker)
      })
    })
  }, [zones])

  const filtered = zones.filter(z =>
    z.name.toLowerCase().includes(search.toLowerCase()) ||
    (z.address ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => {
    setEditZone(null)
    setSaveError(null)
    setForm({ officeName: '', officeAddress: '', latitude: '', longitude: '', radiusMeters: '200' })
    setShowModal(true)
  }

  const openEdit = (z: ZoneRow) => {
    setEditZone(z)
    setSaveError(null)
    setForm({
      officeName:    z.name,
      officeAddress: z.address ?? '',
      latitude:      String(z.latitude),
      longitude:     String(z.longitude),
      radiusMeters:  String(z.radius_meters),
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.officeName.trim() || !form.latitude || !form.longitude) return
    const result = editZone
      ? await update(editZone.id, form)
      : await create(form)
    if (!result.error) setShowModal(false)
  }

  const handleDelete = async (id: string) => {
    await remove(id)
    setConfirmId(null)
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Zones</h1>
        <button className="btn-secondary text-xs"><Download size={14} /> Download Report</button>
      </div>

      {/* Map Card */}
      <div className="card overflow-hidden">
        <div style={{ position: 'relative', display: 'inline-flex', margin: '12px 0 0 12px', zIndex: 20 }}
          className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
          {(['peta', 'satelit'] as const).map(l => (
            <button key={l} onClick={() => setMapLayer(l)}
              className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${mapLayer === l ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {l === 'peta' ? 'Peta' : 'Satelit'}
            </button>
          ))}
        </div>
        <div ref={mapRef} style={{ height: 300, width: '100%', marginTop: -40 }} />
        <p className="text-xs text-blue-500 px-4 pb-3 pt-1">
          📍 Klik pada peta saat modal terbuka untuk mengisi koordinat otomatis
        </p>
      </div>

      {/* Zone Table */}
      <div className="card overflow-hidden">
        {error && (
          <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">{error}</div>
        )}
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <button onClick={openAdd} className="btn-primary text-xs"><Plus size={14} /> Add Zones</button>
          <div className="relative ml-2">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input type="text" placeholder="Search" value={search}
              onChange={e => setSearch(e.target.value)} className="input pl-7 w-44 text-xs" />
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr>
              <th className="table-th">Office Name</th>
              <th className="table-th">Office Address</th>
              <th className="table-th">Latitude</th>
              <th className="table-th">Longitude</th>
              <th className="table-th">Radius (in meter)</th>
              <th className="table-th">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">Loading...</td></tr>
            )}
            {!isLoading && filtered.map(z => (
              <tr key={z.id} className="table-tr-hover">
                <td className="table-td">
                  <span className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer">{z.name}</span>
                </td>
                <td className="table-td text-xs text-gray-500 max-w-xs truncate">{z.address}</td>
                <td className="table-td text-xs font-mono text-gray-700">{z.latitude}</td>
                <td className="table-td text-xs font-mono text-gray-700">{z.longitude}</td>
                <td className="table-td text-xs font-semibold text-gray-800">{z.radius_meters}</td>
                <td className="table-td">
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(z)}
                      className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition-colors">
                      <Edit size={12} className="text-blue-500" />
                    </button>
                    <button onClick={() => setConfirmId(z.id)}
                      className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors">
                      <Trash2 size={12} className="text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && filtered.length === 0 && !error && (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">Tidak ada zona</td></tr>
            )}
          </tbody>
        </table>

        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Items per page:</span>
            <select className="select text-xs w-16"><option>10</option></select>
          </div>
          <div className="text-xs text-gray-500">1–{filtered.length} of {filtered.length}</div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-dropdown w-full max-w-md p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              {editZone ? 'Edit Zone' : 'Add Zone'}
            </h3>
            {saveError && (
              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">{saveError}</div>
            )}
            <div className="space-y-3">
              {[
                { label: 'Office Name', key: 'officeName', placeholder: 'e.g. Kantor Pusat' },
                { label: 'Office Address', key: 'officeAddress', placeholder: 'Alamat lengkap...' },
                { label: 'Latitude', key: 'latitude', placeholder: 'e.g. -8.200565' },
                { label: 'Longitude', key: 'longitude', placeholder: 'e.g. 113.6792966' },
                { label: 'Radius (meters)', key: 'radiusMeters', placeholder: 'e.g. 200' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">{f.label}</label>
                  <input
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="input text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="text-xs text-blue-600 mt-3 flex items-center gap-1">
              <span>📍</span> Klik pada peta untuk mengisi koordinat otomatis
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={() => setShowModal(false)} className="btn-secondary text-xs">Cancel</button>
              <button onClick={handleSave} disabled={isSaving} className="btn-primary text-xs">
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-dropdown w-full max-w-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Hapus Zone?</h3>
            <p className="text-sm text-gray-500 mb-5">Data zona ini akan dihapus secara permanen.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmId(null)} className="btn-secondary text-xs">Batal</button>
              <button onClick={() => handleDelete(confirmId)} disabled={isDeleting}
                className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                {isDeleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
