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
  Typography
} from '@mui/material';
import { verify as verifyRequest } from '../api/auth.api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Verify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, token } = useAuth();
  const [status, setStatus] = useState('pending');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const statusFromQuery = searchParams.get('status');
    const messageFromQuery = searchParams.get('message');

    if (statusFromQuery) {
      setStatus(statusFromQuery === 'success' ? 'success' : 'error');
      setMessage(
        statusFromQuery === 'success'
          ? 'המשתמש אומת בהצלחה.'
          : messageFromQuery || 'אימות החשבון נכשל.'
      );
      setDialogOpen(true);
      return;
    }

    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing.');
      setDialogOpen(true);
      return;
    }

    verifyRequest(token)
      .then((response) => {
        login({ accessToken: response.data.accessToken });
        setStatus('success');
        setMessage('המשתמש אומת בהצלחה.');
        setDialogOpen(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1200);
      })
      .catch((err) => {
        const errorMessage = err.response?.data?.message || 'Verification failed';
        setStatus('error');
        setMessage(errorMessage);
        setDialogOpen(true);
      });
  }, [login, searchParams]);

  const handleClose = () => {
    setDialogOpen(false);
    if (status === 'success' && token) {
      navigate('/dashboard');
      return;
    }
    navigate('/login');
  };

  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="sm">
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Verifying your account
        </Typography>
        <Typography color="text.secondary">
          Please wait while we confirm your email address.
        </Typography>
      </Container>
      <Dialog open={dialogOpen} onClose={handleClose}>
        <DialogTitle>
          {status === 'success' ? 'Account verified' : 'Verification issue'}
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">{message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>
            {status === 'success' ? 'Go to dashboard' : 'Back to login'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
