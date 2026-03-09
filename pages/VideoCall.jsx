import { useMemo } from 'react';
import { Box, Button, Container, Paper, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const JITSI_BASE_URL = 'https://meet.jit.si';

const extractEmailFromJwt = (jwt) => {
  if (!jwt) return '';
  try {
    const payload = jwt.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = decodeURIComponent(
      atob(normalized)
        .split('')
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    );
    return (JSON.parse(decoded)?.email || '').toLowerCase();
  } catch {
    return '';
  }
};

const normalizeEmail = (email) => email.trim().toLowerCase();

const sanitizeForRoom = (value) =>
  value.replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

const buildRoomName = (emailA, emailB) => {
  const pair = [normalizeEmail(emailA), normalizeEmail(emailB)].sort();
  const room = `bank11-${sanitizeForRoom(pair[0])}-${sanitizeForRoom(pair[1])}`;
  return room.slice(0, 120);
};

export default function VideoCall() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();

  const currentUserEmail = useMemo(() => extractEmailFromJwt(token), [token]);
  const roomFromQuery = useMemo(
    () => String(searchParams.get('room') || '').trim(),
    [searchParams]
  );
  const peerEmail = useMemo(
    () => normalizeEmail(searchParams.get('peer') || ''),
    [searchParams]
  );

  const hasValidPeer =
    Boolean(peerEmail) &&
    peerEmail.includes('@') &&
    peerEmail !== currentUserEmail;
  const canStartCall =
    Boolean(currentUserEmail) &&
    (Boolean(roomFromQuery) || hasValidPeer);

  const roomName = roomFromQuery || (canStartCall ? buildRoomName(currentUserEmail, peerEmail) : '');
  const callUrl = canStartCall ? `${JITSI_BASE_URL}/${roomName}` : '';

  return (
    <Box sx={{ py: { xs: 4, md: 5 } }}>
      <Container maxWidth="xl" sx={{ width: 'min(1480px, 96vw)' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard')}
          >
            Back to dashboard
          </Button>

          {canStartCall ? (
            <Button
              variant="contained"
              endIcon={<OpenInNewIcon />}
              onClick={() => window.open(callUrl, '_blank', 'noopener,noreferrer')}
            >
              Open in new tab
            </Button>
          ) : null}
        </Stack>

        <Paper sx={{ p: { xs: 2, md: 2.5 } }}>
          {!canStartCall ? (
            <Stack spacing={1}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Cannot start video call
              </Typography>
              <Typography color="text.secondary">
                Please return to dashboard and enter a valid email for another user.
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={1.2}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Video call with {peerEmail}
              </Typography>
              <Typography color="text.secondary">
                Room: {roomName}
              </Typography>
              <Box
                sx={{
                  mt: 1,
                  borderRadius: 1.5,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                  height: { xs: '70vh', md: '74vh' }
                }}
              >
                <iframe
                  title="Jitsi video call"
                  src={callUrl}
                  width="100%"
                  height="100%"
                  allow="camera; microphone; fullscreen; display-capture; autoplay"
                  style={{ border: 0 }}
                />
              </Box>
            </Stack>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
