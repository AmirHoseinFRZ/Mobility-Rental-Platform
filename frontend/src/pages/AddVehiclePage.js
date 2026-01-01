import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { DirectionsCar, LocationOn } from '@mui/icons-material';
import { vehicleService } from '../services/api';
import LocationSelector from '../components/LocationSelector';

function AddVehiclePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [vehicleLocation, setVehicleLocation] = useState(null);

  const [formData, setFormData] = useState({
    vehicleNumber: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    vehicleType: 'CAR',
    color: '',
    licensePlate: '',
    seatingCapacity: 4,
    fuelType: 'PETROL',
    transmission: 'MANUAL',
    pricePerHour: '',
    pricePerDay: '',
    imageUrl: '',
    description: '',
    features: '',
    requiresDriver: false,
    driverPricePerHour: '',
    driverPricePerDay: '',
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!vehicleLocation) {
      setError('Please select vehicle location on the map');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        ownerId: user.id,
        year: parseInt(formData.year),
        seatingCapacity: parseInt(formData.seatingCapacity),
        pricePerHour: parseFloat(formData.pricePerHour),
        pricePerDay: parseFloat(formData.pricePerDay),
        driverPricePerHour: formData.driverPricePerHour ? parseFloat(formData.driverPricePerHour) : null,
        driverPricePerDay: formData.driverPricePerDay ? parseFloat(formData.driverPricePerDay) : null,
        latitude: vehicleLocation.lat,
        longitude: vehicleLocation.lng,
      };

      await vehicleService.createVehicle(payload);
      setSuccess('Vehicle added successfully!');
      setTimeout(() => {
        navigate('/my-vehicles');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (lat, lng) => {
    setVehicleLocation({ lat, lng });
  };

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setVehicleLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          setError('Failed to get your location. Please select manually on the map.');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser. Please select manually on the map.');
    }
  };

  const vehicleTypes = ['CAR', 'BIKE', 'SCOOTER', 'BICYCLE', 'VAN', 'TRUCK'];
  const fuelTypes = ['PETROL', 'DIESEL', 'ELECTRIC', 'HYBRID', 'CNG'];
  const transmissionTypes = ['MANUAL', 'AUTOMATIC'];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <DirectionsCar sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            List Your Vehicle for Rent
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Basic Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Vehicle Number"
                name="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={handleChange}
                required
                helperText="Unique identifier for your vehicle"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="License Plate"
                name="licensePlate"
                value={formData.licensePlate}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Brand"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                required
                placeholder="e.g., Toyota, Honda, BMW"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                required
                placeholder="e.g., Camry, Civic, X5"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Year"
                name="year"
                type="number"
                value={formData.year}
                onChange={handleChange}
                required
                inputProps={{ min: 1900, max: new Date().getFullYear() + 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Vehicle Type"
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleChange}
                required
              >
                {vehicleTypes.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Color"
                name="color"
                value={formData.color}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Specifications
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Seating Capacity"
                name="seatingCapacity"
                type="number"
                value={formData.seatingCapacity}
                onChange={handleChange}
                required
                inputProps={{ min: 1, max: 50 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Fuel Type"
                name="fuelType"
                value={formData.fuelType}
                onChange={handleChange}
              >
                {fuelTypes.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Transmission"
                name="transmission"
                value={formData.transmission}
                onChange={handleChange}
              >
                {transmissionTypes.map(type => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Pricing
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price Per Hour ($)"
                name="pricePerHour"
                type="number"
                value={formData.pricePerHour}
                onChange={handleChange}
                required
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price Per Day ($)"
                name="pricePerDay"
                type="number"
                value={formData.pricePerDay}
                onChange={handleChange}
                required
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Location
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select where your vehicle is parked. Click on the map or use the button to get your current location.
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              onClick={handleUseMyLocation}
              startIcon={<LocationOn />}
              fullWidth
              sx={{ mb: 2 }}
            >
              Use My Current Location
            </Button>
            
            <LocationSelector
              position={vehicleLocation}
              onLocationSelect={handleLocationSelect}
              height={350}
              label="Vehicle Parking Location"
              zoom={15}
            />
            
            {vehicleLocation && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Selected: {vehicleLocation.lat.toFixed(6)}, {vehicleLocation.lng.toFixed(6)}
              </Typography>
            )}
          </Box>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Additional Details
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Image URL"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your vehicle..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Features"
                name="features"
                value={formData.features}
                onChange={handleChange}
                placeholder="AC, GPS, Bluetooth, etc. (comma separated)"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : 'Add Vehicle'}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/my-vehicles')}
              disabled={loading}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default AddVehiclePage;

