import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  const { reloadAccount, account } = useAuth();

  const [receiverEmail, setReceiverEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [warmingUp, setWarmingUp] = useState(true);
  const [confirmHighAmountOpen, setConfirmHighAmountOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const warmUpServer = async () => {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          await api.get('/health');
          if (isMounted) {
            setWarmingUp(false);
          }
          return;
        } catch {
          await new Promise((resolve) => setTimeout(resolve, 1200));
        }
      }

      if (isMounted) {
        setWarmingUp(false);
      }
    };

    warmUpServer();
    return () => {
      isMounted = false;
    };
  }, []);

  const executeTransfer = async ({ riskConfirmed = false } = {}) => {
    setError('');

    if (!receiverEmail || !amount) {
      setError('Receiver email and amount are required');
      return;
    }

    const numericAmount = Number(amount);
    if (numericAmount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    const availableBalance = Number(account?.balance);
    if (Number.isFinite(availableBalance) && numericAmount > availableBalance) {
      setError(`Insufficient balance. Available: ${availableBalance.toFixed(2)} ILS`);
      return;
    }

    try {
      setLoading(true);

      await api.post('/transactions', {
        receiverEmail,
        amount: numericAmount,
        description,
        riskConfirmed
      });

      setConfirmHighAmountOpen(false);
      setSuccessOpen(true);
      await reloadAccount();

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      const requiresAdditionalConfirmation = Boolean(
        err?.response?.data?.requiresAdditionalConfirmation
      );
      if (requiresAdditionalConfirmation) {
        setConfirmHighAmountOpen(true);
        return;
      }

      if (!err.response) {
        setError('Cannot reach server right now. Please try again in a few seconds.');
        return;
      }

      setError(
        err.response?.data?.message ||
        'Transfer failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await executeTransfer({ riskConfirmed: false });
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
            {warmingUp && (
              <Alert severity="info">
                Connecting to server, please wait a moment...
              </Alert>
            )}

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
              onChange={(e) => {
                const nextValue = e.target.value;
                if (nextValue === '' || Number(nextValue) >= 0) {
                  setAmount(nextValue);
                }
              }}
              inputProps={{ min: 0 }}
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
                disabled={loading || warmingUp}
              >
                {loading ? 'Sending…' : warmingUp ? 'Preparing…' : 'Send'}
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

      <Dialog
        open={confirmHighAmountOpen}
        onClose={() => {
          if (!loading) setConfirmHighAmountOpen(false);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Additional Confirmation</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2">
            This transfer amount is above 1000 ILS. Are you sure you want to proceed?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmHighAmountOpen(false)}
            disabled={loading}
          >
            No
          </Button>
          <Button
            variant="contained"
            onClick={() => executeTransfer({ riskConfirmed: true })}
            disabled={loading}
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
