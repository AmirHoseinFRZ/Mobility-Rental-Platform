import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  Grid,
  Paper,
} from '@mui/material';
import {
  People,
  DirectionsCar,
  BookOnline,
  Dashboard,
} from '@mui/icons-material';

// Tab Panel Component
function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function AdminDashboardPage() {
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);

  // Sample statistics - in real app, fetch from backend
  const stats = [
    {
      title: 'Total Users',
      value: '1,234',
      icon: <People fontSize="large" />,
      color: '#1976d2',
    },
    {
      title: 'Total Vehicles',
      value: '567',
      icon: <DirectionsCar fontSize="large" />,
      color: '#2e7d32',
    },
    {
      title: 'Active Bookings',
      value: '89',
      icon: <BookOnline fontSize="large" />,
      color: '#ed6c02',
    },
    {
      title: 'Revenue',
      value: '$45,678',
      icon: <Dashboard fontSize="large" />,
      color: '#9c27b0',
    },
  ];

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    // Navigate to specific admin page
    switch (newValue) {
      case 0:
        // Dashboard - stay here
        break;
      case 1:
        navigate('/admin/users');
        break;
      case 2:
        navigate('/admin/vehicles');
        break;
      case 3:
        navigate('/admin/bookings');
        break;
      default:
        break;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Admin Dashboard
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {stat.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: stat.color }}>
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Dashboard" icon={<Dashboard />} />
          <Tab label="Users" icon={<People />} />
          <Tab label="Vehicles" icon={<DirectionsCar />} />
          <Tab label="Bookings" icon={<BookOnline />} />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <TabPanel value={currentTab} index={0}>
        <Grid container spacing={3}>
          {/* Recent Activity */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Activity
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    No recent activity to display
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography
                    variant="body2"
                    sx={{ cursor: 'pointer', color: 'primary.main' }}
                    onClick={() => navigate('/admin/users')}
                  >
                    → Manage Users
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ cursor: 'pointer', color: 'primary.main' }}
                    onClick={() => navigate('/admin/vehicles')}
                  >
                    → Manage Vehicles
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ cursor: 'pointer', color: 'primary.main' }}
                    onClick={() => navigate('/admin/bookings')}
                  >
                    → View All Bookings
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Container>
  );
}

export default AdminDashboardPage;





