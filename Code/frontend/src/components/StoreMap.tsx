import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Store } from '../types';
import { useNavigate } from 'react-router-dom';

// Fix default marker icons broken by bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const storeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo([lat, lng], 13, { duration: 1.2 }); }, [lat, lng, map]);
  return null;
}

interface Props {
  stores: Store[];
  userLat?: number | null;
  userLng?: number | null;
}

export default function StoreMap({ stores, userLat, userLng }: Props) {
  const navigate = useNavigate();
  const center: [number, number] = userLat && userLng
    ? [userLat, userLng]
    : stores.length > 0
    ? [stores[0].lat, stores[0].lng]
    : [25.7617, -80.1918]; // Miami default

  return (
    <MapContainer center={center} zoom={12} className="w-full h-full rounded-2xl" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {userLat && userLng && (
        <>
          <FlyTo lat={userLat} lng={userLng} />
          <Marker position={[userLat, userLng]} icon={userIcon}>
            <Popup>You are here</Popup>
          </Marker>
        </>
      )}
      {stores.map((store) => (
        <Marker key={store.id} position={[store.lat, store.lng]} icon={storeIcon}>
          <Popup>
            <div className="min-w-[160px]">
              <p className="font-bold text-sm">{store.name}</p>
              <p className="text-xs text-gray-500">{store.address}, {store.city}</p>
              {store.distance != null && (
                <p className="text-xs text-gray-400 mt-0.5">{store.distance.toFixed(1)} mi away</p>
              )}
              <button
                onClick={() => navigate(`/store/${store.id}`)}
                className="mt-2 w-full bg-brand-600 text-white text-xs py-1.5 rounded-lg font-semibold"
              >
                View Store
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
