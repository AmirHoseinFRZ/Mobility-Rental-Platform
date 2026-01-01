# Map Components Guide

This guide explains how to use the map components in the Mobility Rental Platform frontend.

## Available Components

### 1. LocationSelector
Interactive map where users can click to select a location.

**Usage:**
```javascript
import LocationSelector from '../components/LocationSelector';

function MyComponent() {
  const [location, setLocation] = useState(null);

  const handleLocationSelect = (lat, lng) => {
    setLocation({ lat, lng });
  };

  return (
    <LocationSelector
      position={location}
      onLocationSelect={handleLocationSelect}
      height={400}
      label="Selected Location"
      zoom={13}
    />
  );
}
```

**Props:**
- `position` - Object `{ lat, lng }` - Current selected position
- `onLocationSelect` - Function `(lat, lng) => {}` - Callback when user clicks map
- `height` - Number - Map height in pixels (default: 400)
- `label` - String - Label for the marker popup
- `zoom` - Number - Zoom level (default: 13)

### 2. MapView
Read-only map that displays a single location.

**Usage:**
```javascript
import MapView from '../components/MapView';

function MyComponent() {
  const vehicleLocation = { lat: 35.6892, lng: 51.3890 };

  return (
    <MapView
      position={vehicleLocation}
      height={300}
      label="Vehicle Location"
      zoom={15}
    />
  );
}
```

**Props:**
- `position` - Object `{ lat, lng }` - Position to display
- `height` - Number - Map height in pixels (default: 300)
- `label` - String - Label for the marker popup
- `zoom` - Number - Zoom level (default: 13)

### 3. MultipleLocationsMap
Map showing multiple locations with markers.

**Usage:**
```javascript
import MultipleLocationsMap from '../components/MultipleLocationsMap';

function MyComponent() {
  const vehicles = [
    { id: 1, lat: 35.6892, lng: 51.3890, label: 'Tesla Model 3' },
    { id: 2, lat: 35.7000, lng: 51.4000, label: 'BMW X5' },
    { id: 3, lat: 35.6800, lng: 51.3800, label: 'Mercedes C-Class' },
  ];

  const handleMarkerClick = (location) => {
    console.log('Clicked vehicle:', location);
    // Navigate to vehicle details or show popup
  };

  return (
    <MultipleLocationsMap
      locations={vehicles}
      height={500}
      zoom={12}
      onMarkerClick={handleMarkerClick}
    />
  );
}
```

**Props:**
- `locations` - Array of objects `[{ id, lat, lng, label }]`
- `height` - Number - Map height in pixels (default: 400)
- `zoom` - Number - Zoom level (default: 12)
- `onMarkerClick` - Function `(location) => {}` - Callback when marker is clicked

## Example Use Cases

### Driver Registration (Already Implemented)
- Uses `LocationSelector` to let drivers pick their current location
- No manual lat/lng input needed
- Includes "Use My Current Location" button

### Vehicle Search by Location
```javascript
import { useState } from 'react';
import LocationSelector from '../components/LocationSelector';
import MultipleLocationsMap from '../components/MultipleLocationsMap';

function VehicleSearch() {
  const [searchLocation, setSearchLocation] = useState(null);
  const [nearbyVehicles, setNearbyVehicles] = useState([]);

  const handleLocationSelect = async (lat, lng) => {
    setSearchLocation({ lat, lng });
    
    // Fetch nearby vehicles
    const vehicles = await vehicleService.getNearestVehicles(lat, lng, 10);
    setNearbyVehicles(vehicles.map(v => ({
      id: v.id,
      lat: v.latitude,
      lng: v.longitude,
      label: `${v.make} ${v.model} - $${v.pricePerHour}/hr`
    })));
  };

  return (
    <div>
      <h2>Select Search Location</h2>
      <LocationSelector
        position={searchLocation}
        onLocationSelect={handleLocationSelect}
        height={300}
      />
      
      {nearbyVehicles.length > 0 && (
        <>
          <h2>Nearby Vehicles</h2>
          <MultipleLocationsMap
            locations={nearbyVehicles}
            height={400}
            onMarkerClick={(vehicle) => navigate(`/vehicle/${vehicle.id}`)}
          />
        </>
      )}
    </div>
  );
}
```

### Add Vehicle with Location
```javascript
import LocationSelector from '../components/LocationSelector';

function AddVehicle() {
  const [vehicleLocation, setVehicleLocation] = useState(null);

  const handleSubmit = async () => {
    if (!vehicleLocation) {
      alert('Please select vehicle location');
      return;
    }

    const vehicleData = {
      // ... other fields
      latitude: vehicleLocation.lat,
      longitude: vehicleLocation.lng,
    };

    await vehicleService.createVehicle(vehicleData);
  };

  return (
    <form>
      {/* Other fields */}
      
      <h3>Vehicle Location</h3>
      <LocationSelector
        position={vehicleLocation}
        onLocationSelect={(lat, lng) => setVehicleLocation({ lat, lng })}
        label="Vehicle Parking Location"
      />
      
      <button onClick={handleSubmit}>Add Vehicle</button>
    </form>
  );
}
```

### View Driver Location (Read-only)
```javascript
import MapView from '../components/MapView';

function DriverDetails({ driver }) {
  return (
    <div>
      <h2>Driver: {driver.name}</h2>
      <h3>Current Location</h3>
      <MapView
        position={{ lat: driver.latitude, lng: driver.longitude }}
        label={driver.name}
        zoom={15}
      />
    </div>
  );
}
```

## Tips

1. **Get User's Current Location:**
```javascript
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
    },
    (error) => {
      console.error('Error getting location:', error);
    }
  );
}
```

2. **Leaflet CSS:** Already included in components, no additional imports needed

3. **Default Location:** Maps default to Tehran (35.6892, 51.3890) if no position provided

4. **Map Tiles:** Using OpenStreetMap (free, no API key needed)

## Styling

All components use MUI's Box component and can be wrapped for additional styling:

```javascript
<Box sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 2 }}>
  <LocationSelector ... />
</Box>
```

