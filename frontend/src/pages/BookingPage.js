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

// Format datetime for local input (without timezone offset)
const formatDateTimeLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
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
    let driverPrice = 0;
    
    // محاسبه قیمت پایه
    if (days >= 1) {
      // اگر به روز رسید: تعداد روز * قیمت روزانه + ساعات باقیمانده * قیمت ساعتی
      basePrice = (days * vehicle.pricePerDay) + (remainingHours * vehicle.pricePerHour);
    } else {
      // اگر کمتر از یک روز: تعداد ساعات * قیمت ساعتی
      basePrice = totalHours * vehicle.pricePerHour;
    }
    
    // محاسبه قیمت راننده (همیشه بر اساس ساعت)
    if (withDriver && vehicle.driverPricePerHour) {
      driverPrice = totalHours * vehicle.driverPricePerHour;
    }
    
    const totalPrice = basePrice + driverPrice;
    
    setPriceData({
      basePrice: basePrice.toFixed(2),
      driverPrice: driverPrice.toFixed(2),
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
      driverPrice,
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
    if (!pickupLocation) {
      setError('لطفاً محل تحویل را وارد کنید');
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

                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    label="تاریخ و زمان شروع"
                    type="datetime-local"
                    value={formatDateTimeLocal(startDateTime)}
                    onChange={(e) => {
                      const selectedDate = new Date(e.target.value);
                      const minTime = getMinStartTime();
                      
                      // Don't allow time before minimum allowed time
                      if (selectedDate < minTime) {
                        setError('زمان شروع نمی‌تواند کمتر از نیم ساعت آینده باشد');
                        setStartDateTime(minTime);
                      } else {
                        setError('');
                        setStartDateTime(selectedDate);
                        // If end time is before new start time, adjust it
                        if (endDateTime <= selectedDate) {
                          setEndDateTime(new Date(selectedDate.getTime() + 60 * 60 * 1000));
                        }
                      }
                    }}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      min: formatDateTimeLocal(getMinStartTime())
                    }}
                    helperText={startDateTime ? formatPersianDateTime(startDateTime) : ''}
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="تاریخ و زمان پایان"
                    type="datetime-local"
                    value={formatDateTimeLocal(endDateTime)}
                    onChange={(e) => {
                      const selectedDate = new Date(e.target.value);
                      
                      // Don't allow end time before start time
                      if (selectedDate <= startDateTime) {
                        setError('زمان پایان باید بعد از زمان شروع باشد');
                      } else {
                        setError('');
                        setEndDateTime(selectedDate);
                      }
                    }}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{
                      min: formatDateTimeLocal(new Date(startDateTime.getTime() + 60 * 60 * 1000))
                    }}
                    helperText={endDateTime ? formatPersianDateTime(endDateTime) : ''}
                  />
                </Box>

                <TextField
                  fullWidth
                  label="محل تحویل"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  required
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="محل بازگشت (اختیاری)"
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
                    label="رزرو با راننده"
                    sx={{ mb: 2 }}
                  />
                )}

                {withDriver && nearestDrivers.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      رانندگان موجود در نزدیکی:
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
                            ⭐ {toPersianNumber(driver.rating.toFixed(1))} • {toPersianNumber(driver.totalTrips)} سفر
                            {driver.distanceKm && ` • ${toPersianNumber(driver.distanceKm.toFixed(1))} کیلومتر فاصله`}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}

                <TextField
                  fullWidth
                  label="درخواست‌های ویژه (اختیاری)"
                  multiline
                  rows={3}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  sx={{ mb: 2 }}
                />

                <TextField
                  fullWidth
                  label="کد تخفیف (اختیاری)"
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
                  خلاصه وسیله نقلیه
                </Typography>
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
                    
                    {priceData.driverPrice > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">هزینه راننده:</Typography>
                        <Typography variant="body2">{formatPrice(priceData.driverPrice)} تومان</Typography>
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
                        {formatPrice(priceData.totalPrice)} تومان
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
                  disabled={bookingLoading || !priceData}
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






