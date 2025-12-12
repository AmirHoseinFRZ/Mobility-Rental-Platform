import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
} from '@mui/material';
import {
  DirectionsCar,
  TwoWheeler,
  ElectricScooter,
  Search,
} from '@mui/icons-material';

function HomePage() {
  const navigate = useNavigate();
  const [searchLocation, setSearchLocation] = useState('');

  const handleSearch = () => {
    if (searchLocation.trim()) {
      navigate(`/search?location=${encodeURIComponent(searchLocation)}`);
    } else {
      navigate('/search');
    }
  };

  const vehicleTypes = [
    { name: 'Cars', icon: <DirectionsCar fontSize="large" />, type: 'CAR' },
    { name: 'Motorcycles', icon: <TwoWheeler fontSize="large" />, type: 'BIKE' },
    { name: 'Scooters', icon: <ElectricScooter fontSize="large" />, type: 'SCOOTER' },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 10,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
                Rent Mobility Made Easy
              </Typography>
              <Typography variant="h5" gutterBottom>
                Choose from cars, bikes, and scooters. With or without a driver.
              </Typography>
              <Box sx={{ mt: 4 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Enter your location..."
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  sx={{
                    backgroundColor: 'white',
                    borderRadius: 1,
                    mb: 2,
                  }}
                  InputProps={{
                    endAdornment: (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSearch}
                        startIcon={<Search />}
                      >
                        Search
                      </Button>
                    ),
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Vehicle Types Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" align="center" gutterBottom>
          Choose Your Ride
        </Typography>
        <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 6 }}>
          Select from our wide range of vehicles
        </Typography>

        <Grid container spacing={4}>
          {vehicleTypes.map((vehicle) => (
            <Grid item xs={12} sm={6} md={4} key={vehicle.type}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: 6,
                  },
                }}
                onClick={() => navigate(`/search?type=${vehicle.type}`)}
              >
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>{vehicle.icon}</Box>
                  <Typography variant="h5" component="h3">
                    {vehicle.name}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Features Section */}
      <Box sx={{ bgcolor: 'grey.100', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" gutterBottom>
            Why Choose Us?
          </Typography>
          <Grid container spacing={4} sx={{ mt: 2 }}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom>
                  🚗 Wide Selection
                </Typography>
                <Typography color="text.secondary">
                  Choose from hundreds of vehicles in your area
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom>
                  💰 Best Prices
                </Typography>
                <Typography color="text.secondary">
                  Dynamic pricing with discounts and promotions
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom>
                  ⭐ Trusted Service
                </Typography>
                <Typography color="text.secondary">
                  Verified vehicles and professional drivers
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom>
          Ready to Get Started?
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Sign up today and get your first rental discount
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate('/register')}
          sx={{ px: 6, py: 2 }}
        >
          Sign Up Now
        </Button>
      </Container>
    </Box>
  );
}

export default HomePage;


