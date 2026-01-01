import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  DirectionsCar,
} from '@mui/icons-material';
import { vehicleService } from '../services/api';

function MyVehiclesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMyVehicles();
  }, [user]);

  const loadMyVehicles = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await vehicleService.getVehiclesByOwner(user.id);
      setVehicles(response.data || []);
    } catch (err) {
      setError('Failed to load your vehicles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) {
      return;
    }

    try {
      await vehicleService.deleteVehicle(vehicleId);
      setVehicles(vehicles.filter(v => v.id !== vehicleId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete vehicle');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'success';
      case 'BOOKED': return 'warning';
      case 'IN_USE': return 'info';
      case 'MAINTENANCE': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <DirectionsCar sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            My Vehicles
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/add-vehicle')}
          size="large"
        >
          Add Vehicle
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {vehicles.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <DirectionsCar sx={{ fontSize: 100, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No vehicles listed yet
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Start earning by listing your vehicle for rent
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/add-vehicle')}
            size="large"
          >
            Add Your First Vehicle
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {vehicles.map((vehicle) => (
            <Grid item xs={12} sm={6} md={4} key={vehicle.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={vehicle.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h6" component="div">
                    {vehicle.brand} {vehicle.model}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {vehicle.year} • {vehicle.vehicleType}
                  </Typography>
                  
                  <Box sx={{ mt: 1, mb: 2 }}>
                    <Chip 
                      label={vehicle.status} 
                      color={getStatusColor(vehicle.status)} 
                      size="small" 
                      sx={{ mr: 1 }}
                    />
                    <Chip 
                      label={vehicle.transmission} 
                      size="small" 
                      variant="outlined"
                    />
                  </Box>

                  <Typography variant="body1" sx={{ fontWeight: 'bold', mt: 2 }}>
                    ${vehicle.pricePerHour}/hr • ${vehicle.pricePerDay}/day
                  </Typography>

                  {vehicle.rating > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      ⭐ {vehicle.rating.toFixed(1)} ({vehicle.totalReviews} reviews)
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Button 
                    size="small" 
                    startIcon={<Edit />}
                    onClick={() => navigate(`/edit-vehicle/${vehicle.id}`)}
                  >
                    Edit
                  </Button>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => handleDelete(vehicle.id)}
                  >
                    <Delete />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}

export default MyVehiclesPage;

