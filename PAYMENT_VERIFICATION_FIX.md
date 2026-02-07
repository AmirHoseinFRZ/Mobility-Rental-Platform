# Payment Verification Issues - Fixed

## Problems Identified

### 1. StaleObjectStateException (Backend)
**Error**: `org.hibernate.StaleObjectStateException: Row was updated or deleted by another transaction`

**Root Cause**: 
- The `Booking` entity extends `BaseEntity` which has a `@Version` field for optimistic locking
- When payment verification is called multiple times (e.g., user refreshes page, duplicate requests), multiple transactions try to update the same booking
- The second transaction fails because the version number has changed

### 2. Frontend Shows "Unsuccessful" (Frontend)
**Problem**: Even when payment is successful, the frontend displays "unsuccessful" message

**Root Cause**:
- When backend throws an exception (like StaleObjectStateException), it returns an `ApiResponse` with `success: false`
- The frontend was only checking for `response.status` or `response.transactionStatus`, but error responses don't have these fields
- The error response structure is:
  ```json
  {
    "success": false,
    "message": "Error message",
    "error": { "code": "ERROR_CODE" }
  }
  ```

## Solutions Implemented

### Backend Fixes

#### 1. Made Payment Verification Idempotent (`PaymentService.java`)

**Changes**:
- Added check to see if booking is already confirmed before updating
- Wrapped the save operation in a try-catch to handle `StaleObjectStateException`
- If concurrent update is detected, refresh the booking and check if it's already confirmed
- If already confirmed by another transaction, treat it as success (idempotent operation)

**Code**:
```java
@Transactional
public PaymentTransactionResponse verifyTransaction(String transactionId) {
    // ... find booking and inquire transaction ...
    
    if ("SUCCESS".equalsIgnoreCase(paymentStatus) || "COMPLETED".equalsIgnoreCase(paymentStatus)) {
        // Check if already confirmed (idempotent)
        if (booking.getStatus() == BookingStatus.CONFIRMED && booking.getPaymentCompleted()) {
            log.info("Booking {} is already confirmed, skipping update", booking.getId());
        } else if (booking.getStatus() == BookingStatus.PENDING) {
            booking.setStatus(BookingStatus.CONFIRMED);
            booking.setPaymentCompleted(true);
            try {
                bookingRepository.save(booking);
                log.info("Booking {} confirmed after successful payment verification", booking.getId());
            } catch (org.hibernate.StaleObjectStateException e) {
                // Refresh and check if confirmed by another transaction
                Booking refreshedBooking = bookingRepository.findById(booking.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", booking.getId()));
                
                if (refreshedBooking.getStatus() != BookingStatus.CONFIRMED) {
                    throw e; // Re-throw if not confirmed yet
                }
                log.info("Booking {} was confirmed by another transaction", booking.getId());
            }
        }
    }
    
    return transactionResponse;
}
```

#### 2. Added Exception Handlers (`GlobalExceptionHandler.java`)

**Changes**:
- Added handler for `StaleObjectStateException`
- Added handler for `OptimisticLockException`
- Both return HTTP 409 (Conflict) with a user-friendly message

**Code**:
```java
@ExceptionHandler(org.hibernate.StaleObjectStateException.class)
public ResponseEntity<ApiResponse<Void>> handleStaleObjectStateException(
        org.hibernate.StaleObjectStateException ex, WebRequest request) {
    log.error("Concurrent modification detected: {}", ex.getMessage());
    
    ErrorDetails errorDetails = ErrorDetails.builder()
            .code("CONCURRENT_MODIFICATION")
            .build();
    
    ApiResponse<Void> response = ApiResponse.error(
            "The resource was modified by another process. Please try again.", 
            errorDetails);
    return new ResponseEntity<>(response, HttpStatus.CONFLICT);
}

@ExceptionHandler(jakarta.persistence.OptimisticLockException.class)
public ResponseEntity<ApiResponse<Void>> handleOptimisticLockException(
        jakarta.persistence.OptimisticLockException ex, WebRequest request) {
    log.error("Optimistic locking failure: {}", ex.getMessage());
    
    ErrorDetails errorDetails = ErrorDetails.builder()
            .code("CONCURRENT_MODIFICATION")
            .build();
    
    ApiResponse<Void> response = ApiResponse.error(
            "The resource was modified by another process. Please try again.", 
            errorDetails);
    return new ResponseEntity<>(response, HttpStatus.CONFLICT);
}
```

