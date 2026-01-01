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

const validationSchema = yup.object({
  licenseNumber: yup.string().required('License number is required'),
  licenseExpiry: yup.date().required('License expiry date is required'),
  vehicleType: yup.string().required('Vehicle type is required'),
  experience: yup.number().required('Experience is required').min(0),
  currentLatitude: yup.number().required('Current latitude is required'),
  currentLongitude: yup.number().required('Current longitude is required'),
});

function DriverRegisterPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      licenseNumber: '',
      licenseExpiry: '',
      vehicleType: 'CAR',
      experience: '',
      currentLatitude: '',
      currentLongitude: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError('');

      try {
        const driverData = {
          userId: user.id,
          licenseNumber: values.licenseNumber,
          licenseExpiry: values.licenseExpiry,
          vehicleType: values.vehicleType,
          experience: parseInt(values.experience),
          currentLatitude: parseFloat(values.currentLatitude),
          currentLongitude: parseFloat(values.currentLongitude),
          status: 'AVAILABLE',
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
          formik.setFieldValue('currentLatitude', position.coords.latitude);
          formik.setFieldValue('currentLongitude', position.coords.longitude);
        },
        (error) => {
          setError('Failed to get current location. Please enter manually.');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
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
                id="licenseExpiry"
                name="licenseExpiry"
                label="License Expiry Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={formik.values.licenseExpiry}
                onChange={formik.handleChange}
                error={formik.touched.licenseExpiry && Boolean(formik.errors.licenseExpiry)}
                helperText={formik.touched.licenseExpiry && formik.errors.licenseExpiry}
              />
            </Grid>

            {/* Vehicle Type */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                id="vehicleType"
                name="vehicleType"
                label="Preferred Vehicle Type"
                value={formik.values.vehicleType}
                onChange={formik.handleChange}
                error={formik.touched.vehicleType && Boolean(formik.errors.vehicleType)}
                helperText={formik.touched.vehicleType && formik.errors.vehicleType}
              >
                <MenuItem value="CAR">Car</MenuItem>
                <MenuItem value="BIKE">Motorcycle</MenuItem>
                <MenuItem value="SCOOTER">Scooter</MenuItem>
              </TextField>
            </Grid>

            {/* Experience */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="experience"
                name="experience"
                label="Years of Experience"
                type="number"
                value={formik.values.experience}
                onChange={formik.handleChange}
                error={formik.touched.experience && Boolean(formik.errors.experience)}
                helperText={formik.touched.experience && formik.errors.experience}
              />
            </Grid>

            {/* Current Location */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                Current Location
              </Typography>
              <Button
                variant="outlined"
                onClick={getCurrentLocation}
                sx={{ mb: 2 }}
              >
                Get Current Location
              </Button>
            </Grid>

            {/* Latitude */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="currentLatitude"
                name="currentLatitude"
                label="Latitude"
                type="number"
                value={formik.values.currentLatitude}
                onChange={formik.handleChange}
                error={formik.touched.currentLatitude && Boolean(formik.errors.currentLatitude)}
                helperText={formik.touched.currentLatitude && formik.errors.currentLatitude}
              />
            </Grid>

            {/* Longitude */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="currentLongitude"
                name="currentLongitude"
                label="Longitude"
                type="number"
                value={formik.values.currentLongitude}
                onChange={formik.handleChange}
                error={formik.touched.currentLongitude && Boolean(formik.errors.currentLongitude)}
                helperText={formik.touched.currentLongitude && formik.errors.currentLongitude}
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



