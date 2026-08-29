"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";

export interface NearbyMapFighter {
  id: string;
  label: string;
  sublabel?: string;
  latitude: number;
  longitude: number;
}

export interface NearbyMapGym {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

interface NearbyMapProps {
  center: { latitude: number; longitude: number };
  fighters: NearbyMapFighter[];
  gyms: NearbyMapGym[];
}

export default function NearbyMap({ center, fighters, gyms }: NearbyMapProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-stone-border" style={{ height: 340 }}>
      <MapContainer
        center={[center.latitude, center.longitude]}
        zoom={10}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <CircleMarker
          center={[center.latitude, center.longitude]}
          radius={9}
          pathOptions={{ color: "#e8e2d6", fillColor: "#e8e2d6", fillOpacity: 0.9 }}
        >
          <Popup>You</Popup>
        </CircleMarker>

        {fighters.map((fighter) => (
          <CircleMarker
            key={fighter.id}
            center={[fighter.latitude, fighter.longitude]}
            radius={7}
            pathOptions={{ color: "#a3283a", fillColor: "#a3283a", fillOpacity: 0.85 }}
          >
            <Popup>
              <strong>{fighter.label}</strong>
              {fighter.sublabel ? <div>{fighter.sublabel}</div> : null}
            </Popup>
          </CircleMarker>
        ))}

        {gyms.map((gym) => (
          <CircleMarker
            key={gym.id}
            center={[gym.latitude, gym.longitude]}
            radius={7}
            pathOptions={{ color: "#2a2622", fillColor: "#2a2622", fillOpacity: 0.85 }}
          >
            <Popup>{gym.name}</Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