### Frontend Fixes

#### 1. Handle Error Responses Properly (`PaymentCallbackPage.js`)

**Changes**:
- Check if response has `success: false` (indicates error from backend)
- Extract status from correct location in response structure
- Handle both success and error response formats

**Code**:
```javascript
const response = await paymentService.verifyTransaction(txnId);

if (response) {
  // Check if this is an error response (API returns success: false on error)
  if (response.success === false) {
    console.error('Error response from API:', response);
    setPaymentStatus('failed');
    setError(response.message || 'خطا در تایید پرداخت');
    return;
  }
  
  // Handle different response structures
  const transactionData = response.data || response;
  const status = transactionData.status || transactionData.transactionStatus || response.status;
  
  if (status) {
    const statusUpper = String(status).toUpperCase();
    
    if (statusUpper === 'SUCCESS' || statusUpper === 'COMPLETED') {
      setPaymentStatus('success');
    } else if (statusUpper === 'FAILED' || statusUpper === 'CANCELED' || statusUpper === 'CANCELLED') {
      setPaymentStatus('failed');
      setError('پرداخت ناموفق بود');
    }
    // ... other status checks
  }
}
```

#### 2. Better Error Handling in Catch Block

**Changes**:
- Check if error is an `ApiResponse` object (has `success` property)
- Extract error message from the correct location
- Provide fallback error messages

**Code**:
```javascript
catch (err) {
  console.error('Payment verification error:', err);
  
  // If error is an ApiResponse object from backend
  if (err && typeof err === 'object' && 'success' in err) {
    setPaymentStatus('failed');
    setError(err.message || 'خطا در تایید پرداخت');
  } else if (err && err.message) {
    setPaymentStatus('failed');
    setError(err.message);
  } else {
    setPaymentStatus('failed');
    setError('خطا در تایید پرداخت. لطفاً دوباره تلاش کنید.');
  }
}
```

## Testing Recommendations

### Test Scenarios

1. **Normal Payment Flow**
   - Create booking → Pay → Verify → Should show success

2. **Duplicate Verification**
   - Verify payment → Refresh page → Verify again → Should still show success (no error)

3. **Concurrent Verification**
   - Open payment callback in two tabs → Both verify simultaneously → Both should succeed

4. **Failed Payment**
   - Cancel payment on gateway → Return to callback → Should show failure message

5. **Network Error**
   - Disconnect network → Try to verify → Should show appropriate error message

### Expected Results

- ✅ No more `StaleObjectStateException` errors
- ✅ Frontend correctly shows success when payment is verified
- ✅ Idempotent verification - multiple calls don't cause errors
- ✅ Clear error messages for users
- ✅ Proper handling of concurrent updates

## Files Modified

### Backend
1. `/backend/booking-service/src/main/java/com/mobility/platform/booking/service/PaymentService.java`
   - Made `verifyTransaction` method idempotent
   - Added handling for concurrent updates

2. `/backend/common-lib/src/main/java/com/mobility/platform/common/exception/GlobalExceptionHandler.java`
   - Added `StaleObjectStateException` handler
   - Added `OptimisticLockException` handler

### Frontend
1. `/frontend/src/pages/PaymentCallbackPage.js`
   - Fixed response structure handling
   - Improved error handling in catch block
   - Added check for `success: false` responses

## Additional Notes

### Why Optimistic Locking?

The `BaseEntity` class includes a `@Version` field:
```java
@Version
private Long version;
```

This enables optimistic locking, which prevents lost updates when multiple transactions modify the same entity. However, it requires proper handling of concurrent modifications.

### Why Idempotency Matters

In payment systems, idempotency is crucial because:
- Users might refresh the callback page
- Network issues might cause retries
- Multiple browser tabs might be open
- Payment gateways might send duplicate webhooks

Our solution ensures that verifying the same successful payment multiple times:
1. Doesn't throw errors
2. Doesn't corrupt data
3. Returns consistent results

## Deployment Steps

1. **Backend**: Rebuild and restart booking-service
   ```bash
   cd backend/booking-service
   mvn clean package
   # Restart the service
   ```

2. **Frontend**: Rebuild React app
   ```bash
   cd frontend
   npm run build
   # Restart the frontend server
   ```

3. **Test**: Run through all test scenarios above

## Monitoring

After deployment, monitor for:
- Reduced occurrence of `StaleObjectStateException` in logs
- Successful payment verifications even with page refreshes
- User feedback on payment success/failure messages





