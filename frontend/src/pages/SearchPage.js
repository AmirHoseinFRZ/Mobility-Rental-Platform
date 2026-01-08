import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  TextField,
  Button,
  Box,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  LocationOn,
  Star,
  LocalGasStation,
  People,
  Search,
  Map as MapIcon,
  ViewList,
} from '@mui/icons-material';
import { vehicleService } from '../services/api';
import LocationSelector from '../components/LocationSelector';
import MultipleLocationsMap from '../components/MultipleLocationsMap';

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

// Format datetime for local input (without timezone offset)
const formatDateTimeLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Format datetime for backend (assumes user is in Iran timezone)
const formatDateTimeForBackend = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

// Convert Gregorian date to Jalali (Persian/Shamsi)
const toJalaliDate = (date) => {
  const gDate = new Date(date);
  const gYear = gDate.getFullYear();
  const gMonth = gDate.getMonth() + 1;
  const gDay = gDate.getDate();
  
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

function SearchPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  
  // Search filters
  const [searchLocation, setSearchLocation] = useState(null);
  const [radius, setRadius] = useState('5');
  const [vehicleType, setVehicleType] = useState('');
  const [requiresDriver, setRequiresDriver] = useState('');
  
  // Time range filters
  const [useTimeRange, setUseTimeRange] = useState(false);
  const getMinStartTime = () => new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
  const [startDateTime, setStartDateTime] = useState(getMinStartTime());
  const [endDateTime, setEndDateTime] = useState(new Date(Date.now() + 90 * 60 * 1000)); // 1.5 hours from now

  useEffect(() => {
    const type = searchParams.get('type');
    if (type) {
      setVehicleType(type);
    }
    // Get user's location if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setSearchLocation(location);
          searchVehicles(location.lat, location.lng);
        },
        () => {
          // If geolocation fails, use default location (Tehran)
          const defaultLocation = { lat: 35.6892, lng: 51.3890 };
          setSearchLocation(defaultLocation);
          searchVehicles(defaultLocation.lat, defaultLocation.lng);
        }
      );
    } else {
      const defaultLocation = { lat: 35.6892, lng: 51.3890 };
      setSearchLocation(defaultLocation);
      searchVehicles(defaultLocation.lat, defaultLocation.lng);
    }
  }, []);

  const searchVehicles = async (lat, lon) => {
    if (!lat || !lon) {
      setError('لطفاً یک موقعیت برای جستجو روی نقشه انتخاب کنید');
      return;
    }
    
    // Validate time range if enabled
    if (useTimeRange) {
      if (endDateTime <= startDateTime) {
        setError('زمان پایان باید بعد از زمان شروع باشد');
        return;
      }
      const minTime = getMinStartTime();
      if (startDateTime < minTime) {
        setError('زمان شروع نمی‌تواند کمتر از نیم ساعت آینده باشد');
        return;
      }
    }
    
    setLoading(true);
    setError('');
    
    try {
      const searchData = {
        latitude: parseFloat(lat),
        longitude: parseFloat(lon),
        radiusKm: parseFloat(radius),
        vehicleType: vehicleType || null,
        requiresDriver: requiresDriver === '' ? null : requiresDriver === 'true',
      };
      
      // Add time range if enabled
      if (useTimeRange) {
        searchData.startDateTime = formatDateTimeForBackend(startDateTime);
        searchData.endDateTime = formatDateTimeForBackend(endDateTime);
      }
      
      const response = await vehicleService.searchByLocation(searchData);
      
      if (response.success) {
        setVehicles(response.data || []);
      } else {
        setError('بارگذاری وسایل نقلیه ناموفق بود');
      }
    } catch (err) {
      setError('بارگذاری وسایل نقلیه ناموفق بود. لطفاً دوباره تلاش کنید.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchLocation) {
      searchVehicles(searchLocation.lat, searchLocation.lng);
    }
  };

  const handleLocationSelect = (lat, lng) => {
    setSearchLocation({ lat, lng });
    searchVehicles(lat, lng);
  };

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setSearchLocation(location);
          searchVehicles(location.lat, location.lng);
        },
        () => {
          setError('دریافت موقعیت شما ناموفق بود. لطفاً روی نقشه انتخاب کنید.');
        }
      );
    } else {
      setError('مرورگر شما از موقعیت‌یابی جغرافیایی پشتیبانی نمی‌کند.');
    }
  };

  const vehicleLocations = vehicles.map((vehicle) => ({
    id: vehicle.id,
    lat: vehicle.latitude,
    lng: vehicle.longitude,
    label: `${vehicle.brand} ${vehicle.model} - ${formatPrice(vehicle.pricePerHour)} تومان/ساعت`,
  }));

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        وسیله نقلیه مناسب خود را پیدا کنید
      </Typography>

      {/* Search Location Map */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          انتخاب موقعیت جستجو
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          روی نقشه کلیک کنید تا موقعیت را انتخاب کنید، یا از دکمه برای دریافت موقعیت فعلی خود استفاده کنید
        </Typography>
        <Button
          variant="outlined"
          onClick={handleUseMyLocation}
          sx={{ mb: 2 }}
          startIcon={<LocationOn />}
        >
          استفاده از موقعیت فعلی من
        </Button>
        
        <LocationSelector
          position={searchLocation}
          onLocationSelect={handleLocationSelect}
          height={300}
          label="مرکز جستجو"
          zoom={12}
        />
        
        {searchLocation && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            جستجو در نزدیکی: {searchLocation.lat.toFixed(4)}, {searchLocation.lng.toFixed(4)}
          </Typography>
        )}
      </Paper>

      {/* Search Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          فیلترها
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="شعاع (کیلومتر)"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              size="small"
              type="number"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>نوع وسیله نقلیه</InputLabel>
              <Select
                value={vehicleType}
                label="نوع وسیله نقلیه"
                onChange={(e) => setVehicleType(e.target.value)}
              >
                <MenuItem value="">همه انواع</MenuItem>
                <MenuItem value="CAR">خودرو</MenuItem>
                <MenuItem value="BIKE">موتورسیکلت</MenuItem>
                <MenuItem value="SCOOTER">اسکوتر</MenuItem>
                <MenuItem value="BICYCLE">دوچرخه</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>با راننده</InputLabel>
              <Select
                value={requiresDriver}
                label="با راننده"
                onChange={(e) => setRequiresDriver(e.target.value)}
              >
                <MenuItem value="">همه</MenuItem>
                <MenuItem value="false">بدون راننده</MenuItem>
                <MenuItem value="true">با راننده</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSearch}
              startIcon={<Search />}
              disabled={loading || !searchLocation}
            >
              جستجو
            </Button>
          </Grid>
        </Grid>
        
        {/* Time Range Filter */}
        <Box sx={{ mt: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={useTimeRange}
                onChange={(e) => setUseTimeRange(e.target.checked)}
              />
            }
            label="فیلتر بر اساس بازه زمانی (فقط وسایل نقلیه موجود در این بازه را نشان بده)"
          />
          
          {useTimeRange && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="تاریخ و زمان شروع"
                  type="datetime-local"
                  value={formatDateTimeLocal(startDateTime)}
                  onChange={(e) => {
                    const selectedDate = new Date(e.target.value);
                    const minTime = getMinStartTime();
                    
                    if (selectedDate < minTime) {
                      setError('زمان شروع نمی‌تواند کمتر از نیم ساعت آینده باشد');
                      setStartDateTime(minTime);
                    } else {
                      setError('');
                      setStartDateTime(selectedDate);
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
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="تاریخ و زمان پایان"
                  type="datetime-local"
                  value={formatDateTimeLocal(endDateTime)}
                  onChange={(e) => {
                    const selectedDate = new Date(e.target.value);
                    
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
                  size="small"
                />
              </Grid>
            </Grid>
          )}
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Results */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              {vehicles.length} وسیله نقلیه یافت شد
            </Typography>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newMode) => newMode && setViewMode(newMode)}
              size="small"
            >
              <ToggleButton value="list">
                <ViewList sx={{ mr: 1 }} />
                لیست
              </ToggleButton>
              <ToggleButton value="map">
                <MapIcon sx={{ mr: 1 }} />
                نقشه
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {viewMode === 'map' && vehicles.length > 0 && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                وسایل نقلیه روی نقشه
              </Typography>
              <MultipleLocationsMap
                locations={vehicleLocations}
                height={500}
                zoom={13}
                onMarkerClick={(location) => navigate(`/vehicle/${location.id}`)}
              />
            </Paper>
          )}

          {viewMode === 'list' && (
            <Grid container spacing={3}>
              {vehicles.map((vehicle) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={vehicle.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="img"
                    height="200"
                    image={vehicle.imageUrl || 'https://placehold.co/300x200/e0e0e0/666?text=Vehicle'}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {vehicle.brand} {vehicle.model}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {toPersianNumber(vehicle.year)} • {vehicle.vehicleType}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Star sx={{ color: 'gold', fontSize: 18, mr: 0.5 }} />
                      <Typography variant="body2">
                        {toPersianNumber(vehicle.rating.toFixed(1))} ({toPersianNumber(vehicle.totalReviews)} نظر)
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip
                        icon={<People />}
                        label={`${toPersianNumber(vehicle.seatingCapacity)} صندلی`}
                        size="small"
                      />
                      {vehicle.fuelType && (
                        <Chip
                          icon={<LocalGasStation />}
                          label={vehicle.fuelType}
                          size="small"
                        />
                      )}
                      {vehicle.distanceKm && (
                        <Chip
                          icon={<LocationOn />}
                          label={`${toPersianNumber(vehicle.distanceKm.toFixed(1))} کیلومتر فاصله`}
                          size="small"
                          color="primary"
                        />
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        هر ساعت:
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {formatPrice(vehicle.pricePerHour)} تومان
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        هر روز:
                      </Typography>
                      <Typography variant="h6" color="primary">
                        {formatPrice(vehicle.pricePerDay)} تومان
                      </Typography>
                    </Box>

                    {vehicle.requiresDriver && (
                      <Chip
                        label="راننده موجود"
                        color="secondary"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    )}

                    <Chip
                      label={vehicle.status}
                      color={vehicle.available ? 'success' : 'default'}
                      size="small"
                      sx={{ mt: 1, ml: 1 }}
                    />
                  </CardContent>

                  <CardActions>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => navigate(`/vehicle/${vehicle.id}`)}
                    >
                      مشاهده جزئیات
                    </Button>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => navigate(`/booking/${vehicle.id}`)}
                      disabled={!vehicle.available}
                    >
                      رزرو کنید
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              ))}
            </Grid>
          )}

          {!loading && vehicles.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                هیچ وسیله نقلیه‌ای در این منطقه یافت نشد. شعاع جستجوی خود را گسترش دهید.
              </Typography>
            </Box>
          )}
        </>
      )}
    </Container>
  );
}

export default SearchPage;
