import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  CircularProgress,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { vehicleService } from '../services/api';

const validationSchema = yup.object({
  vehicleType: yup.string().required('Vehicle type is required'),
  brand: yup.string().required('Brand is required'),
  model: yup.string().required('Model is required'),
  year: yup.number().required('Year is required').min(1900).max(new Date().getFullYear() + 1),
  vehicleNumber: yup.string().required('Vehicle number is required'),
  seatingCapacity: yup.number().required('Seating capacity is required').min(1),
  pricePerHour: yup.number().required('Price per hour is required').min(0),
  pricePerDay: yup.number().required('Price per day is required').min(0),
  currentLatitude: yup.number().required('Latitude is required'),
  currentLongitude: yup.number().required('Longitude is required'),
});

function EditVehiclePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const formik = useFormik({
    initialValues: {
      vehicleType: 'CAR',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      vehicleNumber: '',
      seatingCapacity: 4,
      fuelType: 'PETROL',
      transmission: 'MANUAL',
      pricePerHour: '',
      pricePerDay: '',
      currentLatitude: '',
      currentLongitude: '',
      currentCity: '',
      currentAddress: '',
      description: '',
      features: '',
      imageUrl: '',
      requiresDriver: false,
      driverPricePerHour: '',
      status: 'AVAILABLE',
    },
    validationSchema,
    onSubmit: async (values) => {
      setSubmitting(true);
      setError('');

      try {
        const vehicleData = {
          ...values,
          ownerId: user.id,
        };

        const response = await vehicleService.updateVehicle(id, vehicleData);

        if (response.success) {
          navigate('/my-vehicles');
        } else {
          setError(response.message || 'Failed to update vehicle');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to update vehicle. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    loadVehicle();
  }, [id]);

  const loadVehicle = async () => {
    try {
      const response = await vehicleService.getVehicleById(id);
      if (response.success) {
        const vehicle = response.data;
        
        // Check if user is the owner
        if (vehicle.ownerId !== user.id) {
          setError('You are not authorized to edit this vehicle');
          return;
        }

        // Set form values
        formik.setValues({
          vehicleType: vehicle.vehicleType || 'CAR',
          brand: vehicle.brand || '',
          model: vehicle.model || '',
          year: vehicle.year || new Date().getFullYear(),
          vehicleNumber: vehicle.vehicleNumber || '',
          seatingCapacity: vehicle.seatingCapacity || 4,
          fuelType: vehicle.fuelType || 'PETROL',
          transmission: vehicle.transmission || 'MANUAL',
          pricePerHour: vehicle.pricePerHour || '',
          pricePerDay: vehicle.pricePerDay || '',
          currentLatitude: vehicle.currentLatitude || '',
          currentLongitude: vehicle.currentLongitude || '',
          currentCity: vehicle.currentCity || '',
          currentAddress: vehicle.currentAddress || '',
          description: vehicle.description || '',
          features: vehicle.features || '',
          imageUrl: vehicle.imageUrl || '',
          requiresDriver: vehicle.requiresDriver || false,
          driverPricePerHour: vehicle.driverPricePerHour || '',
          status: vehicle.status || 'AVAILABLE',
        });
      }
    } catch (err) {
      setError('Failed to load vehicle details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Edit Vehicle
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Update your vehicle information
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            {/* Vehicle Type */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                id="vehicleType"
                name="vehicleType"
                label="Vehicle Type"
                value={formik.values.vehicleType}
                onChange={formik.handleChange}
                error={formik.touched.vehicleType && Boolean(formik.errors.vehicleType)}
                helperText={formik.touched.vehicleType && formik.errors.vehicleType}
              >
                <MenuItem value="CAR">Car</MenuItem>
                <MenuItem value="BIKE">Motorcycle</MenuItem>
                <MenuItem value="SCOOTER">Scooter</MenuItem>
                <MenuItem value="BICYCLE">Bicycle</MenuItem>
              </TextField>
            </Grid>

            {/* Status */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                id="status"
                name="status"
                label="Status"
                value={formik.values.status}
                onChange={formik.handleChange}
              >
                <MenuItem value="AVAILABLE">Available</MenuItem>
                <MenuItem value="BOOKED">Booked</MenuItem>
                <MenuItem value="IN_USE">In Use</MenuItem>
                <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
              </TextField>
            </Grid>

            {/* Brand */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="brand"
                name="brand"
                label="Brand"
                value={formik.values.brand}
                onChange={formik.handleChange}
                error={formik.touched.brand && Boolean(formik.errors.brand)}
                helperText={formik.touched.brand && formik.errors.brand}
              />
            </Grid>

            {/* Model */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="model"
                name="model"
                label="Model"
                value={formik.values.model}
                onChange={formik.handleChange}
                error={formik.touched.model && Boolean(formik.errors.model)}
                helperText={formik.touched.model && formik.errors.model}
              />
            </Grid>

            {/* Year */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="year"
                name="year"
                label="Year"
                type="number"
                value={formik.values.year}
                onChange={formik.handleChange}
                error={formik.touched.year && Boolean(formik.errors.year)}
                helperText={formik.touched.year && formik.errors.year}
              />
            </Grid>

            {/* Vehicle Number */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="vehicleNumber"
                name="vehicleNumber"
                label="Vehicle Number"
                value={formik.values.vehicleNumber}
                onChange={formik.handleChange}
                error={formik.touched.vehicleNumber && Boolean(formik.errors.vehicleNumber)}
                helperText={formik.touched.vehicleNumber && formik.errors.vehicleNumber}
              />
            </Grid>

            {/* Seating Capacity */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="seatingCapacity"
                name="seatingCapacity"
                label="Seating Capacity"
                type="number"
                value={formik.values.seatingCapacity}
                onChange={formik.handleChange}
                error={formik.touched.seatingCapacity && Boolean(formik.errors.seatingCapacity)}
                helperText={formik.touched.seatingCapacity && formik.errors.seatingCapacity}
              />
            </Grid>

            {/* Fuel Type */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                id="fuelType"
                name="fuelType"
                label="Fuel Type"
                value={formik.values.fuelType}
                onChange={formik.handleChange}
              >
                <MenuItem value="PETROL">Petrol</MenuItem>
                <MenuItem value="DIESEL">Diesel</MenuItem>
                <MenuItem value="ELECTRIC">Electric</MenuItem>
                <MenuItem value="HYBRID">Hybrid</MenuItem>
                <MenuItem value="CNG">CNG</MenuItem>
              </TextField>
            </Grid>

            {/* Transmission */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                id="transmission"
                name="transmission"
                label="Transmission"
                value={formik.values.transmission}
                onChange={formik.handleChange}
              >
                <MenuItem value="MANUAL">Manual</MenuItem>
                <MenuItem value="AUTOMATIC">Automatic</MenuItem>
              </TextField>
            </Grid>

            {/* Price Per Hour */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="pricePerHour"
                name="pricePerHour"
                label="Price Per Hour ($)"
                type="number"
                value={formik.values.pricePerHour}
                onChange={formik.handleChange}
                error={formik.touched.pricePerHour && Boolean(formik.errors.pricePerHour)}
                helperText={formik.touched.pricePerHour && formik.errors.pricePerHour}
              />
            </Grid>

            {/* Price Per Day */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="pricePerDay"
                name="pricePerDay"
                label="Price Per Day ($)"
                type="number"
                value={formik.values.pricePerDay}
                onChange={formik.handleChange}
                error={formik.touched.pricePerDay && Boolean(formik.errors.pricePerDay)}
                helperText={formik.touched.pricePerDay && formik.errors.pricePerDay}
              />
            </Grid>

            {/* Requires Driver */}
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    id="requiresDriver"
                    name="requiresDriver"
                    checked={formik.values.requiresDriver}
                    onChange={formik.handleChange}
                  />
                }
                label="Requires Driver"
              />
            </Grid>

            {/* Driver Price Per Hour */}
            {formik.values.requiresDriver && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="driverPricePerHour"
                  name="driverPricePerHour"
                  label="Driver Price Per Hour ($)"
                  type="number"
                  value={formik.values.driverPricePerHour}
                  onChange={formik.handleChange}
                />
              </Grid>
            )}

            {/* Location - Latitude */}
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

            {/* Location - Longitude */}
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

            {/* City */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="currentCity"
                name="currentCity"
                label="City"
                value={formik.values.currentCity}
                onChange={formik.handleChange}
              />
            </Grid>

            {/* Address */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="currentAddress"
                name="currentAddress"
                label="Address"
                value={formik.values.currentAddress}
                onChange={formik.handleChange}
              />
            </Grid>

            {/* Image URL */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="imageUrl"
                name="imageUrl"
                label="Image URL"
                value={formik.values.imageUrl}
                onChange={formik.handleChange}
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="description"
                name="description"
                label="Description"
                multiline
                rows={3}
                value={formik.values.description}
                onChange={formik.handleChange}
              />
            </Grid>

            {/* Features */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="features"
                name="features"
                label="Features (comma separated)"
                multiline
                rows={2}
                value={formik.values.features}
                onChange={formik.handleChange}
              />
            </Grid>

            {/* Buttons */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/my-vehicles')}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                >
                  {submitting ? 'Updating...' : 'Update Vehicle'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}

export default EditVehiclePage;



