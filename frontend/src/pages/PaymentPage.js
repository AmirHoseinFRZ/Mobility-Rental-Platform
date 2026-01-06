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
  Chip,
} from '@mui/material';
import {
  CheckCircle,
  Payment,
  Error,
} from '@mui/icons-material';
import { bookingService, paymentService, paymentGatewayDirect } from '../services/api';

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

  const steps = ['رزرو ایجاد شد', 'پردازش پرداخت', 'تایید'];
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
        
        // If booking has a transaction ID, set it
        if (response.data.paymentTransactionId) {
          setTransactionId(response.data.paymentTransactionId);
        }
      } else {
        setError('رزرو یافت نشد');
      }
    } catch (err) {
      setError('بارگذاری جزئیات رزرو ناموفق بود');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransaction = async () => {
    // Prevent creating transaction if payment is already completed
    if (paymentStatus === 'COMPLETED' || booking?.paymentCompleted) {
      console.warn('Payment already completed, cannot create new transaction');
      return;
    }
    
    // Prevent creating transaction if one already exists and is pending
    if (transactionId && paymentStatus !== 'FAILED') {
      console.warn('Transaction already exists, cannot create new transaction');
      return;
    }
    
    setProcessing(true);
    setError('');
    
    try {
      // Prepare transaction request according to PaymentTransactionRequest DTO
      // Amount should be in smallest currency unit (rials)
      // If booking.finalPrice is in tomans, multiply by 10 to get rials
      // Minimum amount is 1000 rials (100 tomans)
      const baseAmount = parseFloat(booking.finalPrice) || 0;
      const amountInRials = Math.round(baseAmount * 10);
      
      if (amountInRials < 1000) {
        throw new Error('مبلغ پرداخت باید حداقل ۱۰۰ تومان باشد');
      }
      
      const invoiceId = `BOOKING-${booking.bookingNumber || bookingId}`;
      
      const transactionRequest = {
        invoiceId: invoiceId, // Required: Invoice ID
        amount: amountInRials, // Required: Amount in smallest currency unit (rials), minimum 1000
        mobileNumber: user?.phoneNumber || user?.mobileNumber || null, // Optional
        email: user?.email || null, // Optional
        callbackUrl: `${window.location.origin}/payment/${bookingId}/callback`, // Required: Callback URL
        description: `Payment for booking #${booking.bookingNumber || bookingId}`, // Optional: Description
      };
      
      // Step 1: Create transaction through booking service
      // Response format: { transactionId, invoiceId, createdAt }
      const transaction = await paymentService.createTransaction(transactionRequest);
      const txnId = transaction.transactionId;
      
      if (!txnId) {
        throw new Error('Transaction ID not received from server');
      }
      
      setTransactionId(txnId);
      
      // Store transactionId in localStorage for callback page
      localStorage.setItem(`payment_transaction_${bookingId}`, txnId);
      
      // Step 2: Get payment details directly from payment gateway
      let paymentDetails;
      try {
        paymentDetails = await paymentGatewayDirect.getPaymentDetailsV2(txnId, 'sandbox');
      } catch (gatewayError) {
        console.error('Error getting payment details:', gatewayError);
        throw new Error('دریافت اطلاعات پرداخت ناموفق بود. لطفاً دوباره تلاش کنید.');
      }
      
      // paymentDetails contains: { payUrl, method, params, body }
      if (!paymentDetails || !paymentDetails.payUrl) {
        throw new Error('آدرس پرداخت دریافت نشد');
      }
      
      // Step 3: Redirect to payment URL
      const method = (paymentDetails.method || 'GET').toUpperCase();
      
      // For POST requests, create a form and submit it
      if (method === 'POST' && (paymentDetails.params || paymentDetails.body)) {
          const form = document.createElement('form');
          form.method = paymentDetails.method;
          form.action = paymentDetails.payUrl;
          
          // Add params as hidden inputs
          if (paymentDetails.params) {
            Object.entries(paymentDetails.params).forEach(([key, value]) => {
              const input = document.createElement('input');
              input.type = 'hidden';
              input.name = key;
              input.value = value;
              form.appendChild(input);
            });
          }
          
          // If body is provided and it's a form-encoded string, parse it
          if (paymentDetails.body && !paymentDetails.params) {
            const bodyParams = new URLSearchParams(paymentDetails.body);
            bodyParams.forEach((value, key) => {
              const input = document.createElement('input');
              input.type = 'hidden';
              input.name = key;
              input.value = value;
              form.appendChild(input);
            });
          }
          
          document.body.appendChild(form);
          form.submit();
        } else {
          // For GET requests, append params as query string parameters
          let finalUrl = paymentDetails.payUrl;
          if (paymentDetails.params && Object.keys(paymentDetails.params).length > 0) {
            const url = new URL(paymentDetails.payUrl);
            Object.entries(paymentDetails.params).forEach(([key, value]) => {
              url.searchParams.append(key, value);
            });
            finalUrl = url.toString();
          }
          window.location.href = finalUrl;
        }
    } catch (err) {
      setError(err.message || 'پرداخت ناموفق بود. لطفاً دوباره تلاش کنید.');
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
          setError('تایید پرداخت ناموفق بود');
        } else {
          setPaymentStatus('PENDING');
        }
      } else {
        setError('تایید پرداخت ناموفق بود');
        setPaymentStatus('FAILED');
      }
    } catch (err) {
      setError(err.message || 'تایید ناموفق بود');
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
        <Alert severity="error">رزرو یافت نشد</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        پرداخت
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
            خلاصه رزرو
          </Typography>
          
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              شماره رزرو:
            </Typography>
            <Typography variant="body1">{booking.bookingNumber}</Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              محل تحویل:
            </Typography>
            <Typography variant="body1">{booking.pickupLocation}</Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              مدت زمان:
            </Typography>
            <Typography variant="body1">
              {new Date(booking.startDateTime).toLocaleString('fa-IR')} - 
              {new Date(booking.endDateTime).toLocaleString('fa-IR')}
            </Typography>
          </Box>

          {booking.withDriver && (
            <Box sx={{ mb: 2 }}>
              <Chip label="با راننده" color="secondary" size="small" />
            </Box>
          )}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h5">مبلغ کل:</Typography>
            <Typography variant="h5" color="primary">
              {formatPrice(booking.finalPrice)} تومان
            </Typography>
          </Box>

          {/* Payment Status */}
          {paymentStatus === 'COMPLETED' ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                پرداخت موفق!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                رزرو شما تایید شد. شناسه تراکنش: {transactionId}
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate('/my-bookings')}
              >
                مشاهده رزروهای من
              </Button>
            </Box>
          ) : paymentStatus === 'FAILED' ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Error sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                پرداخت ناموفق
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {error || 'لطفاً دوباره تلاش کنید یا از روش پرداخت دیگری استفاده کنید.'}
              </Typography>
              <Button
                variant="contained"
                onClick={handleCreateTransaction}
              >
                تلاش دوباره
              </Button>
            </Box>
          ) : processing ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography variant="body1">
                در حال پردازش پرداخت شما...
              </Typography>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Payment sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                آماده پرداخت
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                برای ادامه پرداخت امن روی دکمه زیر کلیک کنید
              </Typography>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleCreateTransaction}
                disabled={processing}
              >
                پرداخت {formatPrice(booking.finalPrice)} تومان
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}

export default PaymentPage;






