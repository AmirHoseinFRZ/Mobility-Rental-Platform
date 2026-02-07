# Feign PATCH Method Fix

## Problem

When booking service tries to update vehicle status using Feign client with PATCH method, it throws:

```
feign.RetryableException: Invalid HTTP method: PATCH
Caused by: java.net.ProtocolException: Invalid HTTP method: PATCH
```

## Root Cause

Feign's default HTTP client (`HttpURLConnection`) doesn't support the PATCH HTTP method. This is a known limitation of Java's `HttpURLConnection`.

## Solution

Configure Feign to use **OkHttp** client instead, which fully supports PATCH and other HTTP methods.

## Changes Made

### 1. Added OkHttp Dependency

**File:** `backend/booking-service/pom.xml`

Added:
```xml
<!-- OkHttp for Feign (supports PATCH method) -->
<dependency>
    <groupId>io.github.openfeign</groupId>
    <artifactId>feign-okhttp</artifactId>
</dependency>
```

### 2. Created Feign Configuration

**File:** `backend/booking-service/src/main/java/com/mobility/platform/booking/config/FeignConfig.java`

Created a configuration class that registers OkHttp as the Feign client:

```java
@Configuration
public class FeignConfig {
    
    @Bean
    public Client feignClient() {
        OkHttpClient okHttpClient = new OkHttpClient.Builder()
                .connectTimeout(5, TimeUnit.SECONDS)
                .readTimeout(10, TimeUnit.SECONDS)
                .writeTimeout(10, TimeUnit.SECONDS)
                .build();
        
        return new feign.okhttp.OkHttpClient(okHttpClient);
    }
}
```

## How It Works

1. **Before:** Feign used `HttpURLConnection` (default) → doesn't support PATCH
2. **After:** Feign uses `OkHttpClient` → fully supports PATCH, PUT, DELETE, etc.

The `@Bean` method in `FeignConfig` automatically replaces the default Feign client with OkHttp client for all Feign clients in the application.

## Affected Endpoints

This fix resolves the error for:
- `VehicleClient.updateVehicleStatus()` - PATCH `/api/vehicles/{id}/status`
- Any other Feign clients using PATCH method

## Testing

After applying the fix:

1. **Restart booking service:**
   ```bash
   docker-compose restart booking-service
   # Or if running standalone:
   cd backend/booking-service
   ./mvnw spring-boot:run
   ```

2. **Create a booking** - The vehicle status update should now work without errors

3. **Check logs** - You should no longer see:
   ```
   Failed to update vehicle status
   feign.RetryableException: Invalid HTTP method: PATCH
   ```

## Alternative Solutions (Not Used)

### Option 1: Use PUT instead of PATCH
- Change `@PatchMapping` to `@PutMapping` in VehicleClient
- Requires changing the vehicle service endpoint as well
- Less RESTful for partial updates

### Option 2: Use Apache HttpClient
- Add `feign-httpclient` dependency
- Similar configuration to OkHttp
- OkHttp is more modern and lightweight

### Option 3: Use RestTemplate instead of Feign
- Would require rewriting the client
- Less convenient than Feign

## Benefits of OkHttp

1. ✅ **Full HTTP method support** - PATCH, PUT, DELETE, etc.
2. ✅ **Better performance** - More efficient than HttpURLConnection
3. ✅ **Connection pooling** - Reuses connections
4. ✅ **Modern and maintained** - Actively developed by Square
5. ✅ **Easy configuration** - Simple timeout and connection settings

## Dependencies

The `feign-okhttp` dependency is managed by Spring Cloud dependencies (version 2023.0.0), so no explicit version is needed in the pom.xml.

## Notes

- The configuration applies to **all** Feign clients in the booking service
- Timeout values can be adjusted in `FeignConfig` if needed
- OkHttp is thread-safe and can be shared across requests

## Verification

After restarting the service, verify the fix by checking:

1. **Booking creation works** without vehicle status update errors
2. **Logs show successful vehicle status updates:**
   ```
   Vehicle status updated successfully: BOOKED
   ```
3. **No more ProtocolException errors** in logs







