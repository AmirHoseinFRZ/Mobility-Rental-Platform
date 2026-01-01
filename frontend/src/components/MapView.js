import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Box } from '@mui/material';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

/**
 * Map View Component
 * Shows a read-only map with a marker at specified location
 * 
 * @param {Object} position - { lat, lng } - Position to show
 * @param {Number} height - Map height in pixels (default: 300)
 * @param {String} label - Label to show in popup
 * @param {Number} zoom - Zoom level (default: 13)
 */

function MapView({ position, height = 300, label, zoom = 13 }) {
  if (!position || !position.lat || !position.lng) {
    return null;
  }

  return (
    <Box sx={{ height: height, width: '100%', borderRadius: 1, overflow: 'hidden' }}>
      <MapContainer
        center={[position.lat, position.lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[position.lat, position.lng]}>
          {label && <Popup>{label}</Popup>}
        </Marker>
      </MapContainer>
    </Box>
  );
}

export default MapView;

