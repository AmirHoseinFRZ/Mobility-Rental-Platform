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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TablePagination,
} from '@mui/material';
import {
  Delete,
  Visibility,
  Edit,
  Search,
} from '@mui/icons-material';
import { vehicleService } from '../services/api';
import axios from 'axios';

function AdminVehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchNumber, setSearchNumber] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);
  const [statusDialog, setStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    loadVehicles();
  }, [page, rowsPerPage]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/vehicles`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          params: {
            page: page,
            size: rowsPerPage,
          },
        }
      );

      if (response.data?.success) {
        setVehicles(response.data.data?.content || []);
      }
    } catch (err) {
      setError('Failed to load vehicles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchByNumber = async () => {
    if (!searchNumber) {
      loadVehicles();
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/vehicles/number/${searchNumber}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.data?.success) {
        setVehicles([response.data.data]);
      }
    } catch (err) {
      setError('Vehicle not found');
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) {
      return;
    }

    try {
      await vehicleService.deleteVehicle(vehicleId);
      loadVehicles();
    } catch (err) {
      setError('Failed to delete vehicle');
    }
  };

  const handleViewVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setViewDialog(true);
  };

  const handleOpenStatusDialog = (vehicle) => {
    setSelectedVehicle(vehicle);
    setNewStatus(vehicle.status);
    setStatusDialog(true);
  };

  const handleUpdateStatus = async () => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/vehicles/${selectedVehicle.id}/status`,
        null,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          params: {
            status: newStatus,
          },
        }
      );
      setStatusDialog(false);
      loadVehicles();
    } catch (err) {
      setError('Failed to update vehicle status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'success';
      case 'BOOKED': return 'warning';
      case 'IN_USE': return 'info';
      case 'MAINTENANCE': return 'error';
      case 'INACTIVE': return 'default';
      default: return 'default';
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading && vehicles.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Vehicle Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Search Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            label="Search by Vehicle Number"
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
              loadVehicles();
            }}
          >
            Clear
          </Button>
        </Box>
      </Paper>

      {/* Vehicles Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Vehicle Number</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Brand/Model</TableCell>
              <TableCell>Year</TableCell>
              <TableCell>Price/Hour</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Owner ID</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vehicles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography color="text.secondary">No vehicles found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              vehicles.map((vehicle) => (
                <TableRow key={vehicle.id} hover>
                  <TableCell>{vehicle.id}</TableCell>
                  <TableCell>{vehicle.vehicleNumber}</TableCell>
                  <TableCell>
                    <Chip label={vehicle.vehicleType} size="small" />
                  </TableCell>
                  <TableCell>{vehicle.brand} {vehicle.model}</TableCell>
                  <TableCell>{vehicle.year}</TableCell>
                  <TableCell>${vehicle.pricePerHour}</TableCell>
                  <TableCell>
                    <Chip
                      label={vehicle.status}
                      color={getStatusColor(vehicle.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{vehicle.ownerId}</TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleViewVehicle(vehicle)}
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="info"
                      onClick={() => handleOpenStatusDialog(vehicle)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteVehicle(vehicle.id)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={-1}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </TableContainer>

      {/* View Vehicle Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Vehicle Details</DialogTitle>
        <DialogContent>
          {selectedVehicle && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" color="text.secondary">Vehicle ID:</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{selectedVehicle.id}</Typography>

              <Typography variant="body2" color="text.secondary">Vehicle Number:</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{selectedVehicle.vehicleNumber}</Typography>

              <Typography variant="body2" color="text.secondary">Type:</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{selectedVehicle.vehicleType}</Typography>

              <Typography variant="body2" color="text.secondary">Brand & Model:</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.year})
              </Typography>

              <Typography variant="body2" color="text.secondary">Seating Capacity:</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{selectedVehicle.seatingCapacity}</Typography>

              <Typography variant="body2" color="text.secondary">Fuel Type:</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{selectedVehicle.fuelType}</Typography>

              <Typography variant="body2" color="text.secondary">Transmission:</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{selectedVehicle.transmission}</Typography>

              <Typography variant="body2" color="text.secondary">Pricing:</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                ${selectedVehicle.pricePerHour}/hour • ${selectedVehicle.pricePerDay}/day
              </Typography>

              <Typography variant="body2" color="text.secondary">Location:</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedVehicle.currentCity || 'Not specified'}
                {selectedVehicle.currentAddress && ` - ${selectedVehicle.currentAddress}`}
              </Typography>

              <Typography variant="body2" color="text.secondary">Status:</Typography>
              <Chip
                label={selectedVehicle.status}
                color={getStatusColor(selectedVehicle.status)}
                size="small"
                sx={{ mb: 2 }}
              />

              {selectedVehicle.description && (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Description:
                  </Typography>
                  <Typography variant="body1">{selectedVehicle.description}</Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={statusDialog} onClose={() => setStatusDialog(false)}>
        <DialogTitle>Update Vehicle Status</DialogTitle>
        <DialogContent sx={{ pt: 2, minWidth: 300 }}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={newStatus}
              label="Status"
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <MenuItem value="AVAILABLE">Available</MenuItem>
              <MenuItem value="BOOKED">Booked</MenuItem>
              <MenuItem value="IN_USE">In Use</MenuItem>
              <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
              <MenuItem value="INACTIVE">Inactive</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateStatus}>
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default AdminVehiclesPage;









