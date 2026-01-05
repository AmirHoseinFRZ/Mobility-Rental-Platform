# Frontend User Guide

## 🚀 How to Access and Use All Features

This guide explains how to access and use all the features in the Mobility Rental Platform frontend.

---

## 📱 For Regular Users

### 1. **Getting Started**
- Visit the homepage at `http://localhost:3000`
- Click "Sign Up" to create a new account
- Or click "Login" if you already have an account

### 2. **Searching for Vehicles**
- From homepage, enter your location in the search box OR click "Search Vehicles" in navbar
- Use filters:
  - **Location**: Enter latitude/longitude or use "Get Current Location"
  - **Radius**: Set search radius in kilometers
  - **Vehicle Type**: Filter by CAR, BIKE, SCOOTER, etc.
  - **With Driver**: Choose vehicles with/without driver option
- Click "Search" to see available vehicles

### 3. **Viewing Vehicle Details**
- Click "View Details" on any vehicle card
- See complete information:
  - Specifications (seats, fuel, transmission)
  - Pricing (per hour and per day)
  - Customer reviews and ratings
  - Location and availability

### 4. **Making a Booking**
- Click "Book Now" on vehicle details page
- Fill in booking details:
  - Start and end date/time
  - Pickup location (required)
  - Dropoff location (optional)
  - Toggle "Book with Driver" if available
  - Select from nearest available drivers
  - Add special requests
  - Enter discount code (if you have one)
- See real-time price calculation
- Click "Proceed to Payment"

### 5. **Completing Payment**
- Review booking summary
- Click "Pay $XXX" to process payment
- Wait for payment verification
- Once successful, booking is confirmed
- Click "View My Bookings" to see your reservation

### 6. **Managing Your Bookings**
- Click "My Bookings" in navbar
- See all your bookings with status:
  - **PENDING**: Waiting for confirmation
  - **CONFIRMED**: Payment completed
  - **ONGOING**: Trip in progress
  - **COMPLETED**: Trip finished
  - **CANCELLED**: Booking cancelled
- Actions available:
  - **Cancel Booking**: For PENDING bookings
  - **Complete Payment**: If payment is pending
  - **Leave Review**: For COMPLETED bookings

### 7. **Managing Your Profile**
- Click on your avatar → "Profile"
- View account information
- Click "Edit" to update details
- Save changes when done

---

## 🚗 For Vehicle Owners

### 1. **Adding Your Vehicle**
- Click "My Vehicles" in navbar
- Click "Add Vehicle" button
- Fill in all required information:
  - **Basic Info**: Vehicle number, brand, model, year, type
  - **Specifications**: Seating, fuel type, transmission
  - **Pricing**: Set hourly and daily rates
  - **Location**: Current city and address
  - **Additional**: Upload image, add description and features
- Click "Add Vehicle" to submit

### 2. **Managing Your Vehicles**
- Access via "My Vehicles" in navbar
- See all your listed vehicles
- Each vehicle shows:
  - Current status (Available, Booked, Maintenance, etc.)
  - Pricing information
  - Location
  - Rating and reviews
- Actions:
  - **Edit**: Update vehicle information
  - **Delete**: Remove vehicle from platform

### 3. **Editing a Vehicle**
- Click "Edit" button on any vehicle card
- Update any information:
  - Change status (Available, Maintenance, Inactive, etc.)
  - Update pricing
  - Modify location
  - Edit descriptions and features
- Click "Update Vehicle" to save

---

## 🚕 For Drivers

### 1. **Becoming a Driver**
- Click "Become a Driver" in navbar (when logged in)
- Fill in driver registration form:
  - License number and expiry date
  - Preferred vehicle type
  - Years of experience
  - Current location (click "Get Current Location")
- Click "Register as Driver"

### 2. **Driver Dashboard**
- Access via "Driver Dashboard" in navbar
- View your driver profile:
  - License information
  - Experience and rating
  - Total trips and earnings
  - Current status

### 3. **Managing Your Availability**
- **Update Status**:
  - Available: Ready to accept bookings
  - Busy: Currently on a trip
  - Offline: Not available
- Select status from dropdown
- Click "Update Status"

### 4. **Updating Your Location**
- Click "Get Current Location" for automatic detection
- Or manually enter latitude/longitude
- Click "Update Location"
- This helps the system assign you to nearby bookings

---

## 👨‍💼 For Administrators

### 1. **Accessing Admin Panel**
- Click on your avatar → "Admin Panel"
- Or visit `/admin` directly
- See platform statistics dashboard:
  - Total users
  - Total vehicles
  - Active bookings
  - Revenue

### 2. **User Management**
- Click "Users" tab or navigate to `/admin/users`
- Features:
  - View all users with pagination
  - Search user by email
  - View user details (click eye icon)
  - Deactivate users (click delete icon)
