import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Pharmacy, UserLocation } from '../types';
import { calculateDistanceKm, formatDistance, isPharmacyOpen, getDirectionsUrl, TETE_CENTER, TETE_BAIRROS } from '../lib/geo';
import { Navigation, Phone, Clock, Store, MapPin, ExternalLink, Compass } from 'lucide-react';

interface MapViewProps {
  pharmacies: Pharmacy[];
  userLocation?: UserLocation | null;
  onSelectPharmacy: (pharmacyId: string) => void;
  onRequestUserLocation?: () => void;
  selectedBairro?: string;
  onBairroChange?: (bairro: string) => void;
  height?: string;
}

export const MapView: React.FC<MapViewProps> = ({
  pharmacies,
  userLocation,
  onSelectPharmacy,
  onRequestUserLocation,
  selectedBairro = 'Todos os Bairros',
  onBairroChange,
  height = 'h-[480px] sm:h-[540px]',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const [activePharmacy, setActivePharmacy] = useState<Pharmacy | null>(null);

  // Initialize Map safely
  useEffect(() => {
    if (!mapContainerRef.current) return;

    try {
      // Check if container already has a map attached by Leaflet
      const containerWithId = mapContainerRef.current as HTMLDivElement & { _leaflet_id?: number | null };
      if (containerWithId._leaflet_id && mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      if (!mapInstanceRef.current && mapContainerRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [TETE_CENTER.latitude, TETE_CENTER.longitude],
          zoom: 14,
          zoomControl: true,
        });

        // Standard OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        markersLayerRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;

        // Invalidate size after layout stabilization
        setTimeout(() => {
          try {
            map.invalidateSize();
          } catch {
            // ignore if unmounted
          }
        }, 150);
      }
    } catch (err) {
      console.warn('Leaflet map initialization safe catch:', err);
    }

    return () => {
      // Map cleanup on unmount
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {
          // ignore
        }
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers when pharmacies or userLocation change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    // Add User Location Marker if available
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div style="
            background: #2563EB;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            border: 3px solid #FFFFFF;
            box-shadow: 0 0 10px rgba(37,99,235,0.6);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon })
        .bindPopup('<b>A sua localização atual</b>')
        .addTo(layer);
    }

    // Filter pharmacies if bairro selected
    const filtered = selectedBairro && selectedBairro !== 'Todos os Bairros'
      ? pharmacies.filter((p) => p.bairro.toLowerCase().includes(selectedBairro.toLowerCase()))
      : pharmacies;

    const bounds: L.LatLngExpression[] = [];

    filtered.forEach((pharm) => {
      const isOpen = isPharmacyOpen(pharm.horario);
      const distance = userLocation
        ? calculateDistanceKm(userLocation.latitude, userLocation.longitude, pharm.latitude, pharm.longitude)
        : null;

      // Custom Pin SVG Icon matching FarmaLink Identity
      const pinColor = isOpen ? '#059669' : '#DC2626';
      const badgeBg = isOpen ? '#10B981' : '#EF4444';

      const customIcon = L.divIcon({
        className: 'farmalink-map-pin',
        html: `
          <div style="
            position: relative;
            width: 38px;
            height: 48px;
            cursor: pointer;
            filter: drop-shadow(0 3px 6px rgba(0,0,0,0.3));
          ">
            <svg viewBox="0 0 100 120" width="38" height="48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 115 C53 110 88 74 88 46 C88 25 71 10 50 10 C29 10 12 25 12 46 C12 74 47 110 50 115 Z" fill="${pinColor}" stroke="#FFFFFF" stroke-width="4"/>
              <circle cx="50" cy="46" r="22" fill="#FFFFFF"/>
              <!-- Green Cross in center -->
              <rect x="45" y="32" width="10" height="28" rx="2" fill="${pinColor}"/>
              <rect x="36" y="41" width="28" height="10" rx="2" fill="${pinColor}"/>
            </svg>
            <div style="
              position: absolute;
              bottom: 40px;
              left: 50%;
              transform: translateX(-50%);
              background: ${badgeBg};
              color: white;
              font-size: 9px;
              font-weight: 700;
              padding: 1px 5px;
              border-radius: 6px;
              white-space: nowrap;
              border: 1px solid white;
            ">
              ${isOpen ? 'Aberta' : 'Fechada'}
            </div>
          </div>
        `,
        iconSize: [38, 48],
        iconAnchor: [19, 48],
        popupAnchor: [0, -48],
      });

      const marker = L.marker([pharm.latitude, pharm.longitude], { icon: customIcon });

      marker.on('click', () => {
        setActivePharmacy(pharm);
      });

      marker.addTo(layer);
      bounds.push([pharm.latitude, pharm.longitude]);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [40, 40], maxZoom: 15 });
    }
  }, [pharmacies, userLocation, selectedBairro]);

  return (
    <div id="interactive-farmalink-map-container" className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-100">
      {/* Map Filter & Controls Bar */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Bairro Selector */}
        {onBairroChange && (
          <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-slate-200/80 px-2.5 py-1.5 flex items-center gap-2 text-xs">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <select
              id="map-bairro-filter"
              value={selectedBairro}
              onChange={(e) => onBairroChange(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer pr-2"
            >
              {TETE_BAIRROS.map((bairro) => (
                <option key={bairro} value={bairro}>
                  {bairro}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* GPS My Location Trigger */}
        {onRequestUserLocation && (
          <button
            type="button"
            id="map-gps-locate-btn"
            onClick={onRequestUserLocation}
            className="pointer-events-auto bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white px-3 py-1.5 rounded-xl shadow-md font-semibold text-xs flex items-center gap-1.5 transition-all"
          >
            <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Meu GPS</span>
          </button>
        )}
      </div>

      {/* Leaflet Map Div */}
      <div ref={mapContainerRef} className={`w-full ${height} z-0`} />

      {/* Selected Pharmacy Quick Bottom Card on Map */}
      {activePharmacy && (
        <div
          id="map-selected-pharmacy-card"
          className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:w-96 z-[400] bg-white rounded-2xl p-3.5 shadow-2xl border border-slate-200 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <img
                src={activePharmacy.logo_url}
                alt={activePharmacy.nome}
                className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0"
              />
              <div>
                <h4 className="font-bold text-slate-900 text-sm leading-tight">{activePharmacy.nome}</h4>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {activePharmacy.bairro}, Tete
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      isPharmacyOpen(activePharmacy.horario)
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isPharmacyOpen(activePharmacy.horario) ? 'bg-emerald-600' : 'bg-red-600'
                      }`}
                    ></span>
                    {isPharmacyOpen(activePharmacy.horario) ? 'Aberta' : 'Fechada'}
                  </span>
                  {userLocation && (
                    <span className="text-[11px] font-semibold text-slate-600">
                      {formatDistance(
                        calculateDistanceKm(
                          userLocation.latitude,
                          userLocation.longitude,
                          activePharmacy.latitude,
                          activePharmacy.longitude
                        )
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActivePharmacy(null)}
              className="text-slate-400 hover:text-slate-600 text-xs p-1"
            >
              ✕
            </button>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-100">
            <button
              type="button"
              id="map-popup-view-pharmacy"
              onClick={() => onSelectPharmacy(activePharmacy.id)}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs text-center transition-colors"
            >
              Ver Medicamentos
            </button>
            <a
              id="map-popup-directions"
              href={getDirectionsUrl(activePharmacy.latitude, activePharmacy.longitude, activePharmacy.nome)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl flex items-center justify-center gap-1 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-600" />
              <span>Como Chegar</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
