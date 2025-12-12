import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  CheckCircle,
  Payment,
  Error,
} from '@mui/icons-material';
import { bookingService, paymentService } from '../services/api';

function PaymentPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(''); // PENDING, COMPLETED, FAILED

  const steps = ['Booking Created', 'Payment Processing', 'Confirmation'];
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    loadBookingDetails();
  }, [bookingId]);

  const loadBookingDetails = async () => {
    try {
      const response = await bookingService.getBookingById(bookingId);
      if (response.success) {
        setBooking(response.data);
        
        // If payment already completed, skip to confirmation
        if (response.data.paymentCompleted) {
          setActiveStep(2);
          setPaymentStatus('COMPLETED');
        }
      } else {
        setError('Booking not found');
      }
    } catch (err) {
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransaction = async () => {
    setProcessing(true);
    setError('');
    
    try {
      // Call Payment Gateway - Create Transaction
      const transactionRequest = {
        userId: user.id,
        bookingId: parseInt(bookingId),
        amount: booking.finalPrice,
        currency: 'USD',
        description: `Booking #${booking.bookingNumber}`,
        callbackUrl: `${window.location.origin}/payment/${bookingId}/callback`,
      };
      
      const response = await paymentService.createTransaction(transactionRequest);
      
      if (response.success) {
        const transaction = response.data;
        setTransactionId(transaction.transactionId);
        
        // If payment gateway provides a payment URL, redirect user
        if (transaction.paymentUrl) {
          window.location.href = transaction.paymentUrl;
        } else {
          // For testing, automatically verify after 2 seconds
          setTimeout(() => {
            handleVerifyTransaction(transaction.transactionId);
          }, 2000);
        }
      } else {
        setError('Failed to create payment transaction');
        setProcessing(false);
      }
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  const handleVerifyTransaction = async (txnId) => {
    try {
      // Call Payment Gateway - Verify Transaction
      const response = await paymentService.verifyTransaction(txnId || transactionId);
      
      if (response.success) {
        const transaction = response.data;
        
        if (transaction.status === 'COMPLETED') {
          setPaymentStatus('COMPLETED');
          setActiveStep(2);
          
          // Confirm the booking
          await bookingService.confirmBooking(bookingId);
        } else if (transaction.status === 'FAILED') {
          setPaymentStatus('FAILED');
          setError('Payment verification failed');
        } else {
          setPaymentStatus('PENDING');
        }
      } else {
        setError('Failed to verify payment');
        setPaymentStatus('FAILED');
      }
    } catch (err) {
      setError(err.message || 'Verification failed');
      setPaymentStatus('FAILED');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!booking) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">Booking not found</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Payment
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Booking Summary
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Booking Number:
            </Typography>
            <Typography variant="body1">{booking.bookingNumber}</Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Pickup:
            </Typography>
            <Typography variant="body1">{booking.pickupLocation}</Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Duration:
            </Typography>
            <Typography variant="body1">
              {new Date(booking.startDateTime).toLocaleString()} - 
              {new Date(booking.endDateTime).toLocaleString()}
            </Typography>
          </Box>

          {booking.withDriver && (
            <Box sx={{ mb: 2 }}>
              <Chip label="With Driver" color="secondary" size="small" />
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5">Total Amount:</Typography>
            <Typography variant="h5" color="primary">
              ${booking.finalPrice}
            </Typography>
          </Box>

          {/* Payment Status */}
          {paymentStatus === 'COMPLETED' ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Payment Successful!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Your booking has been confirmed. Transaction ID: {transactionId}
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/my-bookings')}
              >
                View My Bookings
              </Button>
            </Box>
          ) : paymentStatus === 'FAILED' ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Error sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Payment Failed
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {error || 'Please try again or use a different payment method.'}
              </Typography>
              <Button
                variant="contained"
                onClick={handleCreateTransaction}
              >
                Try Again
              </Button>
            </Box>
          ) : processing ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="body1">
                Processing your payment...
              </Typography>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Payment sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Ready to Pay
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Click below to proceed with secure payment
              </Typography>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleCreateTransaction}
                disabled={processing}
              >
                Pay ${booking.finalPrice}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}

export default PaymentPage;


