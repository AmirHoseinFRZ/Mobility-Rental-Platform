import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Rating,
} from '@mui/material';
import {
  DirectionsCar,
  People,
  LocalGasStation,
  Speed,
  CalendarMonth,
  LocationOn,
} from '@mui/icons-material';
import { vehicleService, reviewService } from '../services/api';

function VehicleDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadVehicleDetails();
    loadReviews();
  }, [id]);

  const loadVehicleDetails = async () => {
    try {
      const response = await vehicleService.getVehicleById(id);
      if (response.success) {
        setVehicle(response.data);
      }
    } catch (err) {
      setError('بارگذاری جزئیات وسیله نقلیه ناموفق بود');
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const response = await reviewService.getVehicleReviews(id);
      if (response.success) {
        setReviews(response.data || []);
      }
    } catch (err) {
      console.error('Failed to load reviews', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !vehicle) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">{error || 'وسیله نقلیه یافت نشد'}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* Vehicle Image */}
        <Grid item xs={12} md={6}>
          <Box
            component="img"
            src={vehicle.imageUrl || 'https://placehold.co/600x400/e0e0e0/666?text=Vehicle'}
            alt={`${vehicle.brand} ${vehicle.model}`}
            sx={{ width: '100%', borderRadius: 2 }}
          />
        </Grid>

        {/* Vehicle Details */}
        <Grid item xs={12} md={6}>
          <Typography variant="h3" gutterBottom>
            {vehicle.brand} {vehicle.model}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Rating value={vehicle.rating} readOnly precision={0.1} />
            <Typography variant="body2" sx={{ ml: 1 }}>
              {vehicle.rating.toFixed(1)} ({vehicle.totalReviews} نظر)
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Chip
              label={vehicle.status}
              color={vehicle.available ? 'success' : 'default'}
              sx={{ mr: 1 }}
            />
            <Chip label={vehicle.vehicleType} variant="outlined" sx={{ mr: 1 }} />
            {vehicle.requiresDriver && (
              <Chip label="راننده موجود" color="secondary" />
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Specifications */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CalendarMonth sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography>سال: {vehicle.year}</Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <People sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography>صندلی: {vehicle.seatingCapacity}</Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocalGasStation sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography>{vehicle.fuelType || 'نامشخص'}</Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Speed sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography>{vehicle.transmission || 'نامشخص'}</Typography>
              </Box>
            </Grid>
            {vehicle.currentCity && (
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography>{vehicle.currentCity}</Typography>
                </Box>
              </Grid>
            )}
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Pricing */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              قیمت
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body1">هر ساعت:</Typography>
              <Typography variant="h6" color="primary">
                ${vehicle.pricePerHour}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body1">هر روز:</Typography>
              <Typography variant="h6" color="primary">
                ${vehicle.pricePerDay}
              </Typography>
            </Box>
            {vehicle.requiresDriver && vehicle.driverPricePerHour && (
              <>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">راننده هر ساعت:</Typography>
                  <Typography variant="h6" color="secondary">
                    +${vehicle.driverPricePerHour}
                  </Typography>
                </Box>
              </>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Description */}
          {vehicle.description && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                توضیحات
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {vehicle.description}
              </Typography>
            </Box>
          )}

          {/* Features */}
          {vehicle.features && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                امکانات
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {vehicle.features}
              </Typography>
            </Box>
          )}

          {/* Book Button */}
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={() => navigate(`/booking/${vehicle.id}`)}
            disabled={!vehicle.available}
            sx={{ py: 1.5 }}
          >
            {vehicle.available ? 'رزرو این وسیله نقلیه' : 'موجود نیست'}
          </Button>
        </Grid>

        {/* Reviews Section */}
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            نظرات مشتریان
          </Typography>
          {reviews.length === 0 ? (
            <Typography color="text.secondary">هنوز نظری ثبت نشده</Typography>
          ) : (
            reviews.map((review) => (
              <Card key={review.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Rating value={review.rating} readOnly size="small" />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Typography variant="body2">{review.comment}</Typography>
                </CardContent>
              </Card>
            ))
          )}
        </Grid>
      </Grid>
    </Container>
  );
}

export default VehicleDetailsPage;






