import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
  Snackbar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Transfer() {
  const navigate = useNavigate();
  const { reloadAccount } = useAuth();

  const [receiverEmail, setReceiverEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!receiverEmail || !amount) {
      setError('Receiver email and amount are required');
      return;
    }

    if (Number(amount) <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    try {
      setLoading(true);

      // ⬅️ שליחה אחת בלבד
      await api.post('/transactions', {
        receiverEmail,
        amount: Number(amount),
        description
      });

      // ⬅️ הצלחה
      setSuccessOpen(true);
      await reloadAccount();

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Transfer failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ py: 8 }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
            Transfer Money
          </Typography>

          <Stack spacing={2} component="form" onSubmit={handleSubmit}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Receiver Email"
              value={receiverEmail}
              onChange={(e) => setReceiverEmail(e.target.value)}
              fullWidth
              required
            />

            <TextField
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              fullWidth
              required
            />

            <TextField
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
            />

            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => navigate('/dashboard')}
                disabled={loading}
              >
                Cancel
              </Button>

              <Button
                variant="contained"
                type="submit"
                fullWidth
                disabled={loading}
              >
                {loading ? 'Sending…' : 'Send'}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>

      {/* ✅ Success Popup */}
      <Snackbar
        open={successOpen}
        autoHideDuration={3000}
        onClose={() => setSuccessOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSuccessOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          <strong>Transfer completed successfully</strong>
          <br />
          The funds have been sent and your account balance has been updated.
        </Alert>
      </Snackbar>
    </Box>
  );
}
