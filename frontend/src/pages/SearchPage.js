import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  TextField,
  Button,
  Box,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  LocationOn,
  Star,
  LocalGasStation,
  People,
  Search,
  Map as MapIcon,
  ViewList,
} from '@mui/icons-material';
import { vehicleService } from '../services/api';
import LocationSelector from '../components/LocationSelector';
import MultipleLocationsMap from '../components/MultipleLocationsMap';

function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  
  // Search filters
  const [searchLocation, setSearchLocation] = useState(null);
  const [radius, setRadius] = useState('5');
  const [vehicleType, setVehicleType] = useState('');
  const [requiresDriver, setRequiresDriver] = useState('');

  useEffect(() => {
    const type = searchParams.get('type');
    if (type) {
      setVehicleType(type);
    }
    // Get user's location if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setSearchLocation(location);
          searchVehicles(location.lat, location.lng);
        },
        () => {
          // If geolocation fails, use default location (Tehran)
          const defaultLocation = { lat: 35.6892, lng: 51.3890 };
          setSearchLocation(defaultLocation);
          searchVehicles(defaultLocation.lat, defaultLocation.lng);
        }
      );
    } else {
      const defaultLocation = { lat: 35.6892, lng: 51.3890 };
      setSearchLocation(defaultLocation);
      searchVehicles(defaultLocation.lat, defaultLocation.lng);
    }
  }, []);

  const searchVehicles = async (lat, lon) => {
    if (!lat || !lon) {
      setError('Please select a search location on the map');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const searchData = {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        radiusKm: parseFloat(radius),
        vehicleType: vehicleType || null,
        requiresDriver: requiresDriver === '' ? null : requiresDriver === 'true',
      };
      
      const response = await vehicleService.searchByLocation(searchData);
      
      if (response.success) {
        setVehicles(response.data || []);
      } else {
        setError('Failed to load vehicles');
      }
    } catch (err) {
      setError('Failed to load vehicles. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchLocation) {
      searchVehicles(searchLocation.lat, searchLocation.lng);
    }
  };

  const handleLocationSelect = (lat, lng) => {
    setSearchLocation({ lat, lng });
    searchVehicles(lat, lng);
  };

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setSearchLocation(location);
          searchVehicles(location.lat, location.lng);
        },
        () => {
          setError('Failed to get your location. Please select on the map.');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  const vehicleLocations = vehicles.map((vehicle) => ({
    id: vehicle.id,
    lat: vehicle.latitude,
    lng: vehicle.longitude,
    label: `${vehicle.brand} ${vehicle.model} - $${vehicle.pricePerHour}/hr`,
  }));

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Find Your Perfect Ride
      </Typography>

      {/* Search Location Map */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Select Search Location
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Click on the map to select a location, or use the button to get your current location
        </Typography>
        <Button
          variant="outlined"
          onClick={handleUseMyLocation}
          sx={{ mb: 2 }}
          startIcon={<LocationOn />}
        >
          Use My Current Location
        </Button>
        
        <LocationSelector
          position={searchLocation}
          onLocationSelect={handleLocationSelect}
          height={300}
          label="Search Center"
          zoom={12}
        />
        
        {searchLocation && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Searching near: {searchLocation.lat.toFixed(4)}, {searchLocation.lng.toFixed(4)}
          </Typography>
        )}
      </Paper>

      {/* Search Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Radius (km)"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              size="small"
              type="number"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Vehicle Type</InputLabel>
              <Select
                value={vehicleType}
                label="Vehicle Type"
                onChange={(e) => setVehicleType(e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="CAR">Car</MenuItem>
                <MenuItem value="BIKE">Motorcycle</MenuItem>
                <MenuItem value="SCOOTER">Scooter</MenuItem>
                <MenuItem value="BICYCLE">Bicycle</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>With Driver</InputLabel>
              <Select
                value={requiresDriver}
                label="With Driver"
                onChange={(e) => setRequiresDriver(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="false">Without Driver</MenuItem>
                <MenuItem value="true">With Driver</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSearch}
              startIcon={<Search />}
              disabled={loading || !searchLocation}
            >
              Search
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Results */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              {vehicles.length} vehicles found
            </Typography>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newMode) => newMode && setViewMode(newMode)}
              size="small"
            >
              <ToggleButton value="list">
                <ViewList sx={{ mr: 1 }} />
                List
              </ToggleButton>
              <ToggleButton value="map">
                <MapIcon sx={{ mr: 1 }} />
                Map
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {viewMode === 'map' && vehicles.length > 0 && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Vehicles on Map
              </Typography>
              <MultipleLocationsMap
                locations={vehicleLocations}
                height={500}
                zoom={13}
                onMarkerClick={(location) => navigate(`/vehicle/${location.id}`)}
              />
            </Paper>
          )}

          {viewMode === 'list' && (
            <Grid container spacing={3}>
              {vehicles.map((vehicle) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={vehicle.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={vehicle.imageUrl || 'https://via.placeholder.com/300x200?text=Vehicle'}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {vehicle.brand} {vehicle.model}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {vehicle.year} • {vehicle.vehicleType}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Star sx={{ color: 'gold', fontSize: 18, mr: 0.5 }} />
                      <Typography variant="body2">
                        {vehicle.rating.toFixed(1)} ({vehicle.totalReviews} reviews)
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip
                        icon={<People />}
                        label={`${vehicle.seatingCapacity} seats`}
                        size="small"
                      />
                      {vehicle.fuelType && (
                        <Chip
                          icon={<LocalGasStation />}
                          label={vehicle.fuelType}
                          size="small"
                        />
                      )}
                      {vehicle.distanceKm && (
                        <Chip
                          icon={<LocationOn />}
                          label={`${vehicle.distanceKm.toFixed(1)} km away`}
                          size="small"
                          color="primary"
                        />
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Per Hour:
                      </Typography>
                      <Typography variant="h6" color="primary">
                        ${vehicle.pricePerHour}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Per Day:
                      </Typography>
                      <Typography variant="h6" color="primary">
                        ${vehicle.pricePerDay}
                      </Typography>
                    </Box>

                    {vehicle.requiresDriver && (
                      <Chip
                        label="Driver Available"
                        color="secondary"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    )}

                    <Chip
                      label={vehicle.status}
                      color={vehicle.available ? 'success' : 'default'}
                      size="small"
                      sx={{ mt: 1, ml: 1 }}
                    />
                  </CardContent>

                  <CardActions>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => navigate(`/vehicle/${vehicle.id}`)}
                    >
                      View Details
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => navigate(`/booking/${vehicle.id}`)}
                      disabled={!vehicle.available}
                    >
                      Book Now
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              ))}
            </Grid>
          )}

          {!loading && vehicles.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                No vehicles found in this area. Try expanding your search radius.
              </Typography>
            </Box>
          )}
        </>
      )}
    </Container>
  );
}

export default SearchPage;






