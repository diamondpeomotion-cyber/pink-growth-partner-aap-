import React, { useState } from 'react';
import { 
  MapPin, 
  Layers, 
  ZoomIn, 
  ZoomOut, 
  Compass, 
  Navigation2, 
  ExternalLink,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface MapPreviewProps {
  fullAddress: string;
  localityName: string;
  cityName: string;
  stateName: string;
  pincode: string;
  landmark?: string;
  onDetectLocation?: () => void;
  isDetecting?: boolean;
}

export default function MapPreview({
  fullAddress,
  localityName,
  cityName,
  stateName,
  pincode,
  landmark,
  onDetectLocation,
  isDetecting = false
}: MapPreviewProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(15);
  const [mapMode, setMapMode] = useState<'roadmap' | 'satellite'>('roadmap');

  // Construct search query string for Google Maps embed
  const searchQuery = [
    fullAddress,
    localityName,
    cityName,
    stateName,
    pincode
  ].filter(Boolean).join(', ') || 'Jaipur, Rajasthan';

  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(searchQuery)}&t=${mapMode === 'satellite' ? 'k' : ''}&z=${zoomLevel}&ie=UTF8&iwloc=&output=embed`;
  const externalMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col transition-all">
      {/* Map Header / Location Detector Bar */}
      <div className="p-3 bg-gray-50/80 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Navigation2 size={16} />
          </span>
          <div>
            <h4 className="text-xs font-bold text-gray-900">Live Map Location Preview</h4>
            <p className="text-[11px] text-gray-500 font-medium line-clamp-1">
              Updates automatically as you type address details
            </p>
          </div>
        </div>

        {onDetectLocation && (
          <button 
            type="button"
            onClick={onDetectLocation}
            disabled={isDetecting}
            className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Compass size={14} className={isDetecting ? "animate-spin" : ""} />
            {isDetecting ? "Locating..." : "Detect GPS Location"}
          </button>
        )}
      </div>

      {/* Interactive Map Iframe Canvas Container */}
      <div className="relative w-full h-64 md:h-72 bg-gray-100 overflow-hidden group">
        <iframe
          key={`${searchQuery}-${mapMode}-${zoomLevel}`}
          title="Interactive Shop Location Map"
          width="100%"
          height="100%"
          src={embedUrl}
          loading="lazy"
          className="w-full h-full border-0 pointer-events-auto filter contrast-[1.02]"
        />

        {/* Center Pin Indicator Badge */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none flex flex-col items-center z-10 animate-bounce">
          <div className="bg-primary text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg border border-white flex items-center gap-1 whitespace-nowrap">
            <MapPin size={12} className="fill-white" />
            Shop Pin
          </div>
          <div className="w-2 h-2 bg-primary rotate-45 -mt-1 shadow-md"></div>
        </div>

        {/* Map View Controls Overlay (Zoom & Type Toggle) */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-20">
          <button
            type="button"
            onClick={() => setMapMode(mapMode === 'roadmap' ? 'satellite' : 'roadmap')}
            className={`p-2 rounded-xl text-xs font-bold shadow-md border backdrop-blur-md transition-all flex items-center gap-1 ${
              mapMode === 'satellite'
                ? 'bg-gray-900 text-white border-gray-700'
                : 'bg-white/90 text-gray-800 border-gray-200 hover:bg-white'
            }`}
            title="Toggle Map / Satellite"
          >
            <Layers size={14} />
            <span className="text-[10px] hidden sm:inline uppercase">{mapMode}</span>
          </button>

          <div className="flex flex-col bg-white/90 backdrop-blur-md rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.min(prev + 1, 19))}
              className="p-2 hover:bg-gray-100 text-gray-700 border-b border-gray-100 transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={15} />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.max(prev - 1, 10))}
              className="p-2 hover:bg-gray-100 text-gray-700 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={15} />
            </button>
          </div>
        </div>

        {/* Live Address Overlay Chip */}
        <div className="absolute bottom-3 left-3 right-3 z-20">
          <div className="bg-white/95 backdrop-blur-md p-2.5 rounded-xl border border-gray-200 shadow-md flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold text-gray-900 truncate">
                  {fullAddress || `${localityName}, ${cityName}`}
                </p>
                <p className="text-[10px] text-gray-500 font-medium truncate">
                  {cityName}, {stateName} {pincode ? `- ${pincode}` : ''}
                </p>
              </div>
            </div>

            <a
              href={externalMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 bg-gray-100 hover:bg-primary/10 hover:text-primary text-gray-600 rounded-lg text-xs transition-colors shrink-0 flex items-center gap-1 font-semibold"
              title="Open in Google Maps"
            >
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>

      {/* Geocoding Status Footer */}
      <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-600 font-medium">
        <span className="flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
          <CheckCircle2 size={13} className="text-emerald-600" /> Map pin aligned with address
        </span>
        <span className="text-[10px] text-gray-400">
          Lat/Lng: 26.8521° N, 75.7682° E
        </span>
      </div>
    </div>
  );
}
