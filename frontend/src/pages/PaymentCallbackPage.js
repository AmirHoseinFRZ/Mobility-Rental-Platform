import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
} from '@mui/material';
import {
  CheckCircle,
  Error,
} from '@mui/icons-material';
import { bookingService, paymentService } from '../services/api';

function PaymentCallbackPage() {
  const { bookingId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'success', 'failed', 'pending'
  const [error, setError] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const hasVerifiedRef = useRef(false);

  useEffect(() => {
    // Only verify once, prevent duplicate calls (even in React Strict Mode)
    if (!hasVerifiedRef.current) {
      verifyPayment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]); // Only depend on bookingId, searchParams is checked inside verifyPayment

  const verifyPayment = async () => {
    // Prevent duplicate verification using ref (more reliable than state)
    if (hasVerifiedRef.current || verifying) {
      return;
    }
    
    hasVerifiedRef.current = true;
    setVerifying(true);
    setError('');
    
    try {
      // Get transactionId from URL params or localStorage
      let txnId = searchParams.get('transactionId') || searchParams.get('tid');
      
      // If not in URL, try to get from localStorage (stored before redirect)
      if (!txnId) {
        txnId = localStorage.getItem(`payment_transaction_${bookingId}`);
      }
      
      // If still not found, get booking to find transactionId
      if (!txnId) {
        const bookingResponse = await bookingService.getBookingById(bookingId);
        if (bookingResponse.success && bookingResponse.data.paymentTransactionId) {
          txnId = bookingResponse.data.paymentTransactionId;
        }
      }
      
      if (!txnId) {
        throw new Error('Transaction ID not found');
      }
      
      setTransactionId(txnId);
      
      // Call booking service to verify transaction
      const response = await paymentService.verifyTransaction(txnId);
      
      console.log('Verification response:', response);
      
      if (response) {
        // Check if this is an error response (API returns success: false on error)
        if (response.success === false) {
          // This is an error response from the API
          console.error('Error response from API:', response);
          setPaymentStatus('failed');
          setError(response.message || 'خطا در تایید پرداخت');
          return;
        }
        
        // Handle different response structures
        // For successful API calls, the transaction data might be in response.data or response itself
        const transactionData = response.data || response;
        const status = transactionData.status || transactionData.transactionStatus || response.status;
        
        if (status) {
          const statusUpper = String(status).toUpperCase();
          console.log('Payment status:', statusUpper);
          
          if (statusUpper === 'SUCCESS' || statusUpper === 'COMPLETED') {
            setPaymentStatus('success');
          } else if (statusUpper === 'FAILED' || statusUpper === 'CANCELED' || statusUpper === 'CANCELLED') {
            setPaymentStatus('failed');
            setError('پرداخت ناموفق بود');
          } else if (statusUpper === 'PENDING' || statusUpper === 'CREATED') {
            setPaymentStatus('pending');
          } else {
            // Unknown status
            console.warn('Unknown payment status:', statusUpper);
            setPaymentStatus('failed');
            setError(`وضعیت پرداخت نامشخص: ${statusUpper}`);
          }
        } else {
          console.error('No status found in response:', response);
          setPaymentStatus('failed');
          setError('وضعیت پرداخت در پاسخ یافت نشد');
        }
      } else {
        console.error('Empty response from verification');
        setPaymentStatus('failed');
        setError('تایید پرداخت ناموفق بود - پاسخ خالی است');
      }
      
      // Clean up localStorage
      localStorage.removeItem(`payment_transaction_${bookingId}`);
      
    } catch (err) {
      console.error('Payment verification error:', err);
      
      // If verification fails, check booking status as fallback
      // This handles cases where payment gateway inquiry fails but booking is already confirmed
      try {
        console.log('Checking booking status as fallback...');
        const bookingResponse = await bookingService.getBookingById(bookingId);
        
        if (bookingResponse && bookingResponse.success && bookingResponse.data) {
          const booking = bookingResponse.data;
          
          // If booking is confirmed and payment is completed, treat as success
          // Handle both string and enum formats, case-insensitive
          const bookingStatus = String(booking.status || '').toUpperCase();
          if (bookingStatus === 'CONFIRMED' && booking.paymentCompleted === true) {
            console.log('Booking is already confirmed with payment completed - showing success');
            setPaymentStatus('success');
            // Get transactionId from booking if we have it
            if (booking.paymentTransactionId) {
              setTransactionId(booking.paymentTransactionId);
            }
            // Clean up localStorage
            localStorage.removeItem(`payment_transaction_${bookingId}`);
            return; // Exit early, don't set error
          }
        }
      } catch (bookingCheckError) {
        console.error('Error checking booking status:', bookingCheckError);
        // Continue to show error if booking check also fails
      }
      
      // If error is an ApiResponse object from backend (has success, message, error properties)
      if (err && typeof err === 'object' && 'success' in err) {
        setPaymentStatus('failed');
        setError(err.message || 'خطا در تایید پرداخت');
      } else if (err && err.message) {
        // Regular error object
        setPaymentStatus('failed');
        setError(err.message);
      } else {
        // Unknown error format
        setPaymentStatus('failed');
        setError('خطا در تایید پرداخت. لطفاً دوباره تلاش کنید.');
      }
    } finally {
      setLoading(false);
      setVerifying(false);
    }
  };

  const handleViewBooking = () => {
    navigate(`/payment/${bookingId}`);
  };

  const handleViewMyBookings = () => {
    navigate('/my-bookings');
  };

  if (loading || verifying) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={60} />
          <Typography variant="h6">در حال تایید پرداخت...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card>
        <CardContent>
          {paymentStatus === 'success' ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
              <Typography variant="h4" gutterBottom color="success.main">
                پرداخت موفق!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                رزرو شما با موفقیت تایید شد.
              </Typography>
              {transactionId && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  شناسه تراکنش: {transactionId}
                </Typography>
              )}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleViewBooking}
                >
                  مشاهده رزرو
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleViewMyBookings}
                >
                  مشاهده همه رزروها
                </Button>
              </Box>
            </Box>
          ) : paymentStatus === 'failed' ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Error sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
              <Typography variant="h4" gutterBottom color="error.main">
                پرداخت ناموفق
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {error || 'پرداخت شما انجام نشد. لطفاً دوباره تلاش کنید.'}
              </Typography>
              {transactionId && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  شناسه تراکنش: {transactionId}
                </Typography>
              )}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleViewBooking}
                >
                  بازگشت به صفحه پرداخت
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleViewMyBookings}
                >
                  مشاهده رزروها
                </Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                در حال بررسی وضعیت پرداخت...
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}

export default PaymentCallbackPage; 