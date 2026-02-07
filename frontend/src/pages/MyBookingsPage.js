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
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
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
import { bookingService, reviewService, paymentService, vehicleService, authService } from '../services/api';
import MapView from '../components/MapView';

// Convert English numbers to Persian
const toPersianNumber = (str) => {
  if (!str) return str;
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  const englishDigits = '0123456789';
  
  let result = String(str);
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(englishDigits[i], 'g'), persianDigits[i]);
  }
  return result;
};

// Format price with Persian numbers and thousand separators
const formatPrice = (amount) => {
  if (!amount) return '۰.۰۰';
  const formatted = amount.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
  return toPersianNumber(formatted);
};

// Format date to Persian numbers
const formatDatePersian = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const options = { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  };
  return toPersianNumber(d.toLocaleString('fa-IR', options));
};

// Format date only (without time)
const formatDateOnlyPersian = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return toPersianNumber(d.toLocaleDateString('fa-IR'));
};

function MyBookingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transactionStatuses, setTransactionStatuses] = useState({}); // Map of bookingId -> transaction status
  
  // Cancel dialog
  const [cancelDialog, setCancelDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  
  // Review dialog
  const [reviewDialog, setReviewDialog] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  
  // Vehicle details dialog
  const [vehicleDetailsDialog, setVehicleDetailsDialog] = useState(false);
  const [vehicleDetails, setVehicleDetails] = useState(null);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [ownerInfo, setOwnerInfo] = useState(null);

  useEffect(() => {
    loadBookings();
  }, [user]);

  const loadBookings = async () => {
    try {
      const response = await bookingService.getUserBookings(user.id);
      if (response.success) {
        // Sort bookings from newest to oldest
        const sortedBookings = (response.data || []).sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        setBookings(sortedBookings);
        
        // Check transaction statuses for bookings with pending payment
        const statusMap = {};
        const checkPromises = sortedBookings
          .filter(booking => 
            !booking.paymentCompleted && 
            booking.status === 'PENDING' && 
            booking.paymentTransactionId
          )
          .map(async (booking) => {
            try {
              const transactionResponse = await paymentService.getTransactionStatus(booking.paymentTransactionId);
              const status = transactionResponse?.status || transactionResponse?.data?.status || '';
              const statusUpper = String(status).toUpperCase();
              
              // If transaction is failed or cancelled, store the status and refresh booking
              if (statusUpper === 'FAILED' || statusUpper === 'CANCELED' || statusUpper === 'CANCELLED') {
                statusMap[booking.id] = statusUpper;
                
                // Refresh booking to get updated status from backend
                try {
                  const updatedBookingResponse = await bookingService.getBookingById(booking.id);
                  if (updatedBookingResponse.success) {
                    // Update the booking in the list
                    setBookings(prevBookings => 
                      prevBookings.map(b => 
                        b.id === booking.id ? updatedBookingResponse.data : b
                      )
                    );
                  }
                } catch (refreshErr) {
                  console.warn(`Could not refresh booking ${booking.id}:`, refreshErr);
                }
              }
            } catch (err) {
              // If we can't check the status, don't block the UI
              console.warn(`Could not check transaction status for booking ${booking.id}:`, err);
            }
          });
        
        await Promise.all(checkPromises);
        setTransactionStatuses(statusMap);
      }
    } catch (err) {
      setError('بارگذاری رزروها ناموفق بود');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    try {
      const response = await bookingService.cancelBooking(selectedBooking.id, cancelReason);
      if (response.success) {
        loadBookings();
        setCancelDialog(false);
        setCancelReason('');
      }
    } catch (err) {
      setError('لغو رزرو ناموفق بود');
    }
  };

  const handleSubmitReview = async () => {
    try {
      const reviewData = {
        userId: user.id,
        bookingId: selectedBooking.id,
        vehicleId: selectedBooking.vehicleId,
        reviewType: 'VEHICLE',
        rating: rating,
        comment: comment,
      };
      
      const response = await reviewService.createReview(reviewData);
      if (response.success) {
        setReviewDialog(false);
        setComment('');
        setRating(5);
        alert('نظر شما با موفقیت ثبت شد!');
      }
    } catch (err) {
      setError('ثبت نظر ناموفق بود');
    }
  };

  const handleViewVehicleDetails = async (vehicleId) => {
    setVehicleLoading(true);
    setVehicleDetailsDialog(true);
    setOwnerInfo(null);
    try {
      const response = await vehicleService.getVehicleById(vehicleId);
      if (response.success) {
        setVehicleDetails(response.data);
        
        // Load owner information if ownerId exists
        if (response.data.ownerId) {
          try {
            const ownerResponse = await authService.getUserById(response.data.ownerId);
            if (ownerResponse.success) {
              setOwnerInfo(ownerResponse.data);
            }
          } catch (ownerErr) {
            console.warn('Could not load owner information:', ownerErr);
            // Don't fail the whole operation if owner info can't be loaded
          }
        }
      } else {
        setError('بارگذاری مشخصات وسیله نقلیه ناموفق بود');
        setVehicleDetailsDialog(false);
      }
    } catch (err) {
      setError('بارگذاری مشخصات وسیله نقلیه ناموفق بود');
      setVehicleDetailsDialog(false);
    } finally {
      setVehicleLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED': return 'success';
      case 'ONGOING': return 'primary';
      case 'COMPLETED': return 'default';
      case 'CANCELLED': return 'error';
      default: return 'warning';
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        رزروهای من
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {bookings.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            هنوز رزروی ندارید
          </Typography>
          <Button variant="contained" onClick={() => navigate('/search')}>
            شروع جستجو
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {bookings.map((booking) => (
            <Grid item xs={12} key={booking.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6">
                        رزرو #{toPersianNumber(booking.bookingNumber)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ایجاد شده: {formatDateOnlyPersian(booking.createdAt)}
                      </Typography>
                    </Box>
                    <Chip
                      label={booking.status}
                      color={getStatusColor(booking.status)}
                    />
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary">
                        محل تحویل:
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {booking.pickupLocation}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        زمان شروع:
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {formatDatePersian(booking.startDateTime)}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        زمان پایان:
                      </Typography>
                      <Typography variant="body1">
                        {formatDatePersian(booking.endDateTime)}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">قیمت کل:</Typography>
                        <Typography variant="h6" color="primary">
                          {formatPrice(booking.finalPrice)} تومان
                        </Typography>
                      </Box>

                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          وضعیت پرداخت:
                        </Typography>
                        <Chip
                          label={booking.paymentCompleted ? 'پرداخت شده' : 'در انتظار'}
                          color={booking.paymentCompleted ? 'success' : 'warning'}
                          size="small"
                        />
                      </Box>

                      {/* Owner information for confirmed bookings */}
                      {(booking.status === 'CONFIRMED' || booking.status === 'ONGOING' || booking.status === 'COMPLETED') && 
                       (booking.ownerFirstName || booking.ownerLastName || booking.ownerPhoneNumber) && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            اطلاعات مالک وسیله نقلیه:
                          </Typography>
                          {(booking.ownerFirstName || booking.ownerLastName) && (
                            <Typography variant="body1" gutterBottom>
                              نام: {booking.ownerFirstName || ''} {booking.ownerLastName || ''}
                            </Typography>
                          )}
                          {booking.ownerPhoneNumber && (
                            <Typography variant="body1">
                              شماره تماس: {toPersianNumber(booking.ownerPhoneNumber)}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant="outlined"
                      color="info"
                      onClick={() => handleViewVehicleDetails(booking.vehicleId)}
                    >
                      مشاهده مشخصات وسیله نقلیه
                    </Button>

                    {booking.status === 'PENDING' && (
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => {
                          setSelectedBooking(booking);
                          setCancelDialog(true);
                        }}
                      >
                        لغو رزرو
                      </Button>
                    )}

                    {booking.status === 'COMPLETED' && (
                      <Button
                        variant="contained"
                        onClick={() => {
                          setSelectedBooking(booking);
                          setReviewDialog(true);
                        }}
                      >
                        ثبت نظر
                      </Button>
                    )}

                    {!booking.paymentCompleted && 
                     booking.status === 'PENDING' && 
                     !transactionStatuses[booking.id] && (
                      <Button
                        variant="contained"
                        onClick={() => navigate(`/payment/${booking.id}`)}
                      >
                        تکمیل پرداخت
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Cancel Dialog */}
      <Dialog open={cancelDialog} onClose={() => setCancelDialog(false)}>
        <DialogTitle>لغو رزرو</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="دلیل لغو (اختیاری)"
            multiline
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog(false)}>بستن</Button>
          <Button variant="contained" color="error" onClick={handleCancelBooking}>
            لغو رزرو
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onClose={() => setReviewDialog(false)}>
        <DialogTitle>ثبت نظر</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              امتیاز:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  variant={rating === star ? 'contained' : 'outlined'}
                  onClick={() => setRating(star)}
                >
                  {star} ⭐
                </Button>
              ))}
            </Box>
          </Box>
          
          <TextField
            fullWidth
            label="نظر شما"
            multiline
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog(false)}>بستن</Button>
          <Button variant="contained" onClick={handleSubmitReview}>
            ثبت نظر
          </Button>
        </DialogActions>
      </Dialog>

      {/* Vehicle Details Dialog */}
      <Dialog 
        open={vehicleDetailsDialog} 
        onClose={() => {
          setVehicleDetailsDialog(false);
          setVehicleDetails(null);
          setOwnerInfo(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DirectionsCar />
            <Typography variant="h6">مشخصات وسیله نقلیه</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {vehicleLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : vehicleDetails ? (
            <Box>
              {/* Vehicle Image */}
              <Box
                component="img"
                src={vehicleDetails.imageUrl || 'https://placehold.co/600x400/e0e0e0/666?text=Vehicle'}
                alt={`${vehicleDetails.brand} ${vehicleDetails.model}`}
                sx={{ width: '100%', borderRadius: 2, mb: 3 }}
              />

              {/* Vehicle Title */}
              <Typography variant="h5" gutterBottom>
                {vehicleDetails.brand} {vehicleDetails.model}
              </Typography>
              
              {/* Rating */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Rating value={vehicleDetails.rating || 0} readOnly precision={0.1} />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {toPersianNumber((vehicleDetails.rating || 0).toFixed(1))} ({toPersianNumber(vehicleDetails.totalReviews || 0)} نظر)
                </Typography>
              </Box>

              {/* Status Chips */}
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={vehicleDetails.status}
                  color={vehicleDetails.available ? 'success' : 'default'}
                  sx={{ mr: 1 }}
                />
                <Chip label={vehicleDetails.vehicleType} variant="outlined" sx={{ mr: 1 }} />
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Specifications */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarMonth sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography>سال: {toPersianNumber(vehicleDetails.year)}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <People sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography>صندلی: {toPersianNumber(vehicleDetails.seatingCapacity)}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <LocalGasStation sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography>{vehicleDetails.fuelType || 'نامشخص'}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Speed sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography>{vehicleDetails.transmission || 'نامشخص'}</Typography>
                  </Box>
                </Grid>
                {vehicleDetails.currentCity && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography>{vehicleDetails.currentCity}</Typography>
                    </Box>
                  </Grid>
                )}
                {vehicleDetails.color && (
                  <Grid item xs={6}>
                    <Typography>رنگ: {vehicleDetails.color}</Typography>
                  </Grid>
                )}
                {vehicleDetails.licensePlate && (
                  <Grid item xs={6}>
                    <Typography>پلاک: {vehicleDetails.licensePlate}</Typography>
                  </Grid>
                )}
                {(vehicleDetails.latitude && vehicleDetails.longitude) && (
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        موقعیت جغرافیایی:
                      </Typography>
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        {toPersianNumber(vehicleDetails.latitude.toFixed(6))}, {toPersianNumber(vehicleDetails.longitude.toFixed(6))}
                      </Typography>
                    </Box>
                    <MapView 
                      position={{ 
                        lat: vehicleDetails.latitude, 
                        lng: vehicleDetails.longitude 
                      }}
                      height={200}
                      label={`${vehicleDetails.brand} ${vehicleDetails.model}`}
                      zoom={13}
                    />
                  </Grid>
                )}
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Pricing */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  قیمت
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body1">هر ساعت:</Typography>
                  <Typography variant="h6" color="primary">
                    {formatPrice(vehicleDetails.pricePerHour)} تومان
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1">هر روز:</Typography>
                  <Typography variant="h6" color="primary">
                    {formatPrice(vehicleDetails.pricePerDay)} تومان
                  </Typography>
                </Box>
              </Box>

              {/* Description */}
              {vehicleDetails.description && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      توضیحات
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {vehicleDetails.description}
                    </Typography>
                  </Box>
                </>
              )}

              {/* Features */}
              {vehicleDetails.features && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      امکانات
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {vehicleDetails.features}
                    </Typography>
                  </Box>
                </>
              )}

              {/* Owner Information */}
              {ownerInfo && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      اطلاعات مالک وسیله نقلیه
                    </Typography>
                    <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                      {(ownerInfo.firstName || ownerInfo.lastName) && (
                        <Typography variant="body1" gutterBottom>
                          <strong>نام و نام خانوادگی:</strong> {ownerInfo.firstName || ''} {ownerInfo.lastName || ''}
                        </Typography>
                      )}
                      {ownerInfo.phoneNumber && (
                        <Typography variant="body1">
                          <strong>شماره تماس:</strong> {toPersianNumber(ownerInfo.phoneNumber)}
                        </Typography>
                      )}
                      {ownerInfo.email && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          <strong>ایمیل:</strong> {ownerInfo.email}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </>
              )}
            </Box>
          ) : (
            <Alert severity="error">مشکلی در بارگذاری مشخصات وسیله نقلیه پیش آمد</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setVehicleDetailsDialog(false);
            setVehicleDetails(null);
            setOwnerInfo(null);
          }}>
            بستن
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default MyBookingsPage;






