import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Alert,
  Paper,
  TextField,
  Typography
} from '@mui/material';
import { signup as signupRequest } from '../api/auth.api.js';

export default function Signup() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [sentOpen, setSentOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const normalizePhone = (value) =>
    value ? value.replace(/[^\d]/g, '') : '';




  const handleSubmit = (event) => {
    event.preventDefault();
    if (submitting) return;

    setError('');
    setFieldErrors({});
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);

    const payload = {
      firstName: formData.get('firstName')?.trim(),
      lastName: formData.get('lastName')?.trim(),
      email: formData.get('email')?.trim(),
      phoneNumber: normalizePhone(formData.get('phoneNumber')),
      password: formData.get('password') || ''
    };

    const confirmPassword = formData.get('confirmPassword') || '';
    const city = formData.get('city')?.trim();

    const nextErrors = {};

    if (!payload.firstName || payload.firstName.length < 2) {
      nextErrors.firstName = 'First name is not valid.';
    }
    if (!payload.lastName || payload.lastName.length < 2) {
      nextErrors.lastName = 'Last name is not valid.';
    }
    if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      nextErrors.email = 'Email is not valid.';
    }
    if (!payload.phoneNumber || !/^05\d{8}$/.test(payload.phoneNumber)) {
      nextErrors.phoneNumber =
        'Phone number must start with 05 and contain 10 digits.';
    }
    if (!payload.password) {
      nextErrors.password = 'Password is required.';
    }
    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    }
    if (payload.password && confirmPassword && payload.password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }
    if (!city) {
      nextErrors.city = 'City is required.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setSubmitting(false);
      return;
    }

    signupRequest(payload)
      .then(() => {
        setError('');          
        setFieldErrors({});
        setSentOpen(true);
        event.currentTarget.reset();
      })

      .catch((err) => {
        setError(err.response?.data?.message || 'Signup נכשל');
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="md">
        <Paper elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4 }}>
          <Typography variant="overline" color="secondary.main">
            Get Started
          </Typography>
          <Typography variant="h4" sx={{ mt: 1, mb: 1, fontWeight: 600 }}>
            Open your account today
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            Create access to your digital banking experience in under 3 minutes.
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="First name"
                  name="firstName"
                  fullWidth
                  required
                  error={Boolean(fieldErrors.firstName)}
                  helperText={fieldErrors.firstName}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Last name"
                  name="lastName"
                  fullWidth
                  required
                  error={Boolean(fieldErrors.lastName)}
                  helperText={fieldErrors.lastName}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Email"
                  type="email"
                  name="email"
                  fullWidth
                  required
                  error={Boolean(fieldErrors.email)}
                  helperText={fieldErrors.email}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Phone"
                  name="phoneNumber"
                  fullWidth
                  required
                  error={Boolean(fieldErrors.phoneNumber)}
                  helperText={fieldErrors.phoneNumber}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Password"
                  type="password"
                  name="password"
                  fullWidth
                  required
                  error={Boolean(fieldErrors.password)}
                  helperText={fieldErrors.password}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Confirm password"
                  type="password"
                  name="confirmPassword"
                  fullWidth
                  required
                  error={Boolean(fieldErrors.confirmPassword)}
                  helperText={fieldErrors.confirmPassword}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="City"
                  name="city"
                  fullWidth
                  required
                  error={Boolean(fieldErrors.city)}
                  helperText={fieldErrors.city}
                />
              </Grid>
            </Grid>

            {error && !sentOpen && (
              <Alert severity="error" sx={{ mt: 3 }}>
                {error}
              </Alert>
            )}




            <Button
              type="submit"
              variant="contained"
              size="large"
              sx={{ mt: 4, px: 5 }}
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create account'}
            </Button>

            <Typography sx={{ mt: 3 }} color="text.secondary">
              Already have access? <Link to="/login">Sign in</Link>
            </Typography>
          </Box>
        </Paper>
      </Container>

      <Dialog
        open={sentOpen}
        onClose={() => {
          setSentOpen(false);
          setError('');        
          setFieldErrors({});
        }}
      >
        <DialogTitle>Verification email sent</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            We sent a verification link to your email.
            Please open it to activate your account and get sign in again.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setSentOpen(false);
              setError('');    
              setFieldErrors({});
              navigate('/login');

            }}
          >
            Got it
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
