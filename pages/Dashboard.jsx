import {
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import AddCardIcon from '@mui/icons-material/AddCard';
import SavingsIcon from '@mui/icons-material/Savings';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTransactionById } from '../api/transactions.api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { account, transactions, loading, logout, token } = useAuth();
  const navigate = useNavigate();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupId, setLookupId] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);

  const getUserEmail = (jwt) => {
    if (!jwt) return null;
    try {
      const payload = jwt.split('.')[1];
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = decodeURIComponent(
        atob(normalized)
          .split('')
          .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
          .join('')
      );
      return JSON.parse(decoded)?.email || null;
    } catch {
      return null;
    }
  };

  const userEmail = getUserEmail(token);
  const getTxSign = (tx) => {
    if (tx?.sign) return tx.sign;
    if (!userEmail) return '';
    if (tx?.fromEmail && tx.fromEmail === userEmail) return '-';
    if (tx?.toEmail && tx.toEmail === userEmail) return '+';
    return '';
  };

  if (loading) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

  if (!account) {
    return null;
  }

  return (
    <Box sx={{ py: { xs: 6, md: 8 } }}>
      <Container maxWidth="lg">
        {/* ===== Header ===== */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
          sx={{ mb: 4 }}
        >
          <Box>
            <Typography variant="overline" color="secondary.main">
              Dashboard
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Welcome back 
            </Typography>
            <Typography color="text.secondary">
              Here is your financial overview for today.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5}>
            <Button variant="outlined" color="secondary" onClick={logout}>
              Log out
            </Button>
            <Button
              variant="contained"
              endIcon={<ArrowOutwardIcon />}
              onClick={() => navigate('/transfer')}
            >
              New transfer
            </Button>
          </Stack>
        </Stack>

        {/* ===== Cards ===== */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="subtitle2" color="text.secondary">
                Main balance
              </Typography>
              <Typography variant="h3" sx={{ mt: 1, fontWeight: 600 }}>
                ₪{account.balance.toLocaleString()}
              </Typography>
              <Chip
                label={account.status}
                color="secondary"
                size="small"
                sx={{ mt: 2 }}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <SavingsIcon color="primary" />
                <Typography variant="subtitle2" color="text.secondary">
                  Savings
                </Typography>
              </Stack>
              <Typography variant="h5" sx={{ mt: 2, fontWeight: 600 }}>
                ₪0
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Feature coming soon
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <AddCardIcon color="primary" />
                <Typography variant="subtitle2" color="text.secondary">
                  Cards
                </Typography>
              </Stack>
              <Typography variant="h5" sx={{ mt: 2, fontWeight: 600 }}>
                —
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Cards management coming soon
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* ===== Transactions ===== */}
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3 }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Latest activity
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setHistoryOpen(true)}
                    disabled={transactions.length === 0}
                  >
                    View all
                  </Button>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => {
                      setLookupId('');
                      setLookupResult(null);
                      setLookupError('');
                      setLookupOpen(true);
                    }}
                  >
                    Find by ID
                  </Button>
                </Stack>
              </Stack>

              {transactions.length === 0 ? (
                <Typography color="text.secondary">
                  No transactions yet
                </Typography>
              ) : (
                <Stack spacing={2}>
                  {transactions.slice(0, 5).map((tx) => (
                    (() => {
                      const sign = getTxSign(tx);
                      return (
                    <Stack
                      key={tx._id || tx.id}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Box>
                        <Typography sx={{ fontWeight: 500 }}>
                          {tx.description || 'Transfer'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(tx.createdAt).toLocaleString()}
                        </Typography>
                      </Box>

                      <Typography
                        sx={{
                          fontWeight: 600,
                          color:
                            sign === '+'
                              ? 'success.main'
                              : sign === '-'
                                ? 'error.main'
                                : 'text.primary'
                        }}
                      >
                        {sign}₪{tx.amount.toLocaleString()}
                      </Typography>
                    </Stack>
                      );
                    })()
                  ))}
                </Stack>
              )}
            </Paper>
          </Grid>

          {/* ===== Quick Actions ===== */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Quick actions
              </Typography>
              <Stack spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<SwapHorizIcon />}
                  onClick={() => navigate('/transfer')}
                >
                  New transfer
                </Button>
                <Button variant="outlined" startIcon={<AddCardIcon />} disabled>
                  Add a new card
                </Button>
                <Button variant="outlined" startIcon={<SavingsIcon />} disabled>
                  Top up savings
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Dialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Transfer history</DialogTitle>
        <DialogContent dividers sx={{ maxHeight: 520 }}>
          {transactions.length === 0 ? (
            <Typography color="text.secondary">
              No transactions yet
            </Typography>
          ) : (
            <Stack spacing={2}>
              {transactions.map((tx) => (
                (() => {
                  const sign = getTxSign(tx);
                  return (
                <Stack
                  key={tx._id || tx.id}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                >
                  <Box>
                    <Typography sx={{ fontWeight: 500 }}>
                      {tx.description || 'Transfer'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(tx.createdAt).toLocaleString()}
                    </Typography>
                  </Box>

                  <Typography
                    sx={{
                      fontWeight: 600,
                      color:
                        sign === '+'
                          ? 'success.main'
                          : sign === '-'
                            ? 'error.main'
                            : 'text.primary'
                    }}
                  >
                    {sign}₪{tx.amount.toLocaleString()}
                  </Typography>
                </Stack>
                  );
                })()
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={lookupOpen}
        onClose={() => setLookupOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Find transfer by ID</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="Transfer ID"
              value={lookupId}
              onChange={(e) => {
                setLookupId(e.target.value);
                setLookupError('');
                setLookupResult(null);
              }}
              fullWidth
              autoFocus
            />
            <Button
              variant="contained"
              onClick={async () => {
                const id = lookupId.trim();
                if (!id) {
                  setLookupError('Please enter a transfer ID.');
                  setLookupResult(null);
                  return;
                }

                try {
                  setLookupLoading(true);
                  setLookupError('');
                  setLookupResult(null);

                  const res = await getTransactionById(id);
                  const tx =
                    res?.data?.transaction ||
                    res?.data?.data?.transaction ||
                    res?.data?.data ||
                    res?.data;

                  if (!tx || (Array.isArray(tx) && tx.length === 0)) {
                    setLookupError('No transfer found with this ID.');
                    return;
                  }

                  setLookupResult(Array.isArray(tx) ? tx[0] : tx);
                } catch (err) {
                  setLookupError(
                    err.response?.data?.message ||
                      'No transfer found with this ID.'
                  );
                } finally {
                  setLookupLoading(false);
                }
              }}
              disabled={lookupLoading}
            >
              {lookupLoading ? 'Searching…' : 'Search'}
            </Button>

            {lookupError && (
              <Typography color="error">{lookupError}</Typography>
            )}

            {lookupResult && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={0.5}>
                  <Typography sx={{ fontWeight: 600 }}>
                    {lookupResult.description || 'Transfer'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ID: {lookupResult._id || lookupResult.id}
                  </Typography>
                  {lookupResult.fromEmail && (
                    <Typography variant="body2" color="text.secondary">
                      From: {lookupResult.fromEmail}
                    </Typography>
                  )}
                  {lookupResult.toEmail && (
                    <Typography variant="body2" color="text.secondary">
                      To: {lookupResult.toEmail}
                    </Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    Date: {new Date(lookupResult.createdAt).toLocaleString()}
                  </Typography>
                  {lookupResult.status && (
                    <Typography variant="body2" color="text.secondary">
                      Status: {lookupResult.status}
                    </Typography>
                  )}
                  <Typography
                    sx={{
                      fontWeight: 600,
                      color: (() => {
                        const sign = getTxSign(lookupResult);
                        if (sign === '+') return 'success.main';
                        if (sign === '-') return 'error.main';
                        return 'text.primary';
                      })()
                    }}
                  >
                    {getTxSign(lookupResult)}₪
                    {lookupResult.amount.toLocaleString()}
                  </Typography>
                </Stack>
              </Paper>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLookupOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
