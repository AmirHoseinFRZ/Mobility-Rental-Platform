import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Alert,
  Avatar,
  Divider,
} from '@mui/material';
import { Person, Edit } from '@mui/icons-material';

function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phoneNumber: user?.phoneNumber || '',
    address: user?.address || '',
    city: user?.city || '',
    country: user?.country || '',
    zipCode: user?.zipCode || '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      // Update user profile
      // const response = await authService.updateProfile(user.id, formData);
      // if (response.success) {
      //   updateUser(response.data);
      //   setSuccess('Profile updated successfully');
      //   setEditing(false);
      // }
      
      // For now, just update local state
      setSuccess('Profile updated successfully');
      setEditing(false);
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Avatar sx={{ width: 80, height: 80, mr: 2, bgcolor: 'primary.main' }}>
            <Person sx={{ fontSize: 40 }} />
          </Avatar>
          <Box>
            <Typography variant="h4">
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {user?.email}
            </Typography>
            <Chip label={user?.role} size="small" sx={{ mt: 1 }} />
          </Box>
        </Box>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6">Profile Information</Typography>
          {!editing && (
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => setEditing(true)}
            >
              Edit
            </Button>
          )}
        </Box>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                disabled={!editing}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                disabled={!editing}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                value={user?.email}
                disabled
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                disabled={!editing}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!editing}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                disabled={!editing}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Country"
                name="country"
                value={formData.country}
                onChange={handleChange}
                disabled={!editing}
              />
            </Grid>

            {user?.driverLicenseNumber && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Driver License"
                  value={user.driverLicenseNumber}
                  disabled
                />
              </Grid>
            )}
          </Grid>

          {editing && (
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setEditing(false);
                  setFormData({
                    firstName: user?.firstName || '',
                    lastName: user?.lastName || '',
                    phoneNumber: user?.phoneNumber || '',
                    address: user?.address || '',
                    city: user?.city || '',
                    country: user?.country || '',
                  });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" variant="contained">
                Save Changes
              </Button>
            </Box>
          )}
        </form>

        <Divider sx={{ my: 3 }} />

        <Box>
          <Typography variant="h6" gutterBottom>
            Account Status
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Email Verified:
              </Typography>
              <Chip
                label={user?.emailVerified ? 'Yes' : 'No'}
                color={user?.emailVerified ? 'success' : 'default'}
                size="small"
              />
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                KYC Verified:
              </Typography>
              <Chip
                label={user?.kycVerified ? 'Yes' : 'No'}
                color={user?.kycVerified ? 'success' : 'default'}
                size="small"
              />
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}

export default ProfilePage;


