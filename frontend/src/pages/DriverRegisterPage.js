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
  licenseNumber: yup.string().required('شماره گواهینامه الزامی است'),
  licenseExpiryDate: yup.date().required('تاریخ انقضای گواهینامه الزامی است'),
  licenseType: yup.string().required('نوع گواهینامه الزامی است'),
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
        setError('لطفاً موقعیت فعلی خود را روی نقشه انتخاب کنید');
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
          alert('ثبت‌نام راننده با موفقیت انجام شد!');
          navigate('/driver-dashboard');
        } else {
          setError(response.message || 'ثبت‌نام راننده ناموفق بود');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'ثبت‌نام راننده ناموفق بود. لطفاً دوباره تلاش کنید.');
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
          setError('دریافت موقعیت فعلی ناموفق بود. لطفاً به صورت دستی روی نقشه انتخاب کنید.');
        }
      );
    } else {
      setError('مرورگر شما از موقعیت‌یابی جغرافیایی پشتیبانی نمی‌کند. لطفاً به صورت دستی روی نقشه انتخاب کنید.');
    }
  };

  const handleLocationSelect = (lat, lng) => {
    setSelectedLocation({ lat, lng });
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          ثبت‌نام به عنوان راننده
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          به عنوان یک راننده حرفه‌ای به پلتفرم ما بپیوندید
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
                label="شماره گواهینامه"
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
                label="تاریخ انقضای گواهینامه"
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
                label="نوع گواهینامه"
                value={formik.values.licenseType}
                onChange={formik.handleChange}
                error={formik.touched.licenseType && Boolean(formik.errors.licenseType)}
                helperText={formik.touched.licenseType && formik.errors.licenseType}
              >
                <MenuItem value="">انتخاب نوع گواهینامه</MenuItem>
                <MenuItem value="A">کلاس A - موتورسیکلت</MenuItem>
                <MenuItem value="B">کلاس B - خودرو</MenuItem>
                <MenuItem value="C">کلاس C - کامیون</MenuItem>
                <MenuItem value="D">کلاس D - اتوبوس</MenuItem>
              </TextField>
            </Grid>

            {/* Vehicle Preference */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                id="vehiclePreference"
                name="vehiclePreference"
                label="نوع وسیله نقلیه مورد علاقه"
                value={formik.values.vehiclePreference}
                onChange={formik.handleChange}
                error={formik.touched.vehiclePreference && Boolean(formik.errors.vehiclePreference)}
                helperText={formik.touched.vehiclePreference && formik.errors.vehiclePreference}
              >
                <MenuItem value="CAR">خودرو</MenuItem>
                <MenuItem value="BIKE">موتورسیکلت</MenuItem>
                <MenuItem value="SCOOTER">اسکوتر</MenuItem>
                <MenuItem value="TRUCK">کامیون</MenuItem>
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
                label="معرفی (اختیاری)"
                placeholder="درباره خود و تجربه رانندگی‌تان بگویید..."
                value={formik.values.bio}
                onChange={formik.handleChange}
                error={formik.touched.bio && Boolean(formik.errors.bio)}
                helperText={formik.touched.bio && formik.errors.bio}
              />
            </Grid>

            {/* Current Location */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                موقعیت فعلی *
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                روی نقشه کلیک کنید تا موقعیت خود را انتخاب کنید، یا از دکمه برای دریافت موقعیت فعلی خود استفاده کنید
              </Typography>
              <Button
                variant="outlined"
                onClick={getCurrentLocation}
                sx={{ mb: 2 }}
                fullWidth
              >
                استفاده از موقعیت فعلی من
              </Button>
              
              <LocationSelector
                position={selectedLocation}
                onLocationSelect={handleLocationSelect}
                height={350}
                label="موقعیت راننده"
              />
              
              {selectedLocation && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  انتخاب شده: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </Typography>
              )}
            </Grid>

            {/* Current Address */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="currentAddress"
                name="currentAddress"
                label="آدرس فعلی (اختیاری)"
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
                label="شهر فعلی (اختیاری)"
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
                {loading ? 'در حال ثبت‌نام...' : 'ثبت‌نام به عنوان راننده'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}

export default DriverRegisterPage;



