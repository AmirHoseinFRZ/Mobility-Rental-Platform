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
} from '@mui/material';
import { bookingService, reviewService } from '../services/api';

function MyBookingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Cancel dialog
  const [cancelDialog, setCancelDialog] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  
  // Review dialog
  const [reviewDialog, setReviewDialog] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    loadBookings();
  }, [user]);

  const loadBookings = async () => {
    try {
      const response = await bookingService.getUserBookings(user.id);
      if (response.success) {
        setBookings(response.data || []);
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
                        رزرو #{booking.bookingNumber}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ایجاد شده: {new Date(booking.createdAt).toLocaleDateString('fa-IR')}
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
                        {new Date(booking.startDateTime).toLocaleString('fa-IR')}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        زمان پایان:
                      </Typography>
                      <Typography variant="body1">
                        {new Date(booking.endDateTime).toLocaleString('fa-IR')}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">قیمت کل:</Typography>
                        <Typography variant="h6" color="primary">
                          ${booking.finalPrice}
                        </Typography>
                      </Box>

                      {booking.withDriver && (
                        <Chip label="با راننده" color="secondary" size="small" sx={{ mb: 1 }} />
                      )}

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
                    </Grid>
                  </Grid>

                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
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

                    {!booking.paymentCompleted && booking.status === 'PENDING' && (
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
    </Container>
  );
}

export default MyBookingsPage;






