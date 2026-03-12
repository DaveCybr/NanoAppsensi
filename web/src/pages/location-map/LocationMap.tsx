import { useEffect, useRef, useState } from 'react'
import { liveLocations } from '../../data/mockData'
import { Clock, CheckCircle2, AlertTriangle, MapPin } from 'lucide-react'
import clsx from 'clsx'

export default function LocationMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Dynamic import of leaflet
    import('leaflet').then(L => {
      const map = L.map(mapRef.current!, {
        center: [-8.2005, 113.6793],
        zoom: 13,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map)

      // Office zone circle
      L.circle([-8.2005, 113.6793], {
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        weight: 2,
        dashArray: '6 4',
        radius: 200,
      }).addTo(map)

      // Markers
      liveLocations.forEach(loc => {
        const color = loc.locationStatus === 'In Zone' ? '#22c55e' : '#ef4444'
        const icon = L.divIcon({
          className: '',
          html: `
            <div style="
              width: 32px; height: 32px;
              background: ${color};
              border: 2.5px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 8px rgba(0,0,0,0.25);
              display: flex; align-items: center; justify-content: center;
              cursor: pointer;
            ">
              <span style="color:white; font-size:13px; font-weight:700; font-family:sans-serif;">
                ${loc.employeeName.charAt(0)}
              </span>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })

        const marker = L.marker([loc.lat, loc.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:'Plus Jakarta Sans',sans-serif; font-size:12px; min-width:180px">
              <div style="font-weight:600; margin-bottom:4px">${loc.employeeName}</div>
              <div style="color:#6b7280">${loc.type === 'check-in' ? '🟢 Check In' : '🔴 Check Out'}</div>
              <div style="color:#6b7280; margin-top:2px">${loc.date} | ${loc.time}</div>
              <div style="margin-top:4px">
                <span style="background:${loc.locationStatus === 'In Zone' ? '#dcfce7' : '#fee2e2'}; color:${loc.locationStatus === 'In Zone' ? '#16a34a' : '#dc2626'}; padding:2px 8px; border-radius:99px; font-size:11px; font-weight:500">
                  ${loc.locationStatus}
                </span>
              </div>
            </div>
          `, { maxWidth: 240 })

        marker.on('click', () => setSelectedId(loc.id))
      })

      mapInstanceRef.current = map
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  const filtered = liveLocations.filter(l =>
    l.employeeName.toLowerCase().includes(search.toLowerCase())
  )

  const onTimeCnt  = liveLocations.filter(l => l.statusIn === 'On-Time').length
  const lateCnt    = liveLocations.filter(l => l.statusIn === 'Late').length

  return (
    <div className="flex h-full relative">
      {/* Map */}
      <div ref={mapRef} className="flex-1 h-full" />

      {/* Right Panel */}
      <div className="w-[320px] shrink-0 h-full flex flex-col bg-white border-l border-gray-200 z-10">
        {/* Summary bar */}
        <div className="p-4 border-b border-gray-100">
          <div className="text-sm font-semibold text-gray-800 mb-3">Summary</div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: <CheckCircle2 size={15} className="text-green-500" />, label: 'On Time',     value: onTimeCnt,                       color: 'text-green-600' },
              { icon: <Clock size={15} className="text-blue-500" />,         label: 'In Tolerance', value: 0,                              color: 'text-blue-600' },
              { icon: <AlertTriangle size={15} className="text-yellow-500" />,label: 'Late',        value: lateCnt,                         color: 'text-yellow-600' },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center p-2 bg-gray-50 rounded-lg gap-1">
                {s.icon}
                <div className={clsx('text-lg font-bold', s.color)}>{s.value}</div>
                <div className="text-[10px] text-gray-500 text-center">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-gray-100">
          <input
            type="text"
            placeholder="Cari karyawan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input text-xs"
          />
        </div>

        {/* Activity feed */}
        <div className="flex-1 overflow-y-auto">
          {filtered.map(loc => (
            <button
              key={loc.id}
              onClick={() => setSelectedId(loc.id === selectedId ? null : loc.id)}
              className={clsx(
                'w-full text-left px-4 py-3 border-b border-gray-50 flex items-start gap-3 transition-colors hover:bg-gray-50',
                selectedId === loc.id && 'bg-blue-50'
              )}
            >
              {/* Avatar */}
              <div className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-[11px] font-bold',
                loc.locationStatus === 'In Zone' ? 'bg-blue-500' : 'bg-gray-400'
              )}>
                {loc.employeeName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-gray-800 truncate">
                  {loc.employeeName}{' '}
                  <span className={clsx(
                    'font-medium',
                    loc.type === 'check-in' ? 'text-blue-600' : 'text-red-500'
                  )}>
                    {loc.type === 'check-in' ? 'Check In' : 'Check Out'}
                  </span>
                  {loc.statusIn !== 'others' && (
                    <span className="text-gray-400"> | {loc.statusIn}</span>
                  )}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  {loc.date} | {loc.time}
                </div>
                <div className="mt-1">
                  <span className={clsx(
                    'text-[10px] font-medium px-2 py-0.5 rounded-full',
                    loc.locationStatus === 'In Zone'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-600'
                  )}>
                    {loc.locationStatus}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="p-3 border-t border-gray-100 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow-sm" />
            <span className="text-[11px] text-gray-500">In Zone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-sm" />
            <span className="text-[11px] text-gray-500">Out Zone</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <MapPin size={12} className="text-blue-500" />
            <span className="text-[11px] text-gray-500">Office Zone</span>
          </div>
        </div>
      </div>
    </div>
  )
}
