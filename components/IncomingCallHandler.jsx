import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Stack,
  Typography
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getOrCreateCallSocket } from '../api/socket.js';

export default function IncomingCallHandler() {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const [incomingCall, setIncomingCall] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const browserNotificationRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, [isAuthenticated]);

  const closeBrowserNotification = () => {
    if (!browserNotificationRef.current) return;
    browserNotificationRef.current.close();
    browserNotificationRef.current = null;
  };

  const showIncomingCallNotification = (payload) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (document.visibilityState === 'visible') return;
    if (Notification.permission !== 'granted') return;

    closeBrowserNotification();
    const fromText = payload?.fromName || payload?.fromEmail || 'A user';
    const notification = new Notification('Incoming call', {
      body: `${fromText} is calling you`,
      tag: String(payload?.callId || 'incoming-call'),
      requireInteraction: true
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    browserNotificationRef.current = notification;
  };

  useEffect(() => {
    if (!token || !isAuthenticated) return undefined;

    const socket = getOrCreateCallSocket({ token });
    if (!socket) return undefined;

    const onIncomingCall = (payload) => {
      setIncomingCall(payload || null);
      showIncomingCallNotification(payload);
    };
    const onCallDeclined = (payload) => {
      const byEmail = payload?.byEmail || 'The other user';
      setStatusMessage(`${byEmail} declined your call.`);
    };
    const onCallTimeout = () => {
      setStatusMessage('Call was not answered.');
    };
    const onCallCanceled = (payload) => {
      setIncomingCall((prev) => {
        if (prev?.callId && payload?.callId === prev.callId) {
          closeBrowserNotification();
          return null;
        }
        return prev;
      });
      setStatusMessage('Call was canceled.');
    };
    const onConnectError = () => {
      setStatusMessage('Call notifications are temporarily unavailable.');
    };

    socket.on('call_incoming', onIncomingCall);
    socket.on('call_declined', onCallDeclined);
    socket.on('call_timeout', onCallTimeout);
    socket.on('call_canceled', onCallCanceled);
    socket.on('connect_error', onConnectError);

    return () => {
      closeBrowserNotification();
      socket.off('call_incoming', onIncomingCall);
      socket.off('call_declined', onCallDeclined);
      socket.off('call_timeout', onCallTimeout);
      socket.off('call_canceled', onCallCanceled);
      socket.off('connect_error', onConnectError);
    };
  }, [token, isAuthenticated]);

  const handleDecline = () => {
    if (!incomingCall || !token) {
      setIncomingCall(null);
      return;
    }

    const socket = getOrCreateCallSocket({ token });
    socket?.emit('call_decline', { callId: incomingCall.callId });
    closeBrowserNotification();
    setIncomingCall(null);
  };

  const handleAccept = () => {
    if (!incomingCall || !token) return;

    const socket = getOrCreateCallSocket({ token });
    socket?.emit('call_accept', { callId: incomingCall.callId }, (response) => {
      if (!response?.ok) {
        setStatusMessage(response?.message || 'Unable to accept this call.');
        closeBrowserNotification();
        setIncomingCall(null);
        return;
      }

      closeBrowserNotification();
      setIncomingCall(null);
      const room = encodeURIComponent(response.roomName || incomingCall.roomName || '');
      const peer = encodeURIComponent(incomingCall.fromEmail || response.peerEmail || '');
      navigate(`/video-call?room=${room}&peer=${peer}&callId=${encodeURIComponent(incomingCall.callId)}`);
    });
  };

  return (
    <>
      <Dialog open={Boolean(incomingCall)} maxWidth="xs" fullWidth>
        <DialogTitle>Incoming call</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 700 }}>
              {incomingCall?.fromName || incomingCall?.fromEmail || 'A user'} is calling
            </Typography>
            <Typography color="text.secondary">
              From: {incomingCall?.fromEmail || 'Unknown'}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDecline}>Decline</Button>
          <Button variant="contained" onClick={handleAccept}>
            Accept
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(statusMessage)}
        autoHideDuration={2800}
        onClose={() => setStatusMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" variant="filled" onClose={() => setStatusMessage('')}>
          {statusMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