- **Search**: Enter email and click "Search"
- **Clear**: Reset search results
- **View Details**: Click eye icon for full user information

### 3. **Vehicle Management**
- Click "Vehicles" tab or navigate to `/admin/vehicles`
- Features:
  - View all vehicles with pagination
  - Search by vehicle number
  - View vehicle details
  - Update vehicle status
  - Delete vehicles
- **Update Status**:
  - Click edit icon on vehicle
  - Select new status
  - Click "Update"
- **Search**: Enter vehicle number and click "Search"

### 4. **Booking Management**
- Click "Bookings" tab or navigate to `/admin/bookings`
- Features:
  - Search bookings by booking number
  - View booking details
  - Check payment status
  - Monitor booking lifecycle
- **Search**: Enter booking number and click "Search"
- **View Details**: Click eye icon for complete booking information

---

## 🔍 Quick Access Features

### Navbar Shortcuts (When Logged In)
- **My Bookings**: View and manage your reservations
- **My Vehicles**: List and manage your vehicles
- **Become a Driver**: Register as a professional driver
- **Add Vehicle**: Quick link to list a new vehicle
- **Driver Dashboard**: Access driver control panel (for registered drivers)
- **Admin Panel**: Access admin dashboard (for administrators)

### Mobile Navigation
- On mobile devices, click the menu icon (☰) to open drawer
- All features available in mobile menu
- Responsive design works on all screen sizes

---

## 💡 Tips & Best Practices

### For Users:
1. **Use Geolocation**: Click "Get Current Location" for accurate searches
2. **Book in Advance**: Reserve vehicles ahead of time for better availability
3. **Use Discount Codes**: Apply promotional codes to save money
4. **Leave Reviews**: Help others by rating completed bookings
5. **Check Driver Ratings**: When booking with a driver, check their rating and experience

### For Vehicle Owners:
1. **Keep Status Updated**: Mark vehicles as "Maintenance" when unavailable
2. **Competitive Pricing**: Set reasonable hourly and daily rates
3. **Quality Photos**: Use clear images to attract more customers
4. **Detailed Descriptions**: Include all features and specifications
5. **Accurate Location**: Keep vehicle location up-to-date

### For Drivers:
1. **Update Location Regularly**: Enable real-time location for better bookings
2. **Stay Available**: Keep status "Available" when ready for trips
3. **Maintain Rating**: Provide excellent service to maintain high ratings
4. **Quick Response**: Accept bookings promptly

### For Admins:
1. **Regular Monitoring**: Check dashboard statistics daily
2. **User Verification**: Review and verify new user registrations
3. **Quality Control**: Monitor vehicle listings for quality
4. **Issue Resolution**: Address booking issues promptly

---

## 🎯 Common Workflows

### Booking a Vehicle with Driver
1. Search for vehicles
2. Filter by "With Driver: Yes"
3. Select vehicle
4. Click "Book Now"
5. Toggle "Book with Driver"
6. Choose from available nearby drivers
7. Complete booking details
8. Proceed to payment

### Listing Your First Vehicle
1. Login to your account
2. Click "Add Vehicle"
3. Fill in all required fields
4. Add attractive photo URL
5. Set competitive pricing
6. Submit and wait for approval

### Starting as a Driver
1. Register as a driver (one-time)
2. Access Driver Dashboard
3. Update your location
4. Set status to "Available"
5. Wait for booking assignments
6. Update status to "Busy" when on trip

### Managing Platform (Admin)
1. Access Admin Panel
2. Review daily statistics
3. Check new user registrations
4. Verify new vehicle listings
5. Monitor active bookings
6. Handle support requests

---

## 🆘 Troubleshooting

### Can't find vehicles?
- Increase search radius
- Check if filters are too restrictive
- Try different location
- Use "Get Current Location"

### Payment failed?
- Check internet connection
- Try again after a few minutes
- Verify booking details
- Contact support if issue persists

### Can't update vehicle status?
- Ensure you're logged in
- Verify you're the vehicle owner
- Check internet connection
- Refresh the page

### Driver dashboard not showing?
- Make sure you've registered as a driver
- Check if registration was successful
- Login again
- Contact admin if issue persists

---

## 📞 Support

For any issues or questions:
- Check this user guide
- Review the FAQ section
- Contact platform administrator
- Report bugs through admin panel

---

## 🎉 Getting the Most Out of the Platform

1. **Complete Your Profile**: Add all details for better trust
2. **Verify Your Account**: Complete KYC verification
3. **Explore Features**: Try all available features
4. **Stay Updated**: Check for new features and updates
5. **Provide Feedback**: Help us improve the platform

---

**Happy Renting! 🚗🏍️🛴**





