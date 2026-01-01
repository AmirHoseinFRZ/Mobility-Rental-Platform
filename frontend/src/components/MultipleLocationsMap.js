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
 * Multiple Locations Map Component
 * Shows multiple markers on a map
 * 
 * @param {Array} locations - Array of { lat, lng, label, id }
 * @param {Number} height - Map height in pixels (default: 400)
 * @param {Number} zoom - Zoom level (default: 12)
 * @param {Function} onMarkerClick - Callback when marker is clicked (location)
 */

function MultipleLocationsMap({ locations = [], height = 400, zoom = 12, onMarkerClick }) {
  if (!locations || locations.length === 0) {
    return null;
  }

  // Calculate center from all locations
  const center = locations.length > 0
    ? {
        lat: locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length,
        lng: locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length,
      }
    : { lat: 35.6892, lng: 51.3890 };

  return (
    <Box sx={{ height: height, width: '100%', borderRadius: 1, overflow: 'hidden' }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {locations.map((location, index) => (
          <Marker
            key={location.id || index}
            position={[location.lat, location.lng]}
            eventHandlers={{
              click: () => onMarkerClick && onMarkerClick(location),
            }}
          >
            <Popup>{location.label || `Location ${index + 1}`}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </Box>
  );
}

export default MultipleLocationsMap;

