"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

// Fix Leaflet's default icon path issues in React
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface Lead {
  place_id: string;
  company_name: string;
  latitude: number | string;
  longitude: number | string;
  address: string;
  category: string;
  rating: string | number;
}

export default function LeadsMap({ leads }: { leads: Lead[] }) {
  // Filter leads with valid coordinates
  const mapLeads = leads.filter(
    (l) => l.latitude && l.longitude && Number(l.latitude) !== 0 && Number(l.longitude) !== 0
  );

  const defaultCenter: [number, number] = mapLeads.length > 0 
    ? [Number(mapLeads[0].latitude), Number(mapLeads[0].longitude)] 
    : [20.5937, 78.9629]; // Default to India

  return (
    <div className="w-full h-full rounded-xl overflow-hidden shadow-sm border border-hairline-strong z-0 relative">
      <MapContainer 
        center={defaultCenter} 
        zoom={mapLeads.length > 0 ? 12 : 5} 
        scrollWheelZoom={true} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {mapLeads.map((lead) => (
          <Marker 
            key={lead.place_id} 
            position={[Number(lead.latitude), Number(lead.longitude)]}
            icon={customIcon}
          >
            <Popup className="font-sans">
              <div className="flex flex-col gap-1 p-1">
                <strong className="text-[14px] font-[700] text-foreground">{lead.company_name}</strong>
                <span className="text-[11px] font-[600] text-primary bg-primary/10 px-2 py-0.5 rounded-full inline-block w-fit uppercase mb-1">
                  {lead.category}
                </span>
                <span className="text-[12px] text-text-mute">{lead.address}</span>
                <span className="text-[12px] font-[600] text-foreground flex items-center gap-1 mt-1">
                  <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                  {lead.rating}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
