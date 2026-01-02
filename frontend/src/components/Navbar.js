import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Container,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Person,
  DirectionsCar,
  BookOnline,
  Logout,
  Garage,
  Dashboard,
  LocalTaxi,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    handleClose();
  };

  const menuItems = [
    { label: 'خانه', path: '/' },
    { label: 'جستجوی وسایل نقلیه', path: '/search' },
  ];

  const additionalAuthItems = [
    { label: 'راننده شوید', path: '/driver-register', icon: <LocalTaxi /> },
    { label: 'افزودن وسیله نقلیه', path: '/add-vehicle', icon: <DirectionsCar /> },
  ];

  const authMenuItems = [
    { label: 'رزروهای من', path: '/my-bookings', icon: <BookOnline /> },
    { label: 'وسایل نقلیه من', path: '/my-vehicles', icon: <Garage /> },
    { label: 'پنل راننده', path: '/driver-dashboard', icon: <LocalTaxi /> },
    { label: 'پروفایل', path: '/profile', icon: <Person /> },
  ];

  const adminMenuItems = [
    { label: 'پنل مدیریت', path: '/admin', icon: <Dashboard /> },
  ];

  return (
    <AppBar position="sticky">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Logo */}
          <DirectionsCar sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontWeight: 700,
              cursor: 'pointer',
            }}
            onClick={() => navigate('/')}
          >
            اجاره وسایل نقلیه
          </Typography>

          {/* Mobile Menu */}
          {isMobile && (
            <>
              <IconButton
                size="large"
                edge="start"
                color="inherit"
                onClick={() => setMobileMenuOpen(true)}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              اجاره
            </Typography>
            </>
          )}

          {/* Desktop Menu */}
          {!isMobile && (
            <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
              {menuItems.map((item) => (
                <Button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  sx={{ color: 'white' }}
                >
                  {item.label}
                </Button>
              ))}
              {isAuthenticated && (
                <Button
                  onClick={() => navigate('/driver-register')}
                  sx={{ color: 'white' }}
                  startIcon={<LocalTaxi />}
                >
                  راننده شوید
                </Button>
              )}
            </Box>
          )}

          {/* Auth Buttons */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {isAuthenticated ? (
                <>
                  <Button color="inherit" onClick={() => navigate('/my-bookings')}>
                    رزروهای من
                  </Button>
                  <Button color="inherit" onClick={() => navigate('/my-vehicles')}>
                    وسایل نقلیه من
                  </Button>
                  <IconButton onClick={handleMenu} color="inherit">
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                      {user?.firstName?.charAt(0)}
                    </Avatar>
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                  >
                    <MenuItem onClick={() => { navigate('/profile'); handleClose(); }}>
                      <Person sx={{ mr: 1 }} /> پروفایل
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/my-bookings'); handleClose(); }}>
                      <BookOnline sx={{ mr: 1 }} /> رزروهای من
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/my-vehicles'); handleClose(); }}>
                      <Garage sx={{ mr: 1 }} /> وسایل نقلیه من
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/driver-dashboard'); handleClose(); }}>
                      <LocalTaxi sx={{ mr: 1 }} /> پنل راننده
                    </MenuItem>
                    {isAdmin() && (
                      <MenuItem onClick={() => { navigate('/admin'); handleClose(); }}>
                        <Dashboard sx={{ mr: 1 }} /> پنل مدیریت
                      </MenuItem>
                    )}
                    <MenuItem onClick={handleLogout}>
                      <Logout sx={{ mr: 1 }} /> خروج
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <>
                  <Button color="inherit" onClick={() => navigate('/login')}>
                    ورود
                  </Button>
                  <Button variant="outlined" color="inherit" onClick={() => navigate('/register')}>
                    ثبت‌نام
                  </Button>
                </>
              )}
            </Box>
          )}
        </Toolbar>
      </Container>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      >
        <Box sx={{ width: 250 }} onClick={() => setMobileMenuOpen(false)}>
          <List>
            {menuItems.map((item) => (
              <ListItem button key={item.path} onClick={() => navigate(item.path)}>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
            {isAuthenticated ? (
              <>
                {authMenuItems.map((item) => (
                  <ListItem button key={item.path} onClick={() => navigate(item.path)}>
                    {item.icon}
                    <ListItemText primary={item.label} sx={{ ml: 2 }} />
                  </ListItem>
                ))}
                {additionalAuthItems.map((item) => (
                  <ListItem button key={item.path} onClick={() => navigate(item.path)}>
                    {item.icon}
                    <ListItemText primary={item.label} sx={{ ml: 2 }} />
                  </ListItem>
                ))}
                {isAdmin() && adminMenuItems.map((item) => (
                  <ListItem button key={item.path} onClick={() => navigate(item.path)}>
                    {item.icon}
                    <ListItemText primary={item.label} sx={{ ml: 2 }} />
                  </ListItem>
                ))}
                <ListItem button onClick={handleLogout}>
                  <Logout />
                  <ListItemText primary="خروج" sx={{ ml: 2 }} />
                </ListItem>
              </>
            ) : (
              <>
                <ListItem button onClick={() => navigate('/login')}>
                  <ListItemText primary="ورود" />
                </ListItem>
                <ListItem button onClick={() => navigate('/register')}>
                  <ListItemText primary="ثبت‌نام" />
                </ListItem>
              </>
            )}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}

export default Navbar;






