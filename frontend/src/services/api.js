import axios from 'axios';

// API Base URL - uses API Gateway
// IMPORTANT: Should point to API Gateway (port 8080), NOT directly to services (8082, 8083, etc.)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Payment Gateway Direct URL - bypasses API Gateway for certain payment operations
const PAYMENT_GATEWAY_URL = process.env.REACT_APP_PAYMENT_GATEWAY_URL || 'http://localhost:8089/api';

// Debug: Log the API URL being used (remove in production)
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 API Base URL:', API_BASE_URL);
  console.log('⚠️  If this shows port 8082, check your REACT_APP_API_URL environment variable!');
}

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Debug: Log the actual request URL
    if (process.env.NODE_ENV === 'development') {
      const fullUrl = config.baseURL + config.url;
      console.log('🌐 Making request to:', fullUrl);
      console.log('   Method:', config.method?.toUpperCase());
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// ==================== AUTH SERVICES ====================
export const authService = {
  register: (userData) => api.post('/api/users/register', userData),
  login: (credentials) => api.post('/api/users/login', credentials),
  getUserById: (id) => api.get(`/api/users/${id}`),
  updateProfile: (id, userData) => api.put(`/api/users/${id}`, userData),
};

// ==================== VEHICLE SERVICES ====================
export const vehicleService = {
  getAllVehicles: (params) => api.get('/api/vehicles/', { params }),
  getVehicleById: (id) => api.get(`/api/vehicles/${id}`),
  getAvailableVehicles: () => api.get('/api/vehicles/available'),
  searchByLocation: (searchData) => api.post('/api/vehicles/search/location', searchData),
  getNearestVehicles: (lat, lon, limit) => 
    api.get(`/api/vehicles/nearest?latitude=${lat}&longitude=${lon}&limit=${limit}`),
  createVehicle: (vehicleData) => api.post('/api/vehicles/', vehicleData),
  updateVehicle: (id, vehicleData) => api.put(`/api/vehicles/${id}`, vehicleData),
  deleteVehicle: (id) => api.delete(`/api/vehicles/${id}`),
  getVehiclesByOwner: (ownerId) => api.get(`/api/vehicles/owner/${ownerId}`),
};

// ==================== BOOKING SERVICES ====================
export const bookingService = {
  createBooking: (bookingData) => api.post('/api/bookings/', bookingData),
  getBookingById: (id) => api.get(`/api/bookings/${id}`),
  getUserBookings: (userId) => api.get(`/api/bookings/user/${userId}`),
  confirmBooking: (id) => api.patch(`/api/bookings/${id}/confirm`),
  startBooking: (id) => api.patch(`/api/bookings/${id}/start`),
  completeBooking: (id) => api.patch(`/api/bookings/${id}/complete`),
  cancelBooking: (id, reason) => api.patch(`/api/bookings/${id}/cancel?reason=${reason}`),
};

// ==================== PRICING SERVICES ====================
export const pricingService = {
  calculatePrice: (priceData) => api.post('/api/pricing/calculate', priceData),
  applyDiscount: (code) => api.post(`/api/pricing/apply-discount/${code}`),
};

// ==================== PAYMENT SERVICES ====================
// These go through API Gateway → Booking Service → Payment Gateway
export const paymentService = {
  // Create transaction (goes through API Gateway to Booking Service)
  createTransaction: (transactionData) => 
    api.post('/api/payments/transaction/create', transactionData),
  
  // Verify transaction status (goes through API Gateway to Booking Service)
  verifyTransaction: (transactionId) => 
    api.post(`/api/payments/transaction/verify?transactionId=${transactionId}`),
  
  // Get transaction status (goes through API Gateway to Booking Service)
  getTransactionStatus: (transactionId) =>
    api.get(`/api/payments/transaction/${transactionId}/status`),
};

// ==================== PAYMENT GATEWAY DIRECT SERVICES ====================
// These bypass API Gateway and call Payment Gateway directly
// No authentication required for these endpoints
export const paymentGatewayDirect = {
  // Get payment details with full response (recommended)
  getPaymentDetailsV2: (transactionId, gateway = 'sandbox') =>
    axios.post(`${PAYMENT_GATEWAY_URL}/pay/v2/${transactionId}?gateway=${gateway}`)
      .then(response => response.data),
  
  // Get simple payment link (alternative)
  getPaymentLink: (transactionId, gateway = 'sandbox') =>
    axios.post(`${PAYMENT_GATEWAY_URL}/pay/${transactionId}?gateway=${gateway}`)
      .then(response => response.data),
};

// ==================== DRIVER SERVICES ====================
export const driverService = {
  registerDriver: (driverData) => api.post('/api/drivers/', driverData),
  getDriverById: (id) => api.get(`/api/drivers/${id}`),
  getAvailableDrivers: () => api.get('/api/drivers/available'),
  findNearestDrivers: (lat, lon, limit) => 
    api.get(`/api/drivers/nearest?latitude=${lat}&longitude=${lon}&limit=${limit}`),
  updateLocation: (id, lat, lon) => 
    api.patch(`/api/drivers/${id}/location?latitude=${lat}&longitude=${lon}`),
  updateStatus: (id, status) => 
    api.patch(`/api/drivers/${id}/status?status=${status}`),
};

// ==================== REVIEW SERVICES ====================
export const reviewService = {
  createReview: (reviewData) => api.post('/api/reviews/', reviewData),
  getVehicleReviews: (vehicleId) => api.get(`/api/reviews/vehicle/${vehicleId}`),
  getDriverReviews: (driverId) => api.get(`/api/reviews/driver/${driverId}`),
  getVehicleRating: (vehicleId) => api.get(`/api/reviews/vehicle/${vehicleId}/rating`),
  getDriverRating: (driverId) => api.get(`/api/reviews/driver/${driverId}/rating`),
};

export default api;






