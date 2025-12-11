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
      setError('Failed to load bookings');
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
      setError('Failed to cancel booking');
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
        alert('Review submitted successfully!');
      }
    } catch (err) {
      setError('Failed to submit review');
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
        My Bookings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {bookings.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No bookings yet
          </Typography>
          <Button variant="contained" onClick={() => navigate('/search')}>
            Start Searching
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
                        Booking #{booking.bookingNumber}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Created: {new Date(booking.createdAt).toLocaleDateString()}
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
                        Pickup Location:
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {booking.pickupLocation}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        Start Time:
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {new Date(booking.startDateTime).toLocaleString()}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        End Time:
                      </Typography>
                      <Typography variant="body1">
                        {new Date(booking.endDateTime).toLocaleString()}
                      </Typography>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Total Price:</Typography>
                        <Typography variant="h6" color="primary">
                          ${booking.finalPrice}
                        </Typography>
                      </Box>

                      {booking.withDriver && (
                        <Chip label="With Driver" color="secondary" size="small" sx={{ mb: 1 }} />
                      )}

                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Payment Status:
                        </Typography>
                        <Chip
                          label={booking.paymentCompleted ? 'Paid' : 'Pending'}
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
                        Cancel Booking
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
                        Leave Review
                      </Button>
                    )}

                    {!booking.paymentCompleted && booking.status === 'PENDING' && (
                      <Button
                        variant="contained"
                        onClick={() => navigate(`/payment/${booking.id}`)}
                      >
                        Complete Payment
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
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Cancellation Reason (Optional)"
            multiline
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog(false)}>Close</Button>
          <Button variant="contained" color="error" onClick={handleCancelBooking}>
            Cancel Booking
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialog} onClose={() => setReviewDialog(false)}>
        <DialogTitle>Leave a Review</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              Rating:
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
            label="Your Review"
            multiline
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog(false)}>Close</Button>
          <Button variant="contained" onClick={handleSubmitReview}>
            Submit Review
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default MyBookingsPage;

