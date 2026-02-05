import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography
} from '@mui/material';
import { resetPassword as resetPasswordRequest } from '../api/auth.api.js';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('ready');
  const [message, setMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(true);

  useEffect(() => {
    const rawToken = searchParams.get('token');
    if (!rawToken) {
      setStatus('error');
      setMessage('Reset token is missing.');
      setDialogOpen(true);
      return;
    }
    setToken(rawToken);
    setDialogOpen(true);
  }, [searchParams]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!password || !confirmPassword) {
      setStatus('error');
      setMessage('Please fill out both password fields.');
      return;
    }
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }

    resetPasswordRequest({ token, password, confirmPassword })
      .then(() => {
        setStatus('success');
        setMessage('Password updated successfully.');
      })
      .catch((err) => {
        const errorMessage = err.response?.data?.message || 'Reset failed';
        setStatus('error');
        setMessage(errorMessage);
      });
  };

  const handleClose = () => {
    setDialogOpen(false);
    navigate('/login');
  };

  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="sm">
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Reset your password
        </Typography>
        <Typography color="text.secondary">
          Open the dialog to choose a new password for your account.
        </Typography>
      </Container>
      <Dialog open={dialogOpen} onClose={handleClose}>
        <DialogTitle>
          {status === 'success' ? 'Password updated' : 'Set a new password'}
        </DialogTitle>
        <DialogContent>
          {status !== 'success' ? (
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <TextField
                label="New password"
                type="password"
                fullWidth
                margin="normal"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <TextField
                label="Confirm password"
                type="password"
                fullWidth
                margin="normal"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
              {message ? (
                <Typography color="error" sx={{ mt: 1 }}>
                  {message}
                </Typography>
              ) : null}
              <Button type="submit" variant="contained" sx={{ mt: 2 }}>
                Update password
              </Button>
            </Box>
          ) : (
            <Typography color="text.secondary">{message}</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>
            {status === 'success' ? 'Go to login' : 'Cancel'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
