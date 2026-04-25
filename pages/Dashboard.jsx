import {
  Alert,
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
  Snackbar,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import { jwtDecode } from 'jwt-decode';
import AddCardIcon from '@mui/icons-material/AddCard';
import SavingsIcon from '@mui/icons-material/Savings';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSentTransactionByRecipientName } from '../api/transactions.api.js';
import { useAuth } from '../context/AuthContext.jsx';
import BankAssistantChat from '../components/BankAssistantChat.jsx';
import { getOrCreateCallSocket } from '../api/socket.js';

export default function Dashboard() {
  const { account, transactions, loading, logout, token, reloadAccount } = useAuth();
  const navigate = useNavigate();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [lookupRecipientName, setLookupRecipientName] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [callOpen, setCallOpen] = useState(false);
  const [callPeerEmail, setCallPeerEmail] = useState('');
  const [callError, setCallError] = useState('');
  const [callLoading, setCallLoading] = useState(false);
  const [outgoingCall, setOutgoingCall] = useState(null);
  const [callNotice, setCallNotice] = useState('');

  useEffect(() => {
    if (!token) return;

    try {
      const decoded = jwtDecode(token);
      setFirstName(decoded.firstName || '');
    } catch (err) {
      console.error('Invalid token', err);
    }
  }, [token]);

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

  const userEmail = useMemo(
    () => String(getUserEmail(token) || '').toLowerCase(),
    [token]
  );
  const getTxSign = (tx) => {
    if (tx?.sign) return tx.sign;
    if (!userEmail) return '';
    const fromEmail = String(tx?.fromEmail || '').toLowerCase();
    const toEmail = String(tx?.toEmail || '').toLowerCase();
    if (fromEmail && fromEmail === userEmail) return '-';
    if (toEmail && toEmail === userEmail) return '+';
    return '';
  };

  useEffect(() => {
    if (!token || !userEmail) return undefined;

    const socket = getOrCreateCallSocket({ token });
    if (!socket) return undefined;

    const onCallAccepted = (payload) => {
      const acceptedCallId = String(payload?.callId || '');
      if (!acceptedCallId) return;

      setOutgoingCall((currentCall) => {
        if (!currentCall || currentCall.callId !== acceptedCallId) {
          return currentCall;
        }

        navigate(
          `/video-call?room=${encodeURIComponent(payload.roomName || currentCall.roomName)}&peer=${encodeURIComponent(payload.peerEmail || currentCall.peerEmail)}&callId=${encodeURIComponent(acceptedCallId)}`
        );
        return null;
      });
    };

    const onCallDeclined = (payload) => {
      const declinedCallId = String(payload?.callId || '');
      setOutgoingCall((currentCall) => {
        if (!currentCall || currentCall.callId !== declinedCallId) {
          return currentCall;
        }
        setCallNotice(`${payload?.byEmail || currentCall.peerEmail} declined your call.`);
        return null;
      });
    };

    const onCallTimeout = (payload) => {
      const timeoutCallId = String(payload?.callId || '');
      setOutgoingCall((currentCall) => {
        if (!currentCall || currentCall.callId !== timeoutCallId) {
          return currentCall;
        }
        setCallNotice(payload?.message || 'Call was not answered.');
        return null;
      });
    };

    const onCallCanceled = (payload) => {
      const canceledCallId = String(payload?.callId || '');
      setOutgoingCall((currentCall) => {
        if (!currentCall || currentCall.callId !== canceledCallId) {
          return currentCall;
        }
        setCallNotice('Call was canceled.');
        return null;
      });
    };

    socket.on('call_accepted', onCallAccepted);
    socket.on('call_declined', onCallDeclined);
    socket.on('call_timeout', onCallTimeout);
    socket.on('call_canceled', onCallCanceled);

    return () => {
      socket.off('call_accepted', onCallAccepted);
      socket.off('call_declined', onCallDeclined);
      socket.off('call_timeout', onCallTimeout);
      socket.off('call_canceled', onCallCanceled);
    };
  }, [token, userEmail, navigate]);

  useEffect(() => {
    if (!token) return undefined;

    const refresh = () => {
      reloadAccount();
    };

    const onFocus = () => refresh();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [token, reloadAccount]);

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
    <Box id="dashboard-root" sx={{ py: { xs: 7, md: 9 } }}>
      <Container maxWidth="xl" sx={{ width: 'min(1480px, 96vw)' }}>
        {/* ===== Header ===== */}
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
          sx={{ mb: { xs: 4.5, md: 5.5 } }}
        >
          <Box>
            <Typography
              variant="overline"
              color="secondary.main"
              sx={{ fontSize: { xs: '0.74rem', md: '0.86rem' }, letterSpacing: '0.11em' }}
            >
              Dashboard
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: '2.15rem', md: '2.75rem' } }}>
              Welcome back{firstName ? ` ${firstName}` : ''} 
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: { xs: '1.12rem', md: '1.34rem' } }}>
              Here is your financial overview for today.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              color="secondary"
              onClick={logout}
              size="large"
              sx={{ px: 2.2, py: 1.15, fontSize: '1.02rem', fontWeight: 700 }}
            >
              Log out
            </Button>
            <Button
              variant="contained"
              endIcon={<ArrowOutwardIcon />}
              onClick={() => navigate('/transfer')}
              size="large"
              sx={{ px: 2.3, py: 1.15, fontSize: '1.02rem', fontWeight: 700 }}
            >
              New transfer
            </Button>
          </Stack>
        </Stack>

        {/* ===== Cards ===== */}
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: { xs: 3.5, md: 4 }, minHeight: { md: 238 } }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '1.24rem' }}>
                Main balance
              </Typography>
              <Typography variant="h3" sx={{ mt: 1.1, fontWeight: 700, fontSize: { xs: '3rem', md: '3.45rem' } }}>
                ₪{account.balance.toLocaleString()}
              </Typography>
              <Chip
                label={account.status}
                color="secondary"
                size="small"
                sx={{ mt: 2.3, fontSize: '0.98rem', height: 34, px: 0.4, fontWeight: 700 }}
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: { xs: 3.5, md: 4 }, minHeight: { md: 238 } }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <SavingsIcon color="primary" sx={{ fontSize: 30 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '1.24rem' }}>
                  Savings
                </Typography>
              </Stack>
              <Typography variant="h5" sx={{ mt: 2.2, fontWeight: 700, fontSize: { xs: '2.3rem', md: '2.7rem' } }}>
                ₪0
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1.3, fontSize: '1.22rem' }}>
                Feature coming soon
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: { xs: 3.5, md: 4 }, minHeight: { md: 238 } }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <AddCardIcon color="primary" sx={{ fontSize: 30 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: '1.24rem' }}>
                  Cards
                </Typography>
              </Stack>
              <Typography variant="h5" sx={{ mt: 2.2, fontWeight: 700, fontSize: { xs: '2.3rem', md: '2.7rem' } }}>
                —
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1.3, fontSize: '1.22rem' }}>
                Cards management coming soon
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* ===== Transactions ===== */}
        <Grid container spacing={4} sx={{ mt: 1.5 }}>
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: { xs: 3.5, md: 4 } }}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 2.4 }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1.9rem', md: '2.15rem' } }}>
                  Latest activity
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => setHistoryOpen(true)}
                    disabled={transactions.length === 0}
                    sx={{ fontSize: '1rem', fontWeight: 700 }}
                  >
                    View all
                  </Button>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => {
                        setLookupRecipientName('');
                        setLookupResult(null);
                        setLookupError('');
                        setLookupOpen(true);
                      }}
                      sx={{ fontSize: '1rem', fontWeight: 700 }}
                    >
                      Find by name
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
                        <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.45rem', md: '1.7rem' } }}>
                          {tx.fromEmail ? tx.fromEmail.split('@')[0] : 'email'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: '1.08rem' }}>
                          {tx.description || 'Transfer'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '1.04rem' }}>
                          {new Date(tx.createdAt).toLocaleString()}
                        </Typography>
                      </Box>

                      <Typography
                        sx={{
                          fontWeight: 600,
                          fontSize: { xs: '1.45rem', md: '1.65rem' },
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
            <Paper sx={{ p: { xs: 3.5, md: 4 }, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2.5, fontWeight: 700, fontSize: { xs: '1.9rem', md: '2.15rem' } }}>
                Quick actions
              </Typography>
              <Stack spacing={2.2}>
                <Button
                  variant="outlined"
                  startIcon={<SwapHorizIcon />}
                  onClick={() => navigate('/transfer')}
                  size="large"
                  sx={{ minHeight: 50, fontSize: '1.06rem', fontWeight: 700 }}
                >
                  New transfer
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<VideoCallIcon />}
                  disabled={Boolean(outgoingCall)}
                  onClick={() => {
                    setCallPeerEmail('');
                    setCallError('');
                    setCallLoading(false);
                    setCallOpen(true);
                  }}
                  size="large"
                  sx={{ minHeight: 50, fontSize: '1.06rem', fontWeight: 700 }}
                >
                  {outgoingCall ? 'Call in progress...' : 'Start video call'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<AddCardIcon />}
                  disabled
                  size="large"
                  sx={{ minHeight: 50, fontSize: '1.06rem', fontWeight: 700 }}
                >
                  Add a new card
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SavingsIcon />}
                  disabled
                  size="large"
                  sx={{ minHeight: 50, fontSize: '1.06rem', fontWeight: 700 }}
                >
                  Top up savings
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Dialog
        open={callOpen}
        onClose={() => setCallOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Start video call</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="Other user email"
              value={callPeerEmail}
              onChange={(event) => {
                setCallPeerEmail(event.target.value);
                setCallError('');
              }}
              placeholder="user@example.com"
              fullWidth
              autoFocus
              disabled={callLoading}
            />
            {callError ? <Typography color="error">{callError}</Typography> : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              if (callLoading) return;
              setCallOpen(false);
            }}
            disabled={callLoading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={callLoading}
            onClick={async () => {
              const peer = callPeerEmail.trim().toLowerCase();

              if (!peer || !peer.includes('@')) {
                setCallError('Please enter a valid email address.');
                return;
              }

              if (!userEmail) {
                setCallError('Your user email is missing. Please log in again.');
                return;
              }

              if (peer === userEmail.toLowerCase()) {
                setCallError('Please enter another user email.');
                return;
              }

              const socket = getOrCreateCallSocket({ token });
              if (!socket) {
                setCallError('Cannot connect to call service right now.');
                return;
              }

              setCallLoading(true);
              socket.emit('call_request', { toEmail: peer }, (response) => {
                setCallLoading(false);

                if (!response?.ok) {
                  setCallError(response?.message || 'Failed to start call.');
                  return;
                }

                setCallOpen(false);
                setCallPeerEmail('');
                setCallError('');
                setOutgoingCall({
                  callId: response.callId,
                  roomName: response.roomName,
                  peerEmail: peer
                });
                setCallNotice(`Calling ${peer}... waiting for answer.`);
              });
            }}
          >
            {callLoading ? 'Calling...' : 'Start call'}
          </Button>
        </DialogActions>
      </Dialog>

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
        <DialogTitle>Find sent transfer by name</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="Recipient name (before @)"
              value={lookupRecipientName}
              onChange={(e) => {
                setLookupRecipientName(e.target.value);
                setLookupError('');
                setLookupResult(null);
              }}
              fullWidth
              autoFocus
            />
            <Button
              variant="contained"
              onClick={async () => {
                const recipientName = lookupRecipientName.trim();
                if (!recipientName) {
                  setLookupError('Please enter a recipient name.');
                  setLookupResult(null);
                  return;
                }

                try {
                  setLookupLoading(true);
                  setLookupError('');
                  setLookupResult(null);

                  const res = await getSentTransactionByRecipientName(recipientName);
                  const tx =
                    res?.data?.transaction ||
                    res?.data?.data?.transaction ||
                    res?.data?.data ||
                    res?.data;

                  if (!tx || (Array.isArray(tx) && tx.length === 0)) {
                    setLookupError('No sent transfer found for this recipient name.');
                    return;
                  }

                  setLookupResult(Array.isArray(tx) ? tx[0] : tx);
                } catch (err) {
                  setLookupError(
                    err.response?.data?.message ||
                      'No sent transfer found for this recipient name.'
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

      <BankAssistantChat token={token} />

      <Snackbar
        open={Boolean(callNotice)}
        autoHideDuration={3200}
        onClose={() => setCallNotice('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" variant="filled" onClose={() => setCallNotice('')}>
          {callNotice}
        </Alert>
      </Snackbar>
    </Box>
  );
}
