import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Grid,
  MenuItem,
  Alert,
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { driverService } from '../services/api';
import LocationSelector from '../components/LocationSelector';

const validationSchema = yup.object({
  licenseNumber: yup.string().required('License number is required'),
  licenseExpiryDate: yup.date().required('License expiry date is required'),
  licenseType: yup.string().required('License type is required'),
  vehiclePreference: yup.string(),
  bio: yup.string(),
  currentAddress: yup.string(),
  currentCity: yup.string(),
});

function DriverRegisterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const formik = useFormik({
    initialValues: {
      licenseNumber: '',
      licenseExpiryDate: '',
      licenseType: '',
      vehiclePreference: 'CAR',
      bio: '',
      currentAddress: '',
      currentCity: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError('');

      if (!selectedLocation) {
        setError('Please select your current location on the map');
        setLoading(false);
        return;
      }

      try {
        const driverData = {
          userId: user.id,
          licenseNumber: values.licenseNumber,
          licenseExpiryDate: values.licenseExpiryDate,
          licenseType: values.licenseType,
          vehiclePreference: values.vehiclePreference,
          bio: values.bio,
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng,
          currentAddress: values.currentAddress,
          currentCity: values.currentCity,
        };

        const response = await driverService.registerDriver(driverData);

        if (response.success) {
          alert('Driver registration successful!');
          navigate('/driver-dashboard');
        } else {
          setError(response.message || 'Driver registration failed');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Driver registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
  });

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setSelectedLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          setError('Failed to get current location. Please select manually on the map.');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser. Please select manually on the map.');
    }
  };

  const handleLocationSelect = (lat, lng) => {
    setSelectedLocation({ lat, lng });
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          Register as a Driver
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Join our platform as a professional driver
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            {/* License Number */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="licenseNumber"
                name="licenseNumber"
                label="License Number"
                value={formik.values.licenseNumber}
                onChange={formik.handleChange}
                error={formik.touched.licenseNumber && Boolean(formik.errors.licenseNumber)}
                helperText={formik.touched.licenseNumber && formik.errors.licenseNumber}
              />
            </Grid>

            {/* License Expiry */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="licenseExpiryDate"
                name="licenseExpiryDate"
                label="License Expiry Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formik.values.licenseExpiryDate}
                onChange={formik.handleChange}
                error={formik.touched.licenseExpiryDate && Boolean(formik.errors.licenseExpiryDate)}
                helperText={formik.touched.licenseExpiryDate && formik.errors.licenseExpiryDate}
              />
            </Grid>

            {/* License Type */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                id="licenseType"
                name="licenseType"
                label="License Type"
                value={formik.values.licenseType}
                onChange={formik.handleChange}
                error={formik.touched.licenseType && Boolean(formik.errors.licenseType)}
                helperText={formik.touched.licenseType && formik.errors.licenseType}
              >
                <MenuItem value="">Select License Type</MenuItem>
                <MenuItem value="A">Class A - Motorcycle</MenuItem>
                <MenuItem value="B">Class B - Car</MenuItem>
                <MenuItem value="C">Class C - Truck</MenuItem>
                <MenuItem value="D">Class D - Bus</MenuItem>
              </TextField>
            </Grid>

            {/* Vehicle Preference */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                id="vehiclePreference"
                name="vehiclePreference"
                label="Preferred Vehicle Type"
                value={formik.values.vehiclePreference}
                onChange={formik.handleChange}
                error={formik.touched.vehiclePreference && Boolean(formik.errors.vehiclePreference)}
                helperText={formik.touched.vehiclePreference && formik.errors.vehiclePreference}
              >
                <MenuItem value="CAR">Car</MenuItem>
                <MenuItem value="BIKE">Motorcycle</MenuItem>
                <MenuItem value="SCOOTER">Scooter</MenuItem>
                <MenuItem value="TRUCK">Truck</MenuItem>
              </TextField>
            </Grid>

            {/* Bio */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                id="bio"
                name="bio"
                label="Bio (Optional)"
                placeholder="Tell us about yourself and your driving experience..."
                value={formik.values.bio}
                onChange={formik.handleChange}
                error={formik.touched.bio && Boolean(formik.errors.bio)}
                helperText={formik.touched.bio && formik.errors.bio}
              />
            </Grid>

            {/* Current Location */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Current Location *
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Click on the map to select your location, or use the button to get your current location
              </Typography>
              <Button
                variant="outlined"
                onClick={getCurrentLocation}
                sx={{ mb: 2 }}
                fullWidth
              >
                Use My Current Location
              </Button>
              
              <LocationSelector
                position={selectedLocation}
                onLocationSelect={handleLocationSelect}
                height={350}
                label="Driver Location"
              />
              
              {selectedLocation && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Selected: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </Typography>
              )}
            </Grid>

            {/* Current Address */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="currentAddress"
                name="currentAddress"
                label="Current Address (Optional)"
                value={formik.values.currentAddress}
                onChange={formik.handleChange}
                error={formik.touched.currentAddress && Boolean(formik.errors.currentAddress)}
                helperText={formik.touched.currentAddress && formik.errors.currentAddress}
              />
            </Grid>

            {/* Current City */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="currentCity"
                name="currentCity"
                label="Current City (Optional)"
                value={formik.values.currentCity}
                onChange={formik.handleChange}
                error={formik.touched.currentCity && Boolean(formik.errors.currentCity)}
                helperText={formik.touched.currentCity && formik.errors.currentCity}
              />
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
              >
                {loading ? 'Registering...' : 'Register as Driver'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}

export default DriverRegisterPage;



