import React from 'react';
import { Box, Container, Grid, Typography, Link } from '@mui/material';
import { Facebook, Twitter, Instagram, LinkedIn } from '@mui/icons-material';

function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'grey.900',
        color: 'white',
        py: 6,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              اجاره وسایل نقلیه
            </Typography>
            <Typography variant="body2" color="grey.400">
              شریک مورد اعتماد شما برای اجاره وسایل نقلیه. خودرو، موتورسیکلت و اسکوتر را اجاره کنید.
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              لینک‌های سریع
            </Typography>
            <Link href="/" color="grey.400" display="block" sx={{ mb: 1, textDecoration: 'none' }}>
              خانه
            </Link>
            <Link href="/search" color="grey.400" display="block" sx={{ mb: 1, textDecoration: 'none' }}>
              جستجوی وسایل نقلیه
            </Link>
            <Link href="/my-bookings" color="grey.400" display="block" sx={{ mb: 1, textDecoration: 'none' }}>
              رزروهای من
            </Link>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              پشتیبانی
            </Typography>
            <Link href="#" color="grey.400" display="block" sx={{ mb: 1, textDecoration: 'none' }}>
              مرکز پشتیبانی
            </Link>
            <Link href="#" color="grey.400" display="block" sx={{ mb: 1, textDecoration: 'none' }}>
              شرایط استفاده
            </Link>
            <Link href="#" color="grey.400" display="block" sx={{ mb: 1, textDecoration: 'none' }}>
              حریم خصوصی
            </Link>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" gutterBottom>
              ما را دنبال کنید
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <IconButton sx={{ color: 'grey.400' }}>
                <Facebook />
              </IconButton>
              <IconButton sx={{ color: 'grey.400' }}>
                <Twitter />
              </IconButton>
              <IconButton sx={{ color: 'grey.400' }}>
                <Instagram />
              </IconButton>
              <IconButton sx={{ color: 'grey.400' }}>
                <LinkedIn />
              </IconButton>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography variant="body2" color="grey.400" align="center">
            © {new Date().getFullYear()} پلتفرم اجاره وسایل نقلیه. تمامی حقوق محفوظ است.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

// IconButton wrapper for footer
function IconButton({ children, sx }) {
  return (
    <Box
      sx={{
        cursor: 'pointer',
        '&:hover': { color: 'primary.main' },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

export default Footer;






