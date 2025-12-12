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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  LocationOn,
  Star,
  LocalGasStation,
  People,
  Search,
} from '@mui/icons-material';
import { vehicleService } from '../services/api';

function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Search filters
  const [latitude, setLatitude] = useState('40.7128');
  const [longitude, setLongitude] = useState('-74.0060');
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
          setLatitude(position.coords.latitude.toString());
          setLongitude(position.coords.longitude.toString());
          searchVehicles(position.coords.latitude, position.coords.longitude);
        },
        () => {
          // If geolocation fails, search with default location
          searchVehicles();
        }
      );
    } else {
      searchVehicles();
    }
  }, []);

  const searchVehicles = async (lat, lon) => {
    setLoading(true);
    setError('');
    
    try {
      const searchData = {
        latitude: parseFloat(lat || latitude),
        longitude: parseFloat(lon || longitude),
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
    searchVehicles();
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Find Your Perfect Ride
      </Typography>

      {/* Search Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Latitude"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Longitude"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Radius (km)"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              size="small"
              type="number"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
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
          <Grid item xs={12} sm={6} md={2}>
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
          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSearch}
              startIcon={<Search />}
              disabled={loading}
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
          <Typography variant="h6" gutterBottom>
            {vehicles.length} vehicles found
          </Typography>

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





