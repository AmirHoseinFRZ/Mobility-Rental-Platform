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
      setError('لطفاً موقعیت وسیله نقلیه را روی نقشه انتخاب کنید');
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
        latitude: vehicleLocation.lat,
        longitude: vehicleLocation.lng,
      };

      await vehicleService.createVehicle(payload);
      setSuccess('وسیله نقلیه با موفقیت اضافه شد!');
      setTimeout(() => {
        navigate('/my-vehicles');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'افزودن وسیله نقلیه ناموفق بود');
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
          setError('دریافت موقعیت شما ناموفق بود. لطفاً به صورت دستی روی نقشه انتخاب کنید.');
        }
      );
    } else {
      setError('مرورگر شما از موقعیت‌یابی جغرافیایی پشتیبانی نمی‌کند. لطفاً به صورت دستی روی نقشه انتخاب کنید.');
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
            ثبت وسیله نقلیه برای اجاره
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            اطلاعات پایه
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="شماره وسیله نقلیه"
                name="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={handleChange}
                required
                helperText="شناسه منحصر به فرد برای وسیله نقلیه شما"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="پلاک"
                name="licensePlate"
                value={formData.licensePlate}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="برند"
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                required
                placeholder="مثلاً: تویوتا، هوندا، بی‌ام‌و"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="مدل"
                name="model"
                value={formData.model}
                onChange={handleChange}
                required
                placeholder="مثلاً: کمری، سیویک، X5"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="سال"
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
                label="نوع وسیله نقلیه"
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
                label="رنگ"
                name="color"
                value={formData.color}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            مشخصات
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="ظرفیت صندلی"
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
                label="نوع سوخت"
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
                label="گیربکس"
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
            قیمت‌گذاری
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="قیمت هر ساعت (تومان)"
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
                label="قیمت هر روز (تومان)"
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
            موقعیت
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            محل پارک وسیله نقلیه خود را انتخاب کنید. روی نقشه کلیک کنید یا از دکمه برای دریافت موقعیت فعلی خود استفاده کنید.
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              onClick={handleUseMyLocation}
              startIcon={<LocationOn />}
              fullWidth
              sx={{ mb: 2 }}
            >
              استفاده از موقعیت فعلی من
            </Button>
            
            <LocationSelector
              position={vehicleLocation}
              onLocationSelect={handleLocationSelect}
              height={350}
              label="محل پارک وسیله نقلیه"
              zoom={15}
            />
            
            {vehicleLocation && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                انتخاب شده: {vehicleLocation.lat.toFixed(6)}, {vehicleLocation.lng.toFixed(6)}
              </Typography>
            )}
          </Box>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            جزئیات بیشتر
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="آدرس تصویر"
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
                label="توضیحات"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="وسیله نقلیه خود را توصیف کنید..."
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="امکانات"
                name="features"
                value={formData.features}
                onChange={handleChange}
                placeholder="تهویه، GPS، بلوتوث و غیره (جدا شده با کاما)"
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
              {loading ? <CircularProgress size={24} /> : 'افزودن وسیله نقلیه'}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/my-vehicles')}
              disabled={loading}
            >
              لغو
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default AddVehiclePage;

