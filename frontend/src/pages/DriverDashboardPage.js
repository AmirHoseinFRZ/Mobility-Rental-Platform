import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  TextField,
  MenuItem,
  Paper,
} from '@mui/material';
import {
  LocationOn,
  Update,
  Star,
} from '@mui/icons-material';
import { driverService } from '../services/api';

function DriverDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Location update
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [updatingLocation, setUpdatingLocation] = useState(false);
  
  // Status update
  const [status, setStatus] = useState('AVAILABLE');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    loadDriverData();
  }, [user]);

  const loadDriverData = async () => {
    try {
      const response = await driverService.getDriverByUserId(user.id);
      if (response.success) {
        setDriver(response.data);
        setLatitude(response.data.currentLatitude || '');
        setLongitude(response.data.currentLongitude || '');
        setStatus(response.data.status || 'AVAILABLE');
      } else {
        // Driver not registered
        setError('Driver profile not found. Please register as a driver.');
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Driver profile not found. Please register as a driver first.');
      } else {
        setError('Failed to load driver data');
      }
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toString());
          setLongitude(position.coords.longitude.toString());
        },
        (error) => {
          setError('Failed to get current location');
        }
      );
    }
  };

  const handleUpdateLocation = async () => {
    setUpdatingLocation(true);
    setError('');
    setSuccess('');

    try {
      const response = await driverService.updateLocation(
        driver.id,
        parseFloat(latitude),
        parseFloat(longitude)
      );

      if (response.success) {
        setSuccess('Location updated successfully!');
        setDriver(response.data);
      } else {
        setError('Failed to update location');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update location');
    } finally {
      setUpdatingLocation(false);
    }
  };

  const handleUpdateStatus = async () => {
    setUpdatingStatus(true);
    setError('');
    setSuccess('');

    try {
      const response = await driverService.updateStatus(driver.id, status);

      if (response.success) {
        setSuccess('Status updated successfully!');
        setDriver(response.data);
      } else {
        setError('Failed to update status');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (statusValue) => {
    switch (statusValue) {
      case 'AVAILABLE': return 'success';
      case 'BUSY': return 'warning';
      case 'OFFLINE': return 'default';
      default: return 'info';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!driver) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error || 'You need to register as a driver first.'}
        </Alert>
        <Button
          variant="contained"
          onClick={() => navigate('/driver-register')}
        >
          Register as Driver
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Driver Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Driver Info Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Driver Information
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Driver ID:
                </Typography>
                <Typography variant="body1">
                  #{driver.id}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  License Number:
                </Typography>
                <Typography variant="body1">
                  {driver.licenseNumber}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  License Expiry:
                </Typography>
                <Typography variant="body1">
                  {new Date(driver.licenseExpiry).toLocaleDateString()}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Vehicle Type:
                </Typography>
                <Chip label={driver.vehicleType} size="small" sx={{ mt: 0.5 }} />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Experience:
                </Typography>
                <Typography variant="body1">
                  {driver.experience} years
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Current Status:
                </Typography>
                <Chip
                  label={driver.status}
                  color={getStatusColor(driver.status)}
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Box>

              {driver.rating > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Star sx={{ color: 'gold', mr: 0.5 }} />
                  <Typography variant="body1">
                    {driver.rating.toFixed(1)} / 5.0
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Update Status Card */}
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Update Status
              </Typography>
              
              <TextField
                select
                fullWidth
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                sx={{ mb: 2 }}
              >
                <MenuItem value="AVAILABLE">Available</MenuItem>
                <MenuItem value="BUSY">Busy</MenuItem>
                <MenuItem value="OFFLINE">Offline</MenuItem>
              </TextField>

              <Button
                fullWidth
                variant="contained"
                onClick={handleUpdateStatus}
                disabled={updatingStatus || status === driver.status}
                startIcon={<Update />}
              >
                {updatingStatus ? 'Updating...' : 'Update Status'}
              </Button>
            </CardContent>
          </Card>

          {/* Update Location Card */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Update Location
              </Typography>

              <Button
                fullWidth
                variant="outlined"
                onClick={getCurrentLocation}
                startIcon={<LocationOn />}
                sx={{ mb: 2 }}
              >
                Get Current Location
              </Button>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Latitude"
                    type="number"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Longitude"
                    type="number"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    size="small"
                  />
                </Grid>
              </Grid>

              <Button
                fullWidth
                variant="contained"
                onClick={handleUpdateLocation}
                disabled={updatingLocation}
                startIcon={<Update />}
              >
                {updatingLocation ? 'Updating...' : 'Update Location'}
              </Button>

              {driver.currentLatitude && driver.currentLongitude && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Current Location:
                  </Typography>
                  <Typography variant="body2">
                    Lat: {driver.currentLatitude.toFixed(6)}, Lon: {driver.currentLongitude.toFixed(6)}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Statistics Card */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Statistics & Earnings
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {driver.totalTrips || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Trips
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    ${driver.totalEarnings || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Earnings
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {driver.rating ? driver.rating.toFixed(1) : 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Rating
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {driver.totalReviews || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Reviews
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default DriverDashboardPage;









