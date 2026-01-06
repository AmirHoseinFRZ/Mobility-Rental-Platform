import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Visibility,
  Search,
} from '@mui/icons-material';
import axios from 'axios';

function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchNumber, setSearchNumber] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);

  useEffect(() => {
    loadAllBookings();
  }, []);

  const loadAllBookings = async () => {
    try {
      setLoading(true);
      // Note: There's no endpoint to get all bookings directly
      // In a real scenario, you'd need to add this endpoint to the backend
      // For now, we'll show a message
      setError('This feature requires a backend endpoint to fetch all bookings');
      setBookings([]);
    } catch (err) {
      setError('Failed to load bookings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchByNumber = async () => {
    if (!searchNumber) {
      loadAllBookings();
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/bookings/number/${searchNumber}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.data?.success) {
        setBookings([response.data.data]);
        setError('');
      }
    } catch (err) {
      setError('Booking not found');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewBooking = (booking) => {
    setSelectedBooking(booking);
    setViewDialog(true);
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

  if (loading && bookings.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Bookings Management
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            label="Search by Booking Number"
            value={searchNumber}
            onChange={(e) => setSearchNumber(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearchByNumber()}
            size="small"
          />
          <Button
            variant="contained"
            onClick={handleSearchByNumber}
            startIcon={<Search />}
          >
            Search
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              setSearchNumber('');
              loadAllBookings();
            }}
          >
            Clear
          </Button>
        </Box>
      </Paper>

      {/* Bookings Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Booking Number</TableCell>
              <TableCell>User ID</TableCell>
              <TableCell>Vehicle ID</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Final Price</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <Typography color="text.secondary">
                    No bookings found. Use search to find a specific booking.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((booking) => (
                <TableRow key={booking.id} hover>
                  <TableCell>{booking.id}</TableCell>
                  <TableCell>{booking.bookingNumber}</TableCell>
                  <TableCell>{booking.userId}</TableCell>
                  <TableCell>{booking.vehicleId}</TableCell>
                  <TableCell>
                    {new Date(booking.startDateTime).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(booking.endDateTime).toLocaleDateString()}
                  </TableCell>
                  <TableCell>${booking.finalPrice}</TableCell>
                  <TableCell>
                    <Chip
                      label={booking.status}
                      color={getStatusColor(booking.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={booking.paymentCompleted ? 'Paid' : 'Pending'}
                      color={booking.paymentCompleted ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleViewBooking(booking)}
                    >
                      <Visibility />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* View Booking Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Booking Details</DialogTitle>
        <DialogContent>
          {selectedBooking && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" color="text.secondary">Booking Number:</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{selectedBooking.bookingNumber}</Typography>

              <Typography variant="body2" color="text.secondary">User ID:</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{selectedBooking.userId}</Typography>

              <Typography variant="body2" color="text.secondary">Vehicle ID:</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{selectedBooking.vehicleId}</Typography>

              <Typography variant="body2" color="text.secondary">Pickup Location:</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{selectedBooking.pickupLocation}</Typography>

              {selectedBooking.dropoffLocation && (
                <>
                  <Typography variant="body2" color="text.secondary">Dropoff Location:</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>{selectedBooking.dropoffLocation}</Typography>
                </>
              )}

              <Typography variant="body2" color="text.secondary">Start Date & Time:</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {new Date(selectedBooking.startDateTime).toLocaleString()}
              </Typography>

              <Typography variant="body2" color="text.secondary">End Date & Time:</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {new Date(selectedBooking.endDateTime).toLocaleString()}
              </Typography>

              <Typography variant="body2" color="text.secondary">Base Price:</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>${selectedBooking.basePrice}</Typography>

              {selectedBooking.discountAmount > 0 && (
                <>
                  <Typography variant="body2" color="text.secondary">Discount:</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>-${selectedBooking.discountAmount}</Typography>
                </>
              )}

              <Typography variant="body2" color="text.secondary">Final Price:</Typography>
              <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                ${selectedBooking.finalPrice}
              </Typography>

              <Typography variant="body2" color="text.secondary">With Driver:</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedBooking.withDriver ? 'Yes' : 'No'}
              </Typography>

              {selectedBooking.driverId && (
                <>
                  <Typography variant="body2" color="text.secondary">Driver ID:</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>{selectedBooking.driverId}</Typography>
                </>
              )}

              <Typography variant="body2" color="text.secondary">Status:</Typography>
              <Chip
                label={selectedBooking.status}
                color={getStatusColor(selectedBooking.status)}
                size="small"
                sx={{ mb: 2 }}
              />

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">Payment Status:</Typography>
                <Chip
                  label={selectedBooking.paymentCompleted ? 'Paid' : 'Pending'}
                  color={selectedBooking.paymentCompleted ? 'success' : 'warning'}
                  size="small"
                />
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Created At:
              </Typography>
              <Typography variant="body1">
                {new Date(selectedBooking.createdAt).toLocaleString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default AdminBookingsPage;






