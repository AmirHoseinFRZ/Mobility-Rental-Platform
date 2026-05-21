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
  Alert,
  CircularProgress,
  Divider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { vehicleService, pricingService, bookingService } from '../services/api';
import LocationSelector from '../components/LocationSelector';

// Haversine straight-line distance in km
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (d) => (d * Math.PI) / 180;
  const r1 = toRad(lat1);
  const r2 = toRad(lat2);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(r1) * Math.cos(r2) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Per-vehicle-type fallback rate (تومان/km) — mirrors backend defaults
const FALLBACK_DELIVERY_RATE = {
  CAR: 15000,
  BIKE: 8000,
  SCOOTER: 8000,
  BICYCLE: 5000,
  VAN: 20000,
  TRUCK: 25000,
};

// Convert English numbers to Persian
const toPersianNumber = (num) => {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return String(num).replace(/\d/g, (digit) => persianDigits[digit]);
};

// Format price with Persian numbers and thousand separators
const formatPrice = (amount) => {
  const formatted = Math.round(parseFloat(amount)).toLocaleString('en-US');
  return toPersianNumber(formatted);
};

// Convert Gregorian date to Jalali (Persian/Shamsi)
const toJalaliDate = (date) => {
  const gDate = new Date(date);
  const gYear = gDate.getFullYear();
  const gMonth = gDate.getMonth() + 1;
  const gDay = gDate.getDate();
  
  // Simple Jalali conversion algorithm
  let jYear, jMonth, jDay;
  
  if (gYear <= 1600) {
    jYear = 0;
  } else {
    jYear = 979;
  }
  
  const gy = gYear - 1600;
  const gm = gMonth - 1;
  const gd = gDay - 1;
  
  let gdayNo = 365 * gy + Math.floor((gy + 3) / 4) - Math.floor((gy + 99) / 100) + Math.floor((gy + 399) / 400);
  
  for (let i = 0; i < gm; ++i) {
    gdayNo += [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][i];
  }
  
  if (gm > 1 && ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0))) {
    ++gdayNo;
  }
  
  gdayNo += gd;
  
  let jdayNo = gdayNo - 79;
  const jNp = Math.floor(jdayNo / 12053);
  jdayNo %= 12053;
  
  jYear += 33 * jNp + 4 * Math.floor(jdayNo / 1461);
  jdayNo %= 1461;
  
  if (jdayNo >= 366) {
    jYear += Math.floor((jdayNo - 1) / 365);
    jdayNo = (jdayNo - 1) % 365;
  }
  
  const monthDays = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
  
  for (let i = 0; i < 11 && jdayNo >= monthDays[i]; ++i) {
    jdayNo -= monthDays[i];
    jMonth = i + 2;
  }
  
  if (jMonth === undefined) {
    jMonth = 1;
  }
  
  jDay = jdayNo + 1;
  
  return { year: jYear, month: jMonth, day: jDay };
};

// Format Jalali date and time in Persian
const formatPersianDateTime = (date) => {
  const persianMonths = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];
  
  const gDate = new Date(date);
  const jalali = toJalaliDate(gDate);
  const hours = gDate.getHours();
  const minutes = gDate.getMinutes();
  
  return `${toPersianNumber(jalali.day)} ${persianMonths[jalali.month - 1]} ${toPersianNumber(jalali.year)} - ساعت ${toPersianNumber(hours)}:${toPersianNumber(String(minutes).padStart(2, '0'))}`;
};

// Format datetime for backend (assumes user is in Iran timezone)
// Sends the datetime as-is without timezone conversion
const formatDateTimeForBackend = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

