import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';

const validationSchema = yup.object({
  emailOrPhone: yup.string().required('ایمیل یا شماره تلفن الزامی است'),
  password: yup.string().required('رمز عبور الزامی است'),
});

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      emailOrPhone: '',
      password: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      setError('');
      
      const result = await login(values);
      
      if (result.success) {
        navigate('/search');
      } else {
        setError(result.message || 'ورود ناموفق بود. لطفاً دوباره تلاش کنید.');
      }
      
      setLoading(false);
    },
  });

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          ورود
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          خوش آمدید! لطفاً وارد حساب خود شوید.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={formik.handleSubmit}>
          <TextField
            fullWidth
            id="emailOrPhone"
            name="emailOrPhone"
            label="ایمیل یا شماره تلفن"
            margin="normal"
            value={formik.values.emailOrPhone}
            onChange={formik.handleChange}
            error={formik.touched.emailOrPhone && Boolean(formik.errors.emailOrPhone)}
            helperText={formik.touched.emailOrPhone && formik.errors.emailOrPhone}
          />

          <TextField
            fullWidth
            id="password"
            name="password"
            label="رمز عبور"
            type="password"
            margin="normal"
            value={formik.values.password}
            onChange={formik.handleChange}
            error={formik.touched.password && Boolean(formik.errors.password)}
            helperText={formik.touched.password && formik.errors.password}
          />

          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? 'در حال ورود...' : 'ورود'}
          </Button>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Typography variant="body2">
              حساب کاربری ندارید؟{' '}
              <Link to="/register" style={{ textDecoration: 'none', color: '#1976d2' }}>
                ثبت‌نام کنید
              </Link>
            </Typography>
          </Box>
        </form>
      </Paper>
    </Container>
  );
}

export default LoginPage;






