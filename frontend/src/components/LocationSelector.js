import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
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
 * Location Selector Component
 * Shows a map where users can click to select a location
 * 
 * @param {Object} position - { lat, lng } - Current selected position
 * @param {Function} onLocationSelect - Callback when location is selected (lat, lng)
 * @param {Number} height - Map height in pixels (default: 400)
 * @param {String} label - Label to show in popup (default: 'Selected Location')
 */

function LocationMarker({ position, onLocationSelect, label }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position ? (
    <Marker position={[position.lat, position.lng]}>
      <Popup>{label || 'Selected Location'}</Popup>
    </Marker>
  ) : null;
}

function LocationSelector({ position, onLocationSelect, height = 400, label, zoom = 13 }) {
  const defaultPosition = position || { lat: 35.6892, lng: 51.3890 }; // Tehran default

  return (
    <Box sx={{ height: height, width: '100%', borderRadius: 1, overflow: 'hidden' }}>
      <MapContainer
        center={[defaultPosition.lat, defaultPosition.lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker
          position={position}
          onLocationSelect={onLocationSelect}
          label={label}
        />
      </MapContainer>
    </Box>
  );
}

export default LocationSelector;

