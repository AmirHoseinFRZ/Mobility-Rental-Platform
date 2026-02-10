import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
} from '@mui/material';
import {
  Close,
  Person,
  Phone,
  Email,
  CalendarToday,
  LocationOn,
  Payment,
  AttachMoney,
} from '@mui/icons-material';
import { bookingService } from '../services/api';

// Convert English numbers to Persian
const toPersianNumber = (num) => {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  return String(num).replace(/\d/g, (digit) => persianDigits[digit]);
};

// Format price with Persian numbers and thousand separators
const formatPrice = (amount) => {
  if (!amount) return '۰';
  const formatted = Math.round(parseFloat(amount)).toLocaleString('en-US');
  return toPersianNumber(formatted);
};

// Format date to Persian
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  const formatted = date.toLocaleDateString('fa-IR', options);
  return formatted;
};

// Get status color and label
const getStatusInfo = (status) => {
  const statusMap = {
    'PENDING': { color: 'warning', label: 'در انتظار تایید' },
    'CONFIRMED': { color: 'success', label: 'تایید شده' },
    'ONGOING': { color: 'info', label: 'در حال انجام' },
    'COMPLETED': { color: 'success', label: 'تکمیل شده' },
    'CANCELLED': { color: 'error', label: 'لغو شده' },
  };
  return statusMap[status] || { color: 'default', label: status };
};

function VehicleBookingsDialog({ open, onClose, vehicle }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && vehicle) {
      loadBookings();
    }
  }, [open, vehicle]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await bookingService.getVehicleBookings(vehicle.id);
      console.log('Bookings response:', response);
      const list = response.data || [];
      // Sort from newest to oldest by createdAt
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setBookings(list);
    } catch (err) {
      console.error('Error loading bookings:', err);
      setError('بارگذاری رزروها ناموفق بود');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '400px' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CalendarToday sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">
            رزروهای {vehicle?.brand} {vehicle?.model}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : bookings.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CalendarToday sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              هنوز رزروی ثبت نشده
            </Typography>
            <Typography variant="body2" color="text.secondary">
              این وسیله نقلیه هنوز رزرو نشده است
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {bookings.map((booking) => {
              const statusInfo = getStatusInfo(booking.status);
              return (
                <Card key={booking.id} variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    {/* Header with booking number and status */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                        شماره رزرو: {booking.bookingNumber}
                      </Typography>
                      <Chip 
                        label={statusInfo.label} 
                        color={statusInfo.color} 
                        size="small"
                      />
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    {/* Customer Information */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
                        اطلاعات مشتری:
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Person sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {booking.userFirstName} {booking.userLastName}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Phone sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography variant="body2" dir="ltr" sx={{ textAlign: 'right' }}>
                              {booking.userPhoneNumber || '-'}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Email sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography variant="body2" dir="ltr" sx={{ textAlign: 'right' }}>
                              {booking.userEmail || '-'}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    {/* Booking Details */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
                        جزئیات رزرو:
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            شروع:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {formatDate(booking.startDateTime)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2" color="text.secondary">
                            پایان:
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {formatDate(booking.endDateTime)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            <LocationOn sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              {booking.pickupLocation}
                            </Typography>
                          </Box>
                        </Grid>
                        {booking.dropoffLocation && (
                          <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <LocationOn sx={{ fontSize: 18, color: 'error.main' }} />
                              <Typography variant="body2">
                                {booking.dropoffLocation}
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    {/* Payment Information */}
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
                        اطلاعات پرداخت:
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AttachMoney sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              مبلغ کل: {formatPrice(booking.finalPrice)} تومان
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Payment sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Chip 
                              label={booking.paymentCompleted ? 'پرداخت شده' : 'پرداخت نشده'}
                              color={booking.paymentCompleted ? 'success' : 'warning'}
                              size="small"
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>

                    {/* Special Requests */}
                    {booking.specialRequests && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
                            درخواست‌های ویژه:
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {booking.specialRequests}
                          </Typography>
                        </Box>
                      </>
                    )}

                    {/* Cancellation Info */}
                    {booking.status === 'CANCELLED' && booking.cancellationReason && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1, color: 'error.main' }}>
                            دلیل لغو:
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {booking.cancellationReason}
                          </Typography>
                        </Box>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained">
          بستن
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default VehicleBookingsDialog;

