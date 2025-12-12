import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Grid,
  Typography,
  TextField,
  Button,
  Box,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vehicleService, pricingService, bookingService, driverService } from '../services/api';

function BookingPage() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Booking form data
  const [startDateTime, setStartDateTime] = useState(new Date(Date.now() + 3600000));
  const [endDateTime, setEndDateTime] = useState(new Date(Date.now() + 7200000));
  const [withDriver, setWithDriver] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  
  // Price calculation
  const [priceData, setPriceData] = useState(null);
  const [nearestDrivers, setNearestDrivers] = useState([]);

  useEffect(() => {
    loadVehicle();
  }, [vehicleId]);

  useEffect(() => {
    if (vehicle && startDateTime && endDateTime) {
      calculatePrice();
    }
  }, [vehicle, startDateTime, endDateTime, withDriver, discountCode]);

  useEffect(() => {
    if (withDriver && vehicle) {
      loadNearestDrivers();
    }
  }, [withDriver]);

  const loadVehicle = async () => {
    try {
      const response = await vehicleService.getVehicleById(vehicleId);
      if (response.success) {
        setVehicle(response.data);
      }
    } catch (err) {
      setError('Failed to load vehicle');
    } finally {
      setLoading(false);
    }
  };

  const loadNearestDrivers = async () => {
    if (!vehicle.latitude || !vehicle.longitude) return;
    
    try {
      const response = await driverService.findNearestDrivers(
        vehicle.latitude,
        vehicle.longitude,
        5
      );
      if (response.success) {
        setNearestDrivers(response.data || []);
        if (response.data.length > 0) {
          setSelectedDriver(response.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load drivers', err);
    }
  };

  const calculatePrice = async () => {
    if (!vehicle) return;
    
    try {
      const priceRequest = {
        vehicleType: vehicle.vehicleType,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        withDriver,
        discountCode: discountCode || null,
      };
      
      const response = await pricingService.calculatePrice(priceRequest);
      if (response.success) {
        setPriceData(response.data);
      }
    } catch (err) {
      console.error('Failed to calculate price', err);
    }
  };

  const handleBooking = async () => {
    if (!pickupLocation) {
      setError('Please enter pickup location');
      return;
    }
    
    setBookingLoading(true);
    setError('');
    
    try {
      const bookingRequest = {
        userId: user.id,
        vehicleId: parseInt(vehicleId),
        driverId: withDriver ? selectedDriver : null,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        pickupLocation,
        pickupLatitude: vehicle.latitude,
        pickupLongitude: vehicle.longitude,
        dropoffLocation: dropoffLocation || null,
        withDriver,
        specialRequests: specialRequests || null,
      };
      
      const response = await bookingService.createBooking(bookingRequest);
      
      if (response.success) {
        // Navigate to payment page
        navigate(`/payment/${response.data.id}`);
      } else {
        setError(response.message || 'Booking failed');
      }
    } catch (err) {
      setError(err.message || 'Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
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
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Book Your Vehicle
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={4}>
          {/* Booking Form */}
          <Grid item xs={12} md={7}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Booking Details
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    label="Start Date & Time"
                    type="datetime-local"
                    value={startDateTime.toISOString().slice(0, 16)}
                    onChange={(e) => setStartDateTime(new Date(e.target.value))}
                    InputLabelProps={{ shrink: true }}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="End Date & Time"
                    type="datetime-local"
                    value={endDateTime.toISOString().slice(0, 16)}
                    onChange={(e) => setEndDateTime(new Date(e.target.value))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>

                <TextField
                  fullWidth
                  label="Pickup Location"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  required
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Dropoff Location (Optional)"
                  value={dropoffLocation}
                  onChange={(e) => setDropoffLocation(e.target.value)}
                  sx={{ mb: 2 }}
                />

                {vehicle.requiresDriver && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={withDriver}
                        onChange={(e) => setWithDriver(e.target.checked)}
                      />
                    }
                    label="Book with Driver"
                    sx={{ mb: 2 }}
                  />
                )}

                {withDriver && nearestDrivers.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Available Drivers Nearby:
                    </Typography>
                    {nearestDrivers.map((driver) => (
                      <Card
                        key={driver.id}
                        sx={{
                          mb: 1,
                          cursor: 'pointer',
                          border: selectedDriver === driver.id ? '2px solid #1976d2' : '1px solid #ddd',
                        }}
                        onClick={() => setSelectedDriver(driver.id)}
                      >
                        <CardContent>
                          <Typography variant="body2">
                            ⭐ {driver.rating.toFixed(1)} • {driver.totalTrips} trips
                            {driver.distanceKm && ` • ${driver.distanceKm.toFixed(1)} km away`}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}

                <TextField
                  fullWidth
                  label="Special Requests (Optional)"
                  multiline
                  rows={3}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="Discount Code (Optional)"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Price Summary */}
          <Grid item xs={12} md={5}>
            <Card sx={{ position: 'sticky', top: 80 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Vehicle Summary
                </Typography>
                <Typography variant="body1">
                  {vehicle.brand} {vehicle.model}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {vehicle.year} • {vehicle.vehicleType}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom>
                  Price Breakdown
                </Typography>

                {priceData ? (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Base Price:</Typography>
                      <Typography variant="body2">${priceData.basePrice}</Typography>
                    </Box>
                    
                    {priceData.driverPrice > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Driver Fee:</Typography>
                        <Typography variant="body2">${priceData.driverPrice}</Typography>
                      </Box>
                    )}
                    
                    {priceData.surgeCharge > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Surge Charge:</Typography>
                        <Typography variant="body2">${priceData.surgeCharge}</Typography>
                      </Box>
                    )}
                    
                    {priceData.weekendCharge > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Weekend Charge:</Typography>
                        <Typography variant="body2">${priceData.weekendCharge}</Typography>
                      </Box>
                    )}
                    
                    {priceData.discountAmount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="success.main">
                          Discount ({priceData.discountCode}):
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          -${priceData.discountAmount}
                        </Typography>
                      </Box>
                    )}
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        Duration: {priceData.rentalHours}h ({priceData.rentalDays}d)
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6">Total:</Typography>
                      <Typography variant="h6" color="primary">
                        ${priceData.totalPrice}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Calculating price...
                  </Typography>
                )}

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleBooking}
                  disabled={bookingLoading || !priceData}
                  sx={{ mt: 3 }}
                >
                  {bookingLoading ? 'Processing...' : 'Proceed to Payment'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </LocalizationProvider>
  );
}

export default BookingPage;


