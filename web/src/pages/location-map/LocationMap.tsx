// web/src/pages/location-map/LocationMap.tsx
// Versi baru — data dari Supabase, bukan mockData

import { useEffect, useRef } from "react";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  RefreshCw,
  Loader2,
} from "lucide-react";
import clsx from "clsx";
import { useLocationMap } from "../../hooks/useLocationMap";
import { useZones } from "../../hooks/useZones";

export default function LocationMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const { date, setDate, rows, summary, isLoading, error, refetch } =
    useLocationMap();

  const { zones } = useZones();

  // ── Init map ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Guard against React StrictMode double-mount: Leaflet leaves _leaflet_id
    // on the DOM node even after .remove() is called asynchronously.
    if ((mapRef.current as any)._leaflet_id) return;

    import("leaflet").then((L) => {
      // Double-check after async import in case of concurrent renders
      if (!mapRef.current || mapInstanceRef.current) return;
      if ((mapRef.current as any)._leaflet_id) return;

      const map = L.map(mapRef.current!, {
        center: [-8.2005, 113.6793],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // ── Draw zone circles ─────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || zones.length === 0) return;

    import("leaflet").then((L) => {
      // Clear existing zone layers
      markersRef.current.forEach((m) => {
        try {
          m.remove();
        } catch {}
      });

      zones.forEach((zone) => {
        const circle = L.circle([zone.latitude, zone.longitude], {
          color: "#2563eb",
          fillColor: "#3b82f6",
          fillOpacity: 0.1,
          weight: 2,
          dashArray: "6 4",
          radius: zone.radius_meters,
        }).addTo(map);

        markersRef.current.push(circle);
      });
    });
  }, [zones]);

  // ── Draw attendance markers ───────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    import("leaflet").then((L) => {
      // Hapus hanya marker (bukan zone circles) — filter by custom flag
      markersRef.current = markersRef.current.filter((m) => {
        if (m._isAttendanceMarker) {
          m.remove();
          return false;
        }
        return true;
      });

      rows.forEach((loc) => {
        // Skip jika tidak ada koordinat
        if (loc.lat === null || loc.lng === null) return;

        const color =
          loc.type === "check-in"
            ? loc.locationStatus === "In Zone"
              ? "#22c55e"
              : "#ef4444"
            : "#94a3b8";

        const icon = L.divIcon({
          className: "",
          html: `
            <div style="
              width:32px;height:32px;
              background:${color};
              border:2.5px solid white;
              border-radius:50%;
              box-shadow:0 2px 8px rgba(0,0,0,0.25);
              display:flex;align-items:center;justify-content:center;
              cursor:pointer;
            ">
              <span style="color:white;font-size:13px;font-weight:700;font-family:sans-serif;">
                ${loc.employeeName.charAt(0)}
              </span>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker([loc.lat, loc.lng], { icon })
          .addTo(map)
          .bindPopup(
            `
            <div style="font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;min-width:180px">
              <div style="font-weight:600;margin-bottom:4px">${loc.employeeName}</div>
              <div style="color:#6b7280">
                ${loc.type === "check-in" ? "🟢 Check In" : "🔴 Check Out"}
              </div>
              <div style="color:#6b7280;margin-top:2px">${loc.date} | ${loc.time}</div>
              <div style="margin-top:4px">
                <span style="
                  background:${loc.locationStatus === "In Zone" ? "#dcfce7" : loc.locationStatus === "No GPS" ? "#f3f4f6" : "#fee2e2"};
                  color:${loc.locationStatus === "In Zone" ? "#16a34a" : loc.locationStatus === "No GPS" ? "#6b7280" : "#dc2626"};
                  padding:2px 8px;border-radius:99px;font-size:11px;font-weight:500
                ">
                  ${loc.locationStatus}
                </span>
              </div>
              <div style="color:#9ca3af;font-size:10px;margin-top:4px">${loc.statusLabel}</div>
            </div>
          `,
            { maxWidth: 240 },
          );

        (marker as any)._isAttendanceMarker = true;
        markersRef.current.push(marker);
      });
    });
  }, [rows]);

  // Filter rows yang punya koordinat untuk panel kanan
  const rowsWithCoords = rows.filter((r) => r.lat !== null);
  const rowsNoCoords = rows.filter((r) => r.lat === null);

  return (
    <div className="flex h-full relative">
      {/* Map */}
      <div ref={mapRef} className="flex-1 h-full" />

      {/* Right Panel */}
      <div className="w-[320px] shrink-0 h-full flex flex-col bg-white border-l border-gray-200 z-10">
        {/* Date filter + refresh */}
        <div className="p-3 border-b border-gray-100 flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input text-xs flex-1"
          />
          <button
            onClick={refetch}
            disabled={isLoading}
            className="btn-icon shrink-0"
            title="Refresh"
          >
            <RefreshCw
              size={14}
              className={
                isLoading ? "animate-spin text-blue-500" : "text-gray-400"
              }
            />
          </button>
        </div>

        {/* Summary */}
        <div className="p-4 border-b border-gray-100">
          <div className="text-sm font-semibold text-gray-800 mb-3">
            Summary
            {isLoading && (
              <Loader2
                size={12}
                className="inline animate-spin ml-2 text-blue-400"
              />
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                icon: <CheckCircle2 size={15} className="text-green-500" />,
                label: "On Time",
                value: summary.onTime,
                color: "text-green-600",
              },
              {
                icon: <Clock size={15} className="text-blue-500" />,
                label: "Absen",
                value: summary.absent,
                color: "text-blue-600",
              },
              {
                icon: <AlertTriangle size={15} className="text-yellow-500" />,
                label: "Terlambat",
                value: summary.late,
                color: "text-yellow-600",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center p-2 bg-gray-50 rounded-lg gap-1"
              >
                {s.icon}
                <div className={clsx("text-lg font-bold", s.color)}>
                  {s.value}
                </div>
                <div className="text-[10px] text-gray-500 text-center">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 text-xs text-gray-400 text-center">
            Total: {summary.total} record · {rowsNoCoords.length} tanpa
            koordinat
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-3 mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
            {error}
          </div>
        )}

        {/* Activity feed */}
        <div className="flex-1 overflow-y-auto">
          {!isLoading && rows.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center h-32 text-gray-400">
              <MapPin size={20} className="mb-2 text-gray-300" />
              <p className="text-xs">Belum ada data kehadiran</p>
              <p className="text-[11px]">untuk tanggal ini</p>
            </div>
          )}

          {rows.map((loc) => (
            <div
              key={loc.id}
              className="w-full text-left px-4 py-3 border-b border-gray-50 flex items-start gap-3 hover:bg-gray-50"
            >
              {/* Avatar */}
              <div
                className={clsx(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-[11px] font-bold",
                  loc.type === "check-in"
                    ? loc.locationStatus === "In Zone"
                      ? "bg-blue-500"
                      : "bg-red-400"
                    : "bg-gray-400",
                )}
              >
                {loc.employeeName.charAt(0)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-gray-800 truncate">
                  {loc.employeeName}{" "}
                  <span
                    className={clsx(
                      "font-medium",
                      loc.type === "check-in"
                        ? "text-blue-600"
                        : "text-red-500",
                    )}
                  >
                    {loc.type === "check-in" ? "Check In" : "Check Out"}
                  </span>
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  {loc.date} | {loc.time}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className={clsx(
                      "text-[10px] font-medium px-2 py-0.5 rounded-full",
                      loc.locationStatus === "In Zone"
                        ? "bg-green-100 text-green-700"
                        : loc.locationStatus === "No GPS"
                          ? "bg-gray-100 text-gray-500"
                          : "bg-red-100 text-red-600",
                    )}
                  >
                    {loc.locationStatus}
                  </span>
                  {loc.lat === null && (
                    <span className="text-[10px] text-gray-400">· no GPS</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="p-3 border-t border-gray-100 flex items-center gap-3 flex-wrap">
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
  );
}
