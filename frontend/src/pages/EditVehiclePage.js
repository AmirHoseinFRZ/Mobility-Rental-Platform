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
import LocationSelector from '../components/LocationSelector';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import CloudUpload from '@mui/icons-material/CloudUpload';

const validationSchema = yup.object({
  vehicleType: yup.string().required('نوع وسیله نقلیه الزامی است'),
  brand: yup.string().required('برند الزامی است'),
  model: yup.string().required('مدل الزامی است'),
  year: yup.number().required('سال الزامی است').min(1900).max(new Date().getFullYear() + 1),
  vehicleNumber: yup.string().required('شماره وسیله نقلیه الزامی است'),
  seatingCapacity: yup.number().required('ظرفیت صندلی الزامی است').min(1),
  pricePerHour: yup.number().required('قیمت ساعتی الزامی است').min(0),
  pricePerDay: yup.number().required('قیمت روزانه الزامی است').min(0),
});

function EditVehiclePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

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
      latitude: '',
      longitude: '',
      description: '',
      features: '',
      imageUrl: '',
      status: 'AVAILABLE',
    },
    validationSchema,
    onSubmit: async (values) => {
      setSubmitting(true);
      setError('');

      // Validate location
      if (!selectedLocation) {
        setError('لطفاً موقعیت را روی نقشه انتخاب کنید');
        setSubmitting(false);
        return;
      }

      try {
        let imageUrl = values.imageUrl?.trim() || '';
        if (imageFile) {
          const uploadRes = await vehicleService.uploadImage(imageFile);
          if (uploadRes?.data) imageUrl = uploadRes.data;
        }

        const vehicleData = {
          ...values,
          imageUrl: imageUrl || null,
          ownerId: user.id,
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng,
        };

        const response = await vehicleService.updateVehicle(id, vehicleData);

        if (response.success) {
          navigate('/my-vehicles');
        } else {
          setError(response.message || 'به‌روزرسانی وسیله نقلیه ناموفق بود');
        }
      } catch (err) {
        setError(err?.message || err?.response?.data?.message || 'به‌روزرسانی وسیله نقلیه ناموفق بود. لطفاً دوباره تلاش کنید.');
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
          setError('شما مجاز به ویرایش این وسیله نقلیه نیستید');
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
          latitude: vehicle.latitude || '',
          longitude: vehicle.longitude || '',
          description: vehicle.description || '',
          features: vehicle.features || '',
          imageUrl: vehicle.imageUrl || '',
          status: vehicle.status || 'AVAILABLE',
        });

        // Set initial location if available
        if (vehicle.latitude && vehicle.longitude) {
          setSelectedLocation({
            lat: vehicle.latitude,
            lng: vehicle.longitude,
          });
        }
      }
    } catch (err) {
      setError('بارگذاری جزئیات وسیله نقلیه ناموفق بود');
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
          ویرایش وسیله نقلیه
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          اطلاعات وسیله نقلیه خود را به‌روزرسانی کنید
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
                label="نوع وسیله نقلیه"
                value={formik.values.vehicleType}
                onChange={formik.handleChange}
                error={formik.touched.vehicleType && Boolean(formik.errors.vehicleType)}
                helperText={formik.touched.vehicleType && formik.errors.vehicleType}
              >
                <MenuItem value="CAR">خودرو</MenuItem>
                <MenuItem value="BIKE">موتورسیکلت</MenuItem>
                <MenuItem value="SCOOTER">اسکوتر</MenuItem>
                <MenuItem value="BICYCLE">دوچرخه</MenuItem>
              </TextField>
            </Grid>

            {/* Status */}
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                id="status"
                name="status"
                label="وضعیت"
                value={formik.values.status}
                onChange={formik.handleChange}
              >
                <MenuItem value="AVAILABLE">در دسترس</MenuItem>
                <MenuItem value="BOOKED">رزرو شده</MenuItem>
                <MenuItem value="IN_USE">در حال استفاده</MenuItem>
                <MenuItem value="MAINTENANCE">در تعمیر</MenuItem>
                <MenuItem value="INACTIVE">غیرفعال</MenuItem>
              </TextField>
            </Grid>

            {/* Brand */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="brand"
                name="brand"
                label="برند"
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
                label="مدل"
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
                label="سال"
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
                label="شماره وسیله نقلیه"
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
                label="ظرفیت صندلی"
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
                label="نوع سوخت"
                value={formik.values.fuelType}
                onChange={formik.handleChange}
              >
                <MenuItem value="PETROL">بنزین</MenuItem>
                <MenuItem value="DIESEL">دیزل</MenuItem>
                <MenuItem value="ELECTRIC">برقی</MenuItem>
                <MenuItem value="HYBRID">هیبریدی</MenuItem>
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
                label="گیربکس"
                value={formik.values.transmission}
                onChange={formik.handleChange}
              >
                <MenuItem value="MANUAL">دستی</MenuItem>
                <MenuItem value="AUTOMATIC">اتوماتیک</MenuItem>
              </TextField>
            </Grid>

            {/* Price Per Hour */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="pricePerHour"
                name="pricePerHour"
                label="قیمت ساعتی (تومان)"
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
                label="قیمت روزانه (تومان)"
                type="number"
                value={formik.values.pricePerDay}
                onChange={formik.handleChange}
                error={formik.touched.pricePerDay && Boolean(formik.errors.pricePerDay)}
                helperText={formik.touched.pricePerDay && formik.errors.pricePerDay}
              />
            </Grid>

            {/* Vehicle Location */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                موقعیت وسیله نقلیه *
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                روی نقشه کلیک کنید تا موقعیت فعلی وسیله نقلیه را تنظیم کنید
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<MyLocationIcon />}
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition(
                        (position) => {
                          setSelectedLocation({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                          });
                        },
                        (error) => {
                          console.error('Error getting location:', error);
                          setError('دریافت موقعیت فعلی شما ممکن نیست. لطفاً به صورت دستی روی نقشه انتخاب کنید.');
                        }
                      );
                    } else {
                      setError('مرورگر شما از موقعیت‌یابی جغرافیایی پشتیبانی نمی‌کند');
                    }
                  }}
                >
                  استفاده از موقعیت فعلی من
                </Button>
              </Box>
              <LocationSelector
                position={selectedLocation}
                onLocationSelect={(lat, lng) => setSelectedLocation({ lat, lng })}
              />
              {selectedLocation && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  انتخاب شده: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </Typography>
              )}
            </Grid>

            {/* Image */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                تصویر وسیله نقلیه
              </Typography>
              {(formik.values.imageUrl || imagePreview) && (
                <Box sx={{ mb: 2 }}>
                  <Box
                    component="img"
                    src={imagePreview || formik.values.imageUrl}
                    alt="تصویر وسیله"
                    sx={{ maxWidth: '100%', maxHeight: 200, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </Box>
              )}
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                fullWidth
                sx={{ py: 1.5, mb: 2 }}
              >
                {imageFile ? imageFile.name : 'انتخاب تصویر جدید (JPEG، PNG، GIF یا WebP - حداکثر ۵ مگابایت)'}
                <input
                  type="file"
                  hidden
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      setImagePreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </Button>
              <TextField
                fullWidth
                id="imageUrl"
                name="imageUrl"
                label="یا آدرس تصویر (URL)"
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
                label="توضیحات"
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
                label="امکانات (جدا شده با کاما)"
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
                  انصراف
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                >
                  {submitting ? 'در حال به‌روزرسانی...' : 'به‌روزرسانی وسیله نقلیه'}
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