function BookingPage() {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Booking form data
  // Set minimum start time to current time + 30 minutes
  const getMinStartTime = () => new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
  const [startDateTime, setStartDateTime] = useState(getMinStartTime());
  const [endDateTime, setEndDateTime] = useState(new Date(Date.now() + 90 * 60 * 1000)); // 1.5 hours from now
  const [specialRequests, setSpecialRequests] = useState('');
  
  // Price calculation
  const [priceData, setPriceData] = useState(null);

  // Delivery
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [deliveryPoint, setDeliveryPoint] = useState(null); // { lat, lng }
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryDistanceKm, setDeliveryDistanceKm] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(null);
  const [deliveryError, setDeliveryError] = useState('');
  const [deliveryLoading, setDeliveryLoading] = useState(false);

  useEffect(() => {
    loadVehicle();
  }, [vehicleId]);

  useEffect(() => {
    if (vehicle && startDateTime && endDateTime) {
      calculatePrice();
    }
  }, [vehicle, startDateTime, endDateTime]);

  // Recalculate delivery distance + fee whenever the selected point changes
  useEffect(() => {
    if (!deliveryEnabled || !deliveryPoint || !vehicle || vehicle.latitude == null || vehicle.longitude == null) {
      setDeliveryDistanceKm(null);
      setDeliveryFee(null);
      setDeliveryError('');
      return;
    }
    const dist = haversineKm(
      vehicle.latitude,
      vehicle.longitude,
      deliveryPoint.lat,
      deliveryPoint.lng
    );
    setDeliveryDistanceKm(dist);

    if (
      vehicle.maxDeliveryRadiusKm != null &&
      dist > vehicle.maxDeliveryRadiusKm
    ) {
      setDeliveryError('این نقطه خارج از محدوده تحویل این خودرو است.');
      setDeliveryFee(null);
      return;
    }
    setDeliveryError('');

    let cancelled = false;
    const t = setTimeout(async () => {
      setDeliveryLoading(true);
      try {
        const response = await pricingService.calculateDeliveryFee(
          vehicle.vehicleType,
          dist
        );
        if (!cancelled && response?.success && response.data) {
          setDeliveryFee(parseFloat(response.data.deliveryFee));
        } else if (!cancelled) {
          const rate = FALLBACK_DELIVERY_RATE[vehicle.vehicleType] || 10000;
          setDeliveryFee(Math.round(rate * dist));
        }
      } catch (e) {
        if (!cancelled) {
          const rate = FALLBACK_DELIVERY_RATE[vehicle.vehicleType] || 10000;
          setDeliveryFee(Math.round(rate * dist));
        }
      } finally {
        if (!cancelled) setDeliveryLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [deliveryEnabled, deliveryPoint, vehicle]);

  // Reverse-geocode the delivery point via Nominatim (debounced)
  useEffect(() => {
    if (!deliveryEnabled || !deliveryPoint) {
      setDeliveryAddress('');
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${deliveryPoint.lat}&lon=${deliveryPoint.lng}&accept-language=fa`;
        const res = await fetch(url, {
          headers: { 'Accept-Language': 'fa' },
        });
        if (!res.ok) throw new Error('reverse geocode failed');
        const data = await res.json();
        if (!cancelled) {
          setDeliveryAddress(
            data.display_name ||
              `موقعیت انتخاب‌شده (${deliveryPoint.lat.toFixed(5)}, ${deliveryPoint.lng.toFixed(5)})`
          );
        }
      } catch (_) {
        if (!cancelled) {
          setDeliveryAddress(
            `موقعیت انتخاب‌شده (${deliveryPoint.lat.toFixed(5)}, ${deliveryPoint.lng.toFixed(5)})`
          );
        }
      }
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [deliveryEnabled, deliveryPoint]);

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

  const calculatePrice = async () => {
    if (!vehicle) return;
    
    try {
      const priceRequest = {
        vehicleType: vehicle.vehicleType,
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        withDriver: false,
        discountCode: null,
      };
      
      console.log('Calculating price with request:', priceRequest);
      const response = await pricingService.calculatePrice(priceRequest);
      console.log('Price calculation response:', response);
      
      if (response.success) {
        setPriceData(response.data);
        console.log('Price data set:', response.data);
      } else {
        console.error('Price calculation failed:', response);
        // Fallback: Calculate price locally
        calculatePriceLocally();
      }
    } catch (err) {
      console.error('Failed to calculate price', err);
      console.error('Error details:', err.response?.data);
      // Fallback: Calculate price locally
      calculatePriceLocally();
    }
  };

  const calculatePriceLocally = () => {
    if (!vehicle || !startDateTime || !endDateTime) return;
    
    const totalHours = Math.ceil((endDateTime - startDateTime) / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const remainingHours = totalHours % 24;
    
    let basePrice = 0;
    
    // محاسبه قیمت پایه
    if (days >= 1) {
      // اگر به روز رسید: تعداد روز * قیمت روزانه + ساعات باقیمانده * قیمت ساعتی
      basePrice = (days * vehicle.pricePerDay) + (remainingHours * vehicle.pricePerHour);
    } else {
      // اگر کمتر از یک روز: تعداد ساعات * قیمت ساعتی
      basePrice = totalHours * vehicle.pricePerHour;
    }
    
    const totalPrice = basePrice;
    
    setPriceData({
      basePrice: basePrice.toFixed(2),
      driverPrice: '0',
      surgeCharge: 0,
      weekendCharge: 0,
      discountAmount: 0,
      discountCode: null,
      rentalHours: totalHours,
      rentalDays: days,
      totalPrice: totalPrice.toFixed(2),
    });
    
    console.log('Price calculated locally:', {
      basePrice,
      totalPrice,
      totalHours,
      days,
      remainingHours,
      calculation: days >= 1 
        ? `${days} روز * ${vehicle.pricePerDay} + ${remainingHours} ساعت * ${vehicle.pricePerHour}`
        : `${totalHours} ساعت * ${vehicle.pricePerHour}`
    });
  };

  const handleBooking = async () => {
    setBookingLoading(true);
    setError('');

    try {
      const defaultPickupLocation =
        (vehicle.currentAddress && vehicle.currentAddress.trim()) ||
        (vehicle.currentCity && vehicle.currentCity.trim()) ||
        'محل وسیله نقلیه';

      const usingDelivery = deliveryEnabled && deliveryPoint && !deliveryError;

      const pickupLocation = usingDelivery
        ? deliveryAddress ||
          `موقعیت انتخاب‌شده (${deliveryPoint.lat.toFixed(5)}, ${deliveryPoint.lng.toFixed(5)})`
        : defaultPickupLocation;
      const pickupLatitude = usingDelivery ? deliveryPoint.lat : vehicle.latitude;
      const pickupLongitude = usingDelivery ? deliveryPoint.lng : vehicle.longitude;

      const basePrice = priceData ? parseFloat(priceData.basePrice) : null;
      const baseTotal = priceData ? parseFloat(priceData.totalPrice) : null;
      const totalWithDelivery =
        baseTotal != null && usingDelivery && deliveryFee != null
          ? baseTotal + deliveryFee
          : baseTotal;

      const bookingRequest = {
        userId: user.id,
        vehicleId: parseInt(vehicleId),
        driverId: null,
        startDateTime: formatDateTimeForBackend(startDateTime),
        endDateTime: formatDateTimeForBackend(endDateTime),
        pickupLocation,
        pickupLatitude,
        pickupLongitude,
        dropoffLocation: null,
        withDriver: false,
        specialRequests: specialRequests || null,
        vehiclePrice: basePrice,
        driverPrice: null,
        totalPrice: totalWithDelivery,
        deliveryRequested: !!usingDelivery,
      };
      
      console.log('Creating booking with request:', bookingRequest);
      const response = await bookingService.createBooking(bookingRequest);
      console.log('Booking response:', response);
      
      if (response.success) {
        // Navigate to payment page
        navigate(`/payment/${response.data.id}`);
      } else {
        setError(response.message || 'رزرو ناموفق بود');
      }
    } catch (err) {
      console.error('Booking error:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.message || err.message || 'رزرو ناموفق بود. لطفاً دوباره تلاش کنید.');
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
          رزرو وسیله نقلیه خود
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
                  جزئیات رزرو
                </Typography>

                {/* بازهٔ زمانی رزرو */}
                <Box
                  sx={{
                    mb: 3,
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: 'action.hover',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600 }}>
                    بازهٔ زمانی رزرو
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <DateTimePicker
                        label="از تاریخ و زمان"
                        value={startDateTime}
                        minDate={new Date()}
                        shouldDisableDate={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const checkDate = new Date(date);
                          checkDate.setHours(0, 0, 0, 0);
                          return checkDate < today;
                        }}
                        shouldDisableTime={(value, view) => {
                          if (!value) return false;
                          const minTime = getMinStartTime();
                          const selectedDate = new Date(value);
                          
                          // اگر روز انتخاب‌شده امروز نیست، همه ساعات مجاز هستند
                          const today = new Date();
                          if (selectedDate.getDate() !== today.getDate() ||
                              selectedDate.getMonth() !== today.getMonth() ||
                              selectedDate.getFullYear() !== today.getFullYear()) {
                            return false;
                          }
                          
                          // برای امروز، ساعات قبل از minTime را غیرفعال کن
                          if (view === 'hours') {
                            return value < minTime.getHours();
                          }
                          if (view === 'minutes') {
                            if (value === minTime.getHours()) {
                              return selectedDate.getMinutes() < minTime.getMinutes();
                            }
                          }
                          return false;
                        }}
                        onChange={(newValue) => {
                          if (!newValue || isNaN(newValue.getTime())) return;
                          const minTime = getMinStartTime();
                          if (newValue < minTime) {
                            setError('زمان شروع نمی‌تواند کمتر از نیم ساعت آینده باشد');
                            setStartDateTime(minTime);
                          } else {
                            setError('');
                            setStartDateTime(newValue);
                            if (endDateTime <= newValue) {
                              setEndDateTime(new Date(newValue.getTime() + 60 * 60 * 1000));
                            }
                          }
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            size="small"
                            helperText={startDateTime ? formatPersianDateTime(startDateTime) : ''}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <DateTimePicker
                        label="تا تاریخ و زمان"
                        value={endDateTime}
                        minDate={startDateTime}
                        shouldDisableDate={(date) => {
                          const startDate = new Date(startDateTime);
                          startDate.setHours(0, 0, 0, 0);
                          const checkDate = new Date(date);
                          checkDate.setHours(0, 0, 0, 0);
                          return checkDate < startDate;
                        }}
                        shouldDisableTime={(value, view) => {
                          if (!value) return false;
                          const selectedDate = new Date(value);
                          const minEndTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);
                          
                          // اگر روز انتخاب‌شده روز شروع نیست، همه ساعات مجاز هستند
                          if (selectedDate.getDate() !== startDateTime.getDate() ||
                              selectedDate.getMonth() !== startDateTime.getMonth() ||
                              selectedDate.getFullYear() !== startDateTime.getFullYear()) {
                            return false;
                          }
                          
                          // برای همان روز شروع، ساعات قبل از minEndTime را غیرفعال کن
                          if (view === 'hours') {
                            return value < minEndTime.getHours();
                          }
                          if (view === 'minutes') {
                            if (selectedDate.getHours() === minEndTime.getHours()) {
                              return value < minEndTime.getMinutes();
                            }
                          }
                          return false;
                        }}
                        onChange={(newValue) => {
                          if (!newValue || isNaN(newValue.getTime())) return;
                          if (newValue <= startDateTime) {
                            setError('زمان پایان باید بعد از زمان شروع باشد');
                          } else {
                            setError('');
                            setEndDateTime(newValue);
                          }
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            size="small"
                            helperText={endDateTime ? formatPersianDateTime(endDateTime) : ''}
                          />
                        )}
                      />
                    </Grid>
                  </Grid>
                  <Box
                    sx={{
                      mt: 2,
                      py: 1.5,
                      px: 2,
                      borderRadius: 1,
                      bgcolor: 'background.paper',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      مدت:
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {startDateTime && endDateTime && endDateTime > startDateTime
                        ? (() => {
                            const hours = Math.ceil((endDateTime - startDateTime) / (1000 * 60 * 60));
                            const days = Math.floor(hours / 24);
                            const h = hours % 24;
                            if (days > 0) {
                              return `${toPersianNumber(days)} روز و ${toPersianNumber(h)} ساعت`;
                            }
                            return `${toPersianNumber(hours)} ساعت`;
                          })()
                        : '—'}
                    </Typography>
                  </Box>
                </Box>

                <TextField
                  fullWidth
                  label="درخواست‌های ویژه (اختیاری)"
                  multiline
                  rows={3}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  sx={{ mb: 2 }}
                />

                {vehicle.deliveryAvailable && (
                  <Box
                    sx={{
                      mt: 1,
                      p: 2.5,
                      borderRadius: 2,
                      bgcolor: 'action.hover',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={deliveryEnabled}
                          onChange={(e) => {
                            setDeliveryEnabled(e.target.checked);
                            if (!e.target.checked) {
                              setDeliveryPoint(null);
                              setDeliveryAddress('');
                              setDeliveryDistanceKm(null);
                              setDeliveryFee(null);
                              setDeliveryError('');
                            }
                          }}
                        />
                      }
                      label="تحویل در محل من"
                    />
                    {vehicle.maxDeliveryRadiusKm != null && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                        حداکثر شعاع تحویل: {toPersianNumber(vehicle.maxDeliveryRadiusKm)} کیلومتر
                      </Typography>
                    )}

                    {deliveryEnabled && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          روی نقشه کلیک کنید تا نقطه تحویل را انتخاب کنید
                        </Typography>
                        <LocationSelector
                          position={
                            deliveryPoint ||
                            (vehicle.latitude && vehicle.longitude
                              ? { lat: vehicle.latitude, lng: vehicle.longitude }
                              : null)
                          }
                          onLocationSelect={(lat, lng) => setDeliveryPoint({ lat, lng })}
                          height={320}
                          label="نقطه تحویل"
                          zoom={14}
                        />

                        {deliveryError && (
                          <Alert severity="error" sx={{ mt: 2 }}>
                            {deliveryError}
                          </Alert>
                        )}

                        {deliveryPoint && !deliveryError && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              آدرس انتخاب‌شده:
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                              {deliveryAddress ||
                                `${deliveryPoint.lat.toFixed(5)}, ${deliveryPoint.lng.toFixed(5)}`}
                            </Typography>
                            {deliveryDistanceKm != null && (
                              <Typography variant="body2" color="text.secondary">
                                فاصله از محل خودرو:{' '}
                                <Box component="span" sx={{ fontWeight: 500, color: 'text.primary' }}>
                                  {toPersianNumber(deliveryDistanceKm.toFixed(1))} کیلومتر
                                </Box>
                              </Typography>
                            )}
                            {deliveryLoading ? (
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                در حال محاسبه هزینه تحویل...
                              </Typography>
                            ) : (
                              deliveryFee != null && (
                                <Typography variant="body2" color="text.secondary">
                                  هزینه تحویل:{' '}
                                  <Box component="span" sx={{ fontWeight: 500, color: 'text.primary' }}>
                                    {formatPrice(deliveryFee)} تومان
                                  </Box>
                                </Typography>
                              )
                            )}
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Price Summary */}
          <Grid item xs={12} md={5}>
            <Card sx={{ position: 'sticky', top: 80 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  خلاصه وسیله نقلیه
                </Typography>
                {vehicle.imageUrl && (
                  <Box
                    component="img"
                    src={vehicle.imageUrl}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    sx={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 2, mb: 2 }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
                <Typography variant="body1">
                  {vehicle.brand} {vehicle.model}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {toPersianNumber(vehicle.year)} • {vehicle.vehicleType}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom>
                  جزئیات قیمت
                </Typography>

                {priceData ? (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">قیمت پایه:</Typography>
                      <Typography variant="body2">{formatPrice(priceData.basePrice)} تومان</Typography>
                    </Box>
                    
                    {deliveryEnabled && deliveryFee != null && !deliveryError && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">هزینه تحویل:</Typography>
                        <Typography variant="body2">{formatPrice(deliveryFee)} تومان</Typography>
                      </Box>
                    )}

                    {priceData.surgeCharge > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">هزینه اضافی:</Typography>
                        <Typography variant="body2">{formatPrice(priceData.surgeCharge)} تومان</Typography>
                      </Box>
                    )}
                    
                    {priceData.weekendCharge > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">هزینه آخر هفته:</Typography>
                        <Typography variant="body2">{formatPrice(priceData.weekendCharge)} تومان</Typography>
                      </Box>
                    )}
                    
                    {priceData.discountAmount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="success.main">
                          تخفیف ({priceData.discountCode}):
                        </Typography>
                        <Typography variant="body2" color="success.main">
                          -{formatPrice(priceData.discountAmount)} تومان
                        </Typography>
                      </Box>
                    )}
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">
                        مدت زمان: {toPersianNumber(priceData.rentalHours)} ساعت ({toPersianNumber(priceData.rentalDays)} روز)
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6">مجموع:</Typography>
                      <Typography variant="h6" color="primary">
                        {formatPrice(
                          parseFloat(priceData.totalPrice) +
                            (deliveryEnabled && deliveryFee != null && !deliveryError
                              ? deliveryFee
                              : 0)
                        )}{' '}
                        تومان
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    در حال محاسبه قیمت...
                  </Typography>
                )}

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleBooking}
                  disabled={
                    bookingLoading ||
                    !priceData ||
                    (deliveryEnabled &&
                      (!deliveryPoint || !!deliveryError || deliveryFee == null))
                  }
                  sx={{ mt: 3 }}
                >
                  {bookingLoading ? 'در حال پردازش...' : 'ادامه به پرداخت'}
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






