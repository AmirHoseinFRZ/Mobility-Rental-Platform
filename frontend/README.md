# Mobility Rental Platform - React Frontend

## Overview

Modern, responsive React frontend application for the Mobility Rental Platform. Built with Material-UI for a beautiful and professional user experience.

## Features

### User Features
- ✅ **User Registration & Login** with JWT authentication
- ✅ **Location-Based Search** for vehicles (PostGIS powered)
- ✅ **Vehicle Details** with images, ratings, and specifications
- ✅ **Smart Booking System** with date/time selection
- ✅ **Dynamic Pricing** with real-time calculations
- ✅ **Discount Code** support
- ✅ **Driver Selection** for with-driver bookings
- ✅ **Payment Integration** with external payment gateway
  - Create transaction endpoint
  - Verify transaction endpoint
- ✅ **My Bookings** dashboard
- ✅ **Booking Lifecycle** (Pending → Confirmed → Ongoing → Completed)
- ✅ **Review System** for vehicles and drivers
- ✅ **Profile Management**
- ✅ **Responsive Design** (Mobile, Tablet, Desktop)

### Technical Features
- ✅ React 18
- ✅ Material-UI (MUI) v5
- ✅ React Router v6
- ✅ Axios for API calls
- ✅ Context API for state management
- ✅ Formik + Yup for form validation
- ✅ JWT token management
- ✅ Error handling and loading states
- ✅ Protected routes
- ✅ Responsive navigation
- ✅ Docker support

## Project Structure

```
frontend/
├── public/
│   ├── index.html              # HTML template
│   └── manifest.json            # PWA manifest
├── src/
│   ├── components/
│   │   ├── Navbar.js           # Navigation bar (desktop & mobile)
│   │   └── Footer.js           # Footer component
│   ├── context/
│   │   └── AuthContext.js      # Authentication state management
│   ├── pages/
│   │   ├── HomePage.js         # Landing page with search
│   │   ├── LoginPage.js        # User login
│   │   ├── RegisterPage.js     # User registration
│   │   ├── SearchPage.js       # Vehicle search with filters
│   │   ├── VehicleDetailsPage.js # Vehicle details & reviews
│   │   ├── BookingPage.js      # Booking form with pricing
│   │   ├── PaymentPage.js      # Payment gateway integration ⭐
│   │   ├── MyBookingsPage.js   # User's booking history
│   │   └── ProfilePage.js      # User profile management
│   ├── services/
│   │   └── api.js              # API service layer (all backend calls)
│   ├── App.js                  # Main app with routing
│   ├── index.js                # React entry point
│   └── index.css               # Global styles
├── package.json                # Dependencies
├── Dockerfile                  # Docker production build
├── nginx.conf                  # Nginx configuration
└── README.md                   # This file
```

## Prerequisites

