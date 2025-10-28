// MapSection.jsx
import {
  faMapMarkerAlt
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import './MapSection.css';

// Fix default marker icon issue in Leaflet + React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
});

const MapSection = () => {
  const position = [11.1450950, 39.6345295]; 

  return (
    <section className="contact-map-section">
      <div className="map-header">
        <div className="icon-container location">
          <FontAwesomeIcon icon={faMapMarkerAlt} className="contact-icon" />
        </div>
      </div>
      <div className="half-section visit">
       
        <MapContainer center={position} zoom={13} scrollWheelZoom={false} className="leaflet-map">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={position}>
            <Popup>We are here!</Popup>
          </Marker>
        </MapContainer>
      </div>
    </section>
  );
};

export default MapSection;