- Node.js 18+
- npm or yarn
- Backend services running (or API Gateway at http://localhost:8080)

## Installation

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

Create a `.env` file from the example:

```bash
cp env.example .env
```

Edit `.env`:
```env
REACT_APP_API_URL=http://localhost:8080
```

### 3. Start Development Server

```bash
npm start
```

The app will open at http://localhost:3000

## Available Scripts

### `npm start`
Runs the app in development mode.
- Opens http://localhost:3000
- Hot reload enabled
- Proxies API requests to http://localhost:8080

### `npm run build`
Builds the app for production to the `build` folder.
- Optimized and minified
- Ready for deployment

### `npm test`
Launches the test runner.

## API Integration

The frontend connects to the backend via API Gateway at `http://localhost:8080`.

### API Services Implemented

All API calls go through `src/services/api.js`:

1. **Auth Service**
   - `register(userData)` - Register new user
   - `login(credentials)` - User login
   - `getUserById(id)` - Get user details

2. **Vehicle Service**
   - `getAllVehicles(params)` - Get all vehicles
   - `getVehicleById(id)` - Get vehicle details
   - `searchByLocation(searchData)` - **PostGIS location search**
   - `getNearestVehicles(lat, lon, limit)` - Find nearest vehicles

3. **Booking Service**
   - `createBooking(bookingData)` - Create new booking
   - `getUserBookings(userId)` - Get user's bookings
   - `confirmBooking(id)` - Confirm booking
   - `startBooking(id)` - Start booking
   - `completeBooking(id)` - Complete booking
   - `cancelBooking(id, reason)` - Cancel booking

4. **Pricing Service**
   - `calculatePrice(priceData)` - Calculate price with all factors
   - `applyDiscount(code)` - Apply discount code

5. **Payment Service** ⭐
   - `createTransaction(transactionData)` - Create payment transaction
   - `verifyTransaction(transactionId)` - Verify payment status

6. **Driver Service**
   - `findNearestDrivers(lat, lon, limit)` - Find nearest drivers
   - `getAvailableDrivers()` - Get all available drivers

7. **Review Service**
   - `createReview(reviewData)` - Submit review
   - `getVehicleReviews(vehicleId)` - Get vehicle reviews
   - `getVehicleRating(vehicleId)` - Get average rating

## Payment Gateway Integration

The frontend integrates with your existing payment gateway using two endpoints:

### 1. Create Transaction
```javascript
POST /api/payments/transaction/create
{
  "userId": 1,
  "bookingId": 123,
  "amount": 150.00,
  "currency": "USD",
  "description": "Booking #BK-12345678",
  "callbackUrl": "http://localhost:3000/payment/123/callback"
}

Response:
{
  "transactionId": "TXN-ABC123",
  "status": "PENDING",
  "paymentUrl": "https://payment-gateway.com/pay/TXN-ABC123"
}
```

### 2. Verify Transaction
```javascript
POST /api/payments/transaction/verify?transactionId=TXN-ABC123

Response:
{
  "transactionId": "TXN-ABC123",
  "status": "COMPLETED",
  "amount": 150.00
}
```

## User Flow

### Complete Booking Flow

1. **Home Page** → Search for vehicles
2. **Search Page** → Browse vehicles by location (PostGIS)
3. **Vehicle Details** → View specifications and reviews
4. **Booking Page** → 
   - Select dates
   - Choose with/without driver
   - Find nearest drivers (if with-driver)
   - Apply discount code
   - See real-time price calculation
5. **Payment Page** →
   - Create payment transaction
   - Redirect to payment gateway
   - Verify payment
   - Confirm booking
6. **My Bookings** → View and manage bookings
7. **Leave Review** → Rate vehicle/driver

## Responsive Design

The application is fully responsive and works on:
- 📱 **Mobile** (phones)
- 📱 **Tablet** (iPads)
- 💻 **Desktop** (laptops, monitors)
- 🖥️ **Large Screens** (4K displays)

### Breakpoints
- xs: 0px - 600px (Mobile)
- sm: 600px - 960px (Tablet)
- md: 960px - 1280px (Small Desktop)
- lg: 1280px - 1920px (Desktop)
- xl: 1920px+ (Large Desktop)

## Key Components

### Navigation
- **Navbar**: Responsive navigation with mobile drawer
  - Desktop: Full menu with user avatar
  - Mobile: Hamburger menu with drawer

### Pages

1. **HomePage**: Hero section, vehicle types, features, CTA
2. **LoginPage**: Formik-powered login with validation
3. **RegisterPage**: Multi-step registration form
4. **SearchPage**: Vehicle search with filters (PostGIS powered)
5. **VehicleDetailsPage**: Complete vehicle info with reviews
6. **BookingPage**: Booking form with price calculator & driver selection
7. **PaymentPage**: Payment gateway integration with transaction tracking ⭐
8. **MyBookingsPage**: Booking management with cancel & review
9. **ProfilePage**: User profile editing

## Docker Deployment

### Build Docker Image

```bash
cd frontend
docker build -t mobility-frontend .
```

### Run Container

```bash
docker run -p 80:80 \
  -e REACT_APP_API_URL=http://your-api-gateway-url \
  mobility-frontend
```

### Docker Compose Integration

The frontend can be added to the main `docker-compose.yml`:

```yaml
frontend:
  build:
    context: ./frontend
  ports:
    - "3000:80"
  environment:
    - REACT_APP_API_URL=http://api-gateway:8080
  depends_on:
    - api-gateway
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API Gateway URL | http://localhost:8080 |
| `REACT_APP_NAME` | Application name | Mobility Rental Platform |
| `REACT_APP_MAP_CENTER_LAT` | Default map center latitude | 40.7128 |
| `REACT_APP_MAP_CENTER_LNG` | Default map center longitude | -74.0060 |

## Authentication Flow

1. User registers/logs in
2. JWT token received from backend
3. Token stored in localStorage
4. Token automatically added to all API requests (via axios interceptor)
5. On 401 response, user redirected to login
6. Token persists across page refreshes

## Payment Integration Flow

1. User completes booking form
2. Frontend creates booking via Booking Service
3. User redirected to Payment Page
4. **Create Transaction** called on Payment Gateway
5. User redirected to Payment Gateway URL (if provided)
6. After payment, **Verify Transaction** called
7. If verified, booking confirmed
8. User can view booking in "My Bookings"

## Styling

- **Material-UI (MUI)** for components
- **Theme**: Customizable (primary: #1976d2, secondary: #dc004e)
- **Custom CSS**: index.css for global styles
- **Responsive**: Mobile-first approach

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development Tips

### Hot Reload
Changes to files automatically reload the browser.

### API Proxy
The `proxy` field in `package.json` proxies API calls during development:
```json
"proxy": "http://localhost:8080"
```

### Debug Mode
Open browser DevTools (F12) to see:
- Console logs
- Network requests
- React component tree

## Production Build

```bash
npm run build
```

Creates optimized build in `build/` folder:
- Minified JS/CSS
- Code splitting
- Asset optimization
- Source maps

## Troubleshooting

### CORS Issues
- Ensure API Gateway has CORS enabled
- Check `Access-Control-Allow-Origin` headers

### API Connection Failed
- Verify backend services are running
- Check `REACT_APP_API_URL` in `.env`
- Ensure API Gateway is accessible

### Build Errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear cache: `npm cache clean --force`

## Future Enhancements

- [ ] Real-time map integration (Leaflet)
- [ ] Push notifications
- [ ] Dark mode toggle
- [ ] Multi-language support
- [ ] PWA features (offline mode)
- [ ] Social login (Google, Facebook)
- [ ] Chat with driver
- [ ] Trip tracking (live location)

## License

[Specify License]

## Support

For issues or questions, please refer to the main project README.

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: December 2025





